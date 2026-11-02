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
    edge.current.opacity = (0.35 + 0.65 * t) * (1 - settle * 0.55);
    if (pane.current) pane.current.opacity = lit * 0.3;
  });

  return (
    <mesh ref={mesh} position={at}>
      {children}
      {glass ? (
        <meshBasicMaterial ref={pane} color="#ffb866" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
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

/* ---------- roads: faint flat strips that fade in with the survey ---------- */
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

/* ---------- Uganda in bricks → the skyline in the same bricks ----------
 * One InstancedMesh. Every brick has a tile on the map and a slot in a
 * building. Scroll lerps each brick from the one to the other, course by
 * course, nearest-Kampala tiles leaving first. */
const MAPB = 0.42; // map tile size
const MAP_W = 24; // world units across the country
const MAP_ROT = -2.2; // the map faces the opening camera angle so north is up on screen
const BW = 1.0, BH = 0.5, BD = 0.5; // building brick
const FLY = 0.07; // progress a brick spends in the air
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
const hash = (k: number) => ((Math.sin(k * 12.9898 + 78.233) * 43758.5453) % 1 + 1) % 1;

type Cell = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; t: number; c: THREE.Color };
type Pane = { x: number; y: number; z: number; ry: number; litAt: number };

/** Lay out every building as brick cells + window panes. */
function layout() {
  const cells: Cell[] = [];
  const panes: Pane[] = [];
  const brick = new THREE.Color(TILE);
  const slabC = new THREE.Color("#746f67");
  let n = 0;
  const colour = (k: number) => brick.clone().offsetHSL(0, (hash(k) - 0.5) * 0.08, (hash(k + 1) - 0.5) * 0.1);

  // one straight wall: bricks along (x0,z0)→(x1,z1), `courses` high from y0
  const wall = (x0: number, z0: number, x1: number, z1: number, y0: number, courses: number, t0: number, dt: number, F: number, windows: boolean) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const k = Math.max(1, Math.round(L / BW));
    const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
    const ry = Math.atan2(ux, uz) - Math.PI / 2;
    for (let c = 0; c < courses; c++) {
      const fc = c % F;
      const winCourse = windows && fc >= 1 && fc <= 2;
      const stag = winCourse ? 0 : (c % 2) * 0.5;
      for (let i = 0; i < k; i++) {
        const a = ((i + 0.5 + stag) / k) * L;
        if (a > L) continue;
        const isWin = winCourse && i % 2 === 1 && i > 0 && i < k - 1;
        const x = x0 + ux * a, z = z0 + uz * a, y = y0 + c * BH + BH / 2;
        if (isWin) {
          if (fc === 1) panes.push({ x, y: y + BH / 2, z, ry, litAt: THREE.MathUtils.clamp((x + 24) / 48 + hash(n * 3) * 0.14, 0, 1) });
          continue;
        }
        // courses go up in order; bricks along a course arrive left→right with a little jitter
        cells.push({ x, y, z, sx: BW, sy: BH, sz: BD, ry, t: t0 + c * dt + (i / k) * dt * 0.8 + hash(n * 7) * dt * 0.4, c: colour(n) });
        n++;
      }
    }
  };

  // hollow box: four walls, optional slab on top
  const box = (cx: number, cz: number, w: number, d: number, y0: number, courses: number, t0: number, dt: number, F: number, windows: boolean) => {
    const hw = w / 2, hd = d / 2;
    wall(cx - hw, cz + hd, cx + hw, cz + hd, y0, courses, t0, dt, F, windows); // front
    wall(cx + hw, cz - hd, cx - hw, cz - hd, y0, courses, t0, dt, F, false); // back
    wall(cx + hw - BD, cz + hd - BD, cx + hw - BD, cz - hd + BD, y0, courses, t0, dt, F, windows); // right
    wall(cx - hw + BD, cz - hd + BD, cx - hw + BD, cz + hd - BD, y0, courses, t0, dt, F, false); // left
  };
  const slab = (cx: number, y: number, cz: number, w: number, d: number, t: number) => {
    cells.push({ x: cx, y, z: cz, sx: w, sy: 0.16, sz: d, ry: 0, t, c: slabC });
    n++;
  };

  // Crescent Apartments: 7 stepped floors, left back
  {
    const X = -17, Z = -10, F = 4;
    slab(X, 0.1, Z, 12, 10, 0.1);
    for (let f = 0; f < 7; f++) {
      const dx = Math.sin(f * 0.9) * 1.1;
      const t0 = 0.16 + f * 0.085;
      box(X + dx, Z, 10, 8, 0.2 + f * F * BH, F, t0, 0.018, F, true);
      slab(X + dx, 0.2 + (f + 1) * F * BH + 0.1, Z, 11, 9, t0 + 0.085);
    }
  }
  // Apartment tower: 7 floors, centre back
  {
    const X = -2, Z = -17, F = 4;
    slab(X, 0.1, Z, 11, 11, 0.11);
    for (let f = 0; f < 7; f++) {
      const t0 = 0.2 + f * 0.085;
      box(X, Z, 9, 9, 0.2 + f * F * BH, F, t0, 0.018, F, true);
      slab(X, 0.2 + (f + 1) * F * BH + 0.1, Z + 0.4, 9.8, 10.6, t0 + 0.085);
    }
  }
  // Mukwano offices: 3 tall floors, right back
  {
    const X = 15, Z = -11, F = 5;
    slab(X, 0.1, Z, 15, 12, 0.12);
    for (let f = 0; f < 3; f++) {
      const t0 = 0.26 + f * 0.13;
      box(X, Z, 13, 10, 0.2 + f * F * BH, F, t0, 0.024, F, true);
      slab(X, 0.2 + (f + 1) * F * BH + 0.1, Z, 13.8, 10.8, t0 + 0.13);
    }
  }
  // KURB food court: long low shop row with a canopy, right front
  {
    const X = 17, Z = 9, F = 6;
    slab(X, 0.1, Z, 20, 9, 0.13);
    box(X, Z, 18, 6, 0.2, F, 0.36, 0.03, F, true);
    slab(X, 0.2 + F * BH + 0.1, Z + 1.5, 19, 10, 0.56);
  }
  // Townhouses: four units, left front
  for (let k = 0; k < 4; k++) {
    const X = -21 + k * 3.6, Z = 10, F = 4;
    slab(X, 0.1, Z, 3.6, 7, 0.14 + k * 0.01);
    for (let f = 0; f < 2; f++) {
      const t0 = 0.4 + k * 0.03 + f * 0.09;
      box(X, Z, 3.4, 6.4, 0.2 + f * F * BH, F, t0, 0.02, F, true);
    }
    slab(X, 0.2 + 2 * F * BH + 0.1, Z, 3.8, 6.8, 0.62 + k * 0.03);
  }
  // Pool Villa: house + garage wing, front centre; the pool comes separately
  {
    const X = 1, Z = 5, F = 4;
    slab(X, 0.1, Z, 9, 7, 0.15);
    for (let f = 0; f < 2; f++) {
      const t0 = 0.5 + f * 0.1;
      box(X, Z, 7, 5, 0.2 + f * F * BH, F, t0, 0.022, F, true);
      slab(X, 0.2 + (f + 1) * F * BH + 0.1, Z + 0.6, 8.2, 6.6, t0 + 0.1);
    }
    box(X - 5, Z + 0.5, 3, 4, 0.2, F, 0.58, 0.024, F, false);
    slab(X - 5, 0.2 + F * BH + 0.1, Z + 0.5, 3.6, 4.6, 0.7);
  }
  cells.sort((a, b) => a.t - b.t);
  return { cells, panes };
}

function Bricks({ progress }: { progress: Progress }) {
  const inst = useRef<THREE.InstancedMesh>(null!);
  const glass = useRef<THREE.InstancedMesh>(null!);
  const water = useRef<THREE.InstancedMesh>(null!);
  const pin = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const borderMat = useRef<THREE.LineBasicMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpC = useMemo(() => new THREE.Color(), []);
  const warm = useMemo(() => new THREE.Color("#ffb866"), []);
  const last = useRef(-1);
  const litLast = useRef(-2);

  const data = useMemo(() => {
    const poly = outline as [number, number][];
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const k = MAP_W / (maxX - minX);
    const cos = Math.cos(MAP_ROT), sin = Math.sin(MAP_ROT);
    // map coords, rotated into world so the country reads north-up from the opening camera
    const toW = (lon: number, lat: number): [number, number] => {
      const x = (lon - (minX + maxX) / 2) * k, z = -(lat - (minY + maxY) / 2) * k;
      return [x * cos + z * sin, -x * sin + z * cos];
    };
    const [kx, kz] = toW(KAMPALA[0], KAMPALA[1]);
    const tiles: { x: number; z: number; d: number }[] = [];
    const lake: { x: number; z: number }[] = [];
    const step = MAPB * 1.04;
    let i = 0;
    for (let lon = minX; lon <= maxX; lon += step / k)
      for (let lat = minY; lat <= maxY; lat += step / k) {
        if (!pointIn(lon, lat, poly)) continue;
        const [x, z] = toW(lon, lat);
        if (pointIn(lon, lat, LAKE)) {
          lake.push({ x, z });
          continue;
        }
        tiles.push({ x, z, d: Math.hypot(x - kx, z - kz) + hash(i++) * 2.5 });
      }
    tiles.sort((a, b) => a.d - b.d);
    const { cells, panes } = layout();
    // more bricks than tiles: the tiles nearest Kampala stack a second layer, top brick leaves first
    const extra = Math.max(0, cells.length - tiles.length);
    const slots: { x: number; y: number; z: number }[] = [];
    tiles.forEach((t, j) => {
      if (j < extra) slots.push({ x: t.x, y: MAPB * 1.5, z: t.z });
      slots.push({ x: t.x, y: MAPB / 2, z: t.z });
    });
    const bricks = cells.map((c, j) => {
      const s = slots[j % slots.length];
      return { ...c, mx: s.x, my: s.y, mz: s.z, arc: 5 + hash(j * 5) * 7, spin: (hash(j * 11) - 0.5) * 6 };
    });
    const border = poly.map(([lon, lat]) => {
      const [x, z] = toW(lon, lat);
      return new THREE.Vector3(x, 0.08, z);
    });
    border.push(border[0].clone());
    return { bricks, panes, lake, border: new THREE.BufferGeometry().setFromPoints(border), kam: [kx, kz] as [number, number] };
  }, []);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const tAll = seg(p, 0.02, 0.2);
    // bricks: only re-pack the matrices while something is actually moving
    if (Math.abs(p - last.current) > 1e-5) {
      last.current = p;
      data.bricks.forEach((b, i) => {
        const f = easeInOut(seg(p, b.t, b.t + FLY));
        const air = Math.sin(f * Math.PI);
        dummy.position.set(THREE.MathUtils.lerp(b.mx, b.x, f), THREE.MathUtils.lerp(b.my, b.y, f) + air * b.arc, THREE.MathUtils.lerp(b.mz, b.z, f));
        dummy.rotation.set(air * b.spin * 0.5, b.ry * f + air * b.spin, air * b.spin * 0.3);
        dummy.scale.set(THREE.MathUtils.lerp(MAPB * 0.94, b.sx * 0.96, f), THREE.MathUtils.lerp(MAPB * 0.94, b.sy * 0.92, f), THREE.MathUtils.lerp(MAPB * 0.94, b.sz * 0.96, f));
        dummy.updateMatrix();
        inst.current.setMatrixAt(i, dummy.matrix);
      });
      inst.current.instanceMatrix.needsUpdate = true;
    }
    // panes: black (invisible, additive) until the lights-on finale
    const ft = finaleT();
    if (ft !== litLast.current) {
      litLast.current = ft;
      data.panes.forEach((w, i) => {
        const lit = ft < 0 ? 0 : flick(ft - (0.7 + w.litAt * 1.9));
        glass.current.setColorAt(i, tmpC.copy(warm).multiplyScalar(lit * 0.6));
      });
      if (glass.current.instanceColor) glass.current.instanceColor.needsUpdate = true;
    }
    // lake drains, border and pin fade as the bricks leave
    const wt = 1 - easeInOut(seg(tAll, 0.25, 0.75));
    data.lake.forEach((c, i) => {
      dummy.position.set(c.x, 0.1 + Math.sin(clock.elapsedTime * 1.2 + c.x * 0.5) * 0.03, c.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(MAPB * 0.98 * wt, 0.1 * wt, MAPB * 0.98 * wt);
      dummy.updateMatrix();
      water.current.setMatrixAt(i, dummy.matrix);
    });
    water.current.instanceMatrix.needsUpdate = true;
    water.current.visible = wt > 0.001;
    borderMat.current.opacity = 1 - easeInOut(seg(tAll, 0.4, 0.9));
    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    pin.current.scale.setScalar(pulse * (1 - easeInOut(seg(tAll, 0, 0.3))));
    const r = (clock.elapsedTime * 0.7) % 1;
    ring.current.scale.setScalar(1 + r * 4);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - r) * 0.6 * (1 - seg(tAll, 0, 0.25));
  });

  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, data.bricks.length]} onUpdate={(m) => data.bricks.forEach((b, i) => m.setColorAt(i, b.c))}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={glass} args={[undefined, undefined, Math.max(1, data.panes.length)]} onUpdate={(m) => { data.panes.forEach((w, i) => { dummy.position.set(w.x, w.y, w.z); dummy.rotation.set(0, w.ry, 0); dummy.scale.set(BW * 0.9, BH * 1.8, 0.08); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, tmpC.set(0x000000)); }); m.instanceMatrix.needsUpdate = true; }}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </instancedMesh>
      <instancedMesh ref={water} args={[undefined, undefined, Math.max(1, data.lake.length)]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={WATER} roughness={0.2} metalness={0.3} />
      </instancedMesh>
      <primitive object={new THREE.Line(data.border, new THREE.LineBasicMaterial({ color: GREEN, transparent: true }))} onUpdate={(l: THREE.Line) => (borderMat.current = l.material as THREE.LineBasicMaterial)} />
      <group ref={pin} position={[data.kam[0], MAPB + 0.2, data.kam[1]]}>
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
    const push = portraitRaw > 1.05 ? 0.06 : 0.07; // finale dolly: gentle on portrait so the skyline stays in frame
    const r = (36 + mapTilt * 14 + far * 47 - s * 8) * portrait * (1 - dolly * push);
    const h = (10 + mapTilt * 18 + far * 26 + Math.sin(s * Math.PI) * 3 - s * 7) * (1 + (portrait - 1) * 0.5) * (1 - dolly * push * 0.9) + my * -1.4;
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
      dpr={lite ? [1, 2] : [1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 34, near: 0.1, far: 260, position: [0, 7, 26] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
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
      <Roads progress={progress} />
      <Bricks progress={progress} />
      <Crane progress={progress} at={[-8, 0, -4]} phase={0} rise={0.05} />
      <Crane progress={progress} at={[9, 0, -3]} phase={2.2} rise={0.1} />
      <Water progress={progress} />
      <Scan progress={progress} />
      <Dust progress={progress} count={lite ? 350 : 900} />
      <Rig progress={progress} mouse={mouse} />
    </Canvas>
  );
}
