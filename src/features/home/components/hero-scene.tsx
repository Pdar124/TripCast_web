import { AdaptiveDpr, Preload } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import { createNoise2D } from 'simplex-noise';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type HeroSceneProps = {
  compact: boolean;
  onReady: () => void;
  reducedMotion: boolean;
};

const routePoints = [
  new THREE.Vector3(-7.5, 0.8, 3.8),
  new THREE.Vector3(-5.2, 1.05, 1.7),
  new THREE.Vector3(-2.4, 0.55, 0.4),
  new THREE.Vector3(0.2, 1.15, -1.2),
  new THREE.Vector3(3.2, 0.65, -0.7),
  new THREE.Vector3(6.8, 1.0, -3.4),
];

const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.35);

function Terrain({ compact }: { compact: boolean }) {
  const geometry = useMemo(() => {
    const widthSegments = compact ? 36 : 72;
    const heightSegments = compact ? 28 : 56;
    const plane = new THREE.PlaneGeometry(24, 18, widthSegments, heightSegments);
    const noise = createNoise2D(() => 0.42);
    const positions = plane.attributes.position;

    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const broad = noise(x * 0.12, y * 0.12) * 1.2;
      const detail = noise(x * 0.3, y * 0.3) * 0.34;
      const routeValley = Math.exp(-Math.pow(y * 0.15 + x * 0.025, 2)) * 0.55;
      positions.setZ(index, broad + detail - routeValley - 0.5);
    }

    plane.computeVertexNormals();
    return plane;
  }, [compact]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial color="#173d2a" flatShading metalness={0.04} roughness={0.92} />
    </mesh>
  );
}

function RouteLine({ progress }: { progress: React.MutableRefObject<number> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => new THREE.TubeGeometry(routeCurve, 180, 0.055, 8, false), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        uniforms={{
          uColor: { value: new THREE.Color('#1ed760') },
          uProgress: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uProgress;
          varying vec2 vUv;
          void main() {
            if (vUv.x > uProgress) discard;
            float glow = 0.78 + sin(vUv.x * 42.0) * 0.14;
            gl_FragColor = vec4(uColor * glow, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function Waypoint({
  progress,
  routePosition,
}: {
  progress: React.MutableRefObject<number>;
  routePosition: number;
}) {
  const [visible, setVisible] = useState(false);
  const position = useMemo(() => routeCurve.getPointAt(routePosition), [routePosition]);
  const { scale } = useSpring({
    scale: visible ? 1 : 0,
    config: { tension: 320, friction: 13 },
  });

  useFrame(() => {
    if (!visible && progress.current >= routePosition) setVisible(true);
  });

  return (
    <animated.group position={position} scale={scale}>
      <mesh position-y={0.22} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#1ed760" emissive="#0b6b32" emissiveIntensity={0.8} />
      </mesh>
      <mesh position-y={-0.02} castShadow>
        <coneGeometry args={[0.09, 0.34, 12]} />
        <meshStandardMaterial color="#f7fff9" />
      </mesh>
    </animated.group>
  );
}

function Scene({ compact, onReady, reducedMotion }: HeroSceneProps) {
  const { camera, clock } = useThree();
  const progress = useRef(reducedMotion ? 1 : 0);
  const announcedReady = useRef(false);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const elapsed = clock.getElapsedTime();
    progress.current = reducedMotion ? 1 : Math.min(1, elapsed / 2.5);

    if (!announcedReady.current) {
      announcedReady.current = true;
      onReady();
    }

    if (reducedMotion) {
      camera.position.set(7.7, 5.2, 8.5);
      camera.lookAt(1.5, 0.1, -1.8);
      return;
    }

    const travel = Math.min(1, elapsed / 4);
    const position = routeCurve.getPointAt(THREE.MathUtils.lerp(0.02, 0.92, travel));
    const target = routeCurve.getPointAt(Math.min(1, travel + 0.07));
    const idle = elapsed > 4 ? Math.sin((elapsed - 4) * 0.45) * 0.14 : 0;
    camera.position.set(position.x - 1.8, position.y + 3.3 + idle, position.z + 4.6);
    lookAt.copy(target).add(new THREE.Vector3(0, 0.25, 0));
    camera.lookAt(lookAt);
  });

  return (
    <>
      <color attach="background" args={['#07140d']} />
      <fog attach="fog" args={['#07140d', 8, 24]} />
      <ambientLight intensity={0.8} />
      <directionalLight castShadow intensity={2.1} position={[4, 9, 5]} />
      <pointLight color="#1ed760" intensity={14} position={[2, 3, -1]} distance={11} />
      <Terrain compact={compact} />
      <RouteLine progress={progress} />
      {[0.15, 0.38, 0.62, 0.88].map((routePosition) => (
        <Waypoint key={routePosition} progress={progress} routePosition={routePosition} />
      ))}
      <AdaptiveDpr pixelated />
      <Preload all />
    </>
  );
}

export function HeroScene(props: HeroSceneProps) {
  return (
    <Canvas
      camera={{ fov: 48, near: 0.1, far: 60, position: [-9, 4.2, 8] }}
      className="h-full w-full"
      dpr={props.compact ? [1, 1.2] : [1, 1.5]}
      gl={{ alpha: false, antialias: !props.compact, powerPreference: 'high-performance' }}
      shadows={!props.compact}
    >
      <Scene {...props} />
    </Canvas>
  );
}
