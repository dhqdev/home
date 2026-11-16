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
  ground(g, 0, 0, 17.2, 10, M.grass, -0.02);
  ground(g, 17.2, 8.5, 20, 10, M.grass, -0.02);
  // rua e calçada
  ground(g, -9, -60, -1.8, 70, M.asphalt, -0.035);
  boxMM(g, -1.9, -0.035, -60, -1.8, 0.1, 70, M.concrete, { walk: true });
  ground(g, -1.8, -60, 0, 70, M.pavers, 0.0);
  // faixa central tracejada
  for (let z = -58; z < 68; z += 4) boxMM(g, -5.48, -0.03, z, -5.32, -0.028, z + 2, M.plasticWhite, { cast: false });

  // ---------------- frente: garagem (2,80 + 2,70), passeio e jardim ----------------
  ground(g, 0, 0.6, 4.4, 3.4, M.paversDark, 0.005); // vaga coberta
  ground(g, 0, 3.4, 4.4, 6.1, M.concregrama, 0.004); // vaga descoberta
  ground(g, 4.4, 0.6, 5.0, 8.5, M.pavers, 0.006); // calçada junto à fachada
  // passeio de pedestres com faixas de grama (como na planta)
  for (let x = 0.0; x < 4.4; x += 0.55) ground(g, x, 6.1, Math.min(x + 0.4, 4.4), 7.3, M.pavers, 0.006);
  // corredor lateral (recuo de 1,50 m)
  ground(g, 0, 8.6, 20, 9.55, M.pavers, 0.006);

  // ---------------- muros de divisa ----------------
  const wallH = 2.2;
  boxMM(g, 0, 0, -0.15, 5, wallH, 0.0, M.plasterOut, { collide: true });
  boxMM(g, 17.2, 0, -0.15, 20, wallH, 0.0, M.plasterOut, { collide: true });
  boxMM(g, 0, 0, 10, 20.15, wallH, 10.15, M.plasterOut, { collide: true });
  boxMM(g, 20, 0, -0.15, 20.15, wallH, 10.15, M.plasterOut, { collide: true });
  boxMM(g, 19.85, 0, 5.5, 20, FLOOR2, 8.5, M.stoneWall, { collide: true });
  // jardim vertical no muro dos fundos (atrás da piscina)
  boxMM(g, 19.9, 0.3, 0.2, 20, 2.15, 5.4, M.soil, { cast: false });
  verticalGarden(g, M, 19.9, 0.35, 0.25, 2.1, 5.35);
  // muretas/canteiro do corredor
  boxMM(g, 0, 0, 9.55, 20, 0.35, 9.62, M.concreteDark, { collide: true });
  ground(g, 0, 9.62, 20, 10, M.soil, 0.3, { walk: false });
  for (let x = 0.6; x < 20; x += 1.25) place(g, F.bush(0.32), x, 0.25, 9.82, x, { collide: false });
  for (let x = 2.5; x < 20; x += 5) place(g, F.palm(3.2), x, 0.3, 9.8, 0, { collide: false });
  // canteiro junto ao muro esquerdo (frente)
  ground(g, 0, 0, 4.4, 0.6, M.soil, 0.02, { walk: false });
  boxMM(g, 0, 0, 0.58, 4.4, 0.12, 0.62, M.concreteDark);
  for (const x of [0.5, 1.5, 2.5, 3.5]) place(g, F.bush(0.28), x, 0.02, 0.3, x, { collide: false });

  // ---------------- garagem coberta (laje leve sobre a vaga coberta) ----------------
  boxMM(g, 0.15, 2.55, 0.0, 4.4, 2.75, 3.45, [M.concrete, M.concrete, M.concreteDark, M.ceiling, M.concrete, M.concrete]);
  boxMM(g, 0.15, 0, 3.1, 0.45, 2.55, 3.45, M.concrete, { collide: true });
  boxMM(g, 4.1, 0, 3.1, 4.4, 2.55, 3.45, M.concrete, { collide: true });
  // número da casa
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshStandardMaterial({ map: textTexture('43', { color: '#151515', w: 256, h: 160, font: 'bold 130px Helvetica, Arial, sans-serif' }), transparent: true, roughness: 0.6 }));
  num.rotation.y = -PI / 2;
  num.position.set(0.145, 1.75, 3.27);
  g.add(num);
  // fitas de LED da garagem
  boxMM(g, 0.2, 2.53, 0.08, 4.35, 2.55, 0.12, M.ledWarm, { cast: false });
  boxMM(g, 0.5, 2.53, 3.3, 4.05, 2.55, 3.34, M.ledWarm, { cast: false });
  // carros
  place(g, F.car(M.carWhite, 'suv'), 2.15, 0, 2.0, -PI / 2, { shrink: 0.05 });
  place(g, F.car(M.carBlack, 'sedan'), 2.15, 0, 4.75, -PI / 2, { shrink: 0.05 });

  // ---------------- jardim frontal ----------------
  place(g, F.palm(4.2), 1.3, 0, 7.95, 0.4, { collide: false });
  world.colliders.push(new THREE.Box3(new THREE.Vector3(1.15, 0, 7.8), new THREE.Vector3(1.45, 3, 8.1)));
  place(g, F.plant('tropical', 1.6, M.terracotta), 2.6, 0, 8.1, 0);
  for (const [x, z, r] of [[0.4, 8.2, 0.4], [2.4, 8.2, 0.4], [4.1, 8.15, 0.35], [4.15, 7.55, 0.3]]) place(g, F.bush(r), x, 0, z, x * 3, { collide: false });
  // canteiro junto à porta
  place(g, F.plant('tropical', 1.9, M.terracotta), 3.75, 0, 8.05, 0);
  place(g, F.plant('small', 0.7), 4.72, 0, 3.72, 0);
  // árvores na calçada
  place(g, F.tree(5.5), -1.0, 0, -2.5, 0, { collide: false });
  place(g, F.tree(5), -1.0, 0, 12.5, 1, { collide: false });

  // ---------------- deck e piscina (3,00 x 2,00) ----------------
  const px0 = 17.7, px1 = 19.7, pz0 = 0.8, pz1 = 3.8, depth = 1.4;
  const deck = (x0, z0, x1, z1) => boxMM(g, x0, -0.12, z0, x1, 0.02, z1, [M.deck, M.deck, M.deck, M.deck, M.deck, M.deck], { walk: true });
  deck(17.2, 0, 20, pz0);
  deck(17.2, pz1, 20, 5.5);
  deck(17.2, pz0, px0, pz1);
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
  for (const z of [1.6, 3.0]) {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), M.poolLight);
    spot.rotation.y = -PI / 2;
    spot.position.set(px1 - 0.002, -0.5, z);
    g.add(spot);
  }
  outdoorLight(scene, new THREE.PointLight(0x7fe3ff, 14, 5, 1.5), [(px0 + px1) / 2, -0.6, (pz0 + pz1) / 2]);
  // espreguiçadeiras e vasos
  place(g, F.lounger(), 18.7, 0.02, 4.65, PI / 2);
  place(g, F.lounger(), 18.7, 0.02, 0.4, PI / 2);
  place(g, F.plant('tropical', 1.5, M.terracotta), 17.5, 0.02, 0.35, 0);
  place(g, F.plant('small', 0.8), 19.6, 0.02, 5.2, 0);

  // ---------------- área gourmet (coberta, nos fundos) ----------------
  ground(g, 17.2, 5.5, 19.85, 8.5, M.floorOut, 0.003);
  boxMM(g, 17.2, 0, 8.5, 19.85, CEIL1, 8.65, M.stoneWall, { collide: true });
  place(g, F.churrasqueira(1.8), 18.65, 0, 8.17, PI);
  place(g, F.sofaL(2.0, 0.85, 1.5, M.linen), 19.4, 0, 6.55, -PI / 2, { shrink: 0.05 });
  place(g, F.outdoorTable(0.4), 18.3, 0, 6.15, 0);
  place(g, F.plant('tropical', 1.4, M.terracotta), 17.5, 0, 5.8, 0);
  [17.9, 18.7].forEach((x) => place(g, F.pendant(0.7, 0.16, M.blackMetal), x, CEIL1, 6.4, 0, { collide: false }));

  // ---------------- iluminação externa (noite) ----------------
  // garagem e marquise
  for (const z of [1.2, 2.6]) outdoorLight(scene, new THREE.SpotLight(0xffc98a, 45, 7, 0.8, 0.6, 1.5), [2.3, 2.5, z], [2.3, 0, z]);
  outdoorLight(scene, new THREE.SpotLight(0xffc98a, 35, 6, 0.8, 0.6, 1.5), [4.3, 2.65, 4.6], [4.3, 0, 4.6]);
  // uplights no ripado
  for (const z of [4.6, 5.8, 7.0, 8.2]) outdoorLight(scene, new THREE.SpotLight(0xffb870, 70, 8, 0.4, 0.8, 1.2), [4.55, 0.1, z], [4.8, 6, z]);
  // fachada envidraçada
  outdoorLight(scene, new THREE.SpotLight(0xffb870, 50, 8, 0.6, 0.8, 1.2), [4.5, 0.1, 0.1], [4.8, 6, 0.1]);
  // palmeira e jardim
  outdoorLight(scene, new THREE.SpotLight(0xffd29a, 60, 7, 0.5, 0.8, 1.2), [2.0, 0.1, 7.4], [1.3, 4, 7.95]);
  // corredor
  for (const x of [3, 9, 15]) outdoorLight(scene, new THREE.PointLight(0xffc98a, 5, 5, 1.6), [x, 0.5, 9.4]);
  // deck
  outdoorLight(scene, new THREE.PointLight(0xffc98a, 8, 7, 1.6), [17.6, 2.5, 4.6]);

  // ---------------- vizinhança (contexto do condomínio) ----------------
  const nb = new THREE.Group();
  nb.name = 'vizinhos';
  g.add(nb);
  world.neighbors = nb;
  neighbors(nb, M);
  return g;
}

function verticalGarden(g, M, x, y0, z0, y1, z1) {
  const leaf = new THREE.PlaneGeometry(0.34, 0.34);
  leaf.translate(0, 0, 0.06);
  const n = Math.round((y1 - y0) * (z1 - z0) * 150);
  const mats = [M.foliage, M.foliageLight, M.foliageDark];
  // fundo verde escuro para não aparecer o muro entre as folhas
  boxMM(g, x - 0.02, y0, z0, x, y1, z1, M.leaf, { cast: false });
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
  house(5, -9.0, 12.2, 7.5, 6.2, M.plasterOut);
  house(5, 11.5, 12.2, 7.5, 6.4, M.concrete);
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
