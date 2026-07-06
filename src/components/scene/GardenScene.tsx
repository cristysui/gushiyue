"use client";

import { useRef, useState, useMemo, useCallback, Suspense } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Raycaster, Vector3, Plane, Group, Mesh } from "three";

// ===== 类型定义 =====
interface GardenSceneProps {
  ancient: {
    id: string;
    name: string;
    dynasty: string;
    title: string;
    bio: string;
  } | null;
  onReachAncient: () => void;
  onReachPoetry: () => void;
  onReachJieqi: () => void;
}

// ===== 等距相机参数 =====
const CAMERA_CONFIG = {
  zoom: 55,
  position: [12, 12, 12] as [number, number, number],
};

// ===== 地面点击移动 Hook =====
function useClickToMove(characterRef: React.RefObject<Group | null>) {
  const [target, setTarget] = useState<Vector3 | null>(null);

  const handleGroundClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!characterRef.current) return;
      event.stopPropagation();
      // R3F 已计算好交点，直接用 event.point
      const point = event.point.clone();
      point.y = 0;
      // 限制移动范围
      point.x = Math.max(-8, Math.min(8, point.x));
      point.z = Math.max(-8, Math.min(8, point.z));
      setTarget(point);
    },
    [characterRef]
  );

  return { target, setTarget, handleGroundClick };
}

// ===== 角色移动逻辑 =====
function CharacterController({
  characterRef,
  target,
  onPositionChange,
}: {
  characterRef: React.RefObject<Group | null>;
  target: Vector3 | null;
  onPositionChange?: (pos: Vector3) => void;
}) {
  useFrame(() => {
    if (!characterRef.current || !target) return;
    const pos = characterRef.current.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.05) {
      // 到达
      onPositionChange?.(pos.clone());
      return;
    }
    const speed = 0.08;
    pos.x += (dx / dist) * speed;
    pos.z += (dz / dist) * speed;
    // 朝向目标
    characterRef.current.rotation.y = Math.atan2(dx, dz);
    onPositionChange?.(pos.clone());
  });
  return null;
}

