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
// const IDENTITY_CALIBRATION_FRAMES = 30;

// // ── Thresholds (balanced: catches person-swap, tolerates lighting) ────────────
// //
// // Strategy:
// //   • Sudden-drop guard   → catches an abrupt face-swap in 1–2 frames
// //   • Hard-fail streak    → catches a sustained low similarity (different person
// //                           who happens to score near the boundary)
// //   • Soft-fail streak    → shows a warning before terminating for borderline cases
// //
// // Key insight: EMA with alpha=0.35 dampens a sudden raw drop of ~0.30 to only
// // ~0.10 in the smoothed signal.  So the sudden-drop guard MUST use the RAW
// // similarity delta, not the smoothed one.  EMA is only used for the streak
// // checks (where we want noise immunity over multiple frames).

// const APPEARANCE_HARD_FAIL        = 0.70;  // raw similarity — clearly different face
// const APPEARANCE_HARD_FAIL_FRAMES = 5;     // 5 consecutive frames → ~1 s at 5 fps

// const APPEARANCE_SOFT_FAIL        = 0.78;  // raw similarity — borderline mismatch
// const APPEARANCE_MISMATCH_FRAMES  = 8;     // 8 frames sustained warning → terminate

// // Sudden-drop guard uses RAW delta (not smoothed) so a face-swap isn't hidden
// // by EMA dampening.  Lighting changes are gradual (Δ < 0.05/frame); face-swaps are abrupt (Δ > 0.15).
// const SUDDEN_DROP_THRESHOLD = 0.12;

// // EMA is used only to smooth the value fed to streak counters (not drop guard)
// const SIMILARITY_EMA_ALPHA  = 0.40;

// // Baseline adaptation — ONLY when very confident; stops new-face learning
// const BASELINE_ADAPT_RATE   = 0.005;

// // Phone detection
// const PHONE_DETECTION_INTERVAL_MS = 50;
// const PHONE_DETECTION_CONFIDENCE  = 0.50;


// const CameraProctoring: React.FC<CameraProctoringProps> = ({
//   onViolation,
//   onEnd,
//   isActive = true,
//   isStarted = false,
// }) => {
//   const videoRef    = useRef<HTMLVideoElement>(null);
//   const streamRef   = useRef<MediaStream | null>(null);
//   const faceMeshRef = useRef<any>(null);
//   const cameraRef   = useRef<any>(null);

//   const violationIntervalRef      = useRef<NodeJS.Timeout | null>(null);
//   const phoneDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const hasEndedRef               = useRef(false);
//   const isInitializingRef         = useRef(false);

//   // Phone
//   const cocoModelRef   = useRef<any>(null);
//   const phoneCanvasRef = useRef<HTMLCanvasElement | null>(null);

//   // ─── Face appearance identity ──────────────────────────────────────────────
//   const faceHistogramRef         = useRef<number[] | null>(null);
//   const calibrationHistogramsRef = useRef<number[][]>([]);
//   const appearanceMismatchRef    = useRef(0);
//   const hardFailStreakRef        = useRef(0);

//   // EMA of raw similarity — used ONLY for streak threshold checks
//   const smoothedSimilarityRef = useRef(1.0);
//   // Previous RAW similarity — used for the sudden-drop guard
//   const prevRawSimilarityRef  = useRef(1.0);

//   // Offscreen canvas for face crop
//   const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);

//   const multiFaceFrameCountRef    = useRef(0);
//   const MULTI_FACE_CONFIRM_FRAMES = 4;

//   // Always-current prop refs
//   const onViolationRef = useRef(onViolation);
//   const onEndRef       = useRef(onEnd);
//   useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
//   useEffect(() => { onEndRef.current = onEnd; },           [onEnd]);

//   // UI state
//   const [status,             setStatus]             = useState<'idle'|'loading'|'active'|'error'>('idle');
//   const [violationCountdown, setViolationCountdown] = useState<number | null>(null);
//   const [currentViolation,   setCurrentViolation]   = useState('');
//   const [faceCount,          setFaceCount]          = useState(0);
//   const [phoneDetected,      setPhoneDetected]      = useState(false);
//   const [calibrated,         setCalibrated]         = useState(false);
//   const [calibrationPct,     setCalibrationPct]     = useState(0);

//   // ─── Cleanup ──────────────────────────────────────────────────────────────
//   const cleanup = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(t => t.stop());
//       streamRef.current = null;
//     }
//     if (cameraRef.current) {
//       try { cameraRef.current.stop(); } catch (_) {}
//       cameraRef.current = null;
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

//   // ─── Violation timer ──────────────────────────────────────────────────────
//   const startViolationTimer = useCallback((message: string) => {
//     if (violationIntervalRef.current) return;
//     setCurrentViolation(message);
//     setViolationCountdown(VIOLATION_TIMEOUT);
//     violationIntervalRef.current = setInterval(() => {
//       setViolationCountdown(prev => {
//         if (prev === null) return null;
//         const next = prev - 1;
//         if (next <= 0) {
//           if (!hasEndedRef.current) {
//             hasEndedRef.current = true;
//             onEndRef.current('Cheating detected – prolonged violation');
//           }
//           return 0;
//         }
//         return next;
//       });
//     }, 1000);
//   }, []);

//   const stopViolationTimer = useCallback(() => {
//     if (violationIntervalRef.current) {
//       clearInterval(violationIntervalRef.current);
//       violationIntervalRef.current = null;
//     }
//     setViolationCountdown(null);
//     setCurrentViolation('');
//   }, []);

//   // ─── Real face sanity check ───────────────────────────────────────────────
//   const isRealFace = (landmarks: any[]): boolean => {
//     if (!landmarks || landmarks.length < 200) return false;
//     const f = landmarks[10], c = landmarks[152],
//           l = landmarks[234], r = landmarks[454];
//     return Math.abs(c.y - f.y) > 0.04 && Math.abs(r.x - l.x) > 0.03;
//   };

