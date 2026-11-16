// Terreno, rua, garagem, piscina, deck, área gourmet, jardim e vizinhança
import * as THREE from 'three';
import { world, boxMM, box, place } from './geo.js';
import * as F from './furniture.js';
import { textTexture } from './textures.js';
import { FLOOR2, CEIL1 } from './plan.js';

const PI = Math.PI;

function ground(parent, x0, z0, x1, z1, mat, y = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
  m.rotation.x = -PI / 2;
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = m.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0), uv.getY(i) * (z1 - z0));
  m.receiveShadow = true;
  parent.add(m);
  if (opts.walk !== false) world.walkables.push(m);
  return m;
}

function outdoorLight(scene, light, pos, target) {
  light.position.set(...pos);
  light.userData.base = light.intensity;
  light.userData.outdoor = true;
  if (target) {
    light.target.position.set(...target);
    scene.add(light.target);
  }
  scene.add(light);
  world.nightLights.push(light);
  return light;
}

export function buildSite(scene, M) {
  const g = new THREE.Group();
  g.name = 'terreno';
  scene.add(g);

  // ---------------- chão ----------------
  // gramado em volta do lote (com "furo" no lote, por causa da piscina)
  ground(g, -60, -60, 0, 70, M.grass, -0.04);
  ground(g, 20.15, -60, 80, 70, M.grass, -0.04);
  ground(g, 0, -60, 20.15, -0.15, M.grass, -0.04);
  ground(g, 0, 10.15, 20.15, 70, M.grass, -0.04);
  ground(g, 0, 0, 16.6, 10, M.grass, -0.02);
  ground(g, 16.6, 8.5, 20, 10, M.grass, -0.02);
  // rua e calçada
  ground(g, -9, -60, -1.8, 70, M.asphalt, -0.035);
  boxMM(g, -1.9, -0.035, -60, -1.8, 0.1, 70, M.concrete, { walk: true });
  ground(g, -1.8, -60, 0, 70, M.pavers, 0.0);
  // faixa central tracejada
  for (let z = -58; z < 68; z += 4) boxMM(g, -5.48, -0.03, z, -5.32, -0.028, z + 2, M.plasticWhite, { cast: false });
  // garagem: vaga coberta (concreto), passeio, vaga descoberta (concregrama)
  ground(g, 0, 0, 5, 2.8, M.paversDark, 0.005);
  ground(g, 0, 2.8, 5, 3.95, M.pavers, 0.006);
  ground(g, 0, 3.95, 5, 6.6, M.concregrama, 0.004);
  // corredor lateral
  ground(g, 0, 8.6, 20, 9.55, M.pavers, 0.006);
  // ---------------- muros de divisa ----------------
  const wallH = 2.2;
  boxMM(g, 0, 0, -0.15, 5, 2.95, 0.0, M.plasterOut, { collide: true });
  boxMM(g, 16.6, 0, -0.15, 20, wallH, 0.0, M.plasterOut, { collide: true });
  boxMM(g, 0, 0, 10, 20.15, wallH, 10.15, M.plasterOut, { collide: true });
  boxMM(g, 20, 0, -0.15, 20.15, wallH, 10.15, M.plasterOut, { collide: true });
  boxMM(g, 19.85, 0, 5.0, 20, FLOOR2, 8.5, M.stoneWall, { collide: true });
  // jardim vertical no muro dos fundos (atrás da piscina)
  boxMM(g, 19.9, 0.3, 0.2, 20, 2.15, 4.9, M.soil, { cast: false });
  verticalGarden(g, M, 19.9, 0.35, 0.25, 2.1, 4.85);
  // muretas/canteiro do corredor
  boxMM(g, 0, 0, 9.55, 20, 0.35, 9.62, M.concreteDark, { collide: true });
  ground(g, 0, 9.62, 20, 10, M.soil, 0.3, { walk: false });
  for (let x = 0.6; x < 20; x += 1.25) place(g, F.bush(0.32), x, 0.25, 9.82, x, { collide: false });
  for (let x = 2.5; x < 20; x += 5) place(g, F.palm(3.2), x, 0.3, 9.8, 0, { collide: false });

  // ---------------- garagem coberta ----------------
  boxMM(g, 0.15, 2.72, 0.0, 4.95, 2.98, 3.0, [M.concrete, M.concrete, M.concreteDark, M.ceiling, M.concrete, M.concrete]);
  boxMM(g, 0.15, 0, 2.62, 0.5, 2.72, 2.97, M.concrete, { collide: true });
  // número da casa
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshStandardMaterial({ map: textTexture('43', { color: '#151515', w: 256, h: 160, font: 'bold 130px Helvetica, Arial, sans-serif' }), transparent: true, roughness: 0.6 }));
  num.rotation.y = -PI / 2;
  num.position.set(0.145, 1.75, 2.8);
  g.add(num);
  // fitas de LED da garagem
  boxMM(g, 0.2, 2.7, 0.08, 4.9, 2.72, 0.12, M.ledWarm, { cast: false });
  boxMM(g, 0.2, 2.7, 2.88, 4.9, 2.72, 2.92, M.ledWarm, { cast: false });
  // carros
  place(g, F.car(M.carWhite, 'suv'), 2.45, 0, 1.4, -PI / 2, { shrink: 0.05 });
  place(g, F.car(M.carBlack, 'sedan'), 2.45, 0, 5.28, -PI / 2, { shrink: 0.05 });

  // ---------------- jardim frontal ----------------
  ground(g, 0.0, 6.6, 4.88, 8.5, M.grass, 0.008);
  boxMM(g, 0, 0, 6.55, 4.88, 0.12, 6.62, M.concreteDark);
  place(g, F.palm(4.2), 1.2, 0, 7.6, 0.4, { collide: false });
  world.colliders.push(new THREE.Box3(new THREE.Vector3(1.05, 0, 7.45), new THREE.Vector3(1.35, 3, 7.75)));
  place(g, F.plant('tropical', 1.6, M.terracotta), 3.0, 0, 7.4, 0);
  for (const [x, z, r] of [[0.4, 8.1, 0.45], [2.2, 8.2, 0.4], [3.8, 8.1, 0.5], [4.4, 7.0, 0.4], [0.5, 6.9, 0.35]]) place(g, F.bush(r), x, 0, z, x * 3, { collide: false });
  // canteiro junto à porta
  place(g, F.plant('tropical', 1.9), 4.45, 0, 4.5, 0);
  place(g, F.plant('small', 0.7), 4.5, 0, 2.55, 0);
  // árvores na calçada
  place(g, F.tree(5.5), -1.0, 0, -2.5, 0, { collide: false });
  place(g, F.tree(5), -1.0, 0, 12.5, 1, { collide: false });

  // ---------------- deck e piscina ----------------
  const px0 = 17.6, px1 = 19.6, pz0 = 0.6, pz1 = 3.6, depth = 1.4;
  const deck = (x0, z0, x1, z1) => boxMM(g, x0, -0.12, z0, x1, 0.02, z1, [M.deck, M.deck, M.deck, M.deck, M.deck, M.deck], { walk: true });
  deck(16.6, 0, 20, pz0);
  deck(16.6, pz1, 20, 5.0);
  deck(16.6, pz0, px0, pz1);
  deck(px1, pz0, 20, pz1);
  // borda (pedra) da piscina
  const cope = (x0, z0, x1, z1) => boxMM(g, x0, 0.0, z0, x1, 0.035, z1, M.marble, { walk: true });
  cope(px0 - 0.12, pz0 - 0.12, px1 + 0.12, pz0);
  cope(px0 - 0.12, pz1, px1 + 0.12, pz1 + 0.12);
  cope(px0 - 0.12, pz0, px0, pz1);
  cope(px1, pz0, px1 + 0.12, pz1);
  // tanque revestido de pastilha
  const poolMat = new THREE.MeshStandardMaterial({ map: M.tex.pool, roughness: 0.25 });
  boxMM(g, px0, -depth - 0.1, pz0, px1, -depth, pz1, poolMat, { cast: false });
  boxMM(g, px0 - 0.05, -depth, pz0 - 0.05, px1 + 0.05, -0.0, pz0, poolMat, { cast: false });
  boxMM(g, px0 - 0.05, -depth, pz1, px1 + 0.05, -0.0, pz1 + 0.05, poolMat, { cast: false });
  boxMM(g, px0 - 0.05, -depth, pz0, px0, -0.0, pz1, poolMat, { cast: false });
  boxMM(g, px1, -depth, pz0, px1 + 0.05, -0.0, pz1, poolMat, { cast: false });
  // degraus de entrada
  for (let i = 0; i < 3; i++) boxMM(g, px0, -depth, pz1 - 0.35 * (i + 1), px0 + 0.35 * (3 - i), -0.3 - i * 0.35, pz1 - 0.35 * i, poolMat, { cast: false });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(px1 - px0, pz1 - pz0), M.water);
  water.rotation.x = -PI / 2;
  water.position.set((px0 + px1) / 2, -0.08, (pz0 + pz1) / 2);
  water.renderOrder = 3;
  g.add(water);
  world.animated.push((t) => {
    M.tex.waterN.offset.set(t * 0.02, t * 0.013);
  });
  world.colliders.push(new THREE.Box3(new THREE.Vector3(px0 + 0.05, -3, pz0 + 0.05), new THREE.Vector3(px1 - 0.05, 0.8, pz1 - 0.05)));
  // luz da piscina
  for (const z of [1.4, 2.8]) {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), M.poolLight);
    spot.rotation.y = -PI / 2;
    spot.position.set(px1 - 0.002, -0.5, z);
    g.add(spot);
  }
  outdoorLight(scene, new THREE.PointLight(0x7fe3ff, 14, 5, 1.5), [(px0 + px1) / 2, -0.6, (pz0 + pz1) / 2]);
  // espreguiçadeiras
  place(g, F.lounger(), 18.6, 0.02, 4.1, PI / 2);
  place(g, F.plant('tropical', 1.5, M.terracotta), 16.95, 0.02, 0.35, 0);
  place(g, F.plant('small', 0.8), 19.6, 0.02, 4.7, 0);

  // ---------------- área gourmet ----------------
  ground(g, 16.6, 5.0, 19.85, 8.5, M.floorOut, 0.003);
  boxMM(g, 16.6, 0, 8.5, 19.85, CEIL1, 8.65, M.stoneWall, { collide: true });
  place(g, F.churrasqueira(1.8), 18.9, 0, 8.15, PI);
  place(g, F.sofaL(2.0, 0.85, 1.5, M.linen), 19.38, 0, 6.15, -PI / 2, { shrink: 0.05 });
  place(g, F.outdoorTable(0.4), 18.3, 0, 6.2, 0);
  place(g, F.stool(), 17.9, 0, 7.55, PI, { collide: false });
  place(g, F.plant('tropical', 1.4, M.terracotta), 17.0, 0, 5.4, 0);
  // pendentes da gourmet
  [17.6, 18.4].forEach((x) => place(g, F.pendant(0.7, 0.16, M.blackMetal), x, CEIL1, 6.4, 0, { collide: false }));

  // ---------------- iluminação externa (noite) ----------------
  // fachada: downlights da marquise e da garagem
  for (const z of [0.7, 2.2]) outdoorLight(scene, new THREE.SpotLight(0xffc98a, 45, 7, 0.8, 0.6, 1.5), [2.5, 2.65, z], [2.5, 0, z]);
  outdoorLight(scene, new THREE.SpotLight(0xffc98a, 35, 6, 0.8, 0.6, 1.5), [4.5, 2.65, 3.4], [4.5, 0, 3.4]);
  // uplights no ripado
  for (const z of [4.6, 5.8, 7.0, 8.2]) outdoorLight(scene, new THREE.SpotLight(0xffb870, 70, 8, 0.4, 0.8, 1.2), [4.55, 0.1, z], [4.85, 6, z]);
  // palmeira e jardim
  outdoorLight(scene, new THREE.SpotLight(0xffd29a, 60, 7, 0.5, 0.8, 1.2), [1.8, 0.1, 7.2], [1.2, 4, 7.6]);
  // corredor
  for (const x of [3, 9, 15]) outdoorLight(scene, new THREE.PointLight(0xffc98a, 5, 5, 1.6), [x, 0.5, 9.4]);
  // deck/gourmet
  outdoorLight(scene, new THREE.PointLight(0xffc98a, 8, 7, 1.6), [17.2, 2.5, 4.2]);

  // ---------------- vizinhança (contexto do condomínio) ----------------
  const nb = new THREE.Group();
  nb.name = 'vizinhos';
  g.add(nb);
  world.neighbors = nb;
  neighbors(nb, M);
  return g;
}