// ===== 小人模型 =====
function CharacterModel({ refProp }: { refProp: React.RefObject<Group | null> }) {
  return (
    <group ref={refProp} position={[0, 0, 0]}>
      {/* 身体 */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.35, 4, 8]} />
        <meshStandardMaterial color="#b8543e" roughness={0.7} />
      </mesh>
      {/* 头 */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#f0e0d0" roughness={0.6} />
      </mesh>
      {/* 帽子 */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <coneGeometry args={[0.18, 0.14, 8]} />
        <meshStandardMaterial color="#3a3028" roughness={0.8} />
      </mesh>
      {/* 影子 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ===== 古人 NPC =====
function AncientNPC({
  position,
  name,
  color = "#8b6f47",
}: {
  position: [number, number, number];
  name: string;
  color?: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) {
      // 轻微浮动
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    }
  });

  return (
    <group position={position} ref={ref}>
      {/* 身体（古袍） */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 0.6, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* 头 */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial color="#e8d0b0" roughness={0.6} />
      </mesh>
      {/* 发髻 */}
      <mesh position={[0, 1.0, -0.03]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>
      {/* 名字标签 */}
      <mesh position={[0, 1.35, 0]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color="#2c2825" transparent opacity={0.7} />
      </mesh>
      {/* 影子 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      {/* 交互光圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.5, 0.6, 24]} />
        <meshBasicMaterial color="#c4a67a" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ===== 建筑：亭子 =====
function Pavilion({ position, rotation = 0, scale = 1 }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* 地基 */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.1, 1.8]} />
        <meshStandardMaterial color="#9b9080" roughness={0.9} />
      </mesh>
      {/* 柱子 */}
      {[[-0.7, 0, -0.7], [0.7, 0, -0.7], [-0.7, 0, 0.7], [0.7, 0, 0.7]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.5, p[2]]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
          <meshStandardMaterial color="#6b5a48" roughness={0.8} />
        </mesh>
      ))}
      {/* 屋顶 */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[1.4, 0.5, 4]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.7} flatShading />
      </mesh>
      {/* 顶尖 */}
      <mesh position={[0, 1.55, 0]}>
        <coneGeometry args={[0.08, 0.2, 4]} />
        <meshStandardMaterial color="#c4a67a" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ===== 建筑：石碑 =====
function StoneTablet({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.35, 0.8, 0.12]} />
        <meshStandardMaterial color="#7a7268" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.25]} />
        <meshStandardMaterial color="#6b635a" roughness={0.95} />
      </mesh>
      {/* 交互光圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.5, 0.6, 24]} />
        <meshBasicMaterial color="#5b7a5e" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ===== 建筑：树 =====
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
        <meshStandardMaterial color="#5a4a38" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#5b7a5e" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.15, 0.95, 0.1]} castShadow>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshStandardMaterial color="#6a8a6e" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// ===== 建筑：灯笼 =====
function Lantern({ position }: { position: [number, number, number] }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.08;
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#d4543e" emissive="#b8543e" emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 4]} />
        <meshBasicMaterial color="#3a3028" />
      </mesh>
    </group>
  );
}

// ===== 交互检测 =====
function InteractionDetector({
  characterRef,
  npcPosition,
  poetryPosition,
  jieqiPosition,
  onReachAncient,
  onReachPoetry,
  onReachJieqi,
}: {
  characterRef: React.RefObject<Group | null>;
  npcPosition: [number, number, number];
  poetryPosition: [number, number, number];
  jieqiPosition: [number, number, number];
  onReachAncient: () => void;
  onReachPoetry: () => void;
  onReachJieqi: () => void;
}) {
  const lastTriggered = useRef<{ ancient: boolean; poetry: boolean; jieqi: boolean }>({
    ancient: false,
    poetry: false,
    jieqi: false,
  });

  useFrame(() => {
    if (!characterRef.current) return;
    const pos = characterRef.current.position;

    const distAncient = Math.hypot(pos.x - npcPosition[0], pos.z - npcPosition[2]);
    const distPoetry = Math.hypot(pos.x - poetryPosition[0], pos.z - poetryPosition[2]);
    const distJieqi = Math.hypot(pos.x - jieqiPosition[0], pos.z - jieqiPosition[2]);

    const nearAncient = distAncient < 1.2;
    const nearPoetry = distPoetry < 1.2;
    const nearJieqi = distJieqi < 1.2;

    if (nearAncient && !lastTriggered.current.ancient) {
      lastTriggered.current.ancient = true;
      onReachAncient();
    } else if (!nearAncient) {
      lastTriggered.current.ancient = false;
    }

    if (nearPoetry && !lastTriggered.current.poetry) {
      lastTriggered.current.poetry = true;
      onReachPoetry();
    } else if (!nearPoetry) {
      lastTriggered.current.poetry = false;
    }

    if (nearJieqi && !lastTriggered.current.jieqi) {
      lastTriggered.current.jieqi = true;
      onReachJieqi();
    } else if (!nearJieqi) {
      lastTriggered.current.jieqi = false;
    }
  });

  return null;
}

// ===== 地面 =====
function Ground({ onClick }: { onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  return (
    <group>
      {/* 主地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={onClick}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#7a6a4e" roughness={0.95} />
      </mesh>
      {/* 庭院石板路 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#8a7a5e" roughness={0.9} />
      </mesh>
      {/* 水池 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.02, -3]}>
        <circleGeometry args={[1.5, 24]} />
        <meshStandardMaterial color="#3a5a6a" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* 石板路径标记 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-3 + i * 1.5, 0.015, 0]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial color="#9b8a6e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ===== 主场景 =====
export default function GardenScene({
  ancient,
  onReachAncient,
  onReachPoetry,
  onReachJieqi,
}: GardenSceneProps) {
  const characterRef = useRef<Group>(null);

  // NPC 位置
  const npcPosition: [number, number, number] = [2, 0, 1];
  const poetryPosition: [number, number, number] = [-3, 0, -2];
  const jieqiPosition: [number, number, number] = [-2, 0, 3];

  const SceneContent = () => {
    const { target, handleGroundClick } = useClickToMove(characterRef);

    return (
      <>
        {/* 环境光 */}
        <ambientLight intensity={0.6} />
        {/* 主光源（太阳） */}
        <directionalLight
          position={[8, 12, 6]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* 暖色补光 */}
        <pointLight position={[-5, 4, -5]} intensity={0.3} color="#c4a67a" />

        {/* 地面 */}
        <Ground onClick={handleGroundClick} />

        {/* 建筑 */}
        <Pavilion position={[0, 0, -4]} scale={1.2} />
        <Pavilion position={[-5, 0, 1]} rotation={Math.PI / 4} scale={0.8} />
        <StoneTablet position={poetryPosition} rotation={0.3} />
        <StoneTablet position={jieqiPosition} rotation={-0.5} />

        {/* 树木 */}
        <Tree position={[-6, 0, -3]} scale={1.3} />
        <Tree position={[5, 0, -4]} scale={1.1} />
        <Tree position={[4, 0, 3]} scale={0.9} />
        <Tree position={[-4, 0, 4]} scale={1.0} />

        {/* 灯笼 */}
        <Lantern position={[-1.5, 1.5, -3]} />
        <Lantern position={[1.5, 1.5, -3]} />

        {/* 角色小人 */}
        <CharacterModel refProp={characterRef} />
        <CharacterController characterRef={characterRef} target={target} />

        {/* 古人 NPC */}
        {ancient && <AncientNPC position={npcPosition} name={ancient.name} />}

        {/* 交互检测 */}
        <InteractionDetector
          characterRef={characterRef}
          npcPosition={npcPosition}
          poetryPosition={poetryPosition}
          jieqiPosition={jieqiPosition}
          onReachAncient={onReachAncient}
          onReachPoetry={onReachPoetry}
          onReachJieqi={onReachJieqi}
        />
      </>
    );
  };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop="always"
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      gl={{ antialias: true, alpha: true }}
    >
      <OrthographicCamera
        makeDefault
        zoom={CAMERA_CONFIG.zoom}
        position={CAMERA_CONFIG.position}
        near={0.1}
        far={100}
      />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
