import { AdaptiveDpr, PerspectiveCamera, Preload } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type HeroSceneProps = {
  active: boolean;
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
  terrainHigh: string;
  terrainLow: string;
  terrainMid: string;
  trees: string;
  wire: string;
};

const fallbackPalette: HeroPalette = {
  ambient: '#172d23',
  background: '#07140d',
  fog: '#0d2117',
  key: '#dff7e8',
  route: '#1ed760',
  terrain: '#173d2a',
  terrainHigh: '#9aaa91',
  terrainLow: '#102b1e',
  terrainMid: '#315b3e',
  trees: '#123924',
  wire: '#4e7a61',
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

const terrainNoise = createNoise2D(seededRandom(1403));
const detailNoise = createNoise2D(seededRandom(7281));

function terrainHeight(x: number, z: number) {
  const rolling = terrainNoise(x * 0.075, z * 0.065) * 0.72;
  const smallDetail = detailNoise(x * 0.19, z * 0.16) * 0.18;
  const distance = THREE.MathUtils.smoothstep(-z, 1.5, 17);
  const ridge = 1 - Math.abs(terrainNoise(x * 0.055 + 3.8, z * 0.052 - 2.1));
  const mountain = Math.pow(ridge, 2.35) * distance * 6.2 + distance * distance * 1.3;
  const rightShoulder = Math.exp(-Math.pow((x - 10) * 0.12, 2)) * distance * 1.15;
  const routeValley = Math.exp(-Math.pow((x - 4.9) * 0.2, 2)) * (0.5 + distance * 0.25);

  return rolling + smallDetail + mountain + rightShoulder - routeValley - 0.72;
}

const routeCoordinates = [
  [7.5, 6.5],
  [5.8, 3],
  [6.8, -0.5],
  [4.5, -4],
  [6, -7.5],
  [3.2, -11],
] as const;

const routeGuideCurve = new THREE.CatmullRomCurve3(
  routeCoordinates.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'catmullrom',
  0.42,
);

const routeCurve = new THREE.CatmullRomCurve3(
  Array.from({ length: 72 }, (_, index) => {
    const point = routeGuideCurve.getPoint(index / 71);
    point.y = terrainHeight(point.x, point.z) + 0.18;
    return point;
  }),
  false,
  'catmullrom',
  0.5,
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
    terrainHigh: value('--hero-terrain-high', fallbackPalette.terrainHigh),
    terrainLow: value('--hero-terrain-low', fallbackPalette.terrainLow),
    terrainMid: value('--hero-terrain-mid', fallbackPalette.terrainMid),
    trees: value('--hero-trees', fallbackPalette.trees),
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
    const low = new THREE.Color(palette.terrainLow);
    const mid = new THREE.Color(palette.terrainMid);
    const high = new THREE.Color(palette.terrainHigh);
    const color = new THREE.Color();
    const colors = new Float32Array(positions.count * 3);

    for (let index = 0; index < positions.count; index += 1) {
      const height = positions.getY(index);
      const variation = detailNoise(positions.getX(index) * 0.3, positions.getZ(index) * 0.3);
      const elevation = THREE.MathUtils.clamp((height + 0.8) / 6.8, 0, 1);

      if (elevation < 0.48) {
        color.copy(low).lerp(mid, elevation / 0.48);
      } else {
        color.copy(mid).lerp(high, (elevation - 0.48) / 0.52);
      }

      color.offsetHSL(variation * 0.012, variation * 0.025, variation * 0.025);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return plane;
  }, [compact, palette.terrainHigh, palette.terrainLow, palette.terrainMid]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={palette.terrain} metalness={0} roughness={0.96} vertexColors />
    </mesh>
  );
}