function verticalGarden(g, M, x, y0, z0, y1, z1) {
  const leaf = new THREE.SphereGeometry(1, 8, 5);
  leaf.scale(0.05, 0.012, 0.13);
  leaf.translate(0, 0, 0.1);
  const n = Math.round((y1 - y0) * (z1 - z0) * 420);
  const mats = [M.leaf, M.leafLight, M.leaf];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  mats.forEach((mat, k) => {
    const inst = new THREE.InstancedMesh(leaf, mat, Math.ceil(n / 3));
    for (let i = 0; i < inst.count; i++) {
      p.set(x - rnd() * 0.06, y0 + rnd() * (y1 - y0), z0 + rnd() * (z1 - z0));
      e.set((rnd() - 0.5) * 1.2, -Math.PI / 2 + (rnd() - 0.5) * 1.4, (rnd() - 0.5) * 3);
      q.setFromEuler(e);
      const s = 0.55 + rnd() * 0.5;
      sc.set(s, s, s);
      m4.compose(p, q, sc);
      inst.setMatrixAt(i, m4);
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    g.add(inst);
  });
}

function neighbors(g, M) {
  const glassDark = new THREE.MeshStandardMaterial({ color: 0x1d2328, roughness: 0.1, metalness: 0.6 });
  const warmWin = new THREE.MeshStandardMaterial({ color: 0x2a2520, emissive: 0xffc27a, emissiveIntensity: 0 });
  world.nightEmissive.push({ mat: warmWin, on: 0.9 });
  const house = (x0, z0, w, d, h, mat, flip = false) => {
    boxMM(g, x0, 0, z0, x0 + w, h, z0 + d, mat, { collide: true });
    boxMM(g, x0 - 0.05, h, z0 - 0.05, x0 + w + 0.05, h + 0.3, z0 + d + 0.05, M.concreteDark, { collide: false });
    // janelas na fachada voltada para a rua
    for (let i = 0; i < 2; i++) {
      boxMM(g, x0 - 0.02, 0.9, z0 + 1 + i * (d / 2), x0, 2.4, z0 + 1 + i * (d / 2) + d / 2 - 2, i ? warmWin : glassDark, { cast: false });
      boxMM(g, x0 - 0.02, 3.6, z0 + 1 + i * (d / 2), x0, 5.2, z0 + 1 + i * (d / 2) + d / 2 - 2, i ? glassDark : warmWin, { cast: false });
    }
  };
  house(5, -9.0, 11, 7.5, 6.2, M.plasterOut);
  house(6, 11.5, 10, 7.5, 6.4, M.concrete);
  house(5, -19, 12, 8, 3.2, M.plasterOut);
  house(5, 21.5, 11, 7.5, 6.0, M.plasterOut);
  // outro lado da rua
  const across = (z0, d, h, mat) => {
    boxMM(g, -24, 0, z0, -13, h, z0 + d, mat, { collide: false });
    boxMM(g, -13.02, 1, z0 + 1, -13, h - 1, z0 + d - 1, glassDark, { cast: false });
  };
  across(-12, 8, 6.4, M.concrete);
  across(-1, 9, 3.4, M.plasterOut);
  across(11, 8, 6.2, M.plasterOut);
  for (const [x, z, h] of [[-10.5, -6, 6], [-10.5, 5, 5.5], [-10.5, 16, 6.5], [24, 3, 7], [25, 12, 6], [24, -6, 6.5]]) place(g, F.tree(h), x, 0, z, x + z, { collide: false });
}
