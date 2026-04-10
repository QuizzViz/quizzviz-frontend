'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProctoringProps {
  onViolation: (message: string) => void;
  onEnd: (reason: string) => void;
  isActive?: boolean;   // component is mounted & ready
  isStarted?: boolean;  // quiz actually started – begin detection now
}

type HeadDirection = 'center' | 'left' | 'right' | 'down' | 'up' | 'unknown';

const VIOLATION_TIMEOUT = 10

const CameraProctoring: React.FC<CameraProctoringProps> = ({
  onViolation,
  onEnd,
  isActive = true,
  isStarted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const violationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef(false);
  const isInitializingRef = useRef(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [violationCountdown, setViolationCountdown] = useState<number | null>(null); // null = no active violation
  const [currentViolation, setCurrentViolation] = useState<string>('');
  const [faceCount, setFaceCount] = useState<number>(0);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (_) {}
      cameraRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (violationIntervalRef.current) {
      clearInterval(violationIntervalRef.current);
      violationIntervalRef.current = null;
    }
    if (faceMeshRef.current) {
      try { faceMeshRef.current.close(); } catch (_) {}
      faceMeshRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ─── Violation timer ────────────────────────────────────────────────────────
  const startViolationTimer = useCallback((message: string) => {
    if (violationIntervalRef.current) return; // already running
    setCurrentViolation(message);
    setViolationCountdown(VIOLATION_TIMEOUT);

    violationIntervalRef.current = setInterval(() => {
      setViolationCountdown((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            onEnd('Cheating detected – prolonged violation');
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [onEnd]);

  const stopViolationTimer = useCallback(() => {
    if (violationIntervalRef.current) {
      clearInterval(violationIntervalRef.current);
      violationIntervalRef.current = null;
    }
    setViolationCountdown(null);
    setCurrentViolation('');
  }, []);

  // ─── Head direction estimation ───────────────────────────────────────────────
  const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
    if (!landmarks || landmarks.length === 0) return 'unknown';

    const noseTip  = landmarks[1];
    const leftEye  = landmarks[33];
    const rightEye = landmarks[263];
    const forehead = landmarks[10];

    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const faceCenterX = (noseTip.x + forehead.x) / 2;
    const faceCenterY = (noseTip.y + forehead.y) / 2;

    const hOffset = eyeCenterX - faceCenterX;
    const vOffset = eyeCenterY - faceCenterY;

    if (hOffset < -0.05) return 'left';
    if (hOffset > 0.05)  return 'right';
    if (vOffset > 0.1)   return 'down';
    if (vOffset < -0.1)  return 'up';
    return 'center';
  };

  // ─── Process detection results ───────────────────────────────────────────────
  const processFaceDetection = useCallback((results: any) => {
    if (hasEndedRef.current) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceCount(0);
      onViolation('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    const faces = results.multiFaceLandmarks;
    setFaceCount(faces.length);

    if (faces.length > 1) {
      hasEndedRef.current = true;
      cleanup();
      onEnd('Multiple faces detected');
      return;
    }

    const direction = estimateHeadDirection(faces[0]);

    if (direction === 'left' || direction === 'right' || direction === 'down') {
      onViolation(`Looking ${direction}`);
      startViolationTimer(`Looking ${direction}`);
    } else {
      // back on screen – reset timer
      stopViolationTimer();
    }
  }, [onViolation, onEnd, startViolationTimer, stopViolationTimer, cleanup]);

  // ─── Initialize ──────────────────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    if (isInitializingRef.current || hasEndedRef.current) return;
    isInitializingRef.current = true;
    setStatus('loading');

    try {
      // 1. Webcam
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise<void>((res) => {
          if (!videoRef.current) return res();
          videoRef.current.onloadedmetadata = () => res();
        });
        await videoRef.current.play();
      }

      // 2. Dynamic import of MediaPipe (avoids SSR crash)
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import('@mediapipe/face_mesh'),
        import('@mediapipe/camera_utils'),
      ]);

      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 5,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults(processFaceDetection);
      faceMeshRef.current = faceMesh;

      // 3. Start Camera loop
      const cam = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current && videoRef.current.readyState === 4) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 320,
        height: 240,
      });
      cam.start();
      cameraRef.current = cam;

      setStatus('active');
    } catch (err: any) {
      console.error('CameraProctoring init error:', err);
      setStatus('error');
      // Do NOT call onEnd here – just mark camera as unavailable
      // The quiz can still run; tab-switch / fullscreen guards remain active
    } finally {
      isInitializingRef.current = false;
    }
  }, [processFaceDetection]);

  // ─── Lifecycle: start when isStarted flips true ──────────────────────────────
  useEffect(() => {
    if (!isActive || !isStarted) return;
    initialize();
    return cleanup;
  }, [isActive, isStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── UI ──────────────────────────────────────────────────────────────────────
  const isViolating = violationCountdown !== null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {/* Camera preview box */}
      <div
        style={{
          width: '200px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: isViolating ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)',
          backgroundColor: '#000',
          boxShadow: isViolating
            ? '0 0 20px rgba(239,68,68,0.5)'
            : '0 4px 24px rgba(0,0,0,0.5)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          position: 'relative',
        }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '200px',
            height: '150px',
            objectFit: 'cover',
            display: status === 'active' ? 'block' : 'none',
            transform: 'scaleX(-1)', // mirror
          }}
        />

        {/* Placeholder when not active */}
        {status !== 'active' && (
          <div
            style={{
              width: '200px',
              height: '150px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#111',
              color: '#666',
              fontSize: '12px',
              gap: '8px',
            }}
          >
            {status === 'loading' && (
              <>
                <div style={{ fontSize: '24px' }}>📷</div>
                <span>Starting camera…</span>
              </>
            )}
            {status === 'idle' && (
              <>
                <div style={{ fontSize: '24px' }}>📷</div>
                <span>Camera standby</span>
              </>
            )}
            {status === 'error' && (
              <>
                <div style={{ fontSize: '24px' }}>⚠️</div>
                <span style={{ color: '#f87171', textAlign: 'center', padding: '0 12px' }}>
                  Camera unavailable
                </span>
              </>
            )}
          </div>
        )}

        {/* Status badge */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(0,0,0,0.65)',
            borderRadius: '99px',
            padding: '2px 8px',
            fontSize: '10px',
            color: '#fff',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                status === 'active' ? (isViolating ? '#ef4444' : '#22c55e') : '#f59e0b',
              display: 'inline-block',
              animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          {status === 'active' ? (isViolating ? 'VIOLATION' : 'PROCTORED') : status.toUpperCase()}
        </div>

        {/* Face count badge */}
        {status === 'active' && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: faceCount === 1 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
              borderRadius: '99px',
              padding: '2px 8px',
              fontSize: '10px',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {faceCount === 0 ? 'No face' : faceCount === 1 ? '1 face ✓' : `${faceCount} faces!`}
          </div>
        )}
      </div>

      {/* Violation countdown bar */}
      {isViolating && (
        <div
          style={{
            width: '200px',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: '10px',
            padding: '8px 10px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ color: '#fca5a5', fontSize: '11px', fontWeight: 600 }}>
              ⚠️ {currentViolation}
            </span>
            <span
              style={{
                color: (violationCountdown ?? 0) <= 5 ? '#ef4444' : '#fbbf24',
                fontSize: '13px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {violationCountdown}s
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '4px' }}>
            <div
              style={{
                width: `${((violationCountdown ?? 0) / VIOLATION_TIMEOUT) * 100}%`,
                height: '4px',
                borderRadius: '99px',
                background:
                  (violationCountdown ?? 0) <= 5
                    ? '#ef4444'
                    : (violationCountdown ?? 0) <= 10
                    ? '#f59e0b'
                    : '#22c55e',
                transition: 'width 1s linear, background 0.3s',
              }}
            />
          </div>
          <p style={{ color: '#9ca3af', fontSize: '10px', marginTop: '4px' }}>
            Quiz ends if not corrected
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default CameraProctoring;