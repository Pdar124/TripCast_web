import { AdaptiveDpr, PerspectiveCamera, Preload } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type HeroSceneProps = {
  compact: boolean;
  onReady: () => void;
  reducedMotion: boolean;
};

type HeroPalette = {
  ambient: string;
  background: string;
  fog: string;
  key: string;
  route: string;
  terrain: string;
  wire: string;
};

const fallbackPalette: HeroPalette = {
  ambient: '#172d23',
  background: '#07140d',
  fog: '#0d2117',
  key: '#dff7e8',
  route: '#1ed760',
  terrain: '#173d2a',
  wire: '#4e7a61',
};

const terrainNoise = createNoise2D(() => 0.42);

function terrainHeight(x: number, z: number) {
  let amplitude = 1;
  let frequency = 0.085;
  let height = 0;
  let normalization = 0;

  for (let octave = 0; octave < 5; octave += 1) {
    const ridge = 1 - Math.abs(terrainNoise(x * frequency, z * frequency));
    height += ridge * ridge * amplitude;
    normalization += amplitude;
    amplitude *= 0.5;
    frequency *= 2.05;
  }

  const broadShape = terrainNoise(x * 0.035, z * 0.035) * 0.85;
  const routeValley = Math.exp(-Math.pow((x - 3.6) * 0.16, 2)) * 0.8;
  return (height / normalization - 0.48) * 5.2 + broadShape - routeValley - 0.65;
}

const routeCoordinates = [
  [7.5, 6.5],
  [5.8, 3],
  [6.8, -0.5],
  [4.5, -4],
  [6, -7.5],
  [3.2, -11],
] as const;

const routeCurve = new THREE.CatmullRomCurve3(
  routeCoordinates.map(([x, z]) => new THREE.Vector3(x, terrainHeight(x, z) + 0.9, z)),
  false,
  'catmullrom',
  0.42,
);

function readHeroPalette(): HeroPalette {
  if (typeof window === 'undefined') return fallbackPalette;

  const styles = window.getComputedStyle(document.documentElement);
  const value = (property: string, fallback: string) =>
    styles.getPropertyValue(property).trim() || fallback;

  return {
    ambient: value('--hero-ambient', fallbackPalette.ambient),
    background: value('--hero-bg', fallbackPalette.background),
    fog: value('--hero-fog', fallbackPalette.fog),
    key: value('--hero-key', fallbackPalette.key),
    route: value('--hero-route', fallbackPalette.route),
    terrain: value('--hero-terrain', fallbackPalette.terrain),
    wire: value('--hero-wire', fallbackPalette.wire),
  };
}

function useHeroPalette() {
  const [palette, setPalette] = useState(readHeroPalette);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setPalette(readHeroPalette());
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  return palette;
}

function Terrain({ compact, palette }: { compact: boolean; palette: HeroPalette }) {
  const geometry = useMemo(() => {
    const widthSegments = compact ? 64 : 128;
    const depthSegments = compact ? 56 : 112;
    const plane = new THREE.PlaneGeometry(38, 34, widthSegments, depthSegments);
    plane.rotateX(-Math.PI / 2);
    const positions = plane.attributes.position;

    for (let index = 0; index < positions.count; index += 1) {
      positions.setY(index, terrainHeight(positions.getX(index), positions.getZ(index)));
    }

    positions.needsUpdate = true;
    plane.computeVertexNormals();
    return plane;
  }, [compact]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={palette.terrain} metalness={0.03} roughness={0.92} />
      </mesh>
      <mesh geometry={geometry} position-y={0.035}>
        <meshBasicMaterial
          color={palette.wire}
          opacity={compact ? 0.1 : 0.16}
          transparent
          wireframe
        />
      </mesh>
    </group>
  );
}

