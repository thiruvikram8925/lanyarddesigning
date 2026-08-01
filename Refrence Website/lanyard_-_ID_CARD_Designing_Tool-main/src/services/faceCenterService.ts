import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export interface FaceCenterResult {
  detected: boolean;
  centerX: number; // 0-1 normalized
  centerY: number; // 0-1 normalized
  faceWidth: number; // 0-1 normalized
  faceHeight: number; // 0-1 normalized
}

class FaceCenterService {
  private detector: FaceDetector | null = null;
  private isInitializing = false;
  private cache: Map<string, FaceCenterResult> = new Map();
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.detector) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.isInitializing = true;
    this.initializationPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        this.detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
        });
      } catch (error) {
        console.error("Failed to initialize MediaPipe FaceDetector:", error);
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initializationPromise;
  }

  async detectFaceCenter(imageUrl: string): Promise<FaceCenterResult> {
    const defaultCenter: FaceCenterResult = {
      detected: false,
      centerX: 0.5,
      centerY: 0.5,
      faceWidth: 0,
      faceHeight: 0,
    };

    if (!imageUrl) return defaultCenter;

    // Check cache
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    // Initialize if needed
    if (!this.detector) {
      await this.initialize();
    }

    if (!this.detector) {
        // Failed to initialize
        return defaultCenter;
    }

    try {
      // Load image
      const img = await this.loadImage(imageUrl);
      
      const detections = this.detector.detect(img);

      if (detections.detections && detections.detections.length > 0) {
        // Get primary face
        const primaryFace = detections.detections[0];
        const bbox = primaryFace.boundingBox;

        if (bbox) {
          // Normalize coordinates to 0-1
          const centerX = (bbox.originX + bbox.width / 2) / img.width;
          const centerY = (bbox.originY + bbox.height / 2) / img.height;
          const faceWidth = bbox.width / img.width;
          const faceHeight = bbox.height / img.height;

          const result: FaceCenterResult = {
            detected: true,
            centerX,
            centerY,
            faceWidth,
            faceHeight,
          };
          this.cache.set(imageUrl, result);
          return result;
        }
      }
      
      // No face detected
      this.cache.set(imageUrl, defaultCenter);
      return defaultCenter;
    } catch (error) {
      console.error("Error during face detection:", error);
      return defaultCenter;
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (src.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image for face detection"));
      img.src = src;
    });
  }
}

export default new FaceCenterService();