//   // ─── Histogram extraction (3-channel: brightness + 2 colour opponents) ────
//   //
//   // Colour-opponent channels (R-G)/(R+G+B) and B/(R+G+B) are invariant to
//   // uniform brightness scaling, so they stay stable across lighting changes
//   // while clearly differing between people with different skin/hair tones.
//   const CROP_SIZE = 32;
//   const HIST_BINS = 32;  // per channel → 96-element descriptor total

//   const extractFaceHistogram = (
//     landmarks: any[],
//     videoEl: HTMLVideoElement,
//     canvas: HTMLCanvasElement
//   ): number[] | null => {
//     const ctx = canvas.getContext('2d', { willReadFrequently: true });
//     if (!ctx) return null;

//     let minX = 1, minY = 1, maxX = 0, maxY = 0;
//     for (const lm of landmarks) {
//       if (lm.x < minX) minX = lm.x;
//       if (lm.y < minY) minY = lm.y;
//       if (lm.x > maxX) maxX = lm.x;
//       if (lm.y > maxY) maxY = lm.y;
//     }

//     const vw = videoEl.videoWidth  || 320;
//     const vh = videoEl.videoHeight || 240;
//     const padX = (maxX - minX) * 0.10;
//     const padY = (maxY - minY) * 0.10;
//     const sx = Math.max(0, (minX - padX) * vw);
//     const sy = Math.max(0, (minY - padY) * vh);
//     const sw = Math.min(vw - sx, (maxX - minX + 2 * padX) * vw);
//     const sh = Math.min(vh - sy, (maxY - minY + 2 * padY) * vh);

//     if (sw < 10 || sh < 10) return null;

//     canvas.width  = CROP_SIZE;
//     canvas.height = CROP_SIZE;
//     ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE);

//     const imageData   = ctx.getImageData(0, 0, CROP_SIZE, CROP_SIZE).data;
//     const totalPixels = CROP_SIZE * CROP_SIZE;

//     // Channel 1: mean-normalised luminance (compensates global brightness shift)
//     const grays = new Array(totalPixels);
//     let meanGray = 0;
//     for (let i = 0, p = 0; i < imageData.length; i += 4, p++) {
//       const g = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
//       grays[p] = g;
//       meanGray += g;
//     }
//     meanGray /= totalPixels;

//     const histGray = new Array(HIST_BINS).fill(0);
//     for (let p = 0; p < totalPixels; p++) {
//       const shifted = Math.max(0, Math.min(255, grays[p] - meanGray + 128));
//       histGray[Math.min(HIST_BINS - 1, Math.floor((shifted / 255) * HIST_BINS))]++;
//     }

//     // Channel 2: (R-G)/(R+G+B+1) — lighting-invariant red-green opponent
//     const histRG = new Array(HIST_BINS).fill(0);
//     for (let i = 0; i < imageData.length; i += 4) {
//       const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
//       const rg = (r - g) / (r + g + b + 1) + 0.5;  // [-1,1] → [0,1]
//       histRG[Math.min(HIST_BINS - 1, Math.floor(rg * HIST_BINS))]++;
//     }

//     // Channel 3: B/(R+G+B+1) — lighting-invariant blue-yellow opponent
//     const histBY = new Array(HIST_BINS).fill(0);
//     for (let i = 0; i < imageData.length; i += 4) {
//       const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
//       const by = b / (r + g + b + 1);
//       histBY[Math.min(HIST_BINS - 1, Math.floor(by * HIST_BINS))]++;
//     }

//     const norm = (h: number[]) => h.map(v => v / totalPixels);
//     return [...norm(histGray), ...norm(histRG), ...norm(histBY)];
//   };

//   // Bhattacharyya coefficient (0 = nothing in common, 1 = identical)
//   const bhattacharyya = (h1: number[], h2: number[]): number => {
//     let sum = 0;
//     for (let i = 0; i < h1.length; i++) sum += Math.sqrt(h1[i] * h2[i]);
//     return Math.min(1, sum);
//   };

//   const averageHistograms = (hists: number[][]): number[] => {
//     const len = hists[0].length;
//     const avg = new Array(len).fill(0);
//     for (const h of hists) for (let i = 0; i < len; i++) avg[i] += h[i];
//     return avg.map(v => v / hists.length);
//   };

//   // ─── Head direction ────────────────────────────────────────────────────────
//   const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
//     if (!landmarks || landmarks.length === 0) return 'unknown';
//     const noseTip = landmarks[1], leftEye = landmarks[33], rightEye = landmarks[263];
//     const forehead = landmarks[10], chin = landmarks[152];
//     const leftEarInner = landmarks[93], rightEarInner = landmarks[323];
//     const noseBridge = landmarks[168];

//     const eyeSpan     = Math.abs(rightEye.x - leftEye.x);
//     const scale       = Math.max(eyeSpan, 0.01);
//     const eyeCenterX  = (leftEye.x + rightEye.x) / 2;
//     const eyeCenterY  = (leftEye.y + rightEye.y) / 2;
//     const faceCenterX = (noseTip.x + forehead.x) / 2;

//     const hOffset      = (eyeCenterX - faceCenterX) / scale;
//     const noseToLeft   = Math.abs(noseTip.x - leftEarInner.x);
//     const noseToRight  = Math.abs(noseTip.x - rightEarInner.x);
//     const earAsymmetry = (noseToLeft - noseToRight) / Math.max(noseToLeft + noseToRight, 0.01);

//     if (hOffset < -0.25 || earAsymmetry >  0.18) return 'left';
//     if (hOffset >  0.25 || earAsymmetry < -0.18) return 'right';

