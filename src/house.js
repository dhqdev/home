// Arquitetura: lajes, paredes com vãos, esquadrias, portas, escada, fachada
import * as THREE from 'three';
import { world, boxMM, boxGeo, box } from './geo.js';
import { FLOOR2, CEIL1, CEIL2, TOP } from './plan.js';

let M; // materiais

// ------------------------------------------------------------------
// Parede com vãos.
// axis 'z': parede corre ao longo de Z, posicionada em x = c
// axis 'x': parede corre ao longo de X, posicionada em z = c
// matA = face do lado positivo (+x ou +z), matB = face do lado negativo
// openings: { a0, a1, type: 'window'|'door'|'slide'|'void'|'pivot', sill, h, swing, leaf }
// ------------------------------------------------------------------
function wall(parent, o) {
  const { axis, c, a0, a1, y0 = 0, h, t = 0.12, matA = M.plaster, matB = M.plaster } = o;
  const edge = o.matEdge || M.plaster;
  const mats = axis === 'z' ? [matA, matB, edge, edge, edge, edge] : [edge, edge, edge, edge, matA, matB];
  const ops = (o.openings || []).slice().sort((p, q) => p.a0 - q.a0);

  const solid = (s0, s1, yb, yt, collide = true) => {
    if (s1 - s0 < 0.001 || yt - yb < 0.001) return;
    if (axis === 'z') boxMM(parent, c - t / 2, yb, s0, c + t / 2, yt, s1, mats, { collide });
    else boxMM(parent, s0, yb, c - t / 2, s1, yt, c + t / 2, mats, { collide });
  };

  let cur = a0;
  for (const op of ops) {
    solid(cur, op.a0, y0, y0 + h);
    const sill = op.sill || 0;
    const top = Math.min(sill + op.h, h);
    if (sill > 0) solid(op.a0, op.a1, y0, y0 + sill);
    if (top < h) solid(op.a0, op.a1, y0 + top, y0 + h);
    fillOpening(parent, axis, c, t, op.a0, op.a1, y0 + sill, y0 + top, op);
    cur = op.a1;
  }
  solid(cur, a1, y0, y0 + h);
}

// coordenadas: s = ao longo da parede, n = deslocamento normal, y
function P(axis, c, s, n) {
  return axis === 'z' ? [c + n, s] : [s, c + n];
}

function bar(parent, axis, c, s0, s1, y0, y1, n0, n1, mat, collide = false) {
  const [xa, za] = P(axis, c, s0, n0);
  const [xb, zb] = P(axis, c, s1, n1);
  return boxMM(parent, Math.min(xa, xb), y0, Math.min(za, zb), Math.max(xa, xb), y1, Math.max(za, zb), mat, { collide, cast: false });
}

function glassPane(parent, axis, c, s0, s1, y0, y1, n = 0, mat = M.glass, collide = true) {
  const m = bar(parent, axis, c, s0, s1, y0, y1, n - 0.006, n + 0.006, mat, collide);
  m.castShadow = false;
  m.receiveShadow = false;
  m.renderOrder = 2;
  return m;
}

