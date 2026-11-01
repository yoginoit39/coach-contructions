"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Grid } from "@react-three/drei";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import outline from "@/lib/uganda-outline.json";

type Progress = RefObject<number>;
type Mouse = RefObject<{ x: number; y: number }>;

/* ---------- palette (Pool Villa, Wakiso) ---------- */
const WALL = "#cfc7b2";
const STONE = "#6e6b66";
const TILE = "#b4553a";
const TRIM = "#efe9dc";
const GLASS = "#7f9199";
const CONCRETE = "#bdb8ae";
const WATER = "#5aa7c4";
const GREEN = "#9ab53c";
const BG = "#0c1413";
const WHITE_C = new THREE.Color("#ffffff");

/* ---------- finale clock: starts when the build crosses 98%, resets below 94% ---------- */
const finale = { t0: -1, now: 0 };
const finaleTick = (p: number, now: number) => {
  if (p >= 0.98 && finale.t0 < 0) finale.t0 = now;
  if (p < 0.94) finale.t0 = -1;
  finale.now = now;
};
const finaleT = () => (finale.t0 < 0 ? -1 : finale.now - finale.t0);
// blackout 0–0.7s, then windows flick on 0.7–2.6s in order, key light back by 3.2s
const flick = (t: number) => (t < 0 ? 0 : t < 0.18 ? (Math.sin(t * 90) > 0.2 ? 1 : 0.15) : 1);

export const seg = (p: number, a: number, b: number) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- geometry: hip roof, ridge along x ---------- */
function hipRoof(w: number, d: number, h: number, ridge: number) {
  const hw = w / 2,
    hd = d / 2,
    hr = ridge / 2;
  const v = new Float32Array([-hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd, -hr, h, 0, hr, h, 0]);
  const idx = [3, 2, 5, 3, 5, 4, 1, 0, 4, 1, 4, 5, 0, 3, 4, 2, 1, 5, 0, 1, 2, 0, 2, 3];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.setIndex(idx);
  const ng = g.toNonIndexed();
  ng.computeVertexNormals();
  return ng;
}

/* ---------- one piece of the house ---------- */
type PieceProps = {
  progress: Progress;
  index: number;
  at: [number, number, number];
  range: [number, number];
  color?: string;
  children: ReactNode;
  rotY?: number;
  glass?: boolean;
  emissive?: boolean;
  grow?: boolean;
  height?: number;
  flat?: boolean;
  /** 0..1 position in the lights-on sequence (emissive pieces only) */
  litAt?: number;
};

function Piece({ progress, index, at, range, color = WALL, children, rotY = 0, glass, emissive, grow, height = 1, litAt = 0.5 }: PieceProps) {
  const mesh = useRef<THREE.Mesh>(null!);
  const pane = useRef<THREE.MeshBasicMaterial>(null!);
  const edge = useRef<THREE.LineBasicMaterial>(null!);
  const from = useMemo(() => {
    const s = Math.sin(index * 12.9898) * 43758.5453;
    const r = (k: number) => ((((s * (k + 1)) % 1) + 1) % 1);
    return { dx: (r(0) - 0.5) * 16, dy: 5 + r(1) * 8, dz: (r(2) - 0.5) * 16, rx: (r(3) - 0.5) * 1.6, rz: (r(4) - 0.5) * 1.6 };
  }, [index]);
  const base = useMemo(() => new THREE.Color(color), [color]);
  const warm = useMemo(() => new THREE.Color("#ffd9a0"), []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const t = easeInOut(seg(p, range[0], range[1]));
    const m = mesh.current;
    m.visible = t > 0.001;
    if (grow) {
      m.scale.set(1, Math.max(0.001, t), 1);
      m.position.set(at[0], at[1] - height / 2 + (height * t) / 2, at[2]);
      m.rotation.set(0, rotY, 0);
    } else {
      m.position.set(at[0] + from.dx * (1 - t), at[1] + from.dy * (1 - t), at[2] + from.dz * (1 - t));
      m.rotation.set(from.rx * (1 - t), rotY + from.rx * (1 - t) * 0.6, from.rz * (1 - t));
    }
    let lit = 0;
    if (emissive) {
      const ft = finaleT();
      lit = ft < 0 ? 0 : flick(ft - (0.7 + litAt * 1.9));
    }
    // lines: bright white while flying in, settle to the piece colour
    const settle = seg(p, range[1], range[1] + 0.08);
    edge.current.color.copy(base).lerp(WHITE_C, 1 - settle * 0.55);
    if (emissive) edge.current.color.lerp(warm, lit);
    edge.current.opacity = (0.35 + 0.65 * t) * (1 - settle * 0.4);
    if (pane.current) pane.current.opacity = lit * 0.72;
  });

  return (
    <mesh ref={mesh} position={at}>
      {children}
      {glass ? (
        <meshBasicMaterial ref={pane} color="#f1c98a" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      ) : (
        <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
      )}
      <Edges threshold={20}>
        <lineBasicMaterial ref={edge} transparent opacity={0.9} color={color} />
      </Edges>
    </mesh>
  );
}

