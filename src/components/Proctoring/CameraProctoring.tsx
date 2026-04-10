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
//   // A genuine face has measurable spread between forehead and chin in Y axis.
//   // Artefacts from partial re-detections tend to be tiny bounding regions.
//   const isRealFace = (landmarks: any[]): boolean => {
//     if (!landmarks || landmarks.length < 200) return false;
//     const forehead = landmarks[10];
//     const chin     = landmarks[152];
//     const leftEar  = landmarks[234];
//     const rightEar = landmarks[454];
//     const verticalSpan   = Math.abs(chin.y - forehead.y);
//     const horizontalSpan = Math.abs(rightEar.x - leftEar.x);
//     // Must have at least 4% of frame height and 3% width to count as a real face
//     return verticalSpan > 0.04 && horizontalSpan > 0.03;
//   };

//   // ─── Head direction estimation ───────────────────────────────────────────────
//   //
//   // Uses THREE independent signals combined so that any one alone being
//   // ambiguous at distance is compensated by the others:
//   //
//   //  1. Nose-to-eye-centre horizontal offset (normalised by eye-span) – yaw
//   //  2. Ear asymmetry ratio (left ear vs right ear visibility) – yaw at distance
//   //     When you turn right the LEFT ear becomes more visible and vice-versa.
//   //     This is robust even when the face is tiny/far away.
//   //  3. Forehead-to-chin ratio (tiltRatio) – pitch/down
//   const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
//     if (!landmarks || landmarks.length === 0) return 'unknown';

//     const noseTip  = landmarks[1];
//     const leftEye  = landmarks[33];
//     const rightEye = landmarks[263];
//     const forehead = landmarks[10];
//     const chin     = landmarks[152];
//     // Ear landmarks: 234 = left ear tip, 454 = right ear tip
//     const leftEar  = landmarks[234];
//     const rightEar = landmarks[454];
//     // Inner ear canal landmarks: 93 = left, 323 = right (more stable)
//     const leftEarInner  = landmarks[93];
//     const rightEarInner = landmarks[323];

//     // ── Signal 1: normalised horizontal offset ──────────────────────────────
//     const eyeSpan = Math.abs(rightEye.x - leftEye.x);
//     const scale   = Math.max(eyeSpan, 0.01);
//     const eyeCenterX  = (leftEye.x + rightEye.x) / 2;
//     const faceCenterX = (noseTip.x + forehead.x) / 2;
//     const faceCenterY = (noseTip.y + forehead.y) / 2;
//     const eyeCenterY  = (leftEye.y + rightEye.y) / 2;
//     const hOffset = (eyeCenterX - faceCenterX) / scale;  // + = turned right in mirror
//     const vOffset = (eyeCenterY - faceCenterY) / scale;

//     // ── Signal 2: ear asymmetry (nose-to-ear distances) ────────────────────
//     // When face turns RIGHT (in real world), the right ear moves behind and
//     // the nose moves closer to the left ear in X. So:
//     //   noseToLeftEar small  → facing right
//     //   noseToRightEar small → facing left
//     const noseToLeftEar  = Math.abs(noseTip.x - leftEarInner.x);
//     const noseToRightEar = Math.abs(noseTip.x - rightEarInner.x);
//     const earAsymmetry   = (noseToLeftEar - noseToRightEar) / Math.max(noseToLeftEar + noseToRightEar, 0.01);
//     // earAsymmetry > 0  → nose closer to right ear  → face turned LEFT
//     // earAsymmetry < 0  → nose closer to left ear   → face turned RIGHT

//     // ── Signal 3: vertical tilt ratio ──────────────────────────────────────
//     const foreheadDist = Math.abs(noseTip.y - forehead.y);
//     const chinDist     = Math.abs(noseTip.y - chin.y);
//     const tiltRatio    = chinDist > 0 ? foreheadDist / chinDist : 1;
//     // tiltRatio < 0.75 → chin compressed → looking down

//     // ── Decision: any TWO signals agreeing → violation ──────────────────────
//     // Thresholds chosen to be strict (catches moderate turns) but not hair-trigger:
//     const hLeft   = hOffset < -0.25;                // offset says left
//     const hRight  = hOffset >  0.25;                // offset says right
//     const earLeft  = earAsymmetry >  0.18;          // ear asymmetry says left
//     const earRight = earAsymmetry < -0.18;          // ear asymmetry says right
//     const lookingDown = vOffset > 0.2 || tiltRatio < 0.75;

//     // Require at least ONE positional OR ear signal for left/right
//     // Using OR (not AND) because at distance hOffset weakens and ear takes over
//     if (hLeft  || earLeft)  return 'left';
//     if (hRight || earRight) return 'right';
//     if (vOffset > 0.25)     return 'down';  // eyes below face center = looking down
//     if (vOffset < -0.25)    return 'up';    // eyes above face center = looking up
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
//       // All detections were artefacts – treat as no face
//       onViolation('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     if (realFaces.length > 1) {
//       // Require several consecutive frames before ending (rules out close-up glitch)
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

//     const direction = estimateHeadDirection(realFaces[0]);