function fillOpening(parent, axis, c, t, s0, s1, yb, yt, op) {
  const f = 0.05; // perfil do caixilho
  const fm = M.frame;
  if (op.type === 'window' || op.type === 'fixed') {
    bar(parent, axis, c, s0, s1, yb, yb + f, -0.04, 0.04, fm);
    bar(parent, axis, c, s0, s1, yt - f, yt, -0.04, 0.04, fm);
    bar(parent, axis, c, s0, s0 + f, yb, yt, -0.04, 0.04, fm);
    bar(parent, axis, c, s1 - f, s1, yb, yt, -0.04, 0.04, fm);
    const w = s1 - s0;
    const n = w > 1.5 ? Math.round(w / 1.1) : 1;
    for (let i = 1; i < n; i++) {
      const s = s0 + (w * i) / n;
      bar(parent, axis, c, s - f / 2, s + f / 2, yb, yt, -0.035, 0.035, fm);
    }
    if (yt - yb > 2.2 && op.transom !== false) bar(parent, axis, c, s0, s1, yb + 2.1, yb + 2.1 + f * 0.8, -0.035, 0.035, fm);
    // peitoril
    if (yb > 0.3 + (op.base || 0)) bar(parent, axis, c, s0 - 0.02, s1 + 0.02, yb - 0.02, yb, -t / 2 - 0.04, t / 2 + 0.04, M.marble);
    glassPane(parent, axis, c, s0 + f, s1 - f, yb + f, yt - f, 0, M.glass, true);
  } else if (op.type === 'slide') {
    // porta de correr de vidro: uma folha fixa e outra aberta (passagem livre na metade)
    const mid = (s0 + s1) / 2;
    bar(parent, axis, c, s0, s1, yb, yb + 0.02, -0.07, 0.07, fm);
    bar(parent, axis, c, s0, s1, yt - f, yt, -0.07, 0.07, fm);
    bar(parent, axis, c, s0, s0 + f, yb, yt, -0.07, 0.07, fm);
    bar(parent, axis, c, s1 - f, s1, yb, yt, -0.07, 0.07, fm);
    // folha fixa
    bar(parent, axis, c, mid - f / 2, mid + f / 2, yb, yt, -0.06, -0.01, fm);
    glassPane(parent, axis, c, s0 + f, mid - f / 2, yb + 0.02, yt - f, -0.035);
    // folha móvel, parcialmente sobreposta à fixa (aberta)
    const open = (mid - s0) * 0.85;
    const m0 = mid - open, m1 = s1 - open;
    bar(parent, axis, c, m0, m0 + f, yb, yt - f, 0.01, 0.06, fm);
    bar(parent, axis, c, m1 - f, m1, yb, yt - f, 0.01, 0.06, fm);
    glassPane(parent, axis, c, m0 + f, m1 - f, yb + 0.02, yt - f, 0.035, M.glass, false);
  } else if (op.type === 'door' || op.type === 'pivot') {
    makeDoor(parent, axis, c, t, s0, s1, yb, yt, op);
  } else if (op.type === 'void') {
    // vão livre com acabamento
    bar(parent, axis, c, s0, s0 + 0.015, yb, yt, -t / 2 - 0.01, t / 2 + 0.01, M.whiteLacquer);
    bar(parent, axis, c, s1 - 0.015, s1, yb, yt, -t / 2 - 0.01, t / 2 + 0.01, M.whiteLacquer);
  }
}

