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
const IDENTITY_CALIBRATION_FRAMES = 40;
const IDENTITY_SIMILARITY_THRESHOLD = 0.82;   // soft — sustained mismatch → terminate
const IDENTITY_MISMATCH_CONFIRM_FRAMES = 12;  // consecutive frames before soft termination
const IDENTITY_HARD_FAIL_THRESHOLD = 0.60;    // instant terminate — clearly different person

// ─── Phone detection config ───────────────────────────────────────────────────
const PHONE_DETECTION_INTERVAL_MS = 200;
const PHONE_DETECTION_CONFIDENCE  = 0.30;


const CameraProctoring: React.FC<CameraProctoringProps> = ({
  onViolation,
  onEnd,
  isActive = true,
  isStarted = false,
}) => {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef   = useRef<any>(null);

  const violationIntervalRef    = useRef<NodeJS.Timeout | null>(null);
  const phoneDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef             = useRef(false);
  const isInitializingRef       = useRef(false);

  // Phone
  const cocoModelRef    = useRef<any>(null);
  const phoneCanvasRef  = useRef<HTMLCanvasElement | null>(null);

  // ─── ALL face-identity state in refs ──────────────────────────────────────
  // KEY FIX: We store faceSignature and mismatch counter in refs so they are
  // always readable by the latest callback without needing a re-render or a
  // new closure.
  const faceSignatureRef          = useRef<number[] | null>(null);
  const calibrationAccRef         = useRef<number[][]>([]);
  const identityMismatchCountRef  = useRef(0);
  const multiFaceFrameCountRef    = useRef(0);

  // ─── Stable refs for callbacks passed in as props ─────────────────────────
  // KEY FIX: Store onViolation / onEnd in refs so the MediaPipe onFrame loop
  // always calls the LATEST version — not a stale closure from mount time.
  const onViolationRef = useRef(onViolation);
  const onEndRef       = useRef(onEnd);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // UI state
  const [status,           setStatus]           = useState<'idle'|'loading'|'active'|'error'>('idle');
  const [violationCountdown, setViolationCountdown] = useState<number | null>(null);
  const [currentViolation, setCurrentViolation] = useState('');
  const [faceCount,        setFaceCount]        = useState(0);
  const [phoneDetected,    setPhoneDetected]    = useState(false);
  const [calibrated,       setCalibrated]       = useState(false);
  const [calibrationPct,   setCalibrationPct]   = useState(0);

  const MULTI_FACE_CONFIRM_FRAMES = 4;

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (_) {}
      cameraRef.current = null;
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

  // ─── Violation timer ──────────────────────────────────────────────────────
  const startViolationTimer = useCallback((message: string) => {
    if (violationIntervalRef.current) return;
    setCurrentViolation(message);
    setViolationCountdown(VIOLATION_TIMEOUT);

    violationIntervalRef.current = setInterval(() => {
      setViolationCountdown(prev => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            onEndRef.current('Cheating detected – prolonged violation');
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, []);

  const stopViolationTimer = useCallback(() => {
    if (violationIntervalRef.current) {
      clearInterval(violationIntervalRef.current);
      violationIntervalRef.current = null;
    }
    setViolationCountdown(null);
    setCurrentViolation('');
  }, []);

  // ─── Face helpers ─────────────────────────────────────────────────────────
  const isRealFace = (landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length < 200) return false;
    const f = landmarks[10], c = landmarks[152],
          l = landmarks[234], r = landmarks[454];
    return Math.abs(c.y - f.y) > 0.04 && Math.abs(r.x - l.x) > 0.03;
  };

  const extractFaceSignature = (landmarks: any[]): number[] => {
    const p = (i: number) => landmarks[i];
    const eyeSpan = Math.hypot(p(263).x - p(33).x, p(263).y - p(33).y);
    const s = Math.max(eyeSpan, 0.01);
    const d  = (a: number, b: number) => Math.hypot(p(a).x-p(b).x, p(a).y-p(b).y) / s;
    const dx = (a: number, b: number) => Math.abs(p(a).x - p(b).x) / s;
    const dy = (a: number, b: number) => Math.abs(p(a).y - p(b).y) / s;
    return [
      dy(10,1), dy(1,152), dy(10,152), dy(33,152), dy(263,152),
      dx(234,454), dx(61,291), dx(93,323),
      dy(168,1), dx(98,327),
      dy(159,145), dy(386,374), dy(70,33), dy(300,263),
      dy(13,14), dy(1,13), dy(14,152),
      d(234,152), d(454,152), d(33,61), d(263,291),
    ];
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]*b[i]; nA += a[i]*a[i]; nB += b[i]*b[i];
    }
    return dot / (Math.sqrt(nA) * Math.sqrt(nB) + 1e-8);
  };

  const averageSignatures = (sigs: number[][]): number[] => {
    const len = sigs[0].length;
    const avg = new Array(len).fill(0);
    for (const s of sigs) for (let i = 0; i < len; i++) avg[i] += s[i];
    return avg.map(v => v / sigs.length);
  };

  // ─── Head direction ────────────────────────────────────────────────────────
  const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
    if (!landmarks || landmarks.length === 0) return 'unknown';
    const noseTip = landmarks[1], leftEye = landmarks[33], rightEye = landmarks[263];
    const forehead = landmarks[10], chin = landmarks[152];
    const leftEarInner = landmarks[93], rightEarInner = landmarks[323];
    const noseBridge = landmarks[168];

    const eyeSpan    = Math.abs(rightEye.x - leftEye.x);
    const scale      = Math.max(eyeSpan, 0.01);
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const faceCenterX = (noseTip.x + forehead.x) / 2;

    const hOffset      = (eyeCenterX - faceCenterX) / scale;
    const noseToLeft   = Math.abs(noseTip.x - leftEarInner.x);
    const noseToRight  = Math.abs(noseTip.x - rightEarInner.x);
    const earAsymmetry = (noseToLeft - noseToRight) / Math.max(noseToLeft + noseToRight, 0.01);

    if (hOffset < -0.25 || earAsymmetry >  0.18) return 'left';
    if (hOffset >  0.25 || earAsymmetry < -0.18) return 'right';

    const foreheadDist    = Math.abs(noseTip.y - forehead.y);
    const chinDist        = Math.abs(noseTip.y - chin.y);
    const faceHeight      = foreheadDist + chinDist;
    const foreheadRatio   = faceHeight > 0.01 ? foreheadDist / faceHeight : 0.5;
    const eyeToNoseY      = (eyeCenterY - noseTip.y) / scale;
    const bridgeChinRatio = faceHeight > 0.01 ? Math.abs(noseBridge.y - chin.y) / faceHeight : 0.5;
    const chinBelowEyes   = (chin.y - eyeCenterY) / scale;

    const lookingDown = foreheadRatio < 0.40 || eyeToNoseY < -0.85 ||
                        bridgeChinRatio < 0.66 || chinBelowEyes > 2.4;
    const lookingUp   = foreheadRatio > 0.60 && eyeToNoseY > -0.30;

    if (lookingDown) return 'down';
    if (lookingUp)   return 'up';
    return 'center';
  };

  // ─── Face detection handler ───────────────────────────────────────────────
  // KEY FIX: This is stored in a ref (processFaceDetectionRef) and re-assigned
  // every render. The MediaPipe onFrame callback reads from this ref, so it
  // always executes the LATEST version — eliminating stale closure bugs entirely.
  const processFaceDetectionRef = useRef<(results: any) => void>(() => {});

  processFaceDetectionRef.current = (results: any) => {
    if (hasEndedRef.current) return;

    const terminate = (reason: string) => {
      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        cleanup();
        onEndRef.current(reason);
      }
    };

    // No face at all
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      multiFaceFrameCountRef.current = 0;
      setFaceCount(0);
      onViolationRef.current('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    const realFaces = results.multiFaceLandmarks.filter(isRealFace);
    setFaceCount(realFaces.length);

    if (realFaces.length === 0) {
      onViolationRef.current('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    // Multiple faces
    if (realFaces.length > 1) {
      multiFaceFrameCountRef.current += 1;
      if (multiFaceFrameCountRef.current >= MULTI_FACE_CONFIRM_FRAMES) {
        terminate('Multiple faces detected');
      }
      return;
    }

    multiFaceFrameCountRef.current = 0;
    const primaryFace = realFaces[0];

    // ── CALIBRATION ──────────────────────────────────────────────────────────
    if (faceSignatureRef.current === null) {
      calibrationAccRef.current.push(extractFaceSignature(primaryFace));
      const pct = Math.min(
        Math.round((calibrationAccRef.current.length / IDENTITY_CALIBRATION_FRAMES) * 100), 100
      );
      setCalibrationPct(pct);

      if (calibrationAccRef.current.length >= IDENTITY_CALIBRATION_FRAMES) {
        faceSignatureRef.current = averageSignatures(calibrationAccRef.current);
        calibrationAccRef.current = [];
        identityMismatchCountRef.current = 0;
        setCalibrated(true);
        console.log('[Proctoring] Baseline face locked in ✓');
      }
      return; // no other checks during calibration
    }

    // ── IDENTITY CHECK ────────────────────────────────────────────────────────
    const currentSig = extractFaceSignature(primaryFace);
    const similarity  = cosineSimilarity(currentSig, faceSignatureRef.current);

    // Log every 30 frames for debugging (won't spam the console)
    // console.log('[Proctoring] similarity:', similarity.toFixed(4));

    // Hard fail — instantly a different person
    if (similarity < IDENTITY_HARD_FAIL_THRESHOLD) {
      console.warn('[Proctoring] Hard identity fail — similarity:', similarity.toFixed(4));
      terminate('Person changed – exam terminated. A different person was detected on camera.');
      return;
    }

    // Soft fail — accumulate
    if (similarity < IDENTITY_SIMILARITY_THRESHOLD) {
      identityMismatchCountRef.current += 1;
      console.warn(
        '[Proctoring] Soft identity mismatch streak:',
        identityMismatchCountRef.current,
        '/ similarity:', similarity.toFixed(4)
      );
      onViolationRef.current('Identity mismatch detected');
      startViolationTimer('Identity mismatch detected');

      if (identityMismatchCountRef.current >= IDENTITY_MISMATCH_CONFIRM_FRAMES) {
        terminate('Person changed – exam terminated. A different person was detected on camera.');
      }
      return;
    }

    // Identity confirmed — reset streak
    identityMismatchCountRef.current = 0;

    // ── GAZE CHECK ────────────────────────────────────────────────────────────
    const direction = estimateHeadDirection(primaryFace);
    if (direction === 'left' || direction === 'right' || direction === 'down' || direction === 'up') {
      onViolationRef.current(`Looking ${direction}`);
      startViolationTimer(`Looking ${direction}`);
    } else {
      stopViolationTimer();
    }
  };

  // ─── Phone detection ──────────────────────────────────────────────────────
  const startPhoneDetection = useCallback(async () => {
    try {
      const tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model = await cocoSsd.load({ base: 'mobilenet_v2' });
      cocoModelRef.current = model;

      const offscreen = document.createElement('canvas');
      offscreen.width = 320; offscreen.height = 240;
      phoneCanvasRef.current = offscreen;
      const ctx = offscreen.getContext('2d');

      phoneDetectionIntervalRef.current = setInterval(async () => {
        if (hasEndedRef.current || !videoRef.current || videoRef.current.readyState < 2 || !ctx) return;
        try {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          const predictions = await cocoModelRef.current.detect(offscreen);
          const phoneFound  = predictions.some(
            (p: any) => (p.class === 'cell phone' || p.class === 'remote') &&
                         p.score > PHONE_DETECTION_CONFIDENCE
          );
          if (phoneFound && !hasEndedRef.current) {
            hasEndedRef.current = true;
            setPhoneDetected(true);
            cleanup();
            onEndRef.current('Mobile phone detected in frame');
          } else if (!phoneFound) {
            setPhoneDetected(false);
          }
        } catch (_) {}
      }, PHONE_DETECTION_INTERVAL_MS);
    } catch (err) {
      console.warn('COCO-SSD phone detection unavailable:', err);
    }
  }, [cleanup]);

  // ─── Initialize ───────────────────────────────────────────────────────────
  const initialize = useCallback(async () => {
    if (isInitializingRef.current || hasEndedRef.current) return;
    isInitializingRef.current = true;
    setStatus('loading');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise<void>(res => {
          if (!videoRef.current) return res();
          videoRef.current.onloadedmetadata = () => res();
        });
        await videoRef.current.play();
      }

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
      // KEY FIX: Don't pass processFaceDetection directly.
      // Instead delegate through the ref so the latest version always runs.
      faceMesh.onResults((results: any) => processFaceDetectionRef.current(results));
      faceMeshRef.current = faceMesh;

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
      startPhoneDetection();
    } catch (err: any) {
      console.error('CameraProctoring init error:', err);
      setStatus('error');
    } finally {
      isInitializingRef.current = false;
    }
  }, [startPhoneDetection]);

  useEffect(() => {
    if (!isActive || !isStarted) return;
    initialize();
    return cleanup;
  }, [isActive, isStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── UI ───────────────────────────────────────────────────────────────────
  const isViolating = violationCountdown !== null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: '8px', pointerEvents: 'none',
    }}>
      {/* Camera preview */}
      <div style={{
        width: '200px', borderRadius: '12px', overflow: 'hidden',
        border: isViolating || phoneDetected ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)',
        backgroundColor: '#000',
        boxShadow: isViolating || phoneDetected
          ? '0 0 20px rgba(239,68,68,0.5)' : '0 4px 24px rgba(0,0,0,0.5)',
        transition: 'border-color 0.3s, box-shadow 0.3s', position: 'relative',
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{
          width: '200px', height: '150px', objectFit: 'cover',
          display: status === 'active' ? 'block' : 'none', transform: 'scaleX(-1)',
        }} />

        {status !== 'active' && (
          <div style={{
            width: '200px', height: '150px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#111', color: '#666', fontSize: '12px', gap: '8px',
          }}>
            {status === 'loading' && <><div style={{fontSize:'24px'}}>📷</div><span>Starting camera…</span></>}
            {status === 'idle'    && <><div style={{fontSize:'24px'}}>📷</div><span>Camera standby</span></>}
            {status === 'error'   && <><div style={{fontSize:'24px'}}>⚠️</div>
              <span style={{color:'#f87171',textAlign:'center',padding:'0 12px'}}>Camera unavailable</span></>}
          </div>
        )}

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: '6px', left: '6px', display: 'flex',
          alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.65)',
          borderRadius: '99px', padding: '2px 8px', fontSize: '10px', color: '#fff',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
            animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
            backgroundColor:
              status !== 'active'              ? '#f59e0b' :
              isViolating || phoneDetected     ? '#ef4444' :
              calibrated                       ? '#22c55e' : '#f59e0b',
          }} />
          {status === 'active'
            ? phoneDetected ? 'PHONE!'
            : isViolating   ? 'VIOLATION'
            : calibrated    ? 'PROCTORED'
            : `CALIBRATING ${calibrationPct}%`
            : status.toUpperCase()}
        </div>

        {/* Face count badge */}
        {status === 'active' && (
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            background: faceCount === 1 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
            borderRadius: '99px', padding: '2px 8px', fontSize: '10px',
            color: '#fff', fontWeight: 600,
          }}>
            {faceCount === 0 ? 'No face' : faceCount === 1 ? '1 face ✓' : `${faceCount} faces!`}
          </div>
        )}

        {/* Calibration progress bar */}
        {status === 'active' && !calibrated && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px', background: 'rgba(255,255,255,0.08)',
          }}>
            <div style={{
              height: '3px', background: '#f59e0b',
              width: `${calibrationPct}%`, transition: 'width 0.2s linear',
            }} />
          </div>
        )}
      </div>

      {/* Phone banner */}
      {phoneDetected && (
        <div style={{
          width: '200px', background: 'rgba(0,0,0,0.9)',
          border: '1px solid rgba(239,68,68,0.8)', borderRadius: '10px', padding: '8px 10px',
        }}>
          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
            📱 Phone detected – ending quiz…
          </span>
        </div>
      )}

      {/* Violation countdown */}
      {isViolating && !phoneDetected && (
        <div style={{
          width: '200px', background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(239,68,68,0.5)', borderRadius: '10px', padding: '8px 10px',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
            <span style={{ color:'#fca5a5', fontSize:'11px', fontWeight:600 }}>
              ⚠️ {currentViolation}
            </span>
            <span style={{
              color: (violationCountdown ?? 0) <= 5 ? '#ef4444' : '#fbbf24',
              fontSize: '13px', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            }}>
              {violationCountdown}s
            </span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'99px', height:'4px' }}>
            <div style={{
              width: `${((violationCountdown ?? 0) / VIOLATION_TIMEOUT) * 100}%`,
              height: '4px', borderRadius: '99px',
              background: (violationCountdown ?? 0) <= 5 ? '#ef4444'
                        : (violationCountdown ?? 0) <= 10 ? '#f59e0b' : '#22c55e',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
          <p style={{ color:'#9ca3af', fontSize:'10px', marginTop:'4px' }}>
            Quiz ends if not corrected
          </p>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
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

// // Cosine similarity threshold — below this we consider it a different person.
// const IDENTITY_SIMILARITY_THRESHOLD = 0.75;

// // Consecutive mismatched frames before soft-termination
// const IDENTITY_MISMATCH_CONFIRM_FRAMES = 15;

// // If similarity drops below this, terminate IMMEDIATELY (obvious person swap)
// const IDENTITY_HARD_FAIL_THRESHOLD = 0.55;


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
//   const faceSignatureRef = useRef<number[] | null>(null);
//   const calibrationAccRef = useRef<number[][]>([]);
//   const identityMismatchCountRef = useRef(0);

//   const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
//   const [violationCountdown, setViolationCountdown] = useState<number | null>(null);
//   const [currentViolation, setCurrentViolation] = useState<string>('');
//   const [faceCount, setFaceCount] = useState<number>(0);
//   const [phoneDetected, setPhoneDetected] = useState(false);
//   const [calibrated, setCalibrated] = useState(false);
//   const [calibrationFrames, setCalibrationFrames] = useState(0);

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

//   const multiFaceFrameCountRef = useRef(0);
//   const MULTI_FACE_CONFIRM_FRAMES = 4;

//   // ─── Validate a real full face ───────────────────────────────────────────────
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
//   // All distances are divided by the inter-eye span, making the vector invariant
//   // to head size and distance. This uniquely captures facial proportions.
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
//       dy(10, 1),    // forehead → nose tip
//       dy(1, 152),   // nose tip → chin
//       dy(10, 152),  // full face height
//       dy(33, 152),  // left eye → chin
//       dy(263, 152), // right eye → chin
//       dx(234, 454), // ear-to-ear (face width)
//       dx(61, 291),  // mouth width
//       dx(93, 323),  // inner ear to inner ear
//       dy(168, 1),   // nose bridge → tip
//       dx(98, 327),  // nose width at base
//       dy(159, 145), // left eye height
//       dy(386, 374), // right eye height
//       dy(70, 33),   // left brow → eye
//       dy(300, 263), // right brow → eye
//       dy(13, 14),   // lip height
//       dy(1, 13),    // nose tip → upper lip
//       dy(14, 152),  // lower lip → chin
//       d(234, 152),  // left ear → chin diagonal
//       d(454, 152),  // right ear → chin diagonal
//       d(33, 61),    // left eye → left mouth corner
//       d(263, 291),  // right eye → right mouth corner
//     ];
//   };

//   const cosineSimilarity = (a: number[], b: number[]): number => {
//     let dot = 0, normA = 0, normB = 0;
//     for (let i = 0; i < a.length; i++) {
//       dot   += a[i] * b[i];
//       normA += a[i] * a[i];
//       normB += b[i] * b[i];
//     }
//     return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
//   };

//   const averageSignatures = (sigs: number[][]): number[] => {
//     const len = sigs[0].length;
//     const avg = new Array(len).fill(0);
//     for (const s of sigs) for (let i = 0; i < len; i++) avg[i] += s[i];
//     return avg.map((v) => v / sigs.length);
//   };

//   // ─── Head direction estimation ───────────────────────────────────────────────
//   //
//   // DOWN DETECTION — SENSITIVE:
//   //
//   // When the user looks downward even slightly:
//   //   Signal A — foreheadRatio < 0.40:
//   //     The forehead landmark crowds toward the nose in Y.
//   //     Even a moderate downward tilt brings this below 0.40.
//   //     (Original was 0.35 — only fired on extreme tilt)
//   //
//   //   Signal B — eyeToNoseY < -0.85:
//   //     Eyes rise in the frame (Y decreases) as head tilts down.
//   //     Threshold loosened from -1.0 → -0.85, catches moderate glances.
//   //
//   //   Signal C — bridgeChinRatio < 0.66:
//   //     Nose bridge approaches chin in Y as head tilts down.
//   //     Loosened from 0.62 → 0.66 for earlier detection.
//   //
//   //   Signal D — chinBelowEyes > 2.4:
//   //     Chin drops further below eye level.
//   //     Lowered from 2.8 → 2.4 for earlier detection.
//   //
//   // OR logic: any single signal is sufficient to flag looking down.
//   //
//   const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
//     if (!landmarks || landmarks.length === 0) return 'unknown';

//     const noseTip       = landmarks[1];
//     const leftEye       = landmarks[33];
//     const rightEye      = landmarks[263];
//     const forehead      = landmarks[10];
//     const chin          = landmarks[152];
//     const leftEarInner  = landmarks[93];
//     const rightEarInner = landmarks[323];
//     const noseBridge    = landmarks[168];

//     const eyeSpan = Math.abs(rightEye.x - leftEye.x);
//     const scale   = Math.max(eyeSpan, 0.01);

//     const eyeCenterX  = (leftEye.x + rightEye.x) / 2;
//     const eyeCenterY  = (leftEye.y + rightEye.y) / 2;
//     const faceCenterX = (noseTip.x + forehead.x) / 2;

//     // ── Horizontal ───────────────────────────────────────────────────────────
//     const hOffset = (eyeCenterX - faceCenterX) / scale;
//     const noseToLeftEar  = Math.abs(noseTip.x - leftEarInner.x);
//     const noseToRightEar = Math.abs(noseTip.x - rightEarInner.x);
//     const earAsymmetry   = (noseToLeftEar - noseToRightEar) /
//                             Math.max(noseToLeftEar + noseToRightEar, 0.01);

//     if (hOffset < -0.25 || earAsymmetry >  0.18) return 'left';
//     if (hOffset >  0.25 || earAsymmetry < -0.18) return 'right';

//     // ── Vertical geometry ────────────────────────────────────────────────────
//     const foreheadDist = Math.abs(noseTip.y - forehead.y);
//     const chinDist     = Math.abs(noseTip.y - chin.y);
//     const faceHeight   = foreheadDist + chinDist;

//     // Signal A: fraction of face above nose tip (shrinks when looking down)
//     const foreheadRatio = faceHeight > 0.01 ? foreheadDist / faceHeight : 0.5;

//     // Signal B: eye Y vs nose Y normalised by eye span
//     // More negative = eyes are higher in frame = head is tilted down
//     const eyeToNoseY = (eyeCenterY - noseTip.y) / scale;

//     // Signal C: nose bridge to chin Y distance vs face height
//     // Shrinks when looking down
//     const noseBridgeToChinY = Math.abs(noseBridge.y - chin.y);
//     const bridgeChinRatio   = faceHeight > 0.01 ? noseBridgeToChinY / faceHeight : 0.5;

//     // Signal D: how far chin has dropped below eyes
//     const chinBelowEyes = (chin.y - eyeCenterY) / scale;

//     // ── DOWN: sensitive thresholds, OR logic ────────────────────────────────
//     const lookingDown =
//       foreheadRatio   < 0.40 ||   // A — forehead crowding nose (was 0.35)
//       eyeToNoseY      < -0.85 ||  // B — eyes riding high in frame (was -1.0)
//       bridgeChinRatio < 0.66 ||   // C — nose bridge near chin (was 0.62)
//       chinBelowEyes   > 2.4;      // D — chin dropped below eyes (was 2.8)

//     // ── UP ───────────────────────────────────────────────────────────────────
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

//     // ── No face ──────────────────────────────────────────────────────────────
//     if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
//       multiFaceFrameCountRef.current = 0;
//       setFaceCount(0);
//       onViolation('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     const realFaces = results.multiFaceLandmarks.filter(isRealFace);
//     setFaceCount(realFaces.length);

//     if (realFaces.length === 0) {
//       onViolation('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     // ── Multiple faces → terminate ───────────────────────────────────────────
//     if (realFaces.length > 1) {
//       multiFaceFrameCountRef.current += 1;
//       if (multiFaceFrameCountRef.current >= MULTI_FACE_CONFIRM_FRAMES) {
//         if (!hasEndedRef.current) {
//           hasEndedRef.current = true;
//           cleanup();
//           onEnd('Multiple faces detected');
//         }
//       }
//       return;
//     }

//     multiFaceFrameCountRef.current = 0;
//     const primaryFace = realFaces[0];

//     // ── Face identity: CALIBRATION phase ─────────────────────────────────────
//     // The very first IDENTITY_CALIBRATION_FRAMES frames lock in the exam-taker's
//     // baseline signature. Until then no gaze checks run (let the user settle).
//     if (faceSignatureRef.current === null) {
//       const sig = extractFaceSignature(primaryFace);
//       calibrationAccRef.current.push(sig);
//       setCalibrationFrames(calibrationAccRef.current.length);

//       if (calibrationAccRef.current.length >= IDENTITY_CALIBRATION_FRAMES) {
//         faceSignatureRef.current = averageSignatures(calibrationAccRef.current);
//         calibrationAccRef.current = [];
//         setCalibrated(true);
//       }
//       return; // skip gaze checks while calibrating
//     }

//     // ── Face identity: VERIFICATION phase ────────────────────────────────────
//     // Every subsequent frame is compared against the locked baseline.
//     // Two-tier response:
//     //   • similarity < HARD_FAIL  → immediate termination (obvious swap)
//     //   • similarity < THRESHOLD  → accumulate frames, terminate after N consecutive
//     const currentSig = extractFaceSignature(primaryFace);
//     const similarity = cosineSimilarity(currentSig, faceSignatureRef.current);

//     if (similarity < IDENTITY_HARD_FAIL_THRESHOLD) {
//       // Score so low it can only mean a completely different person on screen
//       if (!hasEndedRef.current) {
//         hasEndedRef.current = true;
//         cleanup();
//         onEnd('Person changed – exam terminated. A different person was detected on camera.');
//       }
//       return;
//     }

//     if (similarity < IDENTITY_SIMILARITY_THRESHOLD) {
//       // Softer mismatch — could be lighting/pose, so confirm over multiple frames
//       identityMismatchCountRef.current += 1;

//       if (identityMismatchCountRef.current >= IDENTITY_MISMATCH_CONFIRM_FRAMES) {
//         if (!hasEndedRef.current) {
//           hasEndedRef.current = true;
//           cleanup();
//           onEnd('Person changed – exam terminated. A different person was detected on camera.');
//         }
//         return;
//       }

//       // Warn while accumulating frames
//       onViolation('Identity mismatch detected');
//       startViolationTimer('Identity mismatch detected');
//       return;
//     }

//     // ── Identity confirmed — reset mismatch streak ────────────────────────────
//     identityMismatchCountRef.current = 0;

//     // ── Gaze / head direction ─────────────────────────────────────────────────
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
//             (p: any) => p.class === 'cell phone' && p.score > 0.55
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
//         } catch (_) {}
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
//   const calibrationPercent = Math.min(
//     Math.round((calibrationFrames / IDENTITY_CALIBRATION_FRAMES) * 100),
//     100
//   );

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
//                 status === 'active'
//                   ? isViolating || phoneDetected
//                     ? '#ef4444'
//                     : calibrated
//                     ? '#22c55e'
//                     : '#f59e0b'
//                   : '#f59e0b',
//               display: 'inline-block',
//               animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
//             }}
//           />
//           {status === 'active'
//             ? phoneDetected
//               ? 'PHONE!'
//               : isViolating
//               ? 'VIOLATION'
//               : calibrated
//               ? 'PROCTORED'
//               : `CALIBRATING ${calibrationPercent}%`
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

//         {/* Calibration progress bar — amber stripe at bottom of video */}
//         {status === 'active' && !calibrated && (
//           <div
//             style={{
//               position: 'absolute',
//               bottom: 0,
//               left: 0,
//               right: 0,
//               height: '3px',
//               background: 'rgba(255,255,255,0.08)',
//             }}
//           >
//             <div
//               style={{
//                 height: '3px',
//                 background: '#f59e0b',
//                 width: `${calibrationPercent}%`,
//                 transition: 'width 0.2s linear',
//               }}
//             />
//           </div>
//         )}
//       </div>

//       {/* Phone detected banner */}
//       {phoneDetected && (
//         <div
//           style={{
//             width: '200px',
//             background: 'rgba(0,0,0,0.9)',
//             border: '1px solid rgba(239,68,68,0.8)',
//             borderRadius: '10px',
//             padding: '8px 10px',
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