/* ---------- the villa ---------- */
const W = 10;
const D = 7;
const H = 3;
const SLAB = 0.3;
type P = Omit<PieceProps, "progress" | "index">;

export function Villa({ progress, at = [0, 0, 0], scale = 1, shift = 0 }: { progress: Progress; at?: [number, number, number]; scale?: number; shift?: number }) {
  const roofMain = useMemo(() => hipRoof(W + 1.6, D + 1.6, 2.6, 5.5), []);
  const roofWing = useMemo(() => hipRoof(6.4, 6.4, 1.6, 1.5), []);

  const pieces = useMemo(() => {
    const out: P[] = [];
    const push = (p: P) => out.push(p);
    const g0 = 0.4;
    const g1 = g0 + H + SLAB;

    // foundations
    push({ at: [0, 0.2, 1], range: [0.06, 0.16], color: CONCRETE, children: <boxGeometry args={[W + 6, 0.4, D + 6]} /> });
    push({ at: [3.5, 0.15, 10.5], range: [0.11, 0.2], color: CONCRETE, children: <boxGeometry args={[20, 0.3, 9]} /> });

    // ground floor: one box, five verandah columns, verandah slab
    push({ at: [0, g0 + H / 2, 0], range: [0.2, 0.3], color: WALL, children: <boxGeometry args={[W, H, D]} /> });
    [-5.6, -2.8, 0, 2.8, 5.6].forEach((x, i) =>
      push({ at: [x, g0 + H / 2, 4.8], range: [0.27 + i * 0.012, 0.33 + i * 0.012], color: TRIM, grow: true, height: H, children: <boxGeometry args={[0.36, H, 0.36]} /> }),
    );
    push({ at: [0, g0 + H + SLAB / 2, 1.2], range: [0.34, 0.42], color: CONCRETE, children: <boxGeometry args={[W + 1.8, SLAB, D + 2.4]} /> });

    // garage wing: one box + door
    push({ at: [-9.5, g0 + H / 2, -1], range: [0.3, 0.4], color: WALL, children: <boxGeometry args={[5.6, H, 5.6]} /> });
    push({ at: [-9.5, g0 + 1.4, 1.81], range: [0.36, 0.44], color: "#3b3834", children: <boxGeometry args={[3.6, 2.4, 0.06]} /> });

    // first floor + balcony rail
    push({ at: [0, g1 + H / 2, 0], range: [0.44, 0.54], color: WALL, children: <boxGeometry args={[W, H, D]} /> });
    push({ at: [0, g1 + 0.55, 4.6], range: [0.5, 0.58], color: TRIM, children: <boxGeometry args={[W + 1.6, 0.08, 0.08]} /> });

    // roofs
    push({ at: [0, g1 + H + 0.1, 0], range: [0.6, 0.72], color: TILE, flat: true, children: <primitive object={roofMain} attach="geometry" /> });
    push({ at: [-9.5, g0 + H - 0.1, -1], range: [0.64, 0.74], color: TILE, flat: true, children: <primitive object={roofWing} attach="geometry" /> });

    // glazing: front only
    const win = (x: number, y: number, z: number, w: number, h: number, ry = 0, k = 0) =>
      push({ at: [x, y, z], range: [0.76 + k * 0.006, 0.84 + k * 0.006], color: GLASS, glass: true, emissive: true, rotY: ry, litAt: 0.55 + k * 0.02, children: <boxGeometry args={[w, h, 0.06]} /> });
    win(-3.4, g0 + 1.9, D / 2 + 0.02, 1.6, 1.8, 0, 0);
    win(0, g0 + 1.6, D / 2 + 0.02, 1.8, 2.4, 0, 1);
    win(3.4, g0 + 1.9, D / 2 + 0.02, 1.6, 1.8, 0, 2);
    win(-3.4, g1 + 1.6, D / 2 + 0.02, 1.6, 1.8, 0, 3);
    win(0, g1 + 1.5, D / 2 + 0.02, 2.2, 2.2, 0, 4);
    win(3.4, g1 + 1.6, D / 2 + 0.02, 1.6, 1.8, 0, 5);

    // pool terrace: one amphitheatre ring, pool water comes separately
    push({ at: [-5, 0.3, 10.5], range: [0.8, 0.86], color: CONCRETE, children: <cylinderGeometry args={[5.2, 5.2, 0.3, 14, 1, false, Math.PI / 2, Math.PI]} /> });
    return out;
  }, [roofMain, roofWing]);

  return (
    <group position={at} scale={scale}>
      {pieces.map((p, i) => (
        <Piece key={i} index={i + 300} progress={progress} {...p} range={[p.range[0] + shift, p.range[1] + shift]} />
      ))}
    </group>
  );
}