function makeDoor(parent, axis, c, t, s0, s1, yb, yt, op) {
  const trim = op.type === 'pivot' ? M.frame : M.whiteLacquer;
  // batentes / guarnições
  bar(parent, axis, c, s0, s0 + 0.03, yb, yt, -t / 2 - 0.012, t / 2 + 0.012, trim);
  bar(parent, axis, c, s1 - 0.03, s1, yb, yt, -t / 2 - 0.012, t / 2 + 0.012, trim);
  bar(parent, axis, c, s0, s1, yt - 0.03, yt, -t / 2 - 0.012, t / 2 + 0.012, trim);

  const w = s1 - s0 - 0.07;
  const h = yt - yb - 0.04;
  const pivot = new THREE.Group();
  const leafMat = op.leaf || (op.type === 'pivot' ? M.ripado : M.whiteLacquer);
  const th = op.type === 'pivot' ? 0.06 : 0.04;
  const leaf = new THREE.Group();
  // folha
  const isGlass = leafMat === M.glass;
  const panel = new THREE.Mesh(boxGeo(th, h, w), leafMat);
  panel.position.set(0, h / 2, w / 2);
  panel.castShadow = !isGlass;
  panel.receiveShadow = !isGlass;
  leaf.add(panel);
  if (isGlass) {
    panel.renderOrder = 2;
    box(leaf, th + 0.01, h, 0.04, M.frame, 0, h / 2, 0.02);
    box(leaf, th + 0.01, h, 0.04, M.frame, 0, h / 2, w - 0.02);
  }
  if (op.type === 'pivot') {
    // puxador vertical grande
    box(leaf, 0.03, 1.2, 0.03, M.blackMetal, 0.08, 1.05, w - 0.2);
    box(leaf, 0.03, 1.2, 0.03, M.blackMetal, -0.08, 1.05, w - 0.2);
    for (const sx of [0.045, -0.045]) box(leaf, 0.06, 0.02, 0.02, M.blackMetal, sx, 0.5, w - 0.2), box(leaf, 0.06, 0.02, 0.02, M.blackMetal, sx, 1.6, w - 0.2);
  } else {
    // maçaneta
    for (const sx of [1, -1]) {
      box(leaf, 0.05, 0.02, 0.02, M.blackMetal, sx * 0.04, 1.02, w - 0.07);
      box(leaf, 0.02, 0.02, 0.12, M.blackMetal, sx * 0.07, 1.02, w - 0.12);
    }
  }
  pivot.add(leaf);
  if (axis === 'x') leaf.rotation.y = Math.PI / 2; // folha ao longo de +X
  const [px, pz] = P(axis, c, s0 + 0.035, 0);
  pivot.position.set(px, yb, pz);
  parent.add(pivot);

  const sign = (op.swing || 1) * (axis === 'z' ? 1 : -1);
  const door = {
    pivot,
    openAngle: sign * (Math.PI / 2) * 0.92,
    angle: 0,
    target: 0,
    open: op.open !== false,
    closedBox: null,
    leaf,
  };
  door.angle = door.target = door.open ? door.openAngle : 0;
  pivot.rotation.y = door.angle;
  // caixa de colisão quando fechada
  const [xa, za] = P(axis, c, s0, -0.05);
  const [xb, zb] = P(axis, c, s1, 0.05);
  door.closedBox = new THREE.Box3(new THREE.Vector3(Math.min(xa, xb), yb, Math.min(za, zb)), new THREE.Vector3(Math.max(xa, xb), yt, Math.max(za, zb)));
  pivot.traverse((o) => (o.userData.door = door));
  world.doors.push(door);
}

// Guarda-corpo de vidro reto
function glassRail(parent, axis, c, s0, s1, y0, h = 1.05) {
  glassPane(parent, axis, c, s0, s1, y0 + 0.02, y0 + h, 0, M.glass, true);
  bar(parent, axis, c, s0, s1, y0, y0 + 0.04, -0.03, 0.03, M.frame);
  bar(parent, axis, c, s0, s1, y0 + h, y0 + h + 0.04, -0.025, 0.025, M.steel);
}

// Vidro inclinado (guarda-corpo da escada)
function slopedGlass(parent, pts) {
  const g = new THREE.BufferGeometry();
  const v = [];
  for (const p of [pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]) v.push(...p);
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, M.glass);
  m.renderOrder = 2;
  parent.add(m);
  // corrimão
  const a = new THREE.Vector3(...pts[3]), b = new THREE.Vector3(...pts[2]);
  const len = a.distanceTo(b);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 12), M.steel);
  rail.position.copy(a).add(b).multiplyScalar(0.5);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  rail.castShadow = true;
  parent.add(rail);
}

// ------------------------------------------------------------------
export function buildHouse(scene, materials) {
  M = materials;
  const house = new THREE.Group();
  house.name = 'casa';
  scene.add(house);
  const upper = new THREE.Group();
  upper.name = 'superior';
  house.add(upper);
  const roof = new THREE.Group();
  roof.name = 'cobertura';
  house.add(roof);
  world.upperGroup = upper;
  world.roofGroup = roof;

  const T = 0.2; // parede externa
  const H1 = FLOOR2; // altura do térreo (piso a piso)
  const Hin = CEIL1;
  const Y2 = FLOOR2;
  const H2 = CEIL2 - FLOOR2;

  // ---------------- LAJES / PISOS ----------------
  // contrapiso do térreo
  const slabMats = (top) => [M.ceiling, M.ceiling, top, M.ceiling, M.ceiling, M.ceiling];
  boxMM(house, 5, -0.2, 0, 16.6, 0, 8.5, slabMats(M.floorPorcelain), { walk: true });
  // pisos por ambiente (sobrepostos)
  const floorPatch = (g, x0, z0, x1, z1, mat, y = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y + 0.003, (z0 + z1) / 2);
    const uv = m.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0), uv.getY(i) * (z1 - z0));
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  floorPatch(house, 5, 5.2, 8, 8.5, M.floorOak); // quarto 1
  floorPatch(house, 9.2, 5.2, 12.2, 8.5, M.floorOak); // quarto 2
  floorPatch(house, 8, 6.3, 9.2, 8.5, M.bathFloor); // banho social
  floorPatch(house, 12.2, 5.2, 13.4, 7.2, M.bathFloor); // lavabo
  floorPatch(house, 14.9, 5.2, 16.6, 8.5, M.bathFloor); // lavanderia
  floorPatch(house, 5, 0, 6.6, 1.8, M.floorOak); // escritório

  // laje do pavimento superior (com vazio da sala, escada e poço de luz)
  const upSlab = (x0, z0, x1, z1, mat = M.floorOakLight) => boxMM(upper, x0, CEIL1, z0, x1, Y2, z1, slabMats(mat), { walk: true });
  upSlab(5, 4.0, 15.4, 8.5);
  upSlab(10.4, 2.88, 12.4, 4.0);
  upSlab(11.5, 0, 12.4, 2.88);
  upSlab(12.4, 2.3, 15.4, 4.0);
  floorPatch(upper, 5, 6, 6.5, 8.5, M.bathFloor, Y2);
  floorPatch(upper, 14.2, 5.3, 15.4, 7.3, M.bathFloor, Y2);
  // forro do escritório (caixa sob o vazio)
  boxMM(house, 5, CEIL1, 0, 6.6, CEIL1 + 0.12, 1.8, [M.ceiling, M.ceiling, M.whiteLacquer, M.ceiling, M.ceiling, M.ceiling]);

  // laje de cobertura do térreo (fundos) e área gourmet
  const roofMats = [M.concrete, M.concrete, M.concreteDark, M.ceiling, M.concrete, M.concrete];
  boxMM(roof, 15.4, CEIL1, 0, 16.6, Y2, 8.5, roofMats);
  boxMM(roof, 16.6, CEIL1, 5.0, 20, Y2, 8.5, roofMats);
  boxMM(roof, 16.6, Y2, 4.95, 20, Y2 + 0.3, 5.1, M.concrete); // platibanda gourmet
  boxMM(roof, 16.6, Y2, 0, 16.75, Y2 + 0.3, 8.5, M.concrete);
  // claraboia do poço de luz sobre a cozinha
  boxMM(roof, 12.4, CEIL1 + 0.05, 0.1, 15.4, CEIL1 + 0.07, 2.3, M.glassFrosted, { cast: false });
  for (let x = 12.4; x <= 15.41; x += 0.75) boxMM(roof, x - 0.025, CEIL1, 0.1, x + 0.025, CEIL1 + 0.1, 2.3, M.frame);
  boxMM(roof, 12.4, CEIL1, 2.2, 15.4, Y2, 2.3, M.ceiling);
  // laje de cobertura do superior
  boxMM(roof, 5, CEIL2, 0, 12.4, CEIL2 + 0.2, 8.5, roofMats);
  boxMM(roof, 12.4, CEIL2, 2.3, 15.4, CEIL2 + 0.2, 8.5, roofMats);

  // ---------------- PAREDES TÉRREO ----------------
  const ext = { t: T, h: H1 };
  // Fachada frontal (x = 5)
  wall(house, {
    axis: 'z', c: 5, a0: 0, a1: 8.5, ...ext, matA: M.plaster, matB: M.plasterOut,
    openings: [
      { a0: 0.2, a1: 1.6, type: 'window', sill: 0, h: 2.6 },
      { a0: 2.9, a1: 4.0, type: 'pivot', sill: 0, h: 2.6, swing: 1 },
      { a0: 6.1, a1: 7.6, type: 'window', sill: 0.9, h: 1.4 },
    ],
  });
  // Fundos (x = 16.6)
  wall(house, {
    axis: 'z', c: 16.6, a0: 0, a1: 8.5, ...ext, matA: M.plasterOut, matB: M.plaster,
    openings: [
      { a0: 0.3, a1: 3.7, type: 'slide', sill: 0, h: 2.6 },
      { a0: 7.0, a1: 7.8, type: 'door', sill: 0, h: 2.1, swing: 1 },
    ],
  });
  // Divisa superior (z = 0)
  wall(house, { axis: 'x', c: 0, a0: 5, a1: 16.6, ...ext, matA: M.plaster, matB: M.plasterOut });
  // Lateral do corredor (z = 8.5)
  wall(house, {
    axis: 'x', c: 8.5, a0: 5, a1: 16.6, ...ext, matA: M.plasterOut, matB: M.plaster,
    openings: [
      { a0: 5.8, a1: 7.3, type: 'window', sill: 1.0, h: 1.3 },
      { a0: 8.3, a1: 8.9, type: 'window', sill: 1.7, h: 0.5 },
      { a0: 10.0, a1: 11.5, type: 'window', sill: 1.0, h: 1.3 },
      { a0: 15.3, a1: 16.2, type: 'window', sill: 1.2, h: 0.9 },
    ],
  });

  // internas
  const inn = { t: 0.12, h: Hin };
  const P_ = M.plaster, W_ = M.wallTile;
  const door = (a0, a1, swing = 1, extra = {}) => ({ a0, a1, type: 'door', sill: 0, h: 2.1, swing, ...extra });
  wall(house, { axis: 'x', c: 5.2, a0: 5, a1: 8, ...inn, openings: [door(7.0, 7.85, 1)] });
  wall(house, { axis: 'z', c: 8, a0: 5.2, a1: 6.3, ...inn });
  wall(house, { axis: 'z', c: 8, a0: 6.3, a1: 8.5, ...inn, matA: W_, matB: P_ });
  wall(house, { axis: 'x', c: 6.3, a0: 8, a1: 9.2, ...inn, matA: W_, openings: [door(8.2, 8.85, -1)] });
  wall(house, { axis: 'z', c: 9.2, a0: 5.2, a1: 6.3, ...inn });
  wall(house, { axis: 'z', c: 9.2, a0: 6.3, a1: 8.5, ...inn, matA: P_, matB: W_ });
  wall(house, { axis: 'x', c: 5.2, a0: 9.2, a1: 12.2, ...inn, openings: [door(9.4, 10.25, 1)] });
  wall(house, { axis: 'z', c: 12.2, a0: 5.2, a1: 7.2, ...inn, matA: W_ });
  wall(house, { axis: 'z', c: 12.2, a0: 7.2, a1: 8.5, ...inn });
  wall(house, { axis: 'x', c: 5.2, a0: 12.2, a1: 13.4, ...inn, matA: W_, openings: [door(12.45, 13.15, 1, { open: false })] });
  wall(house, { axis: 'x', c: 5.2, a0: 13.4, a1: 14.9, ...inn, openings: [door(13.75, 14.5, 1)] });
  wall(house, { axis: 'x', c: 5.2, a0: 14.9, a1: 16.6, ...inn, matA: W_, openings: [door(15.2, 16.0, 1)] });
  wall(house, { axis: 'z', c: 13.4, a0: 5.2, a1: 7.2, ...inn, matB: W_ });
  wall(house, { axis: 'x', c: 7.2, a0: 12.2, a1: 13.4, ...inn, matB: W_ });
  wall(house, { axis: 'x', c: 7.2, a0: 13.4, a1: 14.9, ...inn });
  wall(house, { axis: 'z', c: 14.9, a0: 5.2, a1: 8.5, ...inn, matA: W_ });
  // escritório: parede da TV e divisória de vidro
  wall(house, { axis: 'z', c: 6.6, a0: 0, a1: 1.8, ...inn });
  wall(house, {
    axis: 'x', c: 1.8, a0: 5, a1: 6.6, t: 0.06, h: Hin, matA: M.frame, matB: M.frame, matEdge: M.frame,
    openings: [
      { a0: 5.08, a1: 5.82, type: 'fixed', sill: 0, h: Hin - 0.05, transom: false },
      { a0: 5.86, a1: 6.56, type: 'door', sill: 0, h: 2.3, swing: -1, leaf: M.glass },
    ],
  });

  // ---------------- PAREDES SUPERIOR ----------------
  const ext2 = { t: T, h: TOP - Y2, y0: Y2 };
  wall(upper, {
    axis: 'z', c: 5, a0: 0, a1: 8.5, ...ext2, matA: M.plaster, matB: M.concrete,
    openings: [
      { a0: 0.2, a1: 3.8, type: 'window', sill: 0, h: 2.55 },
      { a0: 4.2, a1: 5.8, type: 'window', sill: 0, h: 2.55, transom: false },
      { a0: 6.8, a1: 7.8, type: 'window', sill: 1.6, h: 0.7 },
    ],
  });
  wall(upper, { axis: 'x', c: 0, a0: 5, a1: 15.4, ...ext2, matA: M.plaster, matB: M.concrete });
  wall(upper, {
    axis: 'x', c: 8.5, a0: 5, a1: 15.4, ...ext2, matA: M.concrete, matB: M.plaster,
    openings: [
      { a0: 5.4, a1: 6.2, type: 'window', sill: 1.6, h: 0.6 },
      { a0: 7.3, a1: 9.3, type: 'window', sill: 0.9, h: 1.4 },
      { a0: 12.7, a1: 14.0, type: 'window', sill: 0.9, h: 1.4 },
    ],
  });
  wall(upper, {
    axis: 'z', c: 15.4, a0: 0, a1: 8.5, ...ext2, matA: M.concrete, matB: M.plaster,
    openings: [
      { a0: 2.8, a1: 4.8, type: 'window', sill: 0.5, h: 1.9 },
      { a0: 5.8, a1: 6.8, type: 'window', sill: 1.6, h: 0.6 },
    ],
  });
  const inn2 = { t: 0.12, h: H2, y0: Y2 };
  wall(upper, { axis: 'z', c: 6.5, a0: 6.0, a1: 8.5, ...inn2, matB: W_, openings: [door(6.15, 6.85, -1)] });
  wall(upper, { axis: 'x', c: 6.0, a0: 5, a1: 6.5, ...inn2, matA: W_ });
  wall(upper, { axis: 'x', c: 5.3, a0: 6.5, a1: 10.0, ...inn2, openings: [door(9.0, 9.85, 1)] });
  wall(upper, { axis: 'z', c: 10.0, a0: 5.3, a1: 8.5, ...inn2, openings: [{ a0: 7.0, a1: 7.9, type: 'void', sill: 0, h: 2.3 }] });
  wall(upper, { axis: 'x', c: 6.5, a0: 10.0, a1: 12.4, ...inn2 });
  wall(upper, { axis: 'z', c: 12.4, a0: 2.3, a1: 5.3, ...inn2, openings: [door(4.4, 5.2, 1)] });
  wall(upper, { axis: 'z', c: 12.4, a0: 5.3, a1: 8.5, ...inn2, openings: [{ a0: 5.4, a1: 6.45, type: 'void', sill: 0, h: 2.4 }] });
  wall(upper, {
    axis: 'z', c: 12.4, a0: 0, a1: 2.3, ...inn2, matA: M.concrete,
    openings: [{ a0: 0.3, a1: 2.0, type: 'window', sill: 0.9, h: 1.5 }],
  });
  wall(upper, { axis: 'x', c: 5.3, a0: 12.4, a1: 14.2, ...inn2 });
  wall(upper, { axis: 'x', c: 5.3, a0: 14.2, a1: 15.4, ...inn2, matA: W_, openings: [door(14.55, 15.25, -1)] });
  wall(upper, { axis: 'z', c: 14.2, a0: 5.3, a1: 7.3, ...inn2, matA: W_ });
  wall(upper, { axis: 'z', c: 14.2, a0: 7.3, a1: 8.5, ...inn2 });
  wall(upper, { axis: 'x', c: 7.3, a0: 14.2, a1: 15.4, ...inn2, matB: W_ });
  wall(upper, { axis: 'x', c: 2.3, a0: 12.4, a1: 15.4, ...inn2, matB: M.concrete });
  // poço de luz: parede externa sobe até a platibanda
  // guarda-corpos de vidro do mezanino
  glassRail(upper, 'x', 4.0, 5.1, 10.4, Y2);
  glassRail(upper, 'z', 10.4, 2.88, 4.0, Y2);
  glassRail(upper, 'z', 11.5, 0.1, 2.88, Y2);
  // borda da laje (testeira) aparente no vazio
  boxMM(upper, 5.1, CEIL1 - 0.1, 3.98, 10.4, Y2, 4.02, M.whiteLacquer);

  // ---------------- ESCADA EM "L" ----------------
  buildStairs(house);

  // ---------------- PARAPEITOS / ACABAMENTOS DA FACHADA ----------------
  facade(house, upper);

  return house;
}