function RouteLine({
  palette,
  progress,
}: {
  palette: HeroPalette;
  progress: React.RefObject<number>;
}) {
  const coreMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const glowMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const coreGeometry = useMemo(() => new THREE.TubeGeometry(routeCurve, 280, 0.035, 10), []);
  const glowGeometry = useMemo(() => new THREE.TubeGeometry(routeCurve, 280, 0.11, 10), []);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(palette.route) },
      uProgress: { value: 0 },
    }),
    [palette.route],
  );

  useEffect(
    () => () => {
      coreGeometry.dispose();
      glowGeometry.dispose();
    },
    [coreGeometry, glowGeometry],
  );

  useFrame(() => {
    if (coreMaterialRef.current) {
      coreMaterialRef.current.uniforms.uProgress.value = progress.current ?? 0;
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.uniforms.uProgress.value = progress.current ?? 0;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  return (
    <group>
      <mesh geometry={glowGeometry} renderOrder={2}>
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          fragmentShader={`
            uniform vec3 uColor;
            uniform float uProgress;
            varying vec2 vUv;
            void main() {
              if (vUv.x > uProgress) discard;
              float head = smoothstep(max(0.0, uProgress - 0.08), uProgress, vUv.x);
              gl_FragColor = vec4(uColor, 0.1 + head * 0.24);
            }
          `}
          ref={glowMaterialRef}
          transparent
          uniforms={uniforms}
          vertexShader={vertexShader}
        />
      </mesh>
      <mesh geometry={coreGeometry} renderOrder={3}>
        <shaderMaterial
          depthTest={false}
          depthWrite={false}
          fragmentShader={`
            uniform vec3 uColor;
            uniform float uProgress;
            varying vec2 vUv;
            void main() {
              if (vUv.x > uProgress) discard;
              float head = smoothstep(max(0.0, uProgress - 0.07), uProgress, vUv.x);
              vec3 color = mix(uColor, vec3(0.92, 1.0, 0.95), head * 0.72);
              gl_FragColor = vec4(color, 1.0);
            }
          `}
          ref={coreMaterialRef}
          toneMapped={false}
          uniforms={uniforms}
          vertexShader={vertexShader}
        />
      </mesh>
    </group>
  );
}

function Waypoint({
  palette,
  progress,
  reducedMotion,
  routePosition,
}: {
  palette: HeroPalette;
  progress: React.RefObject<number>;
  reducedMotion: boolean;
  routePosition: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => routeCurve.getPointAt(routePosition), [routePosition]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const halo = haloRef.current;
    if (!group || !halo) return;

    const reveal = THREE.MathUtils.clamp(((progress.current ?? 0) - routePosition) * 8, 0, 1);
    const offset = reveal - 1;
    const eased = 1 + 2.70158 * offset * offset * offset + 1.70158 * offset * offset;
    group.scale.setScalar(Math.max(0.001, eased));

    const pulse = reducedMotion
      ? 1
      : 1 + Math.sin(clock.getElapsedTime() * 2.4 + routePosition * 8) * 0.12;
    halo.scale.setScalar(pulse);
    halo.rotation.z += reducedMotion ? 0 : 0.0025;
  });

  return (
    <group position={position} ref={groupRef} scale={0.001}>
      <mesh castShadow position-y={0.34}>
        <sphereGeometry args={[0.11, 18, 14]} />
        <meshBasicMaterial color={palette.route} depthTest={false} toneMapped={false} />
      </mesh>
      <mesh castShadow position-y={0.17}>
        <cylinderGeometry args={[0.025, 0.035, 0.34, 10]} />
        <meshBasicMaterial color={palette.route} depthTest={false} toneMapped={false} />
      </mesh>
      <mesh position-y={0.025} ref={haloRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.17, 0.25, 36]} />
        <meshBasicMaterial
          color={palette.route}
          depthTest={false}
          depthWrite={false}
          opacity={0.42}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function Scene({
  compact,
  onReady,
  palette,
  reducedMotion,
}: HeroSceneProps & { palette: HeroPalette }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const progress = useRef(reducedMotion ? 1 : 0);
  const announcedReady = useRef(false);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const cameraStart = useMemo(
    () => new THREE.Vector3(compact ? 13.5 : 15.5, compact ? 10.5 : 9.4, compact ? 21 : 19),
    [compact],
  );
  const cameraEnd = useMemo(
    () => new THREE.Vector3(compact ? 10.8 : 12.2, compact ? 8.4 : 7.2, compact ? 17 : 14.8),
    [compact],
  );
  const lookAt = useRef(new THREE.Vector3());
  const baseLookAt = useMemo(() => new THREE.Vector3(compact ? 3.8 : 3.2, -0.2, -1.8), [compact]);

  useEffect(() => {
    if (reducedMotion) return;

    const updatePointer = (event: PointerEvent) => {
      pointerTarget.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const resetPointer = () => {
      pointerTarget.current = { x: 0, y: 0 };
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerleave', resetPointer);
    return () => {
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerleave', resetPointer);
    };
  }, [reducedMotion]);

  useFrame(({ clock }, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const elapsed = clock.getElapsedTime();
    progress.current = reducedMotion ? 1 : Math.min(1, elapsed / 3.2);

    if (!announcedReady.current) {
      announcedReady.current = true;
      onReady();
    }

    if (reducedMotion) {
      camera.position.copy(cameraEnd);
      camera.lookAt(baseLookAt);
      return;
    }

    const damping = 1 - Math.exp(-delta * 2.8);
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, pointerTarget.current.x, damping);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, pointerTarget.current.y, damping);

    const intro = THREE.MathUtils.clamp(elapsed / 4.4, 0, 1);
    const easedIntro = 1 - Math.pow(1 - intro, 4);
    const idleTime = Math.max(0, elapsed - 4.4);
    camera.position.lerpVectors(cameraStart, cameraEnd, easedIntro);
    camera.position.x += pointer.current.x * 0.75 + Math.sin(idleTime * 0.16) * 0.28;
    camera.position.y -= pointer.current.y * 0.42;
    camera.position.z += Math.cos(idleTime * 0.13) * 0.22;

    lookAt.current.copy(baseLookAt);
    lookAt.current.x += pointer.current.x * 0.28;
    lookAt.current.y -= pointer.current.y * 0.16;
    camera.lookAt(lookAt.current);
  });

  return (
    <>
      <PerspectiveCamera
        far={80}
        fov={compact ? 52 : 46}
        makeDefault
        near={0.1}
        position={[15.5, 9.4, 19]}
        ref={cameraRef}
      />
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fog, compact ? 15 : 17, compact ? 35 : 42]} />
      <hemisphereLight color={palette.key} groundColor={palette.ambient} intensity={1.1} />
      <directionalLight
        castShadow={!compact}
        color={palette.key}
        intensity={2.25}
        position={[-9, 15, 8]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <pointLight color={palette.route} distance={15} intensity={18} position={[5, 4, 1]} />
      <Terrain compact={compact} palette={palette} />
      <group position-x={compact ? 1.8 : 0}>
        <RouteLine palette={palette} progress={progress} />
        {[0.08, 0.3, 0.53, 0.76, 0.96].map((routePosition) => (
          <Waypoint
            key={routePosition}
            palette={palette}
            progress={progress}
            reducedMotion={reducedMotion}
            routePosition={routePosition}
          />
        ))}
      </group>
      <AdaptiveDpr pixelated />
      <Preload all />
    </>
  );
}

export function HeroScene(props: HeroSceneProps) {
  const palette = useHeroPalette();

  return (
    <Canvas
      className="h-full w-full"
      dpr={props.compact ? [1, 1.2] : [1, 1.6]}
      gl={{ alpha: false, antialias: !props.compact, powerPreference: 'high-performance' }}
      shadows={!props.compact}
    >
      <Scene {...props} palette={palette} />
    </Canvas>
  );
}
