import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';
import { THEMES } from '../constants';

const PARTICLE_COUNT = 4500; // Increased for better resolution

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color() },
    uColor2: { value: new THREE.Color() },
    uMorphFactor: { value: 0 }, // 0 = Chaos, 1 = Formed
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorphFactor;
    attribute vec3 aRandom;
    attribute vec3 aTarget;
    attribute float aScale;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying vec2 vUv;

    // Cubic easing for smooth snap
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      vUv = uv;
      vColor = aColor;

      // Chaos movement (brownian-ish)
      vec3 chaosPos = aRandom + vec3(
        sin(uTime * 0.5 + aRandom.y) * 2.0,
        cos(uTime * 0.3 + aRandom.x) * 2.0,
        sin(uTime * 0.7 + aRandom.z) * 2.0
      );

      // Target movement (swaying)
      float sway = sin(uTime * 2.0 + aTarget.y * 0.5) * 0.1 * (aTarget.y + 8.0) / 16.0;
      vec3 targetPos = aTarget;
      targetPos.x += sway;
      targetPos.z += sway * 0.5;

      // Morph
      float t = easeInOutCubic(uMorphFactor);
      vec3 pos = mix(chaosPos, targetPos, t);

      // Scale pulse
      float scale = aScale * (0.8 + 0.2 * sin(uTime * 3.0 + aRandom.x));

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Distance attenuation
      gl_PointSize = scale * (300.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if(ll > 0.5) discard;

      // Soft glow
      float strength = 1.0 - (ll * 2.0);
      strength = pow(strength, 1.5);

      gl_FragColor = vec4(vColor, strength);
    }
  `
};

interface FoliageProps {
  shape: ShapeType;
  formed: boolean;
}

export const Foliage: React.FC<FoliageProps> = ({ shape, formed }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Generate Geometry Data
  const { positions, randoms, colors, targets, scales } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const rand = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const targs = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);

    const theme = THEMES[shape];
    const palette = theme.particles.map(c => new THREE.Color(c));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Initial Random (Chaos)
      rand[i3] = (Math.random() - 0.5) * 40;
      rand[i3 + 1] = (Math.random() - 0.5) * 40;
      rand[i3 + 2] = (Math.random() - 0.5) * 40;

      // Colors
      const color = palette[Math.floor(Math.random() * palette.length)];
      cols[i3] = color.r;
      cols[i3 + 1] = color.g;
      cols[i3 + 2] = color.b;

      // Scale
      scales[i] = Math.random() * 0.5 + 0.5;

      // -- TARGET CALCULATION --
      let tx = 0, ty = 0, tz = 0;
      const h = Math.random() * 16 - 8; // Height from -8 to 8
      const angle = Math.random() * Math.PI * 2;

      if (shape === ShapeType.TREE) {
        // Cone: r = (1 - (h+8)/16) * baseRadius
        const normalizedH = (h + 8) / 16;
        const radius = (1 - normalizedH) * 5.5; 
        const r = radius * Math.sqrt(Math.random()); 
        tx = Math.cos(angle) * r;
        tz = Math.sin(angle) * r;
        ty = h;
      } else if (shape === ShapeType.COKE) {
        // Updated Contour Bottle Math
        // Height range: -8 to 8
        let r = 0;
        
        // Use a continuous piecewise function to define the "Hull" radius
        if (h < -1) {
           // Base & Bulb: -8 to -1 (Length 7)
           // Starts at 2.6, Bulges to 3.6, Tapers to 2.4
           const t = (h - (-8)) / 7.0; 
           r = (1-t)*(1-t)*2.6 + 2*(1-t)*t*3.6 + t*t*2.4;
        } else if (h < 2.5) {
           // Waist & Label Area: -1 to 2.5 (Length 3.5)
           // Connects 2.4 -> 1.7 (Waist) -> 3.0 (Shoulder Start)
           const t = (h - (-1)) / 3.5;
           r = (1-t)*(1-t)*2.4 + 2*(1-t)*t*1.7 + t*t*3.0;
        } else if (h < 4.5) {
           // Shoulder: 2.5 to 4.5 (Length 2.0)
           // 3.0 -> 2.8 -> 1.0 (Neck)
           const t = (h - 2.5) / 2.0;
           r = (1-t)*(1-t)*3.0 + 2*(1-t)*t*2.8 + t*t*1.0;
        } else {
           // Neck: 4.5 to 8
           // Slight taper
           r = 1.0 - (h - 4.5) * 0.05;
           // Cap Lip
           if (h > 7.7) r = 1.1; 
        }

        // Particle Distribution Bias for Glass/Liquid effect
        // Bias towards surface but keep liquid volume full
        let distributionBias = 1.0;
        const isLiquidLevel = h < 4.5; // Liquid stops at neck
        
        if (isLiquidLevel) {
            // Volume fill for liquid (heavy core, defined edge)
            distributionBias = Math.pow(Math.random(), 0.5); 
        } else {
            // Glass neck: distinct surface
            distributionBias = Math.pow(Math.random(), 0.1);
        }

        const filledR = r * distributionBias;
        
        tx = Math.cos(angle) * filledR;
        tz = Math.sin(angle) * filledR;
        ty = h;

      } else if (shape === ShapeType.SNOW) {
        const armIndex = Math.floor(Math.random() * 6);
        const armAngle = (armIndex / 6) * Math.PI * 2;
        const dist = Math.random() * 8;
        const spread = (Math.random() - 0.5) * (dist * 0.4); 
        
        const lx = dist;
        const lz = spread;
        
        tx = lx * Math.cos(armAngle) - lz * Math.sin(armAngle);
        tz = lx * Math.sin(armAngle) + lz * Math.cos(armAngle);
        ty = (Math.random() - 0.5) * 1.0; 
      }

      targs[i3] = tx;
      targs[i3 + 1] = ty;
      targs[i3 + 2] = tz;
      
      pos[i3] = rand[i3];
      pos[i3+1] = rand[i3+1];
      pos[i3+2] = rand[i3+2];
    }

    return { positions: pos, randoms: rand, colors: cols, targets: targs, scales };
  }, [shape]);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Lerp morph factor
      const targetMorph = formed ? 1.0 : 0.0;
      shaderRef.current.uniforms.uMorphFactor.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uMorphFactor.value,
        targetMorph,
        0.05 // Speed factor - smooth transition
      );
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" array={randoms} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" array={targets} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aScale" array={scales} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};