/* ---------- the skyline: six Coach projects on one plot ---------- */
const BRICKRED = "#8a4a3a";
const RENDER = "#cfc7b2";
const WHITE = "#ece8de";

function City({ progress }: { progress: Progress }) {
  const gable = useMemo(() => hipRoof(3.4, 6.2, 1.4, 3.3), []);
  const pieces = useMemo(() => {
    const out: P[] = [];
    const push = (p: P) => out.push(p);
    const win = (x: number, y: number, z: number, w: number, h: number, ry: number, r0: number) => {
      // split anything wider than 2.6 into panes with a mullion gap, so floors read as windows not slabs
      const cols = Math.max(1, Math.round(w / 2.2));
      const cw = (w - (cols - 1) * 0.35) / cols;
      for (let c = 0; c < cols; c++) {
        const off = -w / 2 + cw / 2 + c * (cw + 0.35);
        const px = ry ? x : x + off;
        const pz = ry ? z + off : z;
        push({ at: [px, y, pz], range: [r0, r0 + 0.06], color: GLASS, glass: true, emissive: true, rotY: ry, litAt: (px + 24) / 48 + ((((y * 7.3 + c) % 1) + 1) % 1) * 0.12, children: <boxGeometry args={[cw, h, 0.06]} /> });
      }
    };


    // Crescent Apartments: 7 stepped floors, left back
    {
      const X = -17, Z = -10, F = 3;
      push({ at: [X, 0.2, Z], range: [0.08, 0.16], color: CONCRETE, children: <boxGeometry args={[13, 0.4, 11]} /> });
      for (let i = 0; i < 7; i++) {
        const r0 = 0.2 + i * 0.055;
        const dx = Math.sin(i * 0.9) * 1.1;
        push({ at: [X + dx, 0.4 + i * F + F / 2 - 0.15, Z], range: [r0, r0 + 0.07], color: WHITE, children: <boxGeometry args={[10, F - 0.3, 8]} /> });
        push({ at: [X + dx, 0.4 + i * F + F - 0.1, Z], range: [r0 + 0.03, r0 + 0.09], color: WHITE, children: <boxGeometry args={[11.4, 0.22, 9.2]} /> });
        win(X + dx, 0.4 + i * F + F / 2 - 0.15, Z + 4.03, 9.2, F - 1, 0, 0.72 + i * 0.012);
        win(X + dx + 5.03, 0.4 + i * F + F / 2 - 0.15, Z, 7.2, F - 1, Math.PI / 2, 0.73 + i * 0.012);
      }
      push({ at: [X, 0.4 + 7 * F + 0.4, Z], range: [0.62, 0.7], color: "#3a3f3e", children: <boxGeometry args={[6, 0.8, 5]} /> });
    }

    // Mukwano offices: brick, 3 floors, right back
    {
      const X = 15, Z = -11, F = 3.4;
      push({ at: [X, 0.2, Z], range: [0.1, 0.18], color: CONCRETE, children: <boxGeometry args={[15, 0.4, 12]} /> });
      for (let i = 0; i < 3; i++) {
        const r0 = 0.24 + i * 0.09;
        push({ at: [X, 0.4 + i * F + F / 2, Z], range: [r0, r0 + 0.08], color: BRICKRED, grow: true, height: F, children: <boxGeometry args={[13, F, 10]} /> });
        push({ at: [X, 0.4 + (i + 1) * F, Z], range: [r0 + 0.04, r0 + 0.1], color: CONCRETE, children: <boxGeometry args={[13.6, 0.25, 10.6]} /> });
        for (let k = 0; k < 4; k++) win(X - 4.5 + k * 3, 0.4 + i * F + F / 2, Z + 5.03, 2.2, 1.8, 0, 0.76 + i * 0.012 + k * 0.004);
      }
      push({ at: [X, 0.4 + F + 0.1, Z + 7.5], range: [0.6, 0.68], color: "#3a3f3e", children: <boxGeometry args={[9, 0.2, 5]} /> });
      push({ at: [X - 3.5, 0.4 + F / 2, Z + 9.5], range: [0.58, 0.64], color: "#3a3f3e", grow: true, height: F, children: <boxGeometry args={[0.2, F, 0.2]} /> });
      push({ at: [X + 3.5, 0.4 + F / 2, Z + 9.5], range: [0.58, 0.64], color: "#3a3f3e", grow: true, height: F, children: <boxGeometry args={[0.2, F, 0.2]} /> });
    }

    // Apartment tower: 7 floors with balconies, centre back
    {
      const X = -2, Z = -17, F = 3;
      push({ at: [X, 0.2, Z], range: [0.09, 0.17], color: CONCRETE, children: <boxGeometry args={[11, 0.4, 11]} /> });
      push({ at: [X, 0.4 + F / 2, Z], range: [0.22, 0.3], color: STONE, grow: true, height: F, children: <boxGeometry args={[9, F, 9]} /> });
      for (let i = 1; i < 7; i++) {
        const r0 = 0.28 + i * 0.065;
        push({ at: [X, 0.4 + i * F + F / 2, Z], range: [r0, r0 + 0.07], color: RENDER, grow: true, height: F, children: <boxGeometry args={[9, F, 9]} /> });
        push({ at: [X, 0.4 + i * F + 0.1, Z + 5], range: [r0 + 0.03, r0 + 0.09], color: WHITE, children: <boxGeometry args={[9.6, 0.2, 1.6]} /> });
        win(X, 0.4 + i * F + F / 2, Z + 4.53, 7.5, F - 1, 0, 0.78 + i * 0.01);
      }
      push({ at: [X, 0.4 + 7 * F + 0.15, Z], range: [0.74, 0.8], color: WHITE, children: <boxGeometry args={[10, 0.3, 10]} /> });
    }

    // KURB food court: long shop row with canopy and sign, right front
    {
      const X = 17, Z = 9;
      push({ at: [X, 0.2, Z], range: [0.12, 0.2], color: CONCRETE, children: <boxGeometry args={[20, 0.4, 9]} /> });
      push({ at: [X, 0.4 + 1.8, Z], range: [0.34, 0.44], color: "#2b2b2a", grow: true, height: 3.6, children: <boxGeometry args={[18, 3.6, 6]} /> });
      push({ at: [X, 0.4 + 3.75, Z + 1.5], range: [0.46, 0.54], color: "#3a3f3e", children: <boxGeometry args={[19, 0.3, 10]} /> });
      push({ at: [X, 0.4 + 4.6, Z - 1], range: [0.56, 0.62], color: WHITE, children: <boxGeometry args={[8, 1.4, 0.3]} /> });
      for (let k = 0; k < 6; k++) win(X - 7.5 + k * 3, 0.4 + 1.7, Z + 3.03, 2.4, 2.6, 0, 0.8 + k * 0.006);
    }

    // Townhouses: four gabled units, left front
    {
      const Z = 10;
      for (let k = 0; k < 4; k++) {
        const X = -21 + k * 3.6;
        const r0 = 0.3 + k * 0.05;
        push({ at: [X, 0.2, Z], range: [0.11 + k * 0.01, 0.19 + k * 0.01], color: CONCRETE, children: <boxGeometry args={[3.5, 0.4, 7]} /> });
        push({ at: [X, 0.4 + 2.6, Z], range: [r0, r0 + 0.08], color: k % 2 ? RENDER : BRICKRED, grow: true, height: 5.2, children: <boxGeometry args={[3.3, 5.2, 6.2]} /> });
        push({ at: [X, 0.4 + 5.2, Z], range: [r0 + 0.3, r0 + 0.37], color: TILE, flat: true, children: <primitive object={gable} attach="geometry" /> });
        win(X, 0.4 + 1.5, Z + 3.13, 1.4, 2.2, 0, 0.82 + k * 0.006);
        win(X, 0.4 + 4, Z + 3.13, 1.8, 1.4, 0, 0.83 + k * 0.006);
      }
    }
    return out;
  }, [gable]);

  return (
    <group>
      <Roads progress={progress} />
      {pieces.map((p, i) => (
        <Piece key={i} index={i} progress={progress} {...p} />
      ))}
    </group>
  );
}