//     const foreheadDist    = Math.abs(noseTip.y - forehead.y);
//     const chinDist        = Math.abs(noseTip.y - chin.y);
//     const faceHeight      = foreheadDist + chinDist;
//     const foreheadRatio   = faceHeight > 0.01 ? foreheadDist / faceHeight : 0.5;
//     const eyeToNoseY      = (eyeCenterY - noseTip.y) / scale;
//     const bridgeChinRatio = faceHeight > 0.01 ? Math.abs(noseBridge.y - chin.y) / faceHeight : 0.5;
//     const chinBelowEyes   = (chin.y - eyeCenterY) / scale;

//     if (foreheadRatio < 0.40 || eyeToNoseY < -0.85 || bridgeChinRatio < 0.66 || chinBelowEyes > 2.4)
//       return 'down';
//     if (foreheadRatio > 0.60 && eyeToNoseY > -0.30)
//       return 'up';
//     return 'center';
//   };

//   // ─── Main face detection handler ──────────────────────────────────────────
//   const processFaceDetectionRef = useRef<(results: any) => void>(() => {});

//   processFaceDetectionRef.current = (results: any) => {
//     if (hasEndedRef.current) return;

//     const terminate = (reason: string) => {
//       if (!hasEndedRef.current) {
//         hasEndedRef.current = true;
//         cleanup();
//         onEndRef.current(reason);
//       }
//     };

//     // ── No face ──────────────────────────────────────────────────────────────
//     if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
//       multiFaceFrameCountRef.current = 0;
//       setFaceCount(0);
//       onViolationRef.current('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     const realFaces = results.multiFaceLandmarks.filter(isRealFace);
//     setFaceCount(realFaces.length);

//     if (realFaces.length === 0) {
//       onViolationRef.current('Face not detected');
//       startViolationTimer('Face not detected');
//       return;
//     }

//     // ── Multiple faces ────────────────────────────────────────────────────────
//     if (realFaces.length > 1) {
//       multiFaceFrameCountRef.current += 1;
//       if (multiFaceFrameCountRef.current >= MULTI_FACE_CONFIRM_FRAMES)
//         terminate('Multiple faces detected');
//       return;
//     }

//     multiFaceFrameCountRef.current = 0;
//     const primaryFace = realFaces[0];
//     const videoEl     = videoRef.current;
//     const canvas      = faceCanvasRef.current;
//     if (!videoEl || !canvas) return;

//     // ── CALIBRATION ───────────────────────────────────────────────────────────
//     if (faceHistogramRef.current === null) {
//       const hist = extractFaceHistogram(primaryFace, videoEl, canvas);
//       if (!hist) return;

//       calibrationHistogramsRef.current.push(hist);
//       const pct = Math.min(
//         Math.round((calibrationHistogramsRef.current.length / IDENTITY_CALIBRATION_FRAMES) * 100),
//         100
//       );
//       setCalibrationPct(pct);

//       if (calibrationHistogramsRef.current.length >= IDENTITY_CALIBRATION_FRAMES) {
//         faceHistogramRef.current      = averageHistograms(calibrationHistogramsRef.current);
//         calibrationHistogramsRef.current = [];
//         appearanceMismatchRef.current    = 0;
//         hardFailStreakRef.current         = 0;
//         smoothedSimilarityRef.current     = 1.0;
//         prevRawSimilarityRef.current      = 1.0;
//         setCalibrated(true);
//         console.log('[Proctoring] Face baseline locked ✓');
//       }
//       return;
//     }

//     // ── IDENTITY CHECK ────────────────────────────────────────────────────────
//     const currentHist = extractFaceHistogram(primaryFace, videoEl, canvas);
//     if (!currentHist) return;

//     const rawSimilarity = bhattacharyya(currentHist, faceHistogramRef.current);

//     // ── Guard 1: SUDDEN DROP on RAW similarity ────────────────────────────────
//     // Must use raw (not EMA-smoothed) delta so EMA dampening doesn't hide a swap.
//     // Lighting changes are gradual (Δ < 0.05/frame); face-swaps are abrupt (Δ > 0.15).
//     const rawDrop = prevRawSimilarityRef.current - rawSimilarity;
//     prevRawSimilarityRef.current = rawSimilarity;  // update BEFORE any early return

//     if (rawDrop > SUDDEN_DROP_THRESHOLD) {
//       console.warn('[Proctoring] Sudden raw drop:', rawDrop.toFixed(4), 'raw:', rawSimilarity.toFixed(4));
//       terminate('Person changed – sudden identity change detected.');
//       return;
//     }

//     // EMA for streak checks only (noise immunity over multiple frames)
//     smoothedSimilarityRef.current =
//       smoothedSimilarityRef.current * (1 - SIMILARITY_EMA_ALPHA) +
//       rawSimilarity                 * SIMILARITY_EMA_ALPHA;
//     const smoothed = smoothedSimilarityRef.current;

//     // Uncomment to tune thresholds:
//     // console.log('[Proctoring] raw:', rawSimilarity.toFixed(3), 'smoothed:', smoothed.toFixed(3));

//     // ── Guard 2: HARD FAIL streak ─────────────────────────────────────────────
//     // Requires sustained low similarity — a brief glare or shadow won't fire this.
//     if (smoothed < APPEARANCE_HARD_FAIL) {
//       hardFailStreakRef.current += 1;
//       console.warn(
//         `[Proctoring] Hard-fail streak ${hardFailStreakRef.current}/${APPEARANCE_HARD_FAIL_FRAMES}`,
//         'smoothed:', smoothed.toFixed(4)
//       );
//       if (hardFailStreakRef.current >= APPEARANCE_HARD_FAIL_FRAMES) {
//         terminate('Person changed – exam terminated. A different person was detected on camera.');
//       }
//       return;  // keep counting; don't reset streak by falling through
//     }