//     if (direction === 'left' || direction === 'right' || direction === 'down' || direction === 'up') {
//       onViolation(`Looking ${direction}`);
//       startViolationTimer(`Looking ${direction}`);
//     } else {
//       stopViolationTimer();
//     }
//   }, [onViolation, onEnd, startViolationTimer, stopViolationTimer, cleanup]);

//   // ─── Phone detection via COCO-SSD ────────────────────────────────────────────
//   //
//   // FIX 2: MediaPipe FaceMesh only tracks faces – it cannot see objects like
//   // phones. We load TensorFlow.js + COCO-SSD (runs entirely in-browser, no
//   // server) and poll every 800 ms. A phone must appear in PHONE_CONFIRM_FRAMES
//   // consecutive detections before ending the quiz to avoid false positives.
//   const startPhoneDetection = useCallback(async () => {
//     try {
//       // Dynamically import to keep SSR safe
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
//               p.score > 0.55 // confidence threshold
//           );

//           if (phoneFound) {
//             // Instant termination — no warnings, no countdown
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
//       // Non-fatal – face proctoring continues normally
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

  // ─── Head direction estimation ───────────────────────────────────────────────
  //
  // In MediaPipe, Y coordinates increase DOWNWARD (top = 0, bottom = 1).
  //
  // Signals used:
  //  1. hOffset       – horizontal nose-to-eye-centre offset (yaw left/right)
  //  2. earAsymmetry  – nose-to-ear distance ratio (yaw at distance)
  //  3. chinFraction  – fraction of face height below the nose (pitch up/down)
  //  4. eyeNoseYDiff  – where eyes sit relative to nose tip (pitch confirmation)
  //
  // Up/down require BOTH signals 3 & 4 to agree → eliminates the previous
  // false-positive where looking up triggered "looking down" and vice-versa.
  const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
    if (!landmarks || landmarks.length === 0) return 'unknown';

    const noseTip       = landmarks[1];
    const leftEye       = landmarks[33];
    const rightEye      = landmarks[263];
    const forehead      = landmarks[10];
    const chin          = landmarks[152];
    const leftEarInner  = landmarks[93];
    const rightEarInner = landmarks[323];

    // ── Scale reference (inter-eye distance) ────────────────────────────────
    const eyeSpan = Math.abs(rightEye.x - leftEye.x);
    const scale   = Math.max(eyeSpan, 0.01);

    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const faceCenterX = (noseTip.x + forehead.x) / 2;

    // ── Signal 1: horizontal offset (normalised by eye span) ────────────────
    const hOffset = (eyeCenterX - faceCenterX) / scale;

    // ── Signal 2: ear asymmetry ──────────────────────────────────────────────
    // earAsymmetry > 0 → nose closer to right ear → face turned LEFT
    // earAsymmetry < 0 → nose closer to left ear  → face turned RIGHT
    const noseToLeftEar  = Math.abs(noseTip.x - leftEarInner.x);
    const noseToRightEar = Math.abs(noseTip.x - rightEarInner.x);
    const earAsymmetry   = (noseToLeftEar - noseToRightEar) /
                           Math.max(noseToLeftEar + noseToRightEar, 0.01);

    // ── Signal 3: chinFraction (pitch – replaces the old tiltRatio) ─────────
    // MediaPipe Y increases downward, so:
    //   Looking DOWN → chin rises toward nose → chinDist SHRINKS → chinFraction DECREASES
    //   Looking UP   → forehead drops toward nose → foreheadDist SHRINKS → chinFraction INCREASES
    const foreheadDist     = Math.abs(noseTip.y - forehead.y);
    const chinDist         = Math.abs(noseTip.y - chin.y);
    const totalFaceHeight  = foreheadDist + chinDist;
    const chinFraction     = totalFaceHeight > 0.01 ? chinDist / totalFaceHeight : 0.5;

    // ── Signal 4: eye-to-nose Y difference (independent pitch confirmation) ──
    // Looking DOWN → eyes drop below nose → eyeNoseYDiff becomes large positive
    // Looking UP   → eyes rise above nose → eyeNoseYDiff becomes negative
    const eyeNoseYDiff = (eyeCenterY - noseTip.y) / scale;

    // ── Horizontal decisions (OR logic – either signal alone is enough) ──────
    const hLeft   = hOffset < -0.25;
    const hRight  = hOffset >  0.25;
    const earLeft  = earAsymmetry >  0.18;
    const earRight = earAsymmetry < -0.18;

    if (hLeft  || earLeft)  return 'left';
    if (hRight || earRight) return 'right';

    // ── Vertical decisions (AND logic – both signals must agree) ────────────
    // Looking DOWN: chin compresses (chinFraction < 0.42) AND eyes drop (eyeNoseYDiff > 0.3)
    const lookingDown = chinFraction < 0.42 && eyeNoseYDiff > 0.3;

    // Looking UP: chin stretches (chinFraction > 0.60) AND eyes rise (eyeNoseYDiff < -0.15)
    const lookingUp   = chinFraction > 0.60 && eyeNoseYDiff < -0.15;

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

    const direction = estimateHeadDirection(realFaces[0]);

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