function buildStairs(g) {
  const N = 17;
  const r = FLOOR2 / N;
  const tread = 0.28;
  const x0 = 10.4 - 9 * tread; // 7.88
  const zA0 = 0.1, zA1 = 1.2; // largura do lance 1
  // lance 1: degraus flutuantes engastados na parede (z = 0)
  for (let k = 1; k <= 9; k++) {
    const xs = x0 + (k - 1) * tread;
    const top = k * r;
    const m = boxMM(g, xs, top - 0.06, zA0, xs + tread + 0.02, top, zA1, M.freijo, { walk: true, collide: true });
  }
  // patamar (bloco)
  const land = 10 * r;
  boxMM(g, 10.4, 0, zA0, 11.5, land - 0.06, zA1, M.concrete, { collide: true });
  boxMM(g, 10.4, land - 0.06, zA0, 11.5, land, zA1, M.freijo, { walk: true });
  // lance 2: bloco maciço revestido, subindo em +Z
  for (let k = 11; k <= 16; k++) {
    const zs = zA1 + (k - 11) * tread;
    const top = k * r;
    boxMM(g, 10.4, 0, zs, 11.5, top - 0.05, zs + tread, M.concrete, { collide: true });
    boxMM(g, 10.38, top - 0.05, zs - 0.01, 11.52, top, zs + tread + 0.01, M.freijo, { walk: true });
  }
  // fita de LED sob os degraus flutuantes
  for (let k = 1; k <= 9; k++) {
    const xs = x0 + (k - 1) * tread;
    boxMM(g, xs + 0.03, k * r - 0.065, zA0 + 0.05, xs + tread - 0.03, k * r - 0.06, zA1 - 0.08, M.ledWarm, { cast: false });
  }
  // guarda-corpos inclinados de vidro
  const h = 0.95;
  slopedGlass(g, [[x0, r * 0.5, 1.2], [10.4, land, 1.2], [10.4, land + h, 1.2], [x0, r * 0.5 + h, 1.2]]);
  slopedGlass(g, [[10.4, land, 1.2 + 0.28], [10.4, FLOOR2, 2.88], [10.4, FLOOR2 + h, 2.88], [10.4, land + h, 1.2 + 0.28]]);
  slopedGlass(g, [[11.5, land, 0.1], [11.5, land, 1.2], [11.5, land + h, 1.2], [11.5, land + h, 0.1]]);
  slopedGlass(g, [[11.5, land, 1.2], [11.5, FLOOR2, 2.88], [11.5, FLOOR2 + h, 2.88], [11.5, land + h, 1.2]]);
  world.colliders.push(new THREE.Box3(new THREE.Vector3(x0, 0.05, 1.19), new THREE.Vector3(10.4, 3.0, 1.23)));
  world.colliders.push(new THREE.Box3(new THREE.Vector3(11.48, 0, 0.1), new THREE.Vector3(11.52, 4.0, 2.88)));
  world.colliders.push(new THREE.Box3(new THREE.Vector3(10.38, 1.5, 1.2), new THREE.Vector3(10.42, 4.0, 2.88)));
  // revestimento de pedra na parede da escada (pé-direito duplo)
  boxMM(g, 6.6, 0, 0.1, 10.4, CEIL2, 0.13, M.stoneWall, { cast: false });
}