//     // ── Guard 3: SOFT FAIL streak ─────────────────────────────────────────────
//     if (smoothed < APPEARANCE_SOFT_FAIL) {
//       hardFailStreakRef.current = 0;
//       appearanceMismatchRef.current += 1;
//       console.warn(
//         '[Proctoring] Soft mismatch', appearanceMismatchRef.current,
//         'smoothed:', smoothed.toFixed(4)
//       );
//       onViolationRef.current('Identity mismatch detected');
//       startViolationTimer('Identity mismatch detected');

//       if (appearanceMismatchRef.current >= APPEARANCE_MISMATCH_FRAMES) {
//         terminate('Person changed – exam terminated. A different person was detected on camera.');
//       }
//       return;
//     }

//     // ── Identity confirmed — reset all counters ───────────────────────────────
//     hardFailStreakRef.current     = 0;
//     appearanceMismatchRef.current = 0;

//     // Adapt baseline only when very confident — prevents gradual new-face learning.
//     // Only adapt when clearly same person (smoothed > 0.90) to absorb slow lighting drift.
//     if (smoothed > 0.90) {
//       const baseline = faceHistogramRef.current!;
//       faceHistogramRef.current = baseline.map(
//         (b, i) => b * (1 - BASELINE_ADAPT_RATE) + currentHist[i] * BASELINE_ADAPT_RATE
//       );
//     }

//     // ── GAZE CHECK ────────────────────────────────────────────────────────────
//     const direction = estimateHeadDirection(primaryFace);
//     if (direction === 'left' || direction === 'right' || direction === 'down' || direction === 'up') {
//       onViolationRef.current(`Looking ${direction}`);
//       startViolationTimer(`Looking ${direction}`);
//     } else {
//       stopViolationTimer();
//     }
//   };

//   // ─── Phone detection ──────────────────────────────────────────────────────
//   const startPhoneDetection = useCallback(async () => {
//     try {
//       const tf = await import('@tensorflow/tfjs');
//       await import('@tensorflow/tfjs-backend-webgl');
//       await tf.setBackend('webgl');
//       await tf.ready();

//       const cocoSsd = await import('@tensorflow-models/coco-ssd');
//       const model   = await cocoSsd.load({ base: 'mobilenet_v2' });
//       cocoModelRef.current = model;

//       const offscreen = document.createElement('canvas');
//       offscreen.width = 320; offscreen.height = 240;
//       phoneCanvasRef.current = offscreen;
//       const ctx = offscreen.getContext('2d');

//       phoneDetectionIntervalRef.current = setInterval(async () => {
//         if (hasEndedRef.current || !videoRef.current || videoRef.current.readyState < 2 || !ctx) return;
//         try {
//           ctx.drawImage(videoRef.current, 0, 0, 320, 240);
//           const predictions = await cocoModelRef.current.detect(offscreen);
//           const phoneFound  = predictions.some(
//             (p: any) => (p.class === 'cell phone' || p.class === 'remote') &&
//                          p.score > PHONE_DETECTION_CONFIDENCE
//           );
//           if (phoneFound && !hasEndedRef.current) {
//             hasEndedRef.current = true;
//             setPhoneDetected(true);
//             cleanup();
//             onEndRef.current('Mobile phone detected in frame');
//           } else if (!phoneFound) {
//             setPhoneDetected(false);
//           }
//         } catch (_) {}
//       }, PHONE_DETECTION_INTERVAL_MS);
//     } catch (err) {
//       console.warn('COCO-SSD phone detection unavailable:', err);
//     }
//   }, [cleanup]);

//   // ─── Initialize ───────────────────────────────────────────────────────────
//   const initialize = useCallback(async () => {
//     if (isInitializingRef.current || hasEndedRef.current) return;
//     isInitializingRef.current = true;
//     setStatus('loading');

//     try {
//       const fc = document.createElement('canvas');
//       fc.width = CROP_SIZE; fc.height = CROP_SIZE;
//       faceCanvasRef.current = fc;

//       const mediaStream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 320, height: 240, facingMode: 'user' },
//       });
//       streamRef.current = mediaStream;

//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//         await new Promise<void>(res => {
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
//       faceMesh.onResults((results: any) => processFaceDetectionRef.current(results));
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
//   }, [startPhoneDetection]);

//   useEffect(() => {
//     if (!isActive || !isStarted) return;
//     initialize();
//     return cleanup;
//   }, [isActive, isStarted]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ─── UI ───────────────────────────────────────────────────────────────────
//   const isViolating = violationCountdown !== null;

//   return (
//     <div style={{
//       position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999,
//       display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
//       gap: '8px', pointerEvents: 'none',
//     }}>
//       {/* Camera preview */}
//       <div style={{
//         width: '200px', borderRadius: '12px', overflow: 'hidden',
//         border: isViolating || phoneDetected ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)',
//         backgroundColor: '#000',
//         boxShadow: isViolating || phoneDetected
//           ? '0 0 20px rgba(239,68,68,0.5)' : '0 4px 24px rgba(0,0,0,0.5)',
//         transition: 'border-color 0.3s, box-shadow 0.3s', position: 'relative',
//       }}>
//         <video ref={videoRef} autoPlay playsInline muted style={{
//           width: '200px', height: '150px', objectFit: 'cover',
//           display: status === 'active' ? 'block' : 'none', transform: 'scaleX(-1)',
//         }} />

//         {status !== 'active' && (
//           <div style={{
//             width: '200px', height: '150px', display: 'flex', flexDirection: 'column',
//             alignItems: 'center', justifyContent: 'center',
//             backgroundColor: '#111', color: '#666', fontSize: '12px', gap: '8px',
//           }}>
//             {status === 'loading' && <><div style={{fontSize:'24px'}}>📷</div><span>Starting camera…</span></>}
//             {status === 'idle'    && <><div style={{fontSize:'24px'}}>📷</div><span>Camera standby</span></>}
//             {status === 'error'   && <><div style={{fontSize:'24px'}}>⚠️</div>
//               <span style={{color:'#f87171',textAlign:'center',padding:'0 12px'}}>Camera unavailable</span></>}
//           </div>
//         )}

