import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandData } from '../types';

declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onUpdate: (data: HandData) => void,
  enabled: boolean = false
) => {
  const handsRef = useRef<any>(null);
  const requestRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to calculate distance between two landmarks
  const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow(p1.z - p2.z, 2)
    );
  };

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    // Sync canvas size with video if needed
    if (results.image.width && canvas.width !== results.image.width) {
       canvas.width = results.image.width;
       canvas.height = results.image.height;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let handData: HandData = {
      present: false,
      gesture: 'NONE',
      position: { x: 0, y: 0, z: 0 }
    };

    // Draw skeleton if hands found
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw connectors
      if (window.HAND_CONNECTIONS && window.drawConnectors) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
      }
      // Draw landmarks
      if (window.drawLandmarks) {
        window.drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 1
        });
      }

      // Analyze Gesture
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];

      // Calculate center of palm (approximate)
      const palmCenter = {
        x: (wrist.x + middleTip.x) / 2,
        y: (wrist.y + middleTip.y) / 2,
        z: (wrist.z + middleTip.z) / 2
      };

      // 1. Detect PINCH (Thumb to Index)
      const pinchDist = getDistance(thumbTip, indexTip);
      
      // 2. Detect FIST (Fingertips close to wrist)
      const fingersClosed = 
        getDistance(indexTip, wrist) < 0.3 && 
        getDistance(middleTip, wrist) < 0.3 &&
        getDistance(ringTip, wrist) < 0.3 &&
        getDistance(pinkyTip, wrist) < 0.3;

      let gesture: HandData['gesture'] = 'OPEN';
      
      if (pinchDist < 0.05) {
        gesture = 'PINCH';
      } else if (fingersClosed) {
        gesture = 'FIST';
      }

      // 3. Position (normalize -1 to 1 based on screen center)
      // We amplify the movement (x3) to make it easier to reach edges
      const x = -(palmCenter.x - 0.5) * 3; 
      const y = -(palmCenter.y - 0.5) * 3;
      const z = palmCenter.z; 

      handData = {
        present: true,
        gesture,
        position: { x, y, z },
        landmarks
      };
    }
    
    ctx.restore();
    onUpdate(handData);
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    let stream: MediaStream | null = null;
    let isActive = true;

    const init = async () => {
      // Safety check: if effect has been cleaned up, stop.
      if (!isActive) return;

      // 1. Wait for scripts to load
      if (!window.Hands) {
         console.log("Waiting for MediaPipe Hands...");
         setTimeout(init, 200);
         return;
      }

      try {
        console.log("Initializing MediaPipe Hands...");
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        // 2. Setup Camera Manually
        // Video element must exist (started=true) for this to run
        if (videoRef.current) {
          console.log("Requesting Camera Access...");
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
          } catch (err) {
            throw new Error("Camera permission denied or not available.");
          }
          
          if (!isActive) {
             stream?.getTracks().forEach(t => t.stop());
             return;
          }

          videoRef.current.srcObject = stream;
          // Wait for video to load metadata
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          
          await videoRef.current.play();
          
          setIsReady(true);
          console.log("Camera started successfully");
          
          // 3. Start Frame Loop
          const loop = async () => {
            if (!isActive) return;
            
            if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
               // Only send if video has data
               try {
                 await handsRef.current.send({ image: videoRef.current });
               } catch (e) {
                 console.warn("Dropped frame", e);
               }
            }
            requestRef.current = requestAnimationFrame(loop);
          };
          loop();
        }
      } catch (e: any) {
        console.error("Initialization Error:", e);
        if (isActive) {
           setError(e.message || "Failed to initialize. Check console.");
        }
      }
    };

    init();

    return () => {
      isActive = false;
      cancelAnimationFrame(requestRef.current);
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [enabled, onResults]);

  return { isReady, error };
};