/* roads: faint flat strips that fade in with the survey, no edges */
function Roads({ progress }: { progress: Progress }) {
  const a = useRef<THREE.MeshBasicMaterial>(null!);
  const b = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    const p = progress.current ?? 0;
    const t = seg(p, 0.05, 0.14);
    a.current.opacity = t * 0.9;
    b.current.opacity = t * 0.9;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2]}>
        <planeGeometry args={[64, 3]} />
        <meshBasicMaterial ref={a} color="#1c2423" transparent opacity={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, 0.02, -2]}>
        <planeGeometry args={[3, 44]} />
        <meshBasicMaterial ref={b} color="#1c2423" transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ---------- Uganda in bricks: the map lies on the plot, Kampala pinned, then scatters into the build ---------- */
const BRICK = 0.62;
const MAP_W = 24; // world units across the country
const KAMPALA: [number, number] = [32.5825, 0.3476];
const LAKE: [number, number][] = [
  [31.72, 0.23], [32.0, 0.4], [32.45, 0.38], [32.62, 0.22], [32.9, 0.3], [33.2, 0.2], [33.4, 0.0], [33.5, -0.5], [33.3, -1.0], [32.6, -1.3], [31.9, -1.1], [31.6, -0.6], [31.6, -0.2],
];
const pointIn = (x: number, y: number, poly: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

function Letters({ progress, mouse }: { progress: Progress; mouse: Mouse }) {
  const inst = useRef<THREE.InstancedMesh>(null!);
  const water = useRef<THREE.InstancedMesh>(null!);
  const group = useRef<THREE.Group>(null!);
  const pin = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const poly = outline as [number, number][];
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const k = MAP_W / (maxX - minX);
    const toW = (lon: number, lat: number): [number, number] => [(lon - (minX + maxX) / 2) * k, -(lat - (minY + maxY) / 2) * k];
    const land: { x: number; z: number; sx: number; sy: number; sz: number; d: number }[] = [];
    const lake: { x: number; z: number }[] = [];
    const step = BRICK * 1.02;
    let i = 0;
    for (let lon = minX; lon <= maxX; lon += step / k)
      for (let lat = minY; lat <= maxY; lat += step / k) {
        if (!pointIn(lon, lat, poly)) continue;
        const [x, z] = toW(lon, lat);
        if (pointIn(lon, lat, LAKE)) {
          lake.push({ x, z });
          continue;
        }
        const s = Math.sin(i * 7.31) * 1000;
        const rnd = (q: number) => (((s * (q + 1)) % 1) + 1) % 1;
        // bricks near Kampala leave first: the city rises from the capital
        const [kx, kz] = toW(KAMPALA[0], KAMPALA[1]);
        const dist = Math.hypot(x - kx, z - kz) / (MAP_W * 0.6);
        land.push({ x, z, sx: (rnd(0) - 0.5) * 36, sy: 8 + rnd(1) * 18, sz: (rnd(2) - 0.5) * 36, d: THREE.MathUtils.clamp(dist * 0.8 + rnd(3) * 0.2, 0, 1) });
        i++;
      }
    const border = poly.map(([lon, lat]) => {
      const [x, z] = toW(lon, lat);
      return new THREE.Vector3(x, 0.08, z);
    });
    border.push(border[0].clone());
    const kam = toW(KAMPALA[0], KAMPALA[1]);
    return { land, lake, border: new THREE.BufferGeometry().setFromPoints(border), kam };
  }, []);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const mx = mouse.current?.x ?? 0, my = mouse.current?.y ?? 0;
    // camera opens at angle -2.2 rad; rotate the map to match so north is straight up on screen
    group.current.rotation.y = -2.2 + mx * 0.12;
    group.current.rotation.x = my * 0.04;
    const tAll = seg(p, 0.02, 0.16);
    const breathe = Math.sin(clock.elapsedTime * 0.8) * 0.03;
    data.land.forEach((c, i) => {
      const t = easeInOut(seg(tAll, c.d * 0.55, c.d * 0.55 + 0.45));
      const lift = (1 - t) * Math.sin(clock.elapsedTime * 1.4 + c.x * 0.3 + c.z * 0.2) * 0.05;
      dummy.position.set(c.x + c.sx * t, BRICK / 2 + breathe + lift + c.sy * t, c.z + c.sz * t);
      dummy.rotation.set(t * 2.5 * (c.d - 0.5), t * 3 * c.d, t * 1.5);
      dummy.scale.setScalar(Math.max(0.0001, (1 - t) * BRICK * 0.94));
      dummy.updateMatrix();
      inst.current.setMatrixAt(i, dummy.matrix);
    });
    inst.current.instanceMatrix.needsUpdate = true;
    const wt = 1 - easeInOut(seg(tAll, 0.3, 0.8));
    data.lake.forEach((c, i) => {
      dummy.position.set(c.x, 0.12 + Math.sin(clock.elapsedTime * 1.2 + c.x * 0.5) * 0.03, c.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(BRICK * 0.98 * wt, 0.12 * wt, BRICK * 0.98 * wt);
      dummy.updateMatrix();
      water.current.setMatrixAt(i, dummy.matrix);
    });
    water.current.instanceMatrix.needsUpdate = true;
    // pin pulses, then lifts off with the bricks
    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    pin.current.scale.setScalar(pulse * (1 - easeInOut(seg(tAll, 0, 0.3))));
    const r = (clock.elapsedTime * 0.7) % 1;
    ring.current.scale.setScalar(1 + r * 4);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - r) * 0.6 * (1 - seg(tAll, 0, 0.25));
    group.current.visible = tAll < 0.999;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <instancedMesh ref={inst} args={[undefined, undefined, data.land.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={TILE} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={water} args={[undefined, undefined, Math.max(1, data.lake.length)]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={WATER} roughness={0.2} metalness={0.3} />
      </instancedMesh>
      <primitive object={new THREE.Line(data.border, new THREE.LineBasicMaterial({ color: GREEN }))} />
      <group ref={pin} position={[data.kam[0], BRICK + 0.2, data.kam[1]]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
          <meshBasicMaterial color={GREEN} />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshBasicMaterial color={GREEN} />
        </mesh>
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color={GREEN} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- tower crane (the Coach logo is a crane) ---------- */
function Crane({ progress, at = [13, 0, -9], phase = 0, rise = 0.05 }: { progress: Progress; at?: [number, number, number]; phase?: number; rise?: number }) {
  const mast = useRef<THREE.Group>(null!);
  const top = useRef<THREE.Group>(null!);
  const hook = useRef<THREE.Group>(null!);
  const MAST = 10.5;
  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const up = easeOut(seg(p, rise, rise + 0.11));
    mast.current.scale.set(1, Math.max(0.001, up), 1);
    mast.current.visible = up > 0.001;
    top.current.visible = up > 0.98;
    // slew across the site while the walls go up, settle at the end
    const slew = seg(p, 0.16, 0.9);
    top.current.rotation.y = phase - 0.6 + slew * Math.PI * 1.2 + Math.sin(clock.elapsedTime * 0.4 + phase) * 0.02;
    // hook rides out along the jib and lowers with each lift
    const trolley = 6 + Math.sin(slew * Math.PI * 4) * 4;
    const drop = 3 + (0.5 + 0.5 * Math.sin(slew * Math.PI * 8)) * 8;
    hook.current.position.set(trolley, -drop, 0);
    const cable = hook.current.children[0] as THREE.Mesh;
    cable.scale.y = drop;
    cable.position.y = drop / 2;
    const lamp = hook.current.children[2] as THREE.Mesh;
    const ft = finaleT();
    const on = ft > 0.3 && Math.sin(clock.elapsedTime * 9 + phase) > 0.3;
    (lamp.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0.08;
    lamp.scale.setScalar(on ? 1.6 : 1);
  });
  return (
    <group position={at}>
      <group ref={mast}>
        <mesh position={[0, MAST / 2, 0]}>
          <boxGeometry args={[0.7, MAST, 0.7]} />
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
          <Edges threshold={20} color={GREEN} />
        </mesh>
      </group>
      <group ref={top} position={[0, MAST, 0]}>
        {/* cab */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.3, 1.4, 1.3]} />
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
          <Edges threshold={20} color={GREEN} />
        </mesh>
        {/* jib */}
        <mesh position={[7, 1.5, 0]}>
          <boxGeometry args={[14, 0.5, 0.5]} />
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
          <Edges threshold={20} color={GREEN} />
        </mesh>
        {/* counter-jib + ballast */}
        <mesh position={[-3, 1.5, 0]}>
          <boxGeometry args={[5, 0.5, 0.5]} />
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
          <Edges threshold={20} color={GREEN} />
        </mesh>
        <mesh position={[-5, 0.9, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.4]} />
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
          <Edges threshold={20} color={GREEN} />
        </mesh>
        {/* apex + tie lines */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[0.3, 3, 0.3]} />
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
          <Edges threshold={20} color={GREEN} />
        </mesh>
        <mesh position={[7, 3.1, 0]} rotation={[0, 0, Math.atan2(3.2, 14)]}>
          <boxGeometry args={[14.4, 0.04, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-2.6, 3.1, 0]} rotation={[0, 0, -Math.atan2(3.2, 5.2)]}>
          <boxGeometry args={[6, 0.04, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* trolley + cable + hook */}
        <group ref={hook} position={[6, -3, 0]}>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.04, 1, 0.04]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.5, 0.6, 0.5]} />
            <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={0} polygonOffsetUnits={3} />
            <Edges threshold={20} color={GREEN} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshBasicMaterial color="#ff5a3c" transparent opacity={0.08} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ---------- pool water: rises and reflects ---------- */
function Water({ progress }: { progress: Progress }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const p = progress.current ?? 0;
    const t = easeOut(seg(p, 0.88, 0.97));
    mesh.current.visible = t > 0.01;
    mesh.current.position.y = 0.05 + t * 0.28;
    (mesh.current.material as THREE.Material).opacity = t * 0.55;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[3.75, 0.1, 11.25]}>
      <planeGeometry args={[4.3, 2.6]} />
      <meshBasicMaterial color={WATER} transparent opacity={0} />
    </mesh>
  );
}

/* ---------- scan line that sweeps up with the build ---------- */
function Scan({ progress }: { progress: Progress }) {
  const g = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const line = useRef<THREE.LineBasicMaterial>(null!);
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(60, 50)), []);
  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    g.current.position.y = 0.1 + seg(p, 0.1, 0.84) * 23;
    const fade = seg(p, 0.08, 0.14) * (1 - seg(p, 0.84, 0.9));
    mat.current.opacity = fade * (0.05 + 0.02 * Math.sin(clock.elapsedTime * 6));
    line.current.opacity = fade * 0.7;
  });
  return (
    <group ref={g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 50]} />
        <meshBasicMaterial ref={mat} color={GREEN} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments rotation={[-Math.PI / 2, 0, 0]} geometry={frame}>
        <lineBasicMaterial ref={line} color={GREEN} transparent opacity={0} />
      </lineSegments>
    </group>
  );
}

/* ---------- survey pegs ---------- */
function Pegs({ progress }: { progress: Progress }) {
  const group = useRef<THREE.Group>(null!);
  const pts = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) out.push([x * 22, z * 14 - 2]);
    return out;
  }, []);
  useFrame(() => {
    const p = progress.current ?? 0;
    const t = easeOut(seg(p, 0, 0.08)) * (1 - seg(p, 0.5, 0.65));
    group.current.scale.setScalar(Math.max(0.001, t));
  });
  return (
    <group ref={group}>
      {pts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
          <meshBasicMaterial color={GREEN} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- dust ---------- */
function Dust({ progress, count = 900 }: { progress: Progress; count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const mat = useRef<THREE.PointsMaterial>(null!);
  const geo = useMemo(() => {
    const n = count;
    const a = new Float32Array(n * 3);
    // deterministic hash so the memo stays pure
    const rnd = (k: number) => ((Math.sin(k * 12.9898 + 78.233) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < n; i++) {
      a[i * 3] = (rnd(i * 3) - 0.5) * 34;
      a[i * 3 + 1] = rnd(i * 3 + 1) * 12;
      a[i * 3 + 2] = (rnd(i * 3 + 2) - 0.5) * 34;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    ref.current.rotation.y = clock.elapsedTime * 0.02;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.3;
    mat.current.opacity = 0.1 + 0.5 * seg(p, 0.1, 0.4) * (1 - 0.6 * seg(p, 0.85, 1));
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial ref={mat} size={0.045} color="#ffffff" transparent opacity={0} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------- camera ---------- */
function KeyLight() {
  const ref = useRef<THREE.DirectionalLight>(null!);
  const amb = useRef<THREE.AmbientLight>(null!);
  useFrame(() => {
    const ft = finaleT();
    // cut the lights, hold dark while the windows come on, ease back to a night level
    const k = ft < 0 ? 1 : ft < 0.5 ? 1 - ft * 1.7 : ft < 2.4 ? 0.15 : Math.min(0.55, 0.15 + (ft - 2.4) * 0.5);
    ref.current.intensity = 2.2 * k;
    amb.current.intensity = 0.5 * (ft < 0 ? 1 : Math.max(0.35, k));
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.5} />
      <directionalLight
        ref={ref}
        position={[10, 16, 8]}
        intensity={2.2}
        color="#fff3e0"
      />
    </>
  );
}

function Rig({ progress, mouse }: { progress: Progress; mouse: Mouse }) {
  const { camera, size } = useThree();
  const fog = useRef<THREE.Fog>(null!);
  const smooth = useRef(0);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    finaleTick(p, clock.elapsedTime);
    const ft = finaleT();
    const dolly = ft < 0 ? 0 : easeInOut(THREE.MathUtils.clamp(ft / 4, 0, 1));
    smooth.current += (p - smooth.current) * 0.07;
    const s = smooth.current;
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;
    // tight on the brick letters, then pull back so the crane and the whole villa stay in frame
    const far = easeInOut(seg(s, 0.08, 0.3));
    const a = -2.2 + s * 2.4 + mx * 0.22;
    const mapTilt = 1 - far; // 1 while the map is on screen
    // portrait phones: back off so the same width fits a narrow frame, and lift the subject above the HUD copy
    const aspect = size.width / Math.max(1, size.height);
    // letters phase needs less back-off than the full site
    const portraitRaw = THREE.MathUtils.clamp(1.3 / aspect, 1, 2.8);
    const portrait = 1 + (portraitRaw - 1) * (0.55 + 0.45 * far);
    const r = (36 + mapTilt * 14 + far * 47 - s * 8) * portrait * (1 - dolly * 0.05);
    const h = (10 + mapTilt * 18 + far * 26 + Math.sin(s * Math.PI) * 3 - s * 7) * (1 + (portrait - 1) * 0.5) * (1 - dolly * 0.08) + my * -1.4;
    camera.position.set(Math.sin(a) * r, h, Math.cos(a) * r + 3);
    const shiftX = portraitRaw > 1.05 ? 0 : -2.5 * far; // landscape: slide the city right so the stage copy sits clear of it
    target.set(shiftX, 4.6 + far * 5 - s * 2 - (portrait - 1) * 1.6, -2 + s * 2);
    // keep the fog the same distance behind the subject whatever the frame shape
    fog.current.near = (40 + far * 30) * portrait;
    fog.current.far = (95 + far * 40) * portrait;
    camera.lookAt(target);
  });
  return <fog ref={fog} attach="fog" args={[BG, 34, 80]} />;
}

export default function Scene({ progress, mouse, lite = false, active = true }: { progress: Progress; mouse: Mouse; lite?: boolean; active?: boolean }) {
  return (
    <Canvas
      dpr={lite ? 1 : [1, 1.25]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 34, near: 0.1, far: 260, position: [0, 7, 26] }}
      gl={{ antialias: !lite, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[BG]} />
      <KeyLight />
      <directionalLight position={[-12, 8, -8]} intensity={0.5} color="#b9c6ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial color="#0a1211" />
      </mesh>
      <Grid args={[80, 80]} cellSize={1} cellThickness={0.5} cellColor="#1a2726" sectionSize={5} sectionThickness={1} sectionColor="#2b3d3a" fadeDistance={50} fadeStrength={1.4} position={[0, 0, 0]} />
      <Pegs progress={progress} />
      <Letters progress={progress} mouse={mouse} />
      <Crane progress={progress} at={[-8, 0, -4]} phase={0} rise={0.05} />
      <Crane progress={progress} at={[9, 0, -3]} phase={2.2} rise={0.1} />
      <City progress={progress} />
      <Villa progress={progress} at={[2, 0, 6]} scale={0.5} shift={0.06} />
      <Water progress={progress} />
      <Scan progress={progress} />
      <Dust progress={progress} count={lite ? 350 : 900} />
      <Rig progress={progress} mouse={mouse} />
    </Canvas>
  );
}
