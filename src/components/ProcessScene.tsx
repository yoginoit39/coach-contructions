"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Villa } from "./Scene";

type Progress = RefObject<number>;

function Rig({ progress }: { progress: Progress }) {
  const { camera, size } = useThree();
  const smooth = useRef(0);
  const target = useMemo(() => new THREE.Vector3(-1, 3.2, 4), []);
  useFrame(() => {
    const p = progress.current ?? 0;
    smooth.current += (p - smooth.current) * 0.08;
    const s = smooth.current;
    const portrait = THREE.MathUtils.clamp(1.1 / (size.width / Math.max(1, size.height)), 1, 2.2);
    const a = -2.4 + s * 1.6;
    const r = 52 * portrait;
    camera.position.set(Math.sin(a) * r, 16 + s * 6, Math.cos(a) * r + 4);
    camera.lookAt(target);
  });
  return null;
}

/** Small wireframe villa that builds as the programme steps scroll past. */
export default function ProcessScene({ progress, active }: { progress: Progress; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.25]} frameloop={active ? "always" : "never"} camera={{ fov: 26, near: 0.1, far: 160, position: [0, 12, 44] }} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}>
      <ambientLight intensity={0.6} />
      <Grid args={[60, 60]} cellSize={1} cellThickness={0.5} cellColor="#1a2726" sectionSize={5} sectionThickness={1} sectionColor="#2b3d3a" fadeDistance={36} fadeStrength={1.6} position={[0, 0, 0]} />
      <Villa progress={progress} at={[0, 0, 0]} scale={0.9} />
      <Rig progress={progress} />
    </Canvas>
  );
}
