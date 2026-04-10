import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const CameraProctoring = ({ onViolation, onEnd, isActive = true }) => {
  const videoRef = useRef(null);
  const [isProctoring, setIsProctoring] = useState(false);
  const [violations, setViolations] = useState([]);
  const [status, setStatus] = useState('Initializing...');
  const [stream, setStream] = useState(null);
  const [detectionInterval, setDetectionInterval] = useState(null);
  const [violationTimer, setViolationTimer] = useState(0);
  const [violationInterval, setViolationInterval] = useState(null);
  const [faceMesh, setFaceMesh] = useState(null);
  const [camera, setCamera] = useState(null);

  // Initialize MediaPipe Face Mesh
  const initializeFaceMesh = useCallback(async () => {
    try {
      // Initialize Face Mesh with installed package
      const faceMeshInstance = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMeshInstance.setOptions({
        maxNumFaces: 5,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      setFaceMesh(faceMeshInstance);
      return true;
    } catch (error) {
      console.error('Failed to initialize Face Mesh:', error);
      return false;
    }
  }, []);

  // Start webcam access
  const startWebcam = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      return true;
    } catch (error) {
      console.error('Camera access denied:', error);
      onEnd("Camera access required");
      return false;
    }
  }, [onEnd]);

  // Estimate head direction based on face landmarks
  const estimateHeadDirection = useCallback((landmarks) => {
    if (!landmarks || landmarks.length === 0) return 'unknown';

    // Key facial points for head direction estimation
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[152];
    const forehead = landmarks[10];

    // Calculate eye center
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;

    // Calculate face center
    const faceCenterX = (noseTip.x + forehead.x) / 2;
    const faceCenterY = (noseTip.y + forehead.y) / 2;

    // Horizontal direction (left/right)
    const horizontalOffset = eyeCenterX - faceCenterX;
    const lookingLeft = horizontalOffset < -0.05;
    const lookingRight = horizontalOffset > 0.05;

    // Vertical direction (up/down)
    const verticalOffset = eyeCenterY - faceCenterY;
    const lookingDown = verticalOffset > 0.1;
    const lookingUp = verticalOffset < -0.1;

    if (lookingLeft) return 'left';
    if (lookingRight) return 'right';
    if (lookingDown) return 'down';
    if (lookingUp) return 'up';
    return 'center';
  }, []);

  // Process face detection results
  const processFaceDetection = useCallback((results) => {
    if (!results.multiFaceLandmarks) {
      handleNoFace();
      return;
    }

    const faces = results.multiFaceLandmarks;

    // Check for multiple faces
    if (faces.length > 1) {
      onEnd("Multiple faces detected");
      return;
    }

    // Single face detected
    if (faces.length === 1) {
      const headDirection = estimateHeadDirection(faces[0]);
      
      if (headDirection === 'left' || headDirection === 'right' || headDirection === 'down') {
        handleLookingAway();
      } else {
        resetViolationTimer();
      }
    }
  }, [estimateHeadDirection, onEnd]);

  // Handle no face detected
  const handleNoFace = useCallback(() => {
    onViolation("Face not detected");
    startViolationTimer();
  }, [onViolation]);

  // Handle looking away from screen
  const handleLookingAway = useCallback(() => {
    onViolation("Looking away");
    startViolationTimer();
  }, [onViolation]);

  // Start violation timer
  const startViolationTimer = useCallback(() => {
    if (!violationInterval) {
      const interval = setInterval(() => {
        setViolationTimer(prev => {
          const newTimer = prev + 1;
          if (newTimer >= 15) {
            onEnd("Cheating detected");
          }
          return newTimer;
        });
      }, 1000);
      setViolationInterval(interval);
    }
  }, [violationInterval, onEnd]);

  // Reset violation timer
  const resetViolationTimer = useCallback(() => {
    setViolationTimer(0);
    if (violationInterval) {
      clearInterval(violationInterval);
      setViolationInterval(null);
    }
  }, [violationInterval]);

  // Handle violation events
  const handleViolation = useCallback((message) => {
    console.log('Violation:', message);
    setViolations(prev => [...prev, { message, timestamp: new Date().toLocaleTimeString() }]);
    onViolation(message);
  }, [onViolation]);

  // Main detection loop
  const startDetection = useCallback(async () => {
    if (!faceMesh || !stream) return;

    // Setup camera with MediaPipe
    const cameraInstance = new Camera(videoRef.current, {
      onFrame: async () => {
        if (faceMesh && videoRef.current && videoRef.current.readyState === 4) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    // Set up face mesh callback
    faceMesh.onResults(processFaceDetection);

    // Start camera
    cameraInstance.start();

    setCamera(cameraInstance);

    // Also run detection every second as backup
    const interval = setInterval(async () => {
      if (faceMesh && videoRef.current && videoRef.current.readyState === 4) {
        await faceMesh.send({ image: videoRef.current });
      }
    }, 1000);
    
    setDetectionInterval(interval);
  }, [faceMesh, stream, processFaceDetection]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Stop MediaPipe camera
    if (camera) {
      camera.stop();
    }

    // Clear intervals
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }
    if (violationInterval) {
      clearInterval(violationInterval);
    }

    // Cleanup face mesh
    if (faceMesh) {
      faceMesh.close();
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream, camera, detectionInterval, violationInterval, faceMesh]);

  // Initialize and start proctoring
  useEffect(() => {
    if (!isActive) return;

    const initialize = async () => {
      try {
        setStatus('Initializing face detection...');
        
        // Initialize Face Mesh
        const faceMeshReady = await initializeFaceMesh();
        if (!faceMeshReady) {
          onEnd("Failed to initialize face detection");
          return;
        }

        setStatus('Accessing camera...');
        
        // Start webcam
        const webcamReady = await startWebcam();
        if (!webcamReady) {
          return;
        }

        // Wait a moment for video to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        setStatus('Starting detection...');
        
        // Start detection
        await startDetection();

        setIsProctoring(true);
        setStatus('Proctoring active');

      } catch (error) {
        console.error('Proctoring initialization error:', error);
        onEnd("Proctoring initialization failed");
      }
    };

    initialize();

    return cleanup;
  }, [isActive, initializeFaceMesh, startWebcam, startDetection, cleanup, onEnd]);

  // Manual stop function
  const stopProctoring = useCallback(() => {
    cleanup();
    setIsProctoring(false);
    setStatus('Manually stopped');
  }, [cleanup]);

  return (
    <div className="camera-proctoring">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '320px',
          height: '240px',
          border: '2px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#000',
          display: isProctoring ? 'block' : 'none'
        }}
      />
      
      {!isProctoring && (
        <div style={{
          width: '320px',
          height: '240px',
          border: '2px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          {status}
        </div>
      )}
      
      {violations.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Recent Violations:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {violations.slice(-3).map((violation, index) => (
              <li key={index}>
                {violation.timestamp}: {violation.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CameraProctoring;