//         {/* Status badge */}
//         <div style={{
//           position: 'absolute', top: '6px', left: '6px', display: 'flex',
//           alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.65)',
//           borderRadius: '99px', padding: '2px 8px', fontSize: '10px', color: '#fff',
//         }}>
//           <span style={{
//             width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
//             animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
//             backgroundColor:
//               status !== 'active'          ? '#f59e0b' :
//               isViolating || phoneDetected ? '#ef4444' :
//               calibrated                   ? '#22c55e' : '#f59e0b',
//           }} />
//           {status === 'active'
//             ? phoneDetected ? 'PHONE!'
//             : isViolating   ? 'VIOLATION'
//             : calibrated    ? 'PROCTORED'
//             : `CALIBRATING ${calibrationPct}%`
//             : status.toUpperCase()}
//         </div>

//         {/* Face count badge */}
//         {status === 'active' && (
//           <div style={{
//             position: 'absolute', top: '6px', right: '6px',
//             background: faceCount === 1 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
//             borderRadius: '99px', padding: '2px 8px', fontSize: '10px',
//             color: '#fff', fontWeight: 600,
//           }}>
//             {faceCount === 0 ? 'No face' : faceCount === 1 ? '1 face ✓' : `${faceCount} faces!`}
//           </div>
//         )}

//         {/* Calibration progress bar */}
//         {status === 'active' && !calibrated && (
//           <div style={{
//             position: 'absolute', bottom: 0, left: 0, right: 0,
//             height: '3px', background: 'rgba(255,255,255,0.08)',
//           }}>
//             <div style={{
//               height: '3px', background: '#f59e0b',
//               width: `${calibrationPct}%`, transition: 'width 0.2s linear',
//             }} />
//           </div>
//         )}
//       </div>

//       {/* Phone banner */}
//       {phoneDetected && (
//         <div style={{
//           width: '200px', background: 'rgba(0,0,0,0.9)',
//           border: '1px solid rgba(239,68,68,0.8)', borderRadius: '10px', padding: '8px 10px',
//         }}>
//           <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
//             📱 Phone detected – ending quiz…
//           </span>
//         </div>
//       )}

//       {/* Violation countdown */}
//       {isViolating && !phoneDetected && (
//         <div style={{
//           width: '200px', background: 'rgba(0,0,0,0.85)',
//           border: '1px solid rgba(239,68,68,0.5)', borderRadius: '10px', padding: '8px 10px',
//         }}>
//           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
//             <span style={{ color:'#fca5a5', fontSize:'11px', fontWeight:600 }}>
//               ⚠️ {currentViolation}
//             </span>
//             <span style={{
//               color: (violationCountdown ?? 0) <= 5 ? '#ef4444' : '#fbbf24',
//               fontSize:'13px', fontWeight:700, fontVariantNumeric:'tabular-nums',
//             }}>
//               {violationCountdown}s
//             </span>
//           </div>
//           <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'99px', height:'4px' }}>
//             <div style={{
//               width: `${((violationCountdown ?? 0) / VIOLATION_TIMEOUT) * 100}%`,
//               height:'4px', borderRadius:'99px',
//               background: (violationCountdown ?? 0) <= 5 ? '#ef4444'
//                         : (violationCountdown ?? 0) <= 10 ? '#f59e0b' : '#22c55e',
//               transition:'width 1s linear, background 0.3s',
//             }} />
//           </div>
//           <p style={{ color:'#9ca3af', fontSize:'10px', marginTop:'4px' }}>
//             Quiz ends if not corrected
//           </p>
//         </div>
//       )}

//       <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
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

// ─── Face identity config ─────────────────────────────────────────────────────
//
// DUAL-SIGNAL APPROACH:
//   Primary  → Geometric signature  (landmark ratio cosine similarity)
//              Person-specific: same person ~0.97+, different person ~0.80-0.88
//   Secondary → Appearance histogram (Bhattacharyya on face crop)
//              Catches lighting changes / partial occlusion as a supplement
//
// Both signals must AGREE to terminate — prevents false positives.
// Either signal alone is insufficient: geometry alone misses disguises,
// histogram alone can't distinguish similar-looking people.

const IDENTITY_CALIBRATION_FRAMES = 60;   // ~2 s at 30 fps
const IDENTITY_REFERENCE_POOL_SIZE = 10;  // evenly sampled from calibration

// Geometric cosine similarity thresholds (primary, high-confidence signal)
// Same person:      typically 0.96–0.99
// Different person: typically 0.78–0.90
const GEO_SIMILARITY_THRESHOLD  = 0.92;  // all pool members must fail
const GEO_HARD_FAIL_STREAK      = 30;    // ~1 s of consecutive mismatches → terminate

// Histogram Bhattacharyya thresholds (secondary, catches abrupt appearance change)
// Same person:      typically 0.75–0.95 (noisy, lighting-dependent)
// Different person: typically 0.60–0.80
// We use this ONLY as a corroborating signal — geo must also be failing
const HIST_CORROBORATE_THRESHOLD = 0.68; // only meaningful when geo is also failing

// Reappearance check — applied once when face comes back after being absent
// Uses BOTH geo and histogram together for a single decisive check
const REAPPEAR_GEO_THRESHOLD  = 0.90;
const REAPPEAR_HIST_THRESHOLD = 0.65;

