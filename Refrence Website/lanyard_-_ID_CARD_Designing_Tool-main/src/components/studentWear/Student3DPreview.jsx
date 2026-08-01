import React, { useMemo, Suspense, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { 
  Float, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';
import IdCardPreview from '../IdCardPreview';
import { getPreviewFrame } from './studentWearPreviewUtils';
import { Group as KonvaGroup, Layer, Stage } from 'react-konva';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';

// A realistic lanyard strap component
function LanyardStrap({ color }) {
  const leftStrap = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.17, 0.82, 0.09),
    new THREE.Vector3(-0.16, 0.72, 0.12),
    new THREE.Vector3(-0.12, 0.58, 0.18),
    new THREE.Vector3(-0.06, 0.46, 0.25),
    new THREE.Vector3(0, 0.38, 0.3),
  ], false), []);
  const rightStrap = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.17, 0.82, 0.09),
    new THREE.Vector3(0.16, 0.72, 0.12),
    new THREE.Vector3(0.12, 0.58, 0.18),
    new THREE.Vector3(0.06, 0.46, 0.25),
    new THREE.Vector3(0, 0.38, 0.3),
  ], false), []);

  // Custom shader for fabric texture
  const leftStrapMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.85,
      metalness: 0.05,
      bumpScale: 0.005,
    });
  }, [color]);

  const rightStrapMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.85,
      metalness: 0.05,
      bumpScale: 0.005,
    });
  }, [color]);

  return (
    <group>
      <mesh material={leftStrapMaterial}>
        <tubeGeometry args={[leftStrap, 80, 0.018, 12, false]} />
      </mesh>
      <mesh material={rightStrapMaterial}>
        <tubeGeometry args={[rightStrap, 80, 0.018, 12, false]} />
      </mesh>
      {/* Metal clip area with realistic chrome finish */}
      <mesh position={[0, 0.36, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.045, 24]} />
        <meshStandardMaterial 
          color="#e2e8f0" 
          metalness={1} 
          roughness={0.1} 
          envMapIntensity={2}
        />
      </mesh>
      {/* Small shadow under the clip */}
      <mesh position={[0, 0.35, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function OverlayBadgeCard({ idCardSize }) {
  const frame = getPreviewFrame(idCardSize);
  const targetBadgeWidth = frame.frameWidth > frame.frameHeight ? 62 : 54;
  const targetBadgeHeight = frame.frameWidth > frame.frameHeight ? 42 : 72;
  const badgeWidthScale = targetBadgeWidth / frame.frameWidth;
  const badgeHeightScale = targetBadgeHeight / frame.frameHeight;
  const badgeScale = Math.min(badgeWidthScale, badgeHeightScale);
  const badgeWidth = Math.round(frame.frameWidth * badgeScale);
  const badgeHeight = Math.round(frame.frameHeight * badgeScale);
  const cardFitScale = badgeWidth / frame.frameWidth;

  return (
    <div
      className="absolute left-1/2 top-[68%] z-20 badge-sway pointer-events-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      <svg viewBox="0 0 40 72" className="absolute left-1/2 top-0 h-[72px] w-[40px] -translate-x-1/2 pointer-events-none">
        <rect x="13" y="8" width="14" height="11" rx="2.2" fill="#0f172a" />
        <rect x="14" y="9" width="12" height="1.7" rx="0.8" fill="rgba(255,255,255,0.35)" />
        <circle cx="20" cy="14" r="2" fill="#0b1220" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
        <rect x="17.5" y="19.5" width="5" height="4.2" rx="0.8" fill="#111827" />
        <line x1="20" y1="24" x2="20" y2="44" stroke="rgba(148,163,184,0.95)" strokeWidth="1.4" />
        <circle cx="20" cy="45.5" r="2.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.7" />
      </svg>

      <div
        className="absolute left-1/2 top-[44px] -translate-x-1/2 overflow-hidden rounded-[9px] border border-white/70 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.28)]"
        style={{
          width: `${badgeWidth}px`,
          height: `${badgeHeight}px`,
          transform: 'rotateX(8deg) rotateY(-4deg) rotateZ(-1deg)',
        }}
      >
        <Stage width={badgeWidth} height={badgeHeight} listening={false}>
          <Layer listening={false}>
            <KonvaGroup
              x={frame.previewOffsetX * cardFitScale}
              y={frame.previewOffsetY * cardFitScale}
              scaleX={frame.cardScale * cardFitScale}
              scaleY={frame.cardScale * cardFitScale}
              listening={false}
            >
              <IdCardPreview isReviewStep={true} forceSide="front" />
            </KonvaGroup>
          </Layer>
        </Stage>
        <div className="gloss-shimmer absolute inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function StudentModel({ shirtColor, textureUrl }) {
  const skinColor = '#f6caa8';
  const hairColor = '#3b261d';
  const tieColor = '#3c2f2b';
  const strapColor = '#374151';

  const texture = useLoader(
    THREE.TextureLoader,
    textureUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  );

  useMemo(() => {
    if (texture && textureUrl) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    }
  }, [texture, textureUrl]);

  return (
    <group position={[0, -0.62, 0.02]}>
      <mesh position={[0, 0.42, -0.12]} castShadow receiveShadow>
        <capsuleGeometry args={[0.34, 0.68, 18, 30]} />
        <meshStandardMaterial 
          color={shirtColor} 
          map={textureUrl ? texture : null}
          roughness={0.78} 
          metalness={0.02} 
        />
      </mesh>
      <mesh position={[-0.43, 0.36, -0.08]} rotation={[0.05, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.08, 0.32, 12, 16]} />
        <meshStandardMaterial 
          color={shirtColor} 
          map={textureUrl ? texture : null}
          roughness={0.8} 
        />
      </mesh>
      <mesh position={[0.43, 0.36, -0.08]} rotation={[0.05, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.08, 0.32, 12, 16]} />
        <meshStandardMaterial 
          color={shirtColor} 
          map={textureUrl ? texture : null}
          roughness={0.8} 
        />
      </mesh>
      <mesh position={[-0.2, 0.68, 0.01]} rotation={[0.06, 0.04, -0.2]} castShadow>
        <capsuleGeometry args={[0.045, 0.34, 10, 16]} />
        <meshStandardMaterial color={strapColor} roughness={0.72} />
      </mesh>
      <mesh position={[0.2, 0.68, 0.01]} rotation={[0.06, -0.04, 0.2]} castShadow>
        <capsuleGeometry args={[0.045, 0.34, 10, 16]} />
        <meshStandardMaterial color={strapColor} roughness={0.72} />
      </mesh>
      <group position={[0, 0.9, 0.08]}>
        <mesh position={[-0.09, -0.02, 0.02]} rotation={[-0.4, 0.06, 0.24]} castShadow>
          <boxGeometry args={[0.16, 0.11, 0.025]} />
          <meshStandardMaterial color="#ffffff" roughness={0.65} />
        </mesh>
        <mesh position={[0.09, -0.02, 0.02]} rotation={[-0.4, -0.06, -0.24]} castShadow>
          <boxGeometry args={[0.16, 0.11, 0.025]} />
          <meshStandardMaterial color="#ffffff" roughness={0.65} />
        </mesh>
      </group>
      <mesh position={[0, 0.76, 0.09]} castShadow>
        <coneGeometry args={[0.08, 0.41, 4]} />
        <meshStandardMaterial color={tieColor} roughness={0.66} />
      </mesh>
      <mesh position={[0, 0.94, 0.11]} castShadow>
        <boxGeometry args={[0.08, 0.07, 0.04]} />
        <meshStandardMaterial color={tieColor} roughness={0.66} />
      </mesh>
      <mesh position={[0, 1.0, -0.03]} castShadow>
        <cylinderGeometry args={[0.085, 0.095, 0.23, 20]} />
        <meshStandardMaterial color={skinColor} roughness={0.42} />
      </mesh>
      <group position={[0, 1.28, 0.03]}>
        <mesh castShadow receiveShadow scale={[0.92, 1.0, 0.9]}>
          <sphereGeometry args={[0.265, 36, 36]} />
          <meshStandardMaterial color={skinColor} roughness={0.38} metalness={0.03} />
        </mesh>
        <mesh position={[-0.26, -0.01, -0.01]} castShadow>
          <sphereGeometry args={[0.052, 14, 14]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.26, -0.01, -0.01]} castShadow>
          <sphereGeometry args={[0.052, 14, 14]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, -0.04]} rotation={[-0.3, 0, 0]} castShadow>
          <sphereGeometry args={[0.28, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={hairColor} roughness={0.84} />
        </mesh>
        <mesh position={[0.1, 0.19, 0.1]} rotation={[-0.55, 0.24, -0.2]} castShadow>
          <capsuleGeometry args={[0.08, 0.16, 10, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.82} />
        </mesh>
        <mesh position={[-0.13, 0.18, 0.12]} rotation={[-0.46, -0.22, 0.2]} castShadow>
          <capsuleGeometry args={[0.075, 0.14, 10, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.82} />
        </mesh>
        <mesh position={[0.02, 0.26, 0.13]} rotation={[-0.65, 0.2, -0.08]} castShadow>
          <capsuleGeometry args={[0.06, 0.12, 10, 16]} />
          <meshStandardMaterial color="#4b3023" roughness={0.8} />
        </mesh>
        <group position={[0, -0.02, 0.23]}>
          <mesh position={[-0.08, 0.058, 0.015]}>
            <torusGeometry args={[0.052, 0.006, 14, 36]} />
            <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.75} />
          </mesh>
          <mesh position={[0.08, 0.058, 0.015]}>
            <torusGeometry args={[0.052, 0.006, 14, 36]} />
            <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.75} />
          </mesh>
          <mesh position={[0, 0.058, 0.016]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.038, 8]} />
            <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.75} />
          </mesh>
          <mesh position={[-0.08, 0.058, 0.011]}>
            <circleGeometry args={[0.044, 24]} />
            <meshStandardMaterial color="#bfdbfe" transparent opacity={0.2} roughness={0.1} metalness={0.25} />
          </mesh>
          <mesh position={[0.08, 0.058, 0.011]}>
            <circleGeometry args={[0.044, 24]} />
            <meshStandardMaterial color="#bfdbfe" transparent opacity={0.2} roughness={0.1} metalness={0.25} />
          </mesh>
          <mesh position={[-0.08, 0.056, -0.003]}>
            <sphereGeometry args={[0.013, 14, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.12} />
          </mesh>
          <mesh position={[0.08, 0.056, -0.003]}>
            <sphereGeometry args={[0.013, 14, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.12} />
          </mesh>
          <mesh position={[0, -0.004, 0.018]} rotation={[0.24, 0, 0]}>
            <capsuleGeometry args={[0.014, 0.028, 12, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.066, 0.005]} rotation={[0.08, 0, 0]}>
            <capsuleGeometry args={[0.006, 0.06, 8, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </mesh>
          <mesh position={[-0.065, -0.03, 0.004]}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshStandardMaterial color="#f4b8ad" roughness={0.55} transparent opacity={0.55} />
          </mesh>
          <mesh position={[0.065, -0.03, 0.004]}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshStandardMaterial color="#f4b8ad" roughness={0.55} transparent opacity={0.55} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function Student3DPreview({ lanyardColor, idCardSize }) {
  const design = useConfiguratorStore((s) => s.design);
  const strapColor = typeof lanyardColor === 'string' && lanyardColor.trim()
    ? lanyardColor
    : '#5d5fef';

  // Uniform color & texture are available for all users
  const shirtColor = design.premiumUniformColor || '#f1f5f9';
  const textureUrl = design.premiumUniformTextureUrl || '';

  return (
    <div className="relative h-full w-full">
      {/* AI Mode badge */}
      <div className="absolute left-1/2 top-2 z-30 flex -translate-x-1/2 items-center gap-[5px] rounded-full border border-[#5d5fef]/20 bg-[linear-gradient(135deg,rgba(93,95,239,0.12),rgba(130,233,255,0.12))] px-[10px] py-[3px] text-[8px] font-black uppercase tracking-[0.14em] text-[#5d5fef] backdrop-blur-md">
        <span className="h-[5px] w-[5px] animate-[ai-dot-pulse_2s_ease-in-out_infinite] rounded-full bg-[#5d5fef]" />
        AI 3D Model View
      </div>

      <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        {/* Adjusted camera to fit two characters */}
        <PerspectiveCamera makeDefault position={[0, 0.8, 4.2]} fov={28} />
        
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.2} 
          color="#fef3c7" 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-4, 4, -4]} intensity={0.6} color="#e0f2fe" />
        <spotLight 
          position={[0, 6, 2]} 
          angle={0.4} 
          penumbra={0.8} 
          intensity={0.8} 
          color="#ffffff" 
          castShadow 
        />
        
        <Suspense fallback={null}>
          <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.2}>
            {/* BOY MODEL (Left) */}
            <group position={[-0.55, -0.44, 0]} scale={1.0}>
              <StudentModel shirtColor={shirtColor} textureUrl={textureUrl} />
              <LanyardStrap color={strapColor} />
            </group>

            {/* GIRL MODEL (Right) */}
            <group position={[0.55, -0.44, 0]} scale={1.0}>
              {/* Slight rotation and scale difference for variety */}
              <group rotation={[0, -0.1, 0]} scale={0.95}>
                <StudentModel shirtColor={shirtColor} textureUrl={textureUrl} />
                <LanyardStrap color={strapColor} />
              </group>
            </group>
          </Float>
          
          <Environment preset="apartment" />
          <ContactShadows 
            position={[0, -1.1, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2.5} 
            far={1.5} 
            color="#1e293b"
          />
        </Suspense>

        <OrbitControls 
          enableZoom={true}
          minDistance={2}
          maxDistance={6}
          enablePan={false}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          rotateSpeed={0.4}
        />
      </Canvas>

      {/* Badges for both models */}
      {/* Boy Badge */}
      <div style={{ position: 'absolute', left: '25%', top: '0', width: '100%', height: '100%', pointerEvents: 'none' }}>
        <OverlayBadgeCard idCardSize={idCardSize} />
      </div>
      {/* Girl Badge */}
      <div style={{ position: 'absolute', left: '75%', top: '0', width: '100%', height: '100%', pointerEvents: 'none' }}>
        <OverlayBadgeCard idCardSize={idCardSize} />
      </div>

      {/* Labels below characters */}
      <div className="absolute bottom-6 flex w-full justify-between px-[25%] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        <span>Boy</span>
        <span>Girl</span>
      </div>
    </div>
  );
}
