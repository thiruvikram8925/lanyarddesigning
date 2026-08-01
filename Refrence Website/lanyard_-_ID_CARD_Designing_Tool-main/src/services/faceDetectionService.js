import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.modelsLoaded = false;
    this.modelLoadingPromise = null;
    this.modelBaseUrl = '/models';
  }

  async loadModels() {
    if (this.modelsLoaded) {
      return;
    }

    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelLoadingPromise = this._loadModelsInternal();
    await this.modelLoadingPromise;
  }

  async _loadModelsInternal() {
    try {
      console.log('[FaceDetectionService] Loading face-api.js models...');
      
      await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelBaseUrl);
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelBaseUrl);
      
      this.modelsLoaded = true;
      console.log('[FaceDetectionService] SSD MobileNet + Landmark models loaded successfully');
    } catch (error) {
      console.error('[FaceDetectionService] Failed to load models:', error);
      this.modelLoadingPromise = null;
      throw new Error(`Failed to load face-api.js models: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async detectFace(imageElement) {
    try {
      await this.loadModels();

      console.log('[FaceDetectionService] Starting face detection on image:', imageElement.width, 'x', imageElement.height);

      let processedImage = imageElement;
      if (imageElement.width < 200 || imageElement.height < 200) {
        console.log('[FaceDetectionService] Image too small, resizing...');
        processedImage = this.resizeImage(imageElement, 400);
      }

      const detections = await faceapi
        .detectAllFaces(processedImage, new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.3,
          maxResults: 1,
        }))
        .withFaceLandmarks();

      console.log('[FaceDetectionService] Found', detections?.length || 0, 'face(s)');

      if (!detections || detections.length === 0) {
        return {
          detected: false,
          error: 'No face detected in image. Try using a clearer photo with a visible face.'
        };
      }

      const face = detections[0];
      
      return {
        detected: true,
        face,
        boundingBox: face.detection.box,
        landmarks: face.landmarks,
        confidence: face.detection.score
      };
    } catch (error) {
      console.error('[FaceDetectionService] Face detection error:', error);
      return {
        detected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  resizeImage(imageElement, minSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const scale = Math.max(minSize / imageElement.width, minSize / imageElement.height);
    
    if (scale > 1) {
      canvas.width = imageElement.width * scale;
      canvas.height = imageElement.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      return canvas;
    }
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    return canvas;
  }

  async detectAllFaces(imageElement) {
    try {
      await this.loadModels();

      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (!detections || detections.length === 0) {
        return [];
      }

      return detections.map(face => ({
        detected: true,
        face,
        boundingBox: face.detection.box,
        landmarks: face.landmarks,
        confidence: face.detection.score
      }));
    } catch (error) {
      console.error('[FaceDetectionService] Multiple face detection error:', error);
      return [];
    }
  }

  getFaceCenter(landmarks) {
    const jaw = landmarks.getJawOutline();
    const left = jaw[0];
    const right = jaw[jaw.length - 1];
    const top = landmarks.positions[27];
    const bottom = landmarks.positions[8];

    return {
      x: (left.x + right.x) / 2,
      y: (top.y + bottom.y) / 2,
      width: right.x - left.x,
      height: bottom.y - top.y
    };
  }

  calculateFaceRotation(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEyeCenter = this.getPointCenter(leftEye);
    const rightEyeCenter = this.getPointCenter(rightEye);
    
    const deltaY = rightEyeCenter.y - leftEyeCenter.y;
    const deltaX = rightEyeCenter.x - leftEyeCenter.x;
    
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * (180 / Math.PI);
    
    return angleDeg;
  }

  calculateHeadTilt(landmarks) {
    const nose = landmarks.getNose();
    const noseTip = nose[3];
    const noseBridge = nose[0];
    
    const deltaX = noseTip.x - noseBridge.x;
    return deltaX;
  }

  getFaceAlignment(landmarks) {
    return {
      rotation: this.calculateFaceRotation(landmarks),
      tilt: this.calculateHeadTilt(landmarks)
    };
  }

  getPointCenter(points) {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  }

  calculateFaceQuality(detectionResult, imageWidth, imageHeight) {
    if (!detectionResult.detected || !detectionResult.boundingBox) {
      return {
        overall: 0, sharpness: 0, brightness: 0, centered: 0, size: 0
      };
    }

    const { boundingBox, confidence } = detectionResult;
    
    const faceArea = boundingBox.width * boundingBox.height;
    const imageArea = imageWidth * imageHeight;
    const faceRatio = faceArea / imageArea;
    const idealRatio = 0.4;
    const sizeScore = Math.max(0, 100 - Math.abs(faceRatio - idealRatio) / idealRatio * 100);

    const faceCenterX = boundingBox.x + boundingBox.width / 2;
    const faceCenterY = boundingBox.y + boundingBox.height / 2;
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;
    const distanceX = Math.abs(faceCenterX - imageCenterX) / imageWidth;
    const distanceY = Math.abs(faceCenterY - imageCenterY) / imageHeight;
    const centeredScore = Math.max(0, 100 - (distanceX + distanceY) * 100);

    const confidenceScore = (confidence || 0) * 100;
    const sharpnessScore = 80;
    const brightnessScore = 80;

    const overall = (
      sizeScore * 0.25 +
      centeredScore * 0.25 +
      confidenceScore * 0.25 +
      sharpnessScore * 0.15 +
      brightnessScore * 0.10
    );

    return {
      overall: Math.round(overall),
      sharpness: Math.round(sharpnessScore),
      brightness: Math.round(brightnessScore),
      centered: Math.round(centeredScore),
      size: Math.round(sizeScore)
    };
  }

  alignFace(imageElement, rotation) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-rotation * Math.PI / 180);
    ctx.drawImage(
      imageElement,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );
    
    return canvas;
  }

  cropToFace(imageElement, faceCenter, targetWidth, targetHeight, padding = 1.5) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const cropWidth = faceCenter.width * padding;
    const cropHeight = faceCenter.height * padding;
    
    const cropX = faceCenter.x - cropWidth / 2;
    const cropY = faceCenter.y - cropHeight / 2;
    
    ctx.drawImage(
      imageElement,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );
    
    return canvas;
  }

  checkIDCardCompliance(detectionResult, imageWidth, imageHeight) {
    const issues = [];
    const warnings = [];

    if (!detectionResult.detected) {
      return { compliant: false, issues: ['No face detected in image'], warnings: [] };
    }

    const { landmarks, confidence } = detectionResult;
    const quality = this.calculateFaceQuality(detectionResult, imageWidth, imageHeight);

    if (quality.size < 50) issues.push('Face is too small in the image');
    else if (quality.size < 70) warnings.push('Face could be larger for better quality');

    if (quality.centered < 60) issues.push('Face is not properly centered');
    else if (quality.centered < 80) warnings.push('Face could be better centered');

    if ((confidence || 0) < 0.7) warnings.push('Face detection confidence is low');

    if (landmarks) {
      const rotation = this.calculateFaceRotation(landmarks);
      if (Math.abs(rotation) > 15) issues.push('Face is tilted too much');
      else if (Math.abs(rotation) > 5) warnings.push('Face is slightly tilted');
    }

    return { compliant: issues.length === 0, issues, warnings };
  }
}

export default new FaceDetectionService();