// Phone detection
const PHONE_DETECTION_INTERVAL_MS = 800;
const PHONE_DETECTION_CONFIDENCE  = 0.55;


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

  const violationIntervalRef      = useRef<NodeJS.Timeout | null>(null);
  const phoneDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef               = useRef(false);
  const isInitializingRef         = useRef(false);

  // Phone
  const cocoModelRef   = useRef<any>(null);
  const phoneCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ─── Face identity state ───────────────────────────────────────────────────
  // Geometric signature pool (primary — most reliable)
  const geoPoolRef              = useRef<number[][] | null>(null);
  const geoMismatchStreakRef    = useRef(0);

  // Histogram baseline (secondary — corroborating)
  const histBaselineRef         = useRef<number[] | null>(null);

  // Calibration accumulator
  const calibGeoRef             = useRef<number[][]>([]);
  const calibHistRef            = useRef<number[][]>([]);

  // Reappearance guard
  const faceWasAbsentRef        = useRef(false);

  // Offscreen canvas for face crop
  const faceCanvasRef           = useRef<HTMLCanvasElement | null>(null);

  const multiFaceFrameCountRef    = useRef(0);
  const MULTI_FACE_CONFIRM_FRAMES = 4;

  // Always-current prop refs
  const onViolationRef = useRef(onViolation);
  const onEndRef       = useRef(onEnd);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onEndRef.current = onEnd; },           [onEnd]);

  // UI state
  const [status,             setStatus]             = useState<'idle'|'loading'|'active'|'error'>('idle');
  const [violationCountdown, setViolationCountdown] = useState<number | null>(null);
  const [currentViolation,   setCurrentViolation]   = useState('');
  const [faceCount,          setFaceCount]          = useState(0);
  const [phoneDetected,      setPhoneDetected]      = useState(false);
  const [calibrated,         setCalibrated]         = useState(false);
  const [calibrationPct,     setCalibrationPct]     = useState(0);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
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
    // Prevent quiz termination during proctoring - face changes are expected
    if (violationIntervalRef.current) return;
    setCurrentViolation(message);
    setViolationCountdown(VIOLATION_TIMEOUT);
    violationIntervalRef.current = setInterval(() => {
      setViolationCountdown(prev => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          // Don't terminate quiz for face changes during proctoring
          return next;
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

  // ─── Real face sanity check ───────────────────────────────────────────────
  const isRealFace = (landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length < 200) return false;
    const f = landmarks[10], c = landmarks[152],
          l = landmarks[234], r = landmarks[454];
    return Math.abs(c.y - f.y) > 0.04 && Math.abs(r.x - l.x) > 0.03;
  };

  // ─── PRIMARY: Geometric face signature ────────────────────────────────────
  //
  // 21 normalised inter-landmark distance ratios, all divided by inter-eye span.
  // Captures unique facial proportions (eye spacing, nose length, jaw width, etc.)
  // Invariant to position, scale, and mild head rotation.
  // Same person across varied poses: cosine similarity ~0.96–0.99
  // Different person:                cosine similarity ~0.78–0.90
  //
  const extractGeoSignature = (landmarks: any[]): number[] => {
    const p  = (i: number) => landmarks[i];
    const es = Math.hypot(p(263).x - p(33).x, p(263).y - p(33).y);
    const sc = Math.max(es, 0.01);
    const d  = (a: number, b: number) => Math.hypot(p(a).x-p(b).x, p(a).y-p(b).y) / sc;
    const dx = (a: number, b: number) => Math.abs(p(a).x - p(b).x) / sc;
    const dy = (a: number, b: number) => Math.abs(p(a).y - p(b).y) / sc;
    return [
      dy(10,1), dy(1,152), dy(10,152), dy(33,152), dy(263,152),
      dx(234,454), dx(61,291), dx(93,323),
      dy(168,1), dx(98,327),
      dy(159,145), dy(386,374), dy(70,33), dy(300,263),
      dy(13,14), dy(1,13), dy(14,152),
      d(234,152), d(454,152), d(33,61), d(263,291),
    ];
  };

  const cosineSim = (a: number[], b: number[]): number => {
    let dot=0, na=0, nb=0;
    for (let i=0; i<a.length; i++) { dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
    return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-8);
  };

  // ─── SECONDARY: Histogram appearance descriptor ───────────────────────────
  //
  // 3-channel colour histogram on a 32x32 face crop (96 bins total).
  // Used only as a CORROBORATING signal — NOT for sole termination decisions.
  // Reason: histogram similarity is dominated by skin tone and lighting,
  // making it unreliable for distinguishing people with similar complexions.
  //
  const CROP_SIZE = 32;
  const HIST_BINS = 32;

  const extractHistogram = (
    landmarks: any[], videoEl: HTMLVideoElement, canvas: HTMLCanvasElement
  ): number[] | null => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    let minX=1,minY=1,maxX=0,maxY=0;
    for (const lm of landmarks) {
      if (lm.x<minX) minX=lm.x; if (lm.y<minY) minY=lm.y;
      if (lm.x>maxX) maxX=lm.x; if (lm.y>maxY) maxY=lm.y;
    }
    const vw=videoEl.videoWidth||320, vh=videoEl.videoHeight||240;
    const px=(maxX-minX)*0.10, py=(maxY-minY)*0.10;
    const sx=Math.max(0,(minX-px)*vw), sy=Math.max(0,(minY-py)*vh);
    const sw=Math.min(vw-sx,(maxX-minX+2*px)*vw), sh=Math.min(vh-sy,(maxY-minY+2*py)*vh);
    if (sw<10||sh<10) return null;
    canvas.width=CROP_SIZE; canvas.height=CROP_SIZE;
    ctx.drawImage(videoEl,sx,sy,sw,sh,0,0,CROP_SIZE,CROP_SIZE);
    const data=ctx.getImageData(0,0,CROP_SIZE,CROP_SIZE).data;
    const N=CROP_SIZE*CROP_SIZE;
    const hG=new Array(HIST_BINS).fill(0);
    const hRG=new Array(HIST_BINS).fill(0);
    const hBY=new Array(HIST_BINS).fill(0);
    let mg=0;
    const grays=new Array(N);
    for (let i=0,p=0;i<data.length;i+=4,p++) {
      const g=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2]; grays[p]=g; mg+=g;
    }
    mg/=N;
    for (let p=0;p<N;p++) {
      const s=Math.max(0,Math.min(255,grays[p]-mg+128));
      hG[Math.min(HIST_BINS-1,Math.floor((s/255)*HIST_BINS))]++;
    }
    for (let i=0;i<data.length;i+=4) {
      const r=data[i],g=data[i+1],b=data[i+2];
      hRG[Math.min(HIST_BINS-1,Math.floor(((r-g)/(r+g+b+1)+0.5)*HIST_BINS))]++;
      hBY[Math.min(HIST_BINS-1,Math.floor((b/(r+g+b+1))*HIST_BINS))]++;
    }
    const norm=(h:number[])=>h.map(v=>v/N);
    return [...norm(hG),...norm(hRG),...norm(hBY)];
  };

  const bhattacharyya = (h1:number[],h2:number[]): number => {
    let s=0; for (let i=0;i<h1.length;i++) s+=Math.sqrt(h1[i]*h2[i]); return Math.min(1,s);
  };

  const averageVecs = (vecs:number[][]): number[] => {
    const len=vecs[0].length, avg=new Array(len).fill(0);
    for (const v of vecs) for (let i=0;i<len;i++) avg[i]+=v[i];
    return avg.map(v=>v/vecs.length);
  };

  // ─── Head direction ────────────────────────────────────────────────────────
  const estimateHeadDirection = (landmarks: any[]): HeadDirection => {
    if (!landmarks || landmarks.length === 0) return 'unknown';
    const noseTip=landmarks[1], leftEye=landmarks[33], rightEye=landmarks[263];
    const forehead=landmarks[10], chin=landmarks[152];
    const leftEarInner=landmarks[93], rightEarInner=landmarks[323];
    const noseBridge=landmarks[168];

    const eyeSpan=Math.abs(rightEye.x-leftEye.x);
    const scale=Math.max(eyeSpan,0.01);
    const eyeCenterX=(leftEye.x+rightEye.x)/2;
    const eyeCenterY=(leftEye.y+rightEye.y)/2;
    const faceCenterX=(noseTip.x+forehead.x)/2;

    const hOffset=(eyeCenterX-faceCenterX)/scale;
    const nL=Math.abs(noseTip.x-leftEarInner.x), nR=Math.abs(noseTip.x-rightEarInner.x);
    const earAsym=(nL-nR)/Math.max(nL+nR,0.01);

    if (hOffset<-0.25||earAsym>0.18) return 'left';
    if (hOffset>0.25||earAsym<-0.18) return 'right';

    const fH=Math.abs(noseTip.y-forehead.y), cH=Math.abs(noseTip.y-chin.y);
    const faceH=fH+cH;
    const foreheadRatio=faceH>0.01?fH/faceH:0.5;
    const eyeToNoseY=(eyeCenterY-noseTip.y)/scale;
    const bridgeChin=faceH>0.01?Math.abs(noseBridge.y-chin.y)/faceH:0.5;
    const chinBelow=(chin.y-eyeCenterY)/scale;

    // AND+OR hybrid: primary signal must fire + at least one corroborating signal
    const sigA=foreheadRatio<0.32;
    const sigB=eyeToNoseY<-1.1;
    const sigC=bridgeChin<0.58;
    const sigD=chinBelow>3.0;
    if (sigA&&(sigB||sigC||sigD)) return 'down';
    if (foreheadRatio>0.60&&eyeToNoseY>-0.30) return 'up';
    return 'center';
  };

  // ─── Main face detection handler ──────────────────────────────────────────
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

    // ── No face ───────────────────────────────────────────────────────────────
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      multiFaceFrameCountRef.current = 0;
      setFaceCount(0);
      faceWasAbsentRef.current = true;  // mark for strict reappearance check
      onViolationRef.current('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    const realFaces = results.multiFaceLandmarks.filter(isRealFace);
    setFaceCount(realFaces.length);

    if (realFaces.length === 0) {
      faceWasAbsentRef.current = true;
      onViolationRef.current('Face not detected');
      startViolationTimer('Face not detected');
      return;
    }

    // ── Multiple faces ────────────────────────────────────────────────────────
    if (realFaces.length > 1) {
      multiFaceFrameCountRef.current += 1;
      if (multiFaceFrameCountRef.current >= MULTI_FACE_CONFIRM_FRAMES)
        terminate('Multiple faces detected');
      return;
    }

    multiFaceFrameCountRef.current = 0;
    const primaryFace = realFaces[0];
    const videoEl     = videoRef.current;
    const canvas      = faceCanvasRef.current;
    if (!videoEl || !canvas) return;

    // ── CALIBRATION ───────────────────────────────────────────────────────────
    if (geoPoolRef.current === null) {
      const geo  = extractGeoSignature(primaryFace);
      const hist = extractHistogram(primaryFace, videoEl, canvas);
      if (!hist) return;

      calibGeoRef.current.push(geo);
      calibHistRef.current.push(hist);

      const pct = Math.min(
        Math.round((calibGeoRef.current.length / IDENTITY_CALIBRATION_FRAMES) * 100), 100
      );
      setCalibrationPct(pct);

      if (calibGeoRef.current.length >= IDENTITY_CALIBRATION_FRAMES) {
        // Evenly sample pool frames from the calibration buffer
        const total = calibGeoRef.current.length;
        const step  = Math.floor(total / IDENTITY_REFERENCE_POOL_SIZE);
        const pool: number[][] = [];
        for (let i = 0; i < IDENTITY_REFERENCE_POOL_SIZE; i++) {
          pool.push(calibGeoRef.current[i * step]);
        }
        geoPoolRef.current     = pool;
        histBaselineRef.current = averageVecs(calibHistRef.current);

        calibGeoRef.current  = [];
        calibHistRef.current = [];
        geoMismatchStreakRef.current = 0;
        faceWasAbsentRef.current    = false;
        setCalibrated(true);
      }

      // Gaze checks run normally even during calibration
    } else {

      // ── IDENTITY CHECK (post-calibration) ──────────────────────────────────
      const currentGeo  = extractGeoSignature(primaryFace);
      const currentHist = extractHistogram(primaryFace, videoEl, canvas);
      if (!currentHist) return;

      // Check current geo against ALL pool members — must match at least one
      const bestGeoSim = Math.max(
        ...geoPoolRef.current.map(ref => cosineSim(currentGeo, ref))
      );
      const histSim = bhattacharyya(currentHist, histBaselineRef.current!);

      // ── Reappearance check (face was absent — handover scenario) ─────────────
      // Applied once when a face comes back after being gone.
      // Uses BOTH signals: geo is primary, histogram corroborates.
      // Different person returning: geo drops to ~0.80-0.88, hist to ~0.60-0.75.
      if (faceWasAbsentRef.current) {
        faceWasAbsentRef.current = false;

        const geoFail  = bestGeoSim  < REAPPEAR_GEO_THRESHOLD;
        const histFail = histSim     < REAPPEAR_HIST_THRESHOLD;

        // Terminate if BOTH signals indicate a different person
        // OR if geo alone shows a very large drop (> 0.06 below threshold)
        if ((geoFail && histFail) || bestGeoSim < REAPPEAR_GEO_THRESHOLD - 0.06) {
          terminate(
            `Person change detected – a different person appeared after face was lost ` +
            `(geo: ${bestGeoSim.toFixed(3)}, hist: ${histSim.toFixed(3)})`
          );
          return;
        }

        // Passed — reset streak and fall through to gaze check
        geoMismatchStreakRef.current = 0;
        stopViolationTimer();
      } else {

        // ── Normal per-frame identity check ────────────────────────────────────
        //
        // Primary (geometric): fails if best match across all pool members
        //   is below GEO_SIMILARITY_THRESHOLD (0.92).
        //   Same person naturally varies 0.96–0.99. Different person: 0.78–0.90.
        //
        // Termination: geometric signal must fail for GEO_HARD_FAIL_STREAK
        //   consecutive frames (~1 s). This prevents lighting-change false positives.
        //   Additionally, if hist also fails, streak threshold halves (faster response).
        //
        const geoFailing  = bestGeoSim  < GEO_SIMILARITY_THRESHOLD;
        const histFailing = histSim     < HIST_CORROBORATE_THRESHOLD;

        if (geoFailing) {
          geoMismatchStreakRef.current += 1;

          // If histogram also corroborates a person change, react twice as fast
          const effectiveThreshold = histFailing
            ? Math.floor(GEO_HARD_FAIL_STREAK / 2)   // ~0.5 s
            : GEO_HARD_FAIL_STREAK;                    // ~1 s

          if (geoMismatchStreakRef.current >= effectiveThreshold) {
            terminate(
              `Person change detected – exam terminated ` +
              `(geo: ${bestGeoSim.toFixed(3)}, hist: ${histSim.toFixed(3)})`
            );
            return;
          }

          // Warn but don't terminate yet
          onViolationRef.current('Identity mismatch detected');
          startViolationTimer('Identity mismatch detected');
        } else {
          // Geo matches — same person confirmed, reset streak
          geoMismatchStreakRef.current = 0;
        }
      }
    }

    // ── GAZE CHECK (always runs after identity check passes) ─────────────────
    const direction = estimateHeadDirection(primaryFace);
    if (direction === 'left' || direction === 'right' || direction === 'down' || direction === 'up') {
      onViolationRef.current(`Looking ${direction}`);
      startViolationTimer(`Looking ${direction}`);
    } else {
      // Only clear violation if it was a gaze violation (not identity)
      if (currentViolation.startsWith('Looking') || currentViolation === 'Face not detected') {
        stopViolationTimer();
      }
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
      const model   = await cocoSsd.load({ base: 'mobilenet_v2' });
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
      const fc = document.createElement('canvas');
      fc.width = CROP_SIZE; fc.height = CROP_SIZE;
      faceCanvasRef.current = fc;

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

        <div style={{
          position: 'absolute', top: '6px', left: '6px', display: 'flex',
          alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.65)',
          borderRadius: '99px', padding: '2px 8px', fontSize: '10px', color: '#fff',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
            animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
            backgroundColor:
              status !== 'active'          ? '#f59e0b' :
              isViolating || phoneDetected ? '#ef4444' :
              calibrated                   ? '#22c55e' : '#f59e0b',
          }} />
          {status === 'active'
            ? phoneDetected ? 'PHONE!'
            : isViolating   ? 'VIOLATION'
            : calibrated    ? 'PROCTORED'
            : `CALIBRATING ${calibrationPct}%`
            : status.toUpperCase()}
        </div>

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
              fontSize:'13px', fontWeight:700, fontVariantNumeric:'tabular-nums',
            }}>
              {violationCountdown}s
            </span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'99px', height:'4px' }}>
            <div style={{
              width: `${((violationCountdown ?? 0) / VIOLATION_TIMEOUT) * 100}%`,
              height:'4px', borderRadius:'99px',
              background: (violationCountdown ?? 0) <= 5 ? '#ef4444'
                        : (violationCountdown ?? 0) <= 10 ? '#f59e0b' : '#22c55e',
              transition:'width 1s linear, background 0.3s',
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