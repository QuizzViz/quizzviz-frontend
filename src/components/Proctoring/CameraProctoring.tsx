'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProctoringProps {
  onViolation: (message: string) => void;
  onEnd: (reason: string) => void;
  isActive?: boolean;
  isStarted?: boolean;
}

type HeadDirection = 'center' | 'left' | 'right' | 'down' | 'up' | 'unknown';

const VIOLATION_TIMEOUT = 10;

// ─── Face identity config ─────────────────────────────────────────────────────
// Frames collected during calibration (~2 s of natural movement at 30 fps)
const IDENTITY_CALIBRATION_FRAMES = 60;
// We store a pool of reference signatures (evenly sampled from calibration).
// Every incoming frame must fail against ALL pool members to be flagged.
// Same person under varied lighting/angle: cosine similarity typically 0.93+
// Different person:                        cosine similarity typically < 0.88
const IDENTITY_SIMILARITY_THRESHOLD = 0.90;
const IDENTITY_REFERENCE_POOL_SIZE  = 10;
// Consecutive mismatch frames before terminating (~1.5 s at 30 fps)
const IDENTITY_MISMATCH_CONFIRM_FRAMES = 45;


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

  // Phone detection state
  const cocoModelRef = useRef<any>(null);
  const phoneDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Face identity state ──────────────────────────────────────────────────
  // Pool of reference signatures for the original exam taker (null = calibrating)
  const referencePoolRef = useRef<number[][] | null>(null);
  // Raw accumulator during calibration
  const calibrationAccRef = useRef<number[][]>([]);
  // Consecutive mismatch streak counter
  const identityMismatchCountRef = useRef(0);

  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [violationCountdown, setViolationCountdown] = useState<number | null>(null);
  const [currentViolation, setCurrentViolation] = useState<string>('');
  const [faceCount, setFaceCount] = useState<number>(0);
  const [phoneDetected, setPhoneDetected] = useState(false);

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
    if (phoneDetectionIntervalRef.current) {
      clearInterval(phoneDetectionIntervalRef.current);
      phoneDetectionIntervalRef.current = null;
    }
    if (faceMeshRef.current) {
      try { faceMeshRef.current.close(); } catch (_) {}
      faceMeshRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    multiFaceFrameCountRef.current = 0;
  }, []);

  // ─── Violation timer ────────────────────────────────────────────────────────
  const startViolationTimer = useCallback((message: string) => {
    if (violationIntervalRef.current) return;
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

  // consecutive multi-face frames required before ending (prevents close-up artefacts)
  const multiFaceFrameCountRef = useRef(0);
  const MULTI_FACE_CONFIRM_FRAMES = 4;

  // ─── Validate a real full face (not an artefact from close-up distortion) ────
  const isRealFace = (landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length < 200) return false;
    const forehead = landmarks[10];
    const chin     = landmarks[152];
    const leftEar  = landmarks[234];
    const rightEar = landmarks[454];
    const verticalSpan   = Math.abs(chin.y - forehead.y);
    const horizontalSpan = Math.abs(rightEar.x - leftEar.x);
    return verticalSpan > 0.04 && horizontalSpan > 0.03;
  };

  // ─── Face geometric signature ─────────────────────────────────────────────
  //
  // Builds a pose-normalised descriptor from ~21 stable inter-landmark ratios.
  // All distances are divided by the inter-eye span so the vector is invariant
  // to head size and distance from camera. This captures unique facial
  // proportions (eye spacing, nose length, jaw width, etc.) without depending
  // on absolute position.
  //
  // Key landmark indices used (MediaPipe 468-point FaceMesh):
  //   1   = nose tip         10  = forehead centre    152 = chin tip
  //   13  = upper lip        14  = lower lip          33  = left eye inner
  //   61  = left mouth corner 70 = left brow peak     93  = left ear inner
  //   98  = left nose base   145 = left eye bottom   159 = left eye top
  //   168 = nose bridge      234 = left ear          263 = right eye inner
  //   291 = right mouth corner 300= right brow peak  323 = right ear inner
  //   327 = right nose base  374 = right eye bottom  386 = right eye top
  //   454 = right ear
  //
  const extractFaceSignature = (landmarks: any[]): number[] => {
    const p = (idx: number) => landmarks[idx];

    const eyeSpan = Math.hypot(p(263).x - p(33).x, p(263).y - p(33).y);
    const scale   = Math.max(eyeSpan, 0.01);

    const d  = (a: number, b: number) =>
      Math.hypot(p(a).x - p(b).x, p(a).y - p(b).y) / scale;
    const dx = (a: number, b: number) =>
      Math.abs(p(a).x - p(b).x) / scale;
    const dy = (a: number, b: number) =>
      Math.abs(p(a).y - p(b).y) / scale;

    return [
      // Vertical face proportions
      dy(10, 1),    // forehead → nose tip
      dy(1, 152),   // nose tip → chin
      dy(10, 152),  // full face height
      dy(33, 152),  // left eye → chin
      dy(263, 152), // right eye → chin

      // Horizontal / width proportions
      dx(234, 454), // ear-to-ear (face width)
      dx(61, 291),  // mouth width
      dx(93, 323),  // inner ear to inner ear

      // Nose geometry
      dy(168, 1),   // nose bridge → tip (nose length)
      dx(98, 327),  // nose width at base

      // Eye geometry
      dy(159, 145), // left eye height
      dy(386, 374), // right eye height
      dy(70, 33),   // left brow → eye
      dy(300, 263), // right brow → eye

      // Mouth geometry
      dy(13, 14),   // lip height
      dy(1, 13),    // nose tip → upper lip
      dy(14, 152),  // lower lip → chin

      // Jaw / cheek diagonals
      d(234, 152),  // left ear → chin diagonal
      d(454, 152),  // right ear → chin diagonal
      d(33, 61),    // left eye → left mouth corner
      d(263, 291),  // right eye → right mouth corner
    ];
  };

  // ── Cosine similarity between two equal-length vectors (0–1) ────────────
  const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  };


  // ─── Head direction estimation ───────────────────────────────────────────────
  //
  // MediaPipe Y increases DOWNWARD (0 = top, 1 = bottom).
  //
  // ── How "looking down" actually changes the face geometry ────────────────────
  //
  //  When the user tilts their head DOWN (e.g. to look at a phone under the desk):
  //
  //   Signal A – foreheadRatio:
  //     The forehead landmark (10) moves TOWARD the nose tip (1) in Y.
  //     → foreheadDist = |nose.y − forehead.y|  SHRINKS.
  //     → foreheadRatio = foreheadDist / faceHeight  DECREASES  (< 0.38 when looking down).
  //     This is the most reliable single signal for downward tilt.
  //
  //   Signal B – eyebrow visibility (eyeToNoseY):
  //     The eyebrows/eyes shift upward in the frame (their Y value decreases).
  //     The nose tip stays relatively central or its Y increases.
  //     → eyeCenterY − noseTip.y  becomes MORE NEGATIVE.
  //     → eyeToNoseY < -0.55 when looking down (normalised by eye span).
  //
  //   Signal C – chin-to-forehead Y ratio:
  //     As head tilts down, chin.y increases (drops in frame) and
  //     forehead.y also increases but less — chin moves further from eyes.
  //     → chinToEyeY / foreheadToEyeY  ratio rises when looking down.
  //
  //  Strategy: use OR across multiple signals with individually tuned thresholds.
  //  Any single strong signal is enough — no AND gating that kills sensitivity.
  //
  const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
    if (!landmarks || landmarks.length === 0) return 'unknown';

    const noseTip       = landmarks[1];
    const leftEye       = landmarks[33];
    const rightEye      = landmarks[263];
    const forehead      = landmarks[10];   // top of forehead
    const chin          = landmarks[152];  // chin tip
    const leftEarInner  = landmarks[93];
    const rightEarInner = landmarks[323];
    // Use nose bridge as a stable top-of-nose reference for the down signal
    const noseBridge    = landmarks[168];

    // ── Scale: inter-eye distance ────────────────────────────────────────────
    const eyeSpan = Math.abs(rightEye.x - leftEye.x);
    const scale   = Math.max(eyeSpan, 0.01);

    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const faceCenterX = (noseTip.x + forehead.x) / 2;

    // ── Horizontal signals ───────────────────────────────────────────────────
    const hOffset = (eyeCenterX - faceCenterX) / scale;

    const noseToLeftEar  = Math.abs(noseTip.x - leftEarInner.x);
    const noseToRightEar = Math.abs(noseTip.x - rightEarInner.x);
    const earAsymmetry   = (noseToLeftEar - noseToRightEar) /
                           Math.max(noseToLeftEar + noseToRightEar, 0.01);

    if (hOffset < -0.25 || earAsymmetry >  0.18) return 'left';
    if (hOffset >  0.25 || earAsymmetry < -0.18) return 'right';

    // ── Vertical geometry ────────────────────────────────────────────────────
    const foreheadDist    = Math.abs(noseTip.y - forehead.y);   // forehead → nose
    const chinDist        = Math.abs(noseTip.y - chin.y);        // nose → chin
    const faceHeight      = foreheadDist + chinDist;

    // Signal A: what fraction of the face is ABOVE the nose tip
    // Looking DOWN → forehead crowds nose → foreheadRatio SHRINKS
    const foreheadRatio = faceHeight > 0.01 ? foreheadDist / faceHeight : 0.5;

    // Signal B: eye centre Y relative to nose tip, scaled by eye span
    // At neutral: eyes are above nose → negative value (e.g. -0.8)
    // Looking DOWN: eyes rise further in frame → becomes more negative (e.g. -1.1)
    const eyeToNoseY = (eyeCenterY - noseTip.y) / scale;

    // Signal C: nose bridge Y relative to chin Y, normalised by face height
    // Looking DOWN → nose bridge moves closer to chin in Y → ratio shrinks
    const noseBridgeToChinY = Math.abs(noseBridge.y - chin.y);
    const bridgeChinRatio   = faceHeight > 0.01 ? noseBridgeToChinY / faceHeight : 0.5;

    // Signal D: how much chin has dropped below eye level, normalised
    // Looking DOWN → chin.y increases a lot relative to eyeCenterY
    const chinBelowEyes = (chin.y - eyeCenterY) / scale;

    // ── DOWN detection ────────────────────────────────────────────────────────
    //
    // Strategy: Signal A (foreheadRatio) is the primary gatekeeper — it MUST
    // cross its threshold. Then at least ONE of B/C/D must also agree.
    // This prevents casual forward lean / reading posture from triggering while
    // still catching a deliberate downward tilt (e.g. phone under the desk).
    //
    //   A: foreheadRatio < 0.32   → forehead has clearly compressed toward nose
    //   B: eyeToNoseY < -1.1      → eyes are distinctly high above nose in frame
    //   C: bridgeChinRatio < 0.58 → nose bridge has moved noticeably close to chin
    //   D: chinBelowEyes > 3.0    → chin has dropped well below eyes
    //
    const sigA = foreheadRatio   < 0.32;
    const sigB = eyeToNoseY      < -1.1;
    const sigC = bridgeChinRatio < 0.58;
    const sigD = chinBelowEyes   > 3.0;

    // Primary signal MUST fire AND at least one corroborating signal must agree
    const lookingDown = sigA && (sigB || sigC || sigD);

    // ── UP detection ─────────────────────────────────────────────────────────
    // Looking UP → forehead stretches away from nose → foreheadRatio GROWS
    //            → eyes drop toward/below nose       → eyeToNoseY → 0 or positive
    const lookingUp =
      foreheadRatio > 0.60 &&
      eyeToNoseY    > -0.30;

    if (lookingDown) return 'down';
    if (lookingUp)   return 'up';

    return 'center';
  };

  // ─── Process detection results ───────────────────────────────────────────────
  const processFaceDetection = useCallback((results: any) => {
    if (hasEndedRef.current) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      multiFaceFrameCountRef.current = 0;
      setFaceCount(0);
      onViolation('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    const faces = results.multiFaceLandmarks;

    // Filter to only real faces (eliminates close-up artefact detections)
    const realFaces = faces.filter(isRealFace);
    setFaceCount(realFaces.length);

    if (realFaces.length === 0) {
      onViolation('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    if (realFaces.length > 1) {
      multiFaceFrameCountRef.current += 1;
      if (multiFaceFrameCountRef.current >= MULTI_FACE_CONFIRM_FRAMES) {
        hasEndedRef.current = true;
        cleanup();
        onEnd('Multiple faces detected');
      }
      return;
    }

    // Single real face – reset multi-face counter
    multiFaceFrameCountRef.current = 0;

    const primaryFace = realFaces[0];

    // ── Face identity check ────────────────────────────────────────────────
    const currentSig = extractFaceSignature(primaryFace);

    if (referencePoolRef.current === null) {
      // Calibration phase: collect raw frames (gaze checks still run below)
      calibrationAccRef.current.push(currentSig);
      if (calibrationAccRef.current.length >= IDENTITY_CALIBRATION_FRAMES) {
        // Evenly sample IDENTITY_REFERENCE_POOL_SIZE frames from the full buffer
        const total = calibrationAccRef.current.length;
        const step  = Math.floor(total / IDENTITY_REFERENCE_POOL_SIZE);
        const pool: number[][] = [];
        for (let i = 0; i < IDENTITY_REFERENCE_POOL_SIZE; i++) {
          pool.push(calibrationAccRef.current[i * step]);
        }
        referencePoolRef.current = pool;
        calibrationAccRef.current = []; // free memory
      }
      // No early return – gaze checks run even during calibration
    } else {
      // Calibrated: incoming frame must match AT LEAST ONE pool member.
      // Fails against ALL → mismatch streak increments.
      // One match resets the streak (tolerates natural pose/lighting shifts).
      const allFail = referencePoolRef.current.every(
        (ref) => cosineSimilarity(currentSig, ref) < IDENTITY_SIMILARITY_THRESHOLD
      );

      if (allFail) {
        identityMismatchCountRef.current += 1;
        if (identityMismatchCountRef.current >= IDENTITY_MISMATCH_CONFIRM_FRAMES) {
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            cleanup();
            onEnd('Person change detected – exam terminated');
          }
          return;
        }
      } else {
        // At least one reference matched – same person, reset streak
        identityMismatchCountRef.current = 0;
      }
    }

    // ── Gaze / head direction check ────────────────────────────────────────
    const direction = estimateHeadDirection(primaryFace);

    if (direction === 'left' || direction === 'right' || direction === 'down' || direction === 'up') {
      onViolation(`Looking ${direction}`);
      startViolationTimer(`Looking ${direction}`);
    } else {
      stopViolationTimer();
    }
  }, [onViolation, onEnd, startViolationTimer, stopViolationTimer, cleanup]);

  // ─── Phone detection via COCO-SSD ────────────────────────────────────────────
  const startPhoneDetection = useCallback(async () => {
    try {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();

      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model = await cocoSsd.load();
      cocoModelRef.current = model;

      phoneDetectionIntervalRef.current = setInterval(async () => {
        if (hasEndedRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

        try {
          const predictions = await cocoModelRef.current.detect(videoRef.current);
          const phoneFound = predictions.some(
            (p: any) =>
              p.class === 'cell phone' &&
              p.score > 0.55
          );

          if (phoneFound) {
            if (!hasEndedRef.current) {
              hasEndedRef.current = true;
              setPhoneDetected(true);
              cleanup();
              onEnd('Mobile phone detected in frame');
            }
          } else {
            setPhoneDetected(false);
          }
        } catch (_) {
          // ignore single-frame errors
        }
      }, 800);
    } catch (err) {
      console.warn('COCO-SSD phone detection unavailable:', err);
    }
  }, [cleanup, onEnd]);

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

      // 2. Dynamic import of MediaPipe
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

      // 4. Start phone detection in parallel (non-blocking)
      startPhoneDetection();
    } catch (err: any) {
      console.error('CameraProctoring init error:', err);
      setStatus('error');
    } finally {
      isInitializingRef.current = false;
    }
  }, [processFaceDetection, startPhoneDetection]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
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
          border: isViolating || phoneDetected ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)',
          backgroundColor: '#000',
          boxShadow: isViolating || phoneDetected
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
            transform: 'scaleX(-1)',
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
                status === 'active' ? (isViolating || phoneDetected ? '#ef4444' : '#22c55e') : '#f59e0b',
              display: 'inline-block',
              animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          {status === 'active'
            ? phoneDetected
              ? 'PHONE!'
              : isViolating
              ? 'VIOLATION'
              : 'PROCTORED'
            : status.toUpperCase()}
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

      {/* Phone detected banner (instant, no countdown) */}
      {phoneDetected && (
        <div
          style={{
            width: '200px',
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid rgba(239,68,68,0.8)',
            borderRadius: '10px',
            padding: '8px 10px',
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
            📱 Phone detected – ending quiz…
          </span>
        </div>
      )}

      {/* Violation countdown bar */}
      {isViolating && !phoneDetected && (
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

// 'use client';
// import React, { useRef, useEffect, useState, useCallback } from 'react';

// interface CameraProctoringProps {
//   onViolation: (message: string) => void;
//   onEnd: (reason: string) => void;
//   isActive?: boolean;
//   isStarted?: boolean;
// }

// type HeadDirection = 'center' | 'left' | 'right' | 'down' | 'up' | 'unknown';

// const VIOLATION_TIMEOUT = 10;

// // ─── Face identity config ─────────────────────────────────────────────────────
// // How many frames to average when building the baseline face signature
// const IDENTITY_CALIBRATION_FRAMES = 30;
// // Cosine similarity threshold — below this we suspect a different person (0–1)
// // 0.82 tolerates natural pose/lighting shifts while catching a true face swap
// const IDENTITY_SIMILARITY_THRESHOLD = 0.82;
// // Consecutive mismatched frames required before ending (prevents single-frame blips)
// const IDENTITY_MISMATCH_CONFIRM_FRAMES = 20;


// const CameraProctoring: React.FC<CameraProctoringProps> = ({
//   onViolation,
//   onEnd,
//   isActive = true,
//   isStarted = false,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const faceMeshRef = useRef<any>(null);
//   const cameraRef = useRef<any>(null);
//   const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const violationIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const hasEndedRef = useRef(false);
//   const isInitializingRef = useRef(false);

//   // Phone detection state
//   const cocoModelRef = useRef<any>(null);
//   const phoneDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   // ─── Face identity state ──────────────────────────────────────────────────
//   // Averaged geometric signature of the original exam taker's face
//   const faceSignatureRef = useRef<number[] | null>(null);
//   // Accumulator for calibration frames
//   const calibrationAccRef = useRef<number[][]>([]);
//   // Consecutive mismatch streak counter
//   const identityMismatchCountRef = useRef(0);

//   const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
//   const [violationCountdown, setViolationCountdown] = useState<number | null>(null);
//   const [currentViolation, setCurrentViolation] = useState<string>('');
//   const [faceCount, setFaceCount] = useState<number>(0);
//   const [phoneDetected, setPhoneDetected] = useState(false);

//   // ─── Cleanup ────────────────────────────────────────────────────────────────
//   const cleanup = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//     if (cameraRef.current) {
//       try { cameraRef.current.stop(); } catch (_) {}
//       cameraRef.current = null;
//     }
//     if (detectionIntervalRef.current) {
//       clearInterval(detectionIntervalRef.current);
//       detectionIntervalRef.current = null;
//     }
//     if (violationIntervalRef.current) {
//       clearInterval(violationIntervalRef.current);
//       violationIntervalRef.current = null;
//     }
//     if (phoneDetectionIntervalRef.current) {
//       clearInterval(phoneDetectionIntervalRef.current);
//       phoneDetectionIntervalRef.current = null;
//     }
//     if (faceMeshRef.current) {
//       try { faceMeshRef.current.close(); } catch (_) {}
//       faceMeshRef.current = null;
//     }
//     if (videoRef.current) videoRef.current.srcObject = null;
//     multiFaceFrameCountRef.current = 0;
//   }, []);

//   // ─── Violation timer ────────────────────────────────────────────────────────
//   const startViolationTimer = useCallback((message: string) => {
//     if (violationIntervalRef.current) return;
//     setCurrentViolation(message);
//     setViolationCountdown(VIOLATION_TIMEOUT);

//     violationIntervalRef.current = setInterval(() => {
//       setViolationCountdown((prev) => {
//         if (prev === null) return null;
//         const next = prev - 1;
//         if (next <= 0) {
//           if (!hasEndedRef.current) {
//             hasEndedRef.current = true;
//             onEnd('Cheating detected – prolonged violation');
//           }
//           return 0;
//         }
//         return next;
//       });
//     }, 1000);
//   }, [onEnd]);

//   const stopViolationTimer = useCallback(() => {
//     if (violationIntervalRef.current) {
//       clearInterval(violationIntervalRef.current);
//       violationIntervalRef.current = null;
//     }
//     setViolationCountdown(null);
//     setCurrentViolation('');
//   }, []);

//   // consecutive multi-face frames required before ending (prevents close-up artefacts)
//   const multiFaceFrameCountRef = useRef(0);
//   const MULTI_FACE_CONFIRM_FRAMES = 4;

//   // ─── Validate a real full face (not an artefact from close-up distortion) ────
//   const isRealFace = (landmarks: any[]): boolean => {
//     if (!landmarks || landmarks.length < 200) return false;
//     const forehead = landmarks[10];
//     const chin     = landmarks[152];
//     const leftEar  = landmarks[234];
//     const rightEar = landmarks[454];
//     const verticalSpan   = Math.abs(chin.y - forehead.y);
//     const horizontalSpan = Math.abs(rightEar.x - leftEar.x);
//     return verticalSpan > 0.04 && horizontalSpan > 0.03;
//   };

//   // ─── Face geometric signature ─────────────────────────────────────────────
//   //
//   // Builds a pose-normalised descriptor from ~21 stable inter-landmark ratios.
//   // All distances are divided by the inter-eye span so the vector is invariant
//   // to head size and distance from camera. This captures unique facial
//   // proportions (eye spacing, nose length, jaw width, etc.) without depending
//   // on absolute position.
//   //
//   // Key landmark indices used (MediaPipe 468-point FaceMesh):
//   //   1   = nose tip         10  = forehead centre    152 = chin tip
//   //   13  = upper lip        14  = lower lip          33  = left eye inner
//   //   61  = left mouth corner 70 = left brow peak     93  = left ear inner
//   //   98  = left nose base   145 = left eye bottom   159 = left eye top
//   //   168 = nose bridge      234 = left ear          263 = right eye inner
//   //   291 = right mouth corner 300= right brow peak  323 = right ear inner
//   //   327 = right nose base  374 = right eye bottom  386 = right eye top
//   //   454 = right ear
//   //
//   const extractFaceSignature = (landmarks: any[]): number[] => {
//     const p = (idx: number) => landmarks[idx];

//     const eyeSpan = Math.hypot(p(263).x - p(33).x, p(263).y - p(33).y);
//     const scale   = Math.max(eyeSpan, 0.01);

//     const d  = (a: number, b: number) =>
//       Math.hypot(p(a).x - p(b).x, p(a).y - p(b).y) / scale;
//     const dx = (a: number, b: number) =>
//       Math.abs(p(a).x - p(b).x) / scale;
//     const dy = (a: number, b: number) =>
//       Math.abs(p(a).y - p(b).y) / scale;

//     return [
//       // Vertical face proportions
//       dy(10, 1),    // forehead → nose tip
//       dy(1, 152),   // nose tip → chin
//       dy(10, 152),  // full face height
//       dy(33, 152),  // left eye → chin
//       dy(263, 152), // right eye → chin

//       // Horizontal / width proportions
//       dx(234, 454), // ear-to-ear (face width)
//       dx(61, 291),  // mouth width
//       dx(93, 323),  // inner ear to inner ear

//       // Nose geometry
//       dy(168, 1),   // nose bridge → tip (nose length)
//       dx(98, 327),  // nose width at base

//       // Eye geometry
//       dy(159, 145), // left eye height
//       dy(386, 374), // right eye height
//       dy(70, 33),   // left brow → eye
//       dy(300, 263), // right brow → eye

//       // Mouth geometry
//       dy(13, 14),   // lip height
//       dy(1, 13),    // nose tip → upper lip
//       dy(14, 152),  // lower lip → chin

//       // Jaw / cheek diagonals
//       d(234, 152),  // left ear → chin diagonal
//       d(454, 152),  // right ear → chin diagonal
//       d(33, 61),    // left eye → left mouth corner
//       d(263, 291),  // right eye → right mouth corner
//     ];
//   };

//   // ── Cosine similarity between two equal-length vectors (0–1) ────────────
//   const cosineSimilarity = (a: number[], b: number[]): number => {
//     let dot = 0, normA = 0, normB = 0;
//     for (let i = 0; i < a.length; i++) {
//       dot   += a[i] * b[i];
//       normA += a[i] * a[i];
//       normB += b[i] * b[i];
//     }
//     return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
//   };

//   // ── Average a list of signature vectors component-wise ──────────────────
//   const averageSignatures = (sigs: number[][]): number[] => {
//     const len = sigs[0].length;
//     const avg = new Array(len).fill(0);
//     for (const s of sigs) for (let i = 0; i < len; i++) avg[i] += s[i];
//     return avg.map((v) => v / sigs.length);
//   };

//   // ─── Head direction estimation ───────────────────────────────────────────────
//   //
//   // MediaPipe Y increases DOWNWARD (0 = top, 1 = bottom).
//   //
//   // ── How "looking down" actually changes the face geometry ────────────────────
//   //
//   //  When the user tilts their head DOWN (e.g. to look at a phone under the desk):
//   //
//   //   Signal A – foreheadRatio:
//   //     The forehead landmark (10) moves TOWARD the nose tip (1) in Y.
//   //     → foreheadDist = |nose.y − forehead.y|  SHRINKS.
//   //     → foreheadRatio = foreheadDist / faceHeight  DECREASES  (< 0.38 when looking down).
//   //     This is the most reliable single signal for downward tilt.
//   //
//   //   Signal B – eyebrow visibility (eyeToNoseY):
//   //     The eyebrows/eyes shift upward in the frame (their Y value decreases).
//   //     The nose tip stays relatively central or its Y increases.
//   //     → eyeCenterY − noseTip.y  becomes MORE NEGATIVE.
//   //     → eyeToNoseY < -0.55 when looking down (normalised by eye span).
//   //
//   //   Signal C – chin-to-forehead Y ratio:
//   //     As head tilts down, chin.y increases (drops in frame) and
//   //     forehead.y also increases but less — chin moves further from eyes.
//   //     → chinToEyeY / foreheadToEyeY  ratio rises when looking down.
//   //
//   //  Strategy: use OR across multiple signals with individually tuned thresholds.
//   //  Any single strong signal is enough — no AND gating that kills sensitivity.
//   //
//   const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
//     if (!landmarks || landmarks.length === 0) return 'unknown';

//     const noseTip       = landmarks[1];
//     const leftEye       = landmarks[33];
//     const rightEye      = landmarks[263];
//     const forehead      = landmarks[10];   // top of forehead
//     const chin          = landmarks[152];  // chin tip
//     const leftEarInner  = landmarks[93];
//     const rightEarInner = landmarks[323];
//     // Use nose bridge as a stable top-of-nose reference for the down signal
//     const noseBridge    = landmarks[168];

//     // ── Scale: inter-eye distance ────────────────────────────────────────────
//     const eyeSpan = Math.abs(rightEye.x - leftEye.x);
//     const scale   = Math.max(eyeSpan, 0.01);

//     const eyeCenterX = (leftEye.x + rightEye.x) / 2;
//     const eyeCenterY = (leftEye.y + rightEye.y) / 2;
//     const faceCenterX = (noseTip.x + forehead.x) / 2;

//     // ── Horizontal signals ───────────────────────────────────────────────────
//     const hOffset = (eyeCenterX - faceCenterX) / scale;

//     const noseToLeftEar  = Math.abs(noseTip.x - leftEarInner.x);
//     const noseToRightEar = Math.abs(noseTip.x - rightEarInner.x);
//     const earAsymmetry   = (noseToLeftEar - noseToRightEar) /
//                            Math.max(noseToLeftEar + noseToRightEar, 0.01);

//     if (hOffset < -0.25 || earAsymmetry >  0.18) return 'left';
//     if (hOffset >  0.25 || earAsymmetry < -0.18) return 'right';

//     // ── Vertical geometry ────────────────────────────────────────────────────
//     const foreheadDist    = Math.abs(noseTip.y - forehead.y);   // forehead → nose
//     const chinDist        = Math.abs(noseTip.y - chin.y);        // nose → chin
//     const faceHeight      = foreheadDist + chinDist;

//     // Signal A: what fraction of the face is ABOVE the nose tip
//     // Looking DOWN → forehead crowds nose → foreheadRatio SHRINKS
//     const foreheadRatio = faceHeight > 0.01 ? foreheadDist / faceHeight : 0.5;

//     // Signal B: eye centre Y relative to nose tip, scaled by eye span
//     // At neutral: eyes are above nose → negative value (e.g. -0.8)
//     // Looking DOWN: eyes rise further in frame → becomes more negative (e.g. -1.1)
//     const eyeToNoseY = (eyeCenterY - noseTip.y) / scale;

//     // Signal C: nose bridge Y relative to chin Y, normalised by face height
//     // Looking DOWN → nose bridge moves closer to chin in Y → ratio shrinks
//     const noseBridgeToChinY = Math.abs(noseBridge.y - chin.y);
//     const bridgeChinRatio   = faceHeight > 0.01 ? noseBridgeToChinY / faceHeight : 0.5;

//     // Signal D: how much chin has dropped below eye level, normalised
//     // Looking DOWN → chin.y increases a lot relative to eyeCenterY
//     const chinBelowEyes = (chin.y - eyeCenterY) / scale;

//     // ── DOWN detection (OR logic — any strong signal fires it) ───────────────
//     //
//     // Tuned thresholds (each independently sufficient):
//     //   A: foreheadRatio < 0.35  → forehead has clearly compressed toward nose
//     //   B: eyeToNoseY < -1.0     → eyes are very high above nose in frame
//     //   C: bridgeChinRatio < 0.62 → nose bridge has moved close to chin
//     //   D: chinBelowEyes > 2.8   → chin has dropped far below eyes
//     //
//     const lookingDown =
//       foreheadRatio  < 0.35  ||   // Signal A — primary, most reliable
//       eyeToNoseY     < -1.0  ||   // Signal B — eye-rise confirmation
//       bridgeChinRatio < 0.62 ||   // Signal C — nose-bridge drop
//       chinBelowEyes  > 2.8;       // Signal D — chin extension

//     // ── UP detection ─────────────────────────────────────────────────────────
//     // Looking UP → forehead stretches away from nose → foreheadRatio GROWS
//     //            → eyes drop toward/below nose       → eyeToNoseY → 0 or positive
//     const lookingUp =
//       foreheadRatio > 0.60 &&
//       eyeToNoseY    > -0.30;

//     if (lookingDown) return 'down';
//     if (lookingUp)   return 'up';

//     return 'center';
//   };

//   // ─── Process detection results ───────────────────────────────────────────────
//   const processFaceDetection = useCallback((results: any) => {
//     if (hasEndedRef.current) return;

//     if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
//       multiFaceFrameCountRef.current = 0;
//       setFaceCount(0);
//       onViolation('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     const faces = results.multiFaceLandmarks;

//     // Filter to only real faces (eliminates close-up artefact detections)
//     const realFaces = faces.filter(isRealFace);
//     setFaceCount(realFaces.length);

//     if (realFaces.length === 0) {
//       onViolation('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     if (realFaces.length > 1) {
//       multiFaceFrameCountRef.current += 1;
//       if (multiFaceFrameCountRef.current >= MULTI_FACE_CONFIRM_FRAMES) {
//         hasEndedRef.current = true;
//         cleanup();
//         onEnd('Multiple faces detected');
//       }
//       return;
//     }

//     // Single real face – reset multi-face counter
//     multiFaceFrameCountRef.current = 0;

//     const primaryFace = realFaces[0];

//     // ── Face identity check ────────────────────────────────────────────────
//     const currentSig = extractFaceSignature(primaryFace);

//     if (faceSignatureRef.current === null) {
//       // Still in calibration phase – accumulate frames to build the baseline
//       calibrationAccRef.current.push(currentSig);
//       if (calibrationAccRef.current.length >= IDENTITY_CALIBRATION_FRAMES) {
//         faceSignatureRef.current = averageSignatures(calibrationAccRef.current);
//         calibrationAccRef.current = []; // free memory
//       }
//       // During calibration, skip gaze checks so the first few frames don't
//       // fire false violations while the user settles into position
//       return;
//     }

//     // Calibrated – compare current face against stored baseline
//     const similarity = cosineSimilarity(currentSig, faceSignatureRef.current);

//     if (similarity < IDENTITY_SIMILARITY_THRESHOLD) {
//       identityMismatchCountRef.current += 1;
//       if (identityMismatchCountRef.current >= IDENTITY_MISMATCH_CONFIRM_FRAMES) {
//         if (!hasEndedRef.current) {
//           hasEndedRef.current = true;
//           cleanup();
//           onEnd('Different person detected – exam terminated');
//         }
//         return;
//       }
//     } else {
//       // Faces match – reset mismatch streak
//       identityMismatchCountRef.current = 0;
//     }

//     // ── Gaze / head direction check ────────────────────────────────────────
//     const direction = estimateHeadDirection(primaryFace);

//     if (direction === 'left' || direction === 'right' || direction === 'down' || direction === 'up') {
//       onViolation(`Looking ${direction}`);
//       startViolationTimer(`Looking ${direction}`);
//     } else {
//       stopViolationTimer();
//     }
//   }, [onViolation, onEnd, startViolationTimer, stopViolationTimer, cleanup]);

//   // ─── Phone detection via COCO-SSD ────────────────────────────────────────────
//   const startPhoneDetection = useCallback(async () => {
//     try {
//       const tf = await import('@tensorflow/tfjs');
//       await tf.ready();

//       const cocoSsd = await import('@tensorflow-models/coco-ssd');
//       const model = await cocoSsd.load();
//       cocoModelRef.current = model;

//       phoneDetectionIntervalRef.current = setInterval(async () => {
//         if (hasEndedRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

//         try {
//           const predictions = await cocoModelRef.current.detect(videoRef.current);
//           const phoneFound = predictions.some(
//             (p: any) =>
//               p.class === 'cell phone' &&
//               p.score > 0.55
//           );

//           if (phoneFound) {
//             if (!hasEndedRef.current) {
//               hasEndedRef.current = true;
//               setPhoneDetected(true);
//               cleanup();
//               onEnd('Mobile phone detected in frame');
//             }
//           } else {
//             setPhoneDetected(false);
//           }
//         } catch (_) {
//           // ignore single-frame errors
//         }
//       }, 800);
//     } catch (err) {
//       console.warn('COCO-SSD phone detection unavailable:', err);
//     }
//   }, [cleanup, onEnd]);

//   // ─── Initialize ──────────────────────────────────────────────────────────────
//   const initialize = useCallback(async () => {
//     if (isInitializingRef.current || hasEndedRef.current) return;
//     isInitializingRef.current = true;
//     setStatus('loading');

//     try {
//       // 1. Webcam
//       const mediaStream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 320, height: 240, facingMode: 'user' },
//       });
//       streamRef.current = mediaStream;

//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//         await new Promise<void>((res) => {
//           if (!videoRef.current) return res();
//           videoRef.current.onloadedmetadata = () => res();
//         });
//         await videoRef.current.play();
//       }

//       // 2. Dynamic import of MediaPipe
//       const [{ FaceMesh }, { Camera }] = await Promise.all([
//         import('@mediapipe/face_mesh'),
//         import('@mediapipe/camera_utils'),
//       ]);

//       const faceMesh = new FaceMesh({
//         locateFile: (file: string) =>
//           `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//       });
//       faceMesh.setOptions({
//         maxNumFaces: 5,
//         refineLandmarks: true,
//         minDetectionConfidence: 0.5,
//         minTrackingConfidence: 0.5,
//       });
//       faceMesh.onResults(processFaceDetection);
//       faceMeshRef.current = faceMesh;

//       // 3. Start Camera loop
//       const cam = new Camera(videoRef.current!, {
//         onFrame: async () => {
//           if (faceMeshRef.current && videoRef.current && videoRef.current.readyState === 4) {
//             await faceMeshRef.current.send({ image: videoRef.current });
//           }
//         },
//         width: 320,
//         height: 240,
//       });
//       cam.start();
//       cameraRef.current = cam;

//       setStatus('active');

//       // 4. Start phone detection in parallel (non-blocking)
//       startPhoneDetection();
//     } catch (err: any) {
//       console.error('CameraProctoring init error:', err);
//       setStatus('error');
//     } finally {
//       isInitializingRef.current = false;
//     }
//   }, [processFaceDetection, startPhoneDetection]);

//   // ─── Lifecycle ───────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!isActive || !isStarted) return;
//     initialize();
//     return cleanup;
//   }, [isActive, isStarted]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ─── UI ──────────────────────────────────────────────────────────────────────
//   const isViolating = violationCountdown !== null;

//   return (
//     <div
//       style={{
//         position: 'fixed',
//         bottom: '24px',
//         left: '24px',
//         zIndex: 9999,
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'flex-start',
//         gap: '8px',
//         pointerEvents: 'none',
//       }}
//     >
//       {/* Camera preview box */}
//       <div
//         style={{
//           width: '200px',
//           borderRadius: '12px',
//           overflow: 'hidden',
//           border: isViolating || phoneDetected ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)',
//           backgroundColor: '#000',
//           boxShadow: isViolating || phoneDetected
//             ? '0 0 20px rgba(239,68,68,0.5)'
//             : '0 4px 24px rgba(0,0,0,0.5)',
//           transition: 'border-color 0.3s, box-shadow 0.3s',
//           position: 'relative',
//         }}
//       >
//         {/* Video */}
//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           muted
//           style={{
//             width: '200px',
//             height: '150px',
//             objectFit: 'cover',
//             display: status === 'active' ? 'block' : 'none',
//             transform: 'scaleX(-1)',
//           }}
//         />

//         {/* Placeholder when not active */}
//         {status !== 'active' && (
//           <div
//             style={{
//               width: '200px',
//               height: '150px',
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//               backgroundColor: '#111',
//               color: '#666',
//               fontSize: '12px',
//               gap: '8px',
//             }}
//           >
//             {status === 'loading' && (
//               <>
//                 <div style={{ fontSize: '24px' }}>📷</div>
//                 <span>Starting camera…</span>
//               </>
//             )}
//             {status === 'idle' && (
//               <>
//                 <div style={{ fontSize: '24px' }}>📷</div>
//                 <span>Camera standby</span>
//               </>
//             )}
//             {status === 'error' && (
//               <>
//                 <div style={{ fontSize: '24px' }}>⚠️</div>
//                 <span style={{ color: '#f87171', textAlign: 'center', padding: '0 12px' }}>
//                   Camera unavailable
//                 </span>
//               </>
//             )}
//           </div>
//         )}

//         {/* Status badge */}
//         <div
//           style={{
//             position: 'absolute',
//             top: '6px',
//             left: '6px',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '5px',
//             background: 'rgba(0,0,0,0.65)',
//             borderRadius: '99px',
//             padding: '2px 8px',
//             fontSize: '10px',
//             color: '#fff',
//           }}
//         >
//           <span
//             style={{
//               width: '6px',
//               height: '6px',
//               borderRadius: '50%',
//               backgroundColor:
//                 status === 'active' ? (isViolating || phoneDetected ? '#ef4444' : '#22c55e') : '#f59e0b',
//               display: 'inline-block',
//               animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
//             }}
//           />
//           {status === 'active'
//             ? phoneDetected
//               ? 'PHONE!'
//               : isViolating
//               ? 'VIOLATION'
//               : 'PROCTORED'
//             : status.toUpperCase()}
//         </div>

//         {/* Face count badge */}
//         {status === 'active' && (
//           <div
//             style={{
//               position: 'absolute',
//               top: '6px',
//               right: '6px',
//               background: faceCount === 1 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
//               borderRadius: '99px',
//               padding: '2px 8px',
//               fontSize: '10px',
//               color: '#fff',
//               fontWeight: 600,
//             }}
//           >
//             {faceCount === 0 ? 'No face' : faceCount === 1 ? '1 face ✓' : `${faceCount} faces!`}
//           </div>
//         )}
//       </div>

//       {/* Phone detected banner (instant, no countdown) */}
//       {phoneDetected && (
//         <div
//           style={{
//             width: '200px',
//             background: 'rgba(0,0,0,0.9)',
//             border: '1px solid rgba(239,68,68,0.8)',
//             borderRadius: '10px',
//             padding: '8px 10px',
//             pointerEvents: 'none',
//           }}
//         >
//           <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
//             📱 Phone detected – ending quiz…
//           </span>
//         </div>
//       )}

//       {/* Violation countdown bar */}
//       {isViolating && !phoneDetected && (
//         <div
//           style={{
//             width: '200px',
//             background: 'rgba(0,0,0,0.85)',
//             border: '1px solid rgba(239,68,68,0.5)',
//             borderRadius: '10px',
//             padding: '8px 10px',
//             pointerEvents: 'none',
//           }}
//         >
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
//             <span style={{ color: '#fca5a5', fontSize: '11px', fontWeight: 600 }}>
//               ⚠️ {currentViolation}
//             </span>
//             <span
//               style={{
//                 color: (violationCountdown ?? 0) <= 5 ? '#ef4444' : '#fbbf24',
//                 fontSize: '13px',
//                 fontWeight: 700,
//                 fontVariantNumeric: 'tabular-nums',
//               }}
//             >
//               {violationCountdown}s
//             </span>
//           </div>
//           <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '4px' }}>
//             <div
//               style={{
//                 width: `${((violationCountdown ?? 0) / VIOLATION_TIMEOUT) * 100}%`,
//                 height: '4px',
//                 borderRadius: '99px',
//                 background:
//                   (violationCountdown ?? 0) <= 5
//                     ? '#ef4444'
//                     : (violationCountdown ?? 0) <= 10
//                     ? '#f59e0b'
//                     : '#22c55e',
//                 transition: 'width 1s linear, background 0.3s',
//               }}
//             />
//           </div>
//           <p style={{ color: '#9ca3af', fontSize: '10px', marginTop: '4px' }}>
//             Quiz ends if not corrected
//           </p>
//         </div>
//       )}

//       <style>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CameraProctoring;
