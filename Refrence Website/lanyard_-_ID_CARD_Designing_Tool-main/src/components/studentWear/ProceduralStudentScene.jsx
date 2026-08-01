import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, RoundedBox, TransformControls } from '@react-three/drei';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import * as THREE from 'three';

const MaterialForPattern = ({ textureUrl }) => {
  const isColor = textureUrl && textureUrl.startsWith('#');

  const texture = useMemo(() => {
    if (!textureUrl || isColor) return null;
    
    try {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(textureUrl);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    } catch (e) {
      return null;
    }
  }, [textureUrl, isColor]);

  if (texture) {
    return <meshStandardMaterial map={texture} roughness={0.8} />;
  }

  // Fallback to color
  const colors = { 
    'tn_sky_check': '#87ceeb', // fallback color for pattern 
  };
  const finalColor = isColor ? textureUrl : (colors[textureUrl] || '#ffffff');
  
  return <meshStandardMaterial color={finalColor} roughness={0.8} />;
};

const Accessories = ({ equippedState }) => {
  const scale = equippedState.lanyardScale || 1.0;
  
  return (
    <group position={[0, 0, 0]}>
      {equippedState.lanyardEquipped && (
        <group position={[0, 1.4, 0.1]} rotation={[0.2, 0, 0]} scale={scale}>
          <mesh position={[0, -0.4, 0]}>
            <torusGeometry args={[0.3, 0.02, 16, 100, Math.PI]} />
            <meshStandardMaterial color="#5d5fef" roughness={0.5} />
          </mesh>
          <mesh position={[-0.3, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
            <meshStandardMaterial color="#5d5fef" roughness={0.5} />
          </mesh>
          <mesh position={[0.3, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
            <meshStandardMaterial color="#5d5fef" roughness={0.5} />
          </mesh>
        </group>
      )}

      {equippedState.idCardEquipped && (
        <group position={[0, 0.5, 0.35]} rotation={[0.1, 0, 0]} scale={scale}>
          <RoundedBox args={[0.4, 0.6, 0.02]} radius={0.02} smoothness={4}>
            <meshStandardMaterial color="#ffffff" />
          </RoundedBox>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.1, 0.05, 0.02]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
};

const MaleStudent = ({ uniform }) => {
  return (
    <group position={[0, -1, 0]}>
      {/* Head */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#fcd5ce" roughness={0.6} />
      </mesh>

      {/* Shirt / Torso */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />
        <MaterialForPattern textureUrl={uniform.shirtTextureUrl} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.55, 1.7, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.0, 16]} />
        <MaterialForPattern textureUrl={uniform.shirtTextureUrl} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.55, 1.7, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.0, 16]} />
        <MaterialForPattern textureUrl={uniform.shirtTextureUrl} />
      </mesh>

      {/* Pants */}
      <mesh position={[-0.2, 0.6, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 1.2, 32]} />
        <MaterialForPattern textureUrl={uniform.pantTextureUrl} />
      </mesh>
      <mesh position={[0.2, 0.6, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 1.2, 32]} />
        <MaterialForPattern textureUrl={uniform.pantTextureUrl} />
      </mesh>
      
      {/* Shoes */}
      <mesh position={[-0.2, 0.1, 0.1]}>
        <boxGeometry args={[0.2, 0.2, 0.35]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.2, 0.1, 0.1]}>
        <boxGeometry args={[0.2, 0.2, 0.35]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};

const FemaleStudent = ({ uniform }) => {
  return (
    <group position={[0, -1, 0]}>
      {/* Head */}
      <mesh position={[0, 2.7, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#fcd5ce" roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 2.75, -0.05]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#472c1c" roughness={0.8} />
      </mesh>

      {/* Shirt / Torso */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.35, 0.3, 1.0, 32]} />
        <MaterialForPattern textureUrl={uniform.shirtTextureUrl} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.5, 1.7, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.9, 16]} />
        <MaterialForPattern textureUrl={uniform.shirtTextureUrl} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.5, 1.7, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.9, 16]} />
        <MaterialForPattern textureUrl={uniform.shirtTextureUrl} />
      </mesh>

      {/* Skirt */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.3, 0.45, 0.5, 32]} />
        <MaterialForPattern textureUrl={uniform.skirtTextureUrl} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 1.0, 16]} />
        <meshStandardMaterial color="#fcd5ce" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 1.0, 16]} />
        <meshStandardMaterial color="#fcd5ce" roughness={0.6} />
      </mesh>
      
      {/* Shoes */}
      <mesh position={[-0.15, 0.05, 0.1]}>
        <boxGeometry args={[0.15, 0.15, 0.25]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.15, 0.05, 0.1]}>
        <boxGeometry args={[0.15, 0.15, 0.25]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};

export default function ProceduralStudentScene({ activeStudent }) {
  const design = useConfiguratorStore(s => s.design);
  const uniform = design.uniformConfig[activeStudent];
  const controlsRef = useRef();

  const handleResetView = (position) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(...position);
      controlsRef.current.update();
    }
  };

  return (
    <>
      <div className="absolute top-24 left-6 z-10 flex flex-col gap-2">
        <button className="bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-sm transition-all" onClick={() => handleResetView([0, 1, 5])}>Front</button>
        <button className="bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-sm transition-all" onClick={() => handleResetView([5, 1, 0])}>Side</button>
        <button className="bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-sm transition-all" onClick={() => handleResetView([0, 1, -5])}>Back</button>
      </div>

      <Canvas shadows camera={{ position: [0, 1, 5], fov: 45 }}>
        <color attach="background" args={['#e5e9f0']} />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={1024}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

        <Environment preset="city" />

        <group position={[0, -0.5, 0]}>
          {activeStudent === 'male' ? (
            <MaleStudent uniform={uniform} />
          ) : (
            <FemaleStudent uniform={uniform} />
          )}

          <Accessories equippedState={design.equippedState} />
        </group>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />

        <OrbitControls 
          ref={controlsRef}
          makeDefault
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </>
  );
}