function facade(house, upper) {
  // Ripado de madeira — fachada do pavimento superior e lateral da porta
  const slats = (x, z0, z1, y0, y1) => {
    const n = Math.floor((z1 - z0) / 0.1);
    const geo = boxGeo(0.04, y1 - y0, 0.05);
    const inst = new THREE.InstancedMesh(geo, M.ripado, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      m4.makeTranslation(x, (y0 + y1) / 2, z0 + 0.05 + i * 0.1);
      inst.setMatrixAt(i, m4);
    }
    inst.castShadow = inst.receiveShadow = true;
    return inst;
  };
  upper.add(slats(4.86, 4.0, 8.5, FLOOR2 + 0.05, TOP - 0.05));
  boxMM(upper, 4.88, FLOOR2, 4.0, 4.9, TOP, 8.5, M.blackMatte, { cast: false });
  house.add(slats(4.86, 4.1, 6.0, 0.05, FLOOR2 - 0.1));
  boxMM(house, 4.88, 0, 4.1, 4.9, FLOOR2 - 0.1, 6.0, M.blackMatte, { cast: false });

  // pingadeiras / rufos (topo das platibandas)
  const cap = (x0, z0, x1, z1) => boxMM(upper, x0, TOP, z0, x1, TOP + 0.04, z1, M.concreteDark);
  cap(4.88, -0.02, 15.52, 0.12);
  cap(4.88, 8.38, 15.52, 8.52);
  cap(4.88, -0.02, 5.12, 8.52);
  cap(15.28, -0.02, 15.52, 8.52);

  // faixa de concreto emoldurando o pé-direito duplo (moldura da fachada)
  boxMM(house, 4.6, 0, -0.15, 5.1, TOP + 0.05, 0.12, M.concrete);
  boxMM(house, 4.6, TOP - 0.35, -0.15, 5.1, TOP + 0.05, 4.05, M.concrete);
  boxMM(house, 4.6, 0, 4.0, 5.1, TOP + 0.05, 4.15, M.concrete);
  // fita de LED no topo da moldura
  boxMM(house, 4.58, TOP - 0.37, -0.1, 4.62, TOP - 0.34, 4.0, M.ledWarm, { cast: false });
  // marquise sobre a porta
  boxMM(house, 3.9, 2.7, 2.6, 5.0, 2.86, 4.15, M.concrete);
  boxMM(house, 3.92, 2.68, 2.7, 4.98, 2.7, 4.05, M.ledWarm, { cast: false });
}