function Trees({ compact, palette }: { compact: boolean; palette: HeroPalette }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trees = useMemo(() => {
    const random = seededRandom(9137);
    const result: Array<{ position: THREE.Vector3; rotation: number; scale: number }> = [];
    const count = compact ? 56 : 120;

    for (let attempt = 0; attempt < count * 8 && result.length < count; attempt += 1) {
      const x = -17 + random() * 34;
      const z = -15 + random() * 29;
      const height = terrainHeight(x, z);
      const slopeX = Math.abs(terrainHeight(x + 0.18, z) - terrainHeight(x - 0.18, z));
      const routeDistance = Math.abs(x - (5.7 - z * 0.12));

      if (height < -0.35 || height > 3.8 || slopeX > 0.58 || routeDistance < 1.15) continue;

      result.push({
        position: new THREE.Vector3(x, height, z),
        rotation: random() * Math.PI,
        scale: 0.58 + random() * 1.05,
      });
    }

    return result;
  }, [compact]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    trees.forEach((tree, index) => {
      dummy.position.copy(tree.position);
      dummy.position.y += 0.48 * tree.scale;
      dummy.rotation.set(0, tree.rotation, 0);
      dummy.scale.set(tree.scale, tree.scale, tree.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <instancedMesh castShadow={!compact} count={trees.length} ref={meshRef}>
      <coneGeometry args={[0.26, 1.05, 7]} />
      <meshStandardMaterial color={palette.trees} roughness={1} />
    </instancedMesh>
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
  const coreGeometry = useMemo(() => new THREE.TubeGeometry(routeCurve, 280, 0.05, 10), []);
  const glowGeometry = useMemo(() => new THREE.TubeGeometry(routeCurve, 280, 0.15, 10), []);
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
              gl_FragColor = vec4(uColor, 0.16 + head * 0.34);
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
  index,
  palette,
  progress,
  reducedMotion,
  routePosition,
}: {
  index: number;
  palette: HeroPalette;
  progress: React.RefObject<number>;
  reducedMotion: boolean;
  routePosition: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => routeCurve.getPointAt(routePosition), [routePosition]);
  const markerTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');

    if (context) {
      context.shadowColor = 'rgba(0, 0, 0, 0.28)';
      context.shadowBlur = 12;
      context.beginPath();
      context.arc(64, 64, 42, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
      context.shadowBlur = 0;
      context.lineWidth = 9;
      context.strokeStyle = palette.route;
      context.stroke();
      context.fillStyle = '#102117';
      context.font = '700 46px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(index + 1), 64, 67);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [index, palette.route]);

  useEffect(() => () => markerTexture.dispose(), [markerTexture]);

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
      <sprite position-y={0.82} renderOrder={6} scale={[1.08, 1.08, 1]}>
        <spriteMaterial
          depthTest={false}
          depthWrite={false}
          fog={false}
          map={markerTexture}
          toneMapped={false}
          transparent
        />
      </sprite>
      <mesh castShadow position-y={0.34} renderOrder={5}>
        <sphereGeometry args={[0.13, 18, 14]} />
        <meshBasicMaterial color={palette.route} depthTest={false} fog={false} toneMapped={false} />
      </mesh>
      <mesh castShadow position-y={0.17}>
        <cylinderGeometry args={[0.03, 0.045, 0.34, 10]} />
        <meshBasicMaterial color={palette.route} depthTest={false} fog={false} toneMapped={false} />
      </mesh>
      <mesh position-y={0.025} ref={haloRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.2, 0.31, 36]} />
        <meshBasicMaterial
          color={palette.route}
          depthTest={false}
          depthWrite={false}
          fog={false}
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
  const cameraEnd = useMemo(
    () => new THREE.Vector3(compact ? 12 : 15.5, compact ? 11 : 12, compact ? 23 : 24),
    [compact],
  );
  const lookAt = useRef(new THREE.Vector3());
  const baseLookAt = useMemo(
    () => new THREE.Vector3(compact ? 4.5 : 4.8, compact ? -0.2 : 0, compact ? -2 : -2.5),
    [compact],
  );
  const desiredCamera = useRef(new THREE.Vector3());
  const desiredLookAt = useRef(new THREE.Vector3());
  const routePoint = useRef(new THREE.Vector3());
  const routeTangent = useRef(new THREE.Vector3());
  const routeSide = useRef(new THREE.Vector3());
  const worldUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.filmOffset = compact ? 0 : -30;
    camera.updateProjectionMatrix();
  }, [compact]);

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

    const rawTravel = THREE.MathUtils.clamp((elapsed - 0.35) / 8.4, 0, 1);
    const easedTravel = rawTravel * rawTravel * (3 - 2 * rawTravel);
    const routeOffsetX = compact ? 1.8 : 0;
    const routeProgress = 0.025 + easedTravel * 0.95;
    const pullback = THREE.MathUtils.smoothstep(rawTravel, 0.78, 1);
    progress.current = easedTravel;

    const filmOffset = compact ? 0 : THREE.MathUtils.lerp(-30, -18, pullback);
    if (Math.abs(camera.filmOffset - filmOffset) > 0.01) {
      camera.filmOffset = filmOffset;
      camera.updateProjectionMatrix();
    }

    routeCurve.getPointAt(routeProgress, routePoint.current);
    routePoint.current.x += routeOffsetX;
    routeCurve.getTangentAt(routeProgress, routeTangent.current).normalize();
    routeSide.current.crossVectors(routeTangent.current, worldUp).normalize();

    desiredCamera.current
      .copy(routePoint.current)
      .addScaledVector(routeTangent.current, compact ? -4.2 : -5.2)
      .addScaledVector(routeSide.current, compact ? 4.8 : 6.5);
    desiredCamera.current.y += compact ? 4.3 : 5.3;

    desiredLookAt.current
      .copy(routePoint.current)
      .addScaledVector(routeTangent.current, compact ? 1.5 : 2.4);
    desiredLookAt.current.y += 0.45;

    desiredCamera.current.lerp(cameraEnd, pullback);
    desiredLookAt.current.lerp(baseLookAt, pullback);

    const idleTime = Math.max(0, elapsed - 8.75);
    desiredCamera.current.x +=
      pointer.current.x * (compact ? 0.28 : 0.58) + Math.sin(idleTime * 0.16) * pullback * 0.24;
    desiredCamera.current.y -= pointer.current.y * (compact ? 0.18 : 0.34);
    desiredCamera.current.z += Math.cos(idleTime * 0.13) * pullback * 0.18;
    desiredLookAt.current.x += pointer.current.x * 0.2;
    desiredLookAt.current.y -= pointer.current.y * 0.12;

    camera.position.lerp(desiredCamera.current, damping);
    lookAt.current.lerp(desiredLookAt.current, damping);
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
        intensity={2.65}
        position={[-8, 14, 10]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <pointLight color={palette.route} distance={15} intensity={18} position={[5, 4, 1]} />
      <Terrain compact={compact} palette={palette} />
      <Trees compact={compact} palette={palette} />
      <group position-x={compact ? 1.8 : 0}>
        <RouteLine palette={palette} progress={progress} />
        {[0.08, 0.3, 0.53, 0.76, 0.96].map((routePosition, index) => (
          <Waypoint
            index={index}
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
      frameloop={props.active ? 'always' : 'never'}
      gl={{ alpha: false, antialias: !props.compact, powerPreference: 'high-performance' }}
      shadows={!props.compact}
    >
      <Scene {...props} palette={palette} />
    </Canvas>
  );
}
