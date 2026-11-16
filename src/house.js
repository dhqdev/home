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
    // flip: espelha a porta (a passagem fica do lado de s0)
    if (op.flip) {
      const B = (pp, axis_, c_, a, b, ...r) => bar(pp, axis_, c_, s0 + s1 - b, s0 + s1 - a, ...r);
      const GP = (pp, axis_, c_, a, b, ...r) => glassPane(pp, axis_, c_, s0 + s1 - b, s0 + s1 - a, ...r);
      return slideLeaves(parent, axis, c, s0, s1, yb, yt, B, GP);
    }
    return slideLeaves(parent, axis, c, s0, s1, yb, yt, bar, glassPane);
  } else if (op.type === 'door' || op.type === 'pivot') {
    makeDoor(parent, axis, c, t, s0, s1, yb, yt, op);
  } else if (op.type === 'void') {
    // vão livre com acabamento
    bar(parent, axis, c, s0, s0 + 0.015, yb, yt, -t / 2 - 0.01, t / 2 + 0.01, M.whiteLacquer);
    bar(parent, axis, c, s1 - 0.015, s1, yb, yt, -t / 2 - 0.01, t / 2 + 0.01, M.whiteLacquer);
  }
}

function slideLeaves(parent, axis, c, s0, s1, yb, yt, bar, glassPane) {
  const f = 0.05;
  const fm = M.frame;
  {
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


// Parede de vidro (caixilho preto) — poço de luz e divisórias
function glassWall(parent, axis, c, a0, a1, y0, h) {
  wall(parent, {
    axis, c, a0, a1, y0, h, t: 0.06, matA: M.frame, matB: M.frame, matEdge: M.frame,
    openings: [{ a0: a0 + 0.03, a1: a1 - 0.03, type: 'fixed', sill: 0, h: h - 0.03, transom: false }],
  });
}

// Rodapé simples (faixa clara junto ao piso)
function baseboard(parent, axis, c, a0, a1, side, y = 0, gaps = []) {
  const n0 = side > 0 ? 0 : -0.012, n1 = side > 0 ? 0.012 : 0;
  let cur = a0;
  for (const [g0, g1] of [...gaps, [a1, a1]].sort((p, q) => p[0] - q[0])) {
    if (g0 - cur > 0.05) bar(parent, axis, c, cur, g0, y, y + 0.08, n0, n1, M.whiteLacquer);
    cur = Math.max(cur, g1);
  }
}

// ------------------------------------------------------------------
// Planta corrigida: casa de X 5,00 a 17,20 e Z 0 a 8,50 (ver plan.js)
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
  const Y2 = FLOOR2;
  const H2 = CEIL2 - FLOOR2;
  const X0 = 5.0, X1 = 17.2, Z1 = 8.5;

  // ---------------- PISOS ----------------
  const slabMats = (top) => [M.ceiling, M.ceiling, top, M.ceiling, M.ceiling, M.ceiling];
  boxMM(house, X0, -0.2, 0, X1, 0, Z1, slabMats(M.floorPorcelain), { walk: true });
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
  floorPatch(house, 5, 0, 6.2, 1.8, M.floorOak); // escritório
  floorPatch(house, 5, 5.3, 8, 8.5, M.floorOak); // quarto 1
  floorPatch(house, 9.2, 5.3, 12.2, 8.5, M.floorOak); // quarto 2
  floorPatch(house, 8, 6.5, 9.2, 8.5, M.bathFloor); // banho social
  floorPatch(house, 12.2, 6.5, 13.4, 8.5, M.bathFloor); // lavabo
  floorPatch(house, 14.9, 6.5, 17.2, 8.5, M.bathFloor); // lavanderia

  // lajes do superior: A (quartos/circulação), B (chegada da escada), C (passagem), D (estar íntimo/varanda)
  const upSlab = (x0, z0, x1, z1, mat = M.floorOakLight) => boxMM(upper, x0, CEIL1, z0, x1, Y2, z1, slabMats(mat), { walk: true });
  upSlab(5, 3.9, X1, Z1);
  upSlab(11, 2.78, 12.1, 3.9);
  upSlab(12.1, 2.9, 13.6, 3.9);
  upSlab(13.6, 0, X1, 3.9);
  floorPatch(upper, 5, 5.2, 6.5, 7.7, M.bathFloor, Y2); // banho master
  floorPatch(upper, 13.7, 7.3, 15.7, 8.5, M.bathFloor, Y2); // banho Isabela
  floorPatch(upper, 15.7, 0, X1, Z1, M.floorOut, Y2); // varanda
  // forro do escritório (caixa sob o vazio)
  boxMM(house, 5, CEIL1, 0, 6.2, CEIL1 + 0.12, 1.8, [M.ceiling, M.ceiling, M.whiteLacquer, M.ceiling, M.ceiling, M.ceiling]);
  // testeira da laje voltada para o vazio
  boxMM(upper, 5.1, CEIL1 - 0.12, 3.88, 11, Y2, 3.9, M.whiteLacquer);

  // poço de luz: claraboia sobre a cozinha
  boxMM(house, 12.1, Y2 - 0.04, 0.1, 13.6, Y2 - 0.02, 2.9, M.glassFrosted, { cast: false });
  for (let z = 0.1; z <= 2.91; z += 0.7) boxMM(house, 12.1, Y2 - 0.12, z - 0.025, 13.6, Y2, z + 0.025, M.frame);
  for (const x of [12.1, 13.6]) boxMM(house, x - 0.04, CEIL1, 0.1, x + 0.04, Y2, 2.9, M.frame);
  // seixos brancos nas bordas do poço
  boxMM(house, 12.12, Y2 - 0.02, 0.1, 12.3, Y2 + 0.04, 2.88, M.marble, { cast: false });
  boxMM(house, 13.4, Y2 - 0.02, 0.1, 13.58, Y2 + 0.04, 2.88, M.marble, { cast: false });

  // ---------------- COBERTURA ----------------
  const roofMats = [M.concrete, M.concrete, M.concreteDark, M.ceiling, M.concrete, M.concrete];
  boxMM(roof, X0, CEIL2, 0, 12.1, CEIL2 + 0.2, Z1, roofMats);
  boxMM(roof, 12.1, CEIL2, 2.9, 13.6, CEIL2 + 0.2, Z1, roofMats);
  boxMM(roof, 13.6, CEIL2, 0, X1, CEIL2 + 0.2, Z1, roofMats);
  // platibanda dos fundos (sobre a varanda)
  boxMM(roof, X1 - 0.2, CEIL2 - 0.25, 0, X1, TOP, Z1, M.concrete);
  // cobertura da área gourmet
  boxMM(roof, X1, CEIL1, 5.5, 20, Y2, Z1, roofMats);
  boxMM(roof, X1, Y2, 5.4, 20, Y2 + 0.25, 5.5, M.concrete);
  boxMM(roof, X1, CEIL1 - 0.02, 5.6, 20, CEIL1, 5.64, M.ledWarm, { cast: false });

  // ---------------- PAREDES DO TÉRREO ----------------
  const ext = { t: T, h: Y2 };
  // Fachada frontal (x = 5): pano de vidro do pé-direito duplo, porta pivotante e janela do quarto 1
  wall(house, { axis: 'z', c: X0, a0: 0, a1: 3.9, ...ext, matA: M.plaster, matB: M.plasterOut, openings: [{ a0: 0.15, a1: 3.75, type: 'fixed', sill: 0, h: Y2, transom: false }] });
  wall(house, {
    axis: 'z', c: X0, a0: 3.9, a1: Z1, ...ext, matA: M.plaster, matB: M.plasterOut,
    openings: [
      { a0: 4.05, a1: 5.15, type: 'pivot', sill: 0, h: 2.6, swing: 1 },
      { a0: 6.0, a1: 7.6, type: 'window', sill: 0.9, h: 1.4 },
    ],
  });
  // Fundos (x = 17,2): porta de correr da cozinha, janela da copa e porta da lavanderia
  wall(house, {
    axis: 'z', c: X1, a0: 0, a1: Z1, ...ext, matA: M.plasterOut, matB: M.plaster,
    openings: [
      { a0: 0.5, a1: 4.1, type: 'slide', sill: 0, h: 2.6, flip: true },
      { a0: 4.7, a1: 6.1, type: 'window', sill: 1.0, h: 1.3 },
      { a0: 7.05, a1: 7.85, type: 'door', sill: 0, h: 2.1, swing: 1 },
    ],
  });
  // Divisa esquerda (z = 0) — parede cega
  wall(house, { axis: 'x', c: 0, a0: X0, a1: X1, ...ext, matA: M.plaster, matB: M.plasterOut });
  // Lateral do recuo (z = 8,5)
  wall(house, {
    axis: 'x', c: Z1, a0: X0, a1: X1, ...ext, matA: M.plasterOut, matB: M.plaster,
    openings: [
      { a0: 5.8, a1: 7.3, type: 'window', sill: 1.35, h: 0.95 }, // quarto 1
      { a0: 8.3, a1: 8.9, type: 'window', sill: 1.7, h: 0.5 }, // banho social
      { a0: 10.0, a1: 11.5, type: 'window', sill: 1.35, h: 0.95 }, // quarto 2
      { a0: 12.5, a1: 13.1, type: 'window', sill: 1.7, h: 0.5 }, // lavabo
      { a0: 15.4, a1: 16.6, type: 'window', sill: 1.2, h: 0.9 }, // lavanderia
    ],
  });

  // internas
  const inn = { t: 0.12, h: CEIL1 };
  const P_ = M.plaster, W_ = M.wallTile;
  const door = (a0, a1, swing = 1, extra = {}) => ({ a0, a1, type: 'door', sill: 0, h: 2.1, swing, ...extra });
  // escritório: parede de fundo e divisória de vidro com porta
  wall(house, { axis: 'z', c: 6.2, a0: 0.1, a1: 1.8, ...inn });
  wall(house, {
    axis: 'x', c: 1.8, a0: 5.1, a1: 6.26, t: 0.06, h: CEIL1, matA: M.frame, matB: M.frame, matEdge: M.frame,
    openings: [
      { a0: 5.13, a1: 5.48, type: 'fixed', sill: 0, h: CEIL1 - 0.05, transom: false },
      { a0: 5.5, a1: 6.18, type: 'door', sill: 0, h: 2.3, swing: -1, leaf: M.glass },
    ],
  });
  // parede da TV (sala x corredor)
  wall(house, { axis: 'x', c: 3.9, a0: 6.2, a1: 9.4, ...inn });
  // quartos, banho social (corredor em z = 5,3)
  wall(house, { axis: 'x', c: 5.3, a0: X0, a1: 8.06, ...inn, openings: [door(7.0, 7.8, 1)] });
  wall(house, { axis: 'z', c: 8, a0: 5.3, a1: 6.5, ...inn });
  wall(house, { axis: 'z', c: 8, a0: 6.5, a1: Z1, ...inn, matA: W_, matB: P_ });
  wall(house, { axis: 'x', c: 6.5, a0: 8, a1: 9.2, ...inn, matA: W_, openings: [door(8.2, 8.9, -1)] });
  wall(house, { axis: 'z', c: 9.2, a0: 5.3, a1: 6.5, ...inn });
  wall(house, { axis: 'z', c: 9.2, a0: 6.5, a1: Z1, ...inn, matA: P_, matB: W_ });
  wall(house, { axis: 'x', c: 5.3, a0: 9.14, a1: 12.26, ...inn, openings: [door(9.4, 10.2, 1)] });
  wall(house, { axis: 'z', c: 12.2, a0: 5.3, a1: 6.5, ...inn });
  wall(house, { axis: 'z', c: 12.2, a0: 6.5, a1: Z1, ...inn, matA: W_ });
  // lavabo, despensa e lavanderia (abrem para a cozinha)
  wall(house, {
    axis: 'x', c: 6.5, a0: 12.14, a1: X1, ...inn,
    openings: [door(12.45, 13.15, -1, { open: false }), door(13.75, 14.5, -1), door(15.25, 16.05, -1)],
  });
  wall(house, { axis: 'z', c: 13.4, a0: 6.5, a1: Z1, ...inn, matB: W_ });
  wall(house, { axis: 'z', c: 14.9, a0: 6.5, a1: Z1, ...inn, matA: W_ });

  // rodapés principais
  baseboard(house, 'x', 0.1, 12.1, 17.1, 1);
  baseboard(house, 'x', 3.84, 6.2, 9.4, -1);
  baseboard(house, 'x', 3.96, 6.2, 9.4, 1);
  baseboard(house, 'x', 5.24, 5.1, 12.2, -1, 0, [[7.0, 7.8], [9.4, 10.2]]);
  baseboard(house, 'x', 6.44, 12.2, 17.1, -1, 0, [[12.45, 13.15], [13.75, 14.5], [15.25, 16.05]]);
  baseboard(house, 'z', 17.1, 4.1, 6.44, -1);
  baseboard(house, 'x', 8.4, 5.1, 7.94, -1);
  baseboard(house, 'x', 5.36, 5.1, 7.94, 1, 0, [[7.0, 7.8]]);
  baseboard(house, 'x', 8.4, 9.26, 12.14, -1);
  baseboard(house, 'x', 5.36, 9.26, 12.14, 1, 0, [[9.4, 10.2]]);

  // ---------------- PAREDES DO SUPERIOR ----------------
  const ext2 = { t: T, h: TOP - Y2, y0: Y2 };
  // frente: pano de vidro do vazio + janelas atrás do ripado
  wall(upper, { axis: 'z', c: X0, a0: 0, a1: 3.9, ...ext2, matA: M.plaster, matB: M.concrete, openings: [{ a0: 0.15, a1: 3.75, type: 'fixed', sill: 0, h: H2, transom: false }] });
  wall(upper, {
    axis: 'z', c: X0, a0: 3.9, a1: Z1, ...ext2, matA: M.plaster, matB: M.concrete,
    openings: [
      { a0: 4.0, a1: 5.1, type: 'window', sill: 0, h: 2.5, transom: false }, // circulação
      { a0: 5.6, a1: 7.3, type: 'window', sill: 1.6, h: 0.7 }, // banho master
    ],
  });
  wall(upper, { axis: 'x', c: 0, a0: X0, a1: X1, ...ext2, matA: M.plaster, matB: M.concrete });
  wall(upper, {
    axis: 'x', c: Z1, a0: X0, a1: X1, ...ext2, matA: M.concrete, matB: M.plaster,
    openings: [
      { a0: 7.2, a1: 9.0, type: 'window', sill: 1.35, h: 0.95 }, // suíte master
      { a0: 10.2, a1: 11.2, type: 'window', sill: 1.6, h: 0.6 }, // closet
      { a0: 11.85, a1: 12.55, type: 'window', sill: 0.5, h: 1.9, transom: false }, // recanto de leitura
      { a0: 14.3, a1: 15.2, type: 'window', sill: 1.6, h: 0.6 }, // banho Isabela
    ],
  });
  // fachada do estar íntimo e da suíte Isabela para a varanda (x = 15,7)
  wall(upper, {
    axis: 'z', c: 15.7, a0: 0.1, a1: 8.4, t: 0.16, h: H2, y0: Y2, matA: M.plasterOut, matB: M.plaster,
    openings: [
      { a0: 0.4, a1: 3.7, type: 'slide', sill: 0, h: 2.5 },
      { a0: 4.7, a1: 6.9, type: 'slide', sill: 0, h: 2.5 },
      { a0: 7.6, a1: 8.2, type: 'window', sill: 1.6, h: 0.6 },
    ],
  });
  // guarda-corpo de vidro da varanda
  glassRail(upper, 'z', X1 - 0.08, 0.1, Z1 - 0.1, Y2);

  const inn2 = { t: 0.12, h: H2, y0: Y2 };
  // banho master + nicho de armário
  wall(upper, { axis: 'x', c: 5.2, a0: 5.1, a1: 6.56, ...inn2, matA: W_ });
  wall(upper, { axis: 'x', c: 5.2, a0: 6.5, a1: 9.76, ...inn2, openings: [door(8.7, 9.5, 1)] });
  wall(upper, { axis: 'z', c: 6.5, a0: 5.2, a1: 7.76, ...inn2, matB: W_, openings: [door(5.4, 6.1, -1)] });
  wall(upper, { axis: 'x', c: 7.7, a0: 5.1, a1: 6.5, ...inn2, matB: W_ });
  // suíte master x closet / hall
  wall(upper, { axis: 'z', c: 9.7, a0: 5.2, a1: Z1, ...inn2, openings: [{ a0: 7.0, a1: 7.8, type: 'void', sill: 0, h: 2.3 }] });
  wall(upper, { axis: 'x', c: 6.1, a0: 9.7, a1: 11.76, ...inn2 });
  wall(upper, { axis: 'z', c: 11.7, a0: 6.1, a1: Z1, ...inn2 });
  // suíte Isabela
  wall(upper, { axis: 'z', c: 12.7, a0: 4.3, a1: Z1, ...inn2, openings: [door(4.42, 5.12, 1)] });
  wall(upper, { axis: 'x', c: 4.3, a0: 12.64, a1: 15.7, ...inn2 });
  wall(upper, { axis: 'x', c: 7.3, a0: 13.7, a1: 15.7, ...inn2, matA: W_ });
  wall(upper, { axis: 'z', c: 13.7, a0: 7.3, a1: Z1, ...inn2, matA: W_, openings: [door(7.45, 8.15, 1)] });
  // poço de luz e ventilação (paredes de vidro, aberto para o céu)
  glassWall(upper, 'z', 12.1, 0.1, 2.9, Y2, H2);
  glassWall(upper, 'x', 2.9, 12.1, 13.6, Y2, H2);
  glassWall(upper, 'z', 13.6, 0.1, 2.9, Y2, H2);
  // mezanino: guarda-corpos de vidro sobre o vazio
  glassRail(upper, 'x', 3.9, 5.1, 11.0, Y2);
  glassRail(upper, 'z', 11.0, 2.78, 3.9, Y2);

  // rodapés do superior
  baseboard(upper, 'x', 5.14, 5.1, 9.7, -1, Y2, [[8.7, 9.5]]);
  baseboard(upper, 'x', 8.4, 6.56, 9.64, -1, Y2);
  baseboard(upper, 'x', 4.24, 12.7, 15.62, -1, Y2);
  baseboard(upper, 'x', 4.36, 12.76, 15.62, 1, Y2);
  baseboard(upper, 'x', 0.1, 13.66, 15.62, 1, Y2);

  // ---------------- ESCADA EM "L" ----------------
  buildStairs(house);

  // ---------------- FACHADA ----------------
  facade(house, upper);

  return house;
}

// Escada: lance 1 ao longo da parede de pedra (z = 0), patamar no canto e lance 2 subindo em +Z
function buildStairs(g) {
  const N = 17;
  const r = FLOOR2 / N;
  const tread = 0.28;
  const xL = 11.0; // início do patamar
  const x0 = xL - 9 * tread; // 8,48
  const zA0 = 0.13, zA1 = 1.1;
  const xB0 = 11.0, xB1 = 12.1;
  // lance 1: degraus flutuantes engastados na parede de pedra
  for (let k = 1; k <= 9; k++) {
    const xs = x0 + (k - 1) * tread;
    const top = k * r;
    boxMM(g, xs, top - 0.06, zA0, xs + tread + 0.02, top, zA1, M.freijo, { walk: true });
    boxMM(g, xs + 0.03, top - 0.065, zA0 + 0.05, xs + tread - 0.03, top - 0.06, zA1 - 0.08, M.ledWarm, { cast: false });
  }
  // não deixa passar por baixo dos degraus mais altos
  world.colliders.push(new THREE.Box3(new THREE.Vector3(x0 + 0.56, 0, zA0), new THREE.Vector3(xL, 0.45, zA1)));
  // patamar
  const land = 10 * r;
  boxMM(g, xB0, 0, zA0, xB1, land - 0.06, zA1, M.concrete, { collide: true });
  boxMM(g, xB0 - 0.01, land - 0.06, zA0, xB1, land, zA1, M.freijo, { walk: true });
  // lance 2: bloco maciço revestido (subindo em +Z)
  for (let k = 11; k <= 16; k++) {
    const zs = zA1 + (k - 11) * tread;
    const top = k * r;
    boxMM(g, xB0, 0, zs, xB1, top - 0.05, zs + tread, M.concrete, { collide: true });
    boxMM(g, xB0 - 0.02, top - 0.05, zs - 0.01, xB1, top, zs + tread + 0.01, M.freijo, { walk: true });
  }
  // guarda-corpos de vidro inclinados
  const h = 0.95;
  const z2 = zA1 + 6 * tread; // 2,78
  slopedGlass(g, [[x0 + 0.56, 2 * r, zA1], [xL, land, zA1], [xL, land + h, zA1], [x0 + 0.56, 2 * r + h, zA1]]);
  slopedGlass(g, [[xB0, land, zA1 + 0.28], [xB0, FLOOR2, z2], [xB0, FLOOR2 + h, z2], [xB0, land + h, zA1 + 0.28]]);
  slopedGlass(g, [[xB1, land, zA0], [xB1, land, zA1], [xB1, land + h, zA1], [xB1, land + h, zA0]]);
  slopedGlass(g, [[xB1, land, zA1], [xB1, FLOOR2, z2], [xB1, FLOOR2 + h, z2], [xB1, land + h, zA1]]);
  world.colliders.push(new THREE.Box3(new THREE.Vector3(x0 + 0.56, 0.4, zA1 - 0.02), new THREE.Vector3(xL, 3.0, zA1 + 0.02)));
  world.colliders.push(new THREE.Box3(new THREE.Vector3(xB0 - 0.02, 1.5, zA1 + 0.28), new THREE.Vector3(xB0 + 0.02, 4.0, z2)));
  world.colliders.push(new THREE.Box3(new THREE.Vector3(xB1 - 0.02, 0, zA0), new THREE.Vector3(xB1 + 0.02, 4.0, z2)));
  // revestimento de pedra na parede da escada/sala (pé-direito duplo)
  boxMM(g, 6.2, 0, 0.1, xB1, CEIL2, 0.13, M.stoneWall, { cast: false });
  // fita de LED rasante no topo da pedra
  boxMM(g, 6.2, CEIL2 - 0.04, 0.13, xB1, CEIL2 - 0.02, 0.16, M.ledWarm, { cast: false });
}

function facade(house, upper) {
  // Ripado de madeira — pavimento superior (frente dos quartos) e painel ao lado da porta
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
  upper.add(slats(4.82, 3.98, 8.5, FLOOR2 + 0.05, TOP - 0.05));
  house.add(slats(4.86, 5.22, 5.95, 0.05, FLOOR2 - 0.1));
  boxMM(house, 4.88, 0, 5.2, 4.9, FLOOR2 - 0.1, 5.95, M.blackMatte, { cast: false });

  // rufos no topo das platibandas
  const cap = (x0, z0, x1, z1) => boxMM(upper, x0, TOP, z0, x1, TOP + 0.04, z1, M.concreteDark);
  cap(4.88, -0.12, 17.22, 0.12);
  cap(4.88, 8.38, 17.22, 8.62);
  cap(4.88, -0.12, 5.12, 8.62);
  cap(16.98, -0.12, 17.22, 8.62);

  // moldura de concreto emoldurando o pé-direito duplo
  boxMM(house, 4.6, 0, -0.15, 5.1, TOP + 0.05, 0.12, M.concrete);
  boxMM(house, 4.6, TOP - 0.35, -0.15, 5.1, TOP + 0.05, 3.95, M.concrete);
  boxMM(house, 4.6, 0, 3.75, 5.1, TOP + 0.05, 3.95, M.concrete);
  boxMM(house, 4.58, TOP - 0.37, -0.1, 4.62, TOP - 0.34, 3.75, M.ledWarm, { cast: false });
  // travessa na altura da laje (por fora do vidro)
  boxMM(house, 4.86, FLOOR2 - 0.1, 0.12, 4.92, FLOOR2 + 0.02, 3.75, M.frame);
  // marquise sobre a porta
  boxMM(house, 3.6, 2.7, 3.95, 5.0, 2.86, 5.5, M.concrete);
  boxMM(house, 3.62, 2.68, 4.05, 4.98, 2.7, 5.4, M.ledWarm, { cast: false });
  // soleira e degrau de granito na porta
  boxMM(house, 4.3, 0, 3.95, 4.9, 0.02, 5.25, M.marbleDark, { walk: true });
}
