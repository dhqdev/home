// Distribuição dos móveis por cômodo + iluminação interna (planta corrigida)
import * as THREE from 'three';
import * as F from './furniture.js';
import { place, world, box } from './geo.js';
import { FLOOR2, CEIL1, CEIL2 } from './plan.js';

const PI = Math.PI;
const E = PI / 2; // virado para +X
const W = -PI / 2; // virado para -X
const N = PI; // virado para -Z
const S = 0; // virado para +Z

const ART = [
  ['#e8dfd2', '#c46b3d', '#2f4858', '#d9a441'],
  ['#f1ebe2', '#7d8f69', '#e3b779', '#3b3b3b'],
  ['#f5efe6', '#6c8ea4', '#e9c46a', '#264653'],
  ['#efe7da', '#b5651d', '#1f3b4d', '#cfb997'],
];

export function furnish(scene, M) {
  F.setFurnitureMaterials(M);
  const g = new THREE.Group();
  g.name = 'moveis';
  scene.add(g);
  const up = world.upperGroup;
  const Y = FLOOR2;
  const art = (parent, w, h, i, x, y, z, ry) => place(parent, F.frameArt(w, h, ART[i % ART.length]), x, y, z, ry, { collide: false });
  const solid = (x0, y0, z0, x1, y1, z1) => world.colliders.push(new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)));

  // ====================== TÉRREO ======================
  // --- Escritório (envidraçado, junto à fachada) ---
  place(g, F.desk(1.0, 0.5), 5.62, 0, 0.38, S);
  place(g, F.officeChair(), 5.62, 0, 0.95, N, { collide: false });
  place(g, F.bookshelf(0.9, 0.42, 0.22), 5.62, 1.4, 0.24, S, { collide: false });
  place(g, F.plant('small', 0.6), 5.32, 0, 1.55, 0);
  art(g, 0.5, 0.65, 0, 6.13, 1.55, 1.15, W);

  // --- Hall de entrada ---
  place(g, F.plant('tropical', 1.9), 5.45, 0, 3.5, 0);
  place(g, F.vase(0.7), 6.0, 0, 2.05, 0, { collide: false });

  // --- Sala de estar: sofá em "L" encostado na parede de pedra, TV na parede do corredor ---
  const sofa = F.sofaL(1.8, 0.95, 1.6, M.sofa);
  sofa.scale.x = -1; // chaise do lado do escritório
  place(g, sofa, 7.15, 0, 0.6, S, { shrink: 0.05 });
  place(g, F.rug(2.6, 2.4), 7.45, 0, 2.0, 0, { collide: false });
  place(g, F.coffeeTableRound(0.42), 7.65, 0, 1.95, 0);
  place(g, F.tvPanel(2.2, 2.6), 7.3, 0, 3.76, N, { collide: false });
  solid(6.2, 0, 3.35, 8.4, 0.7, 3.84);
  place(g, F.armchair(M.leather), 9.3, 0, 2.45, W + 0.35);
  place(g, F.sideTable(), 9.45, 0, 1.65, 0);
  place(g, F.floorLamp(), 8.75, 0, 3.55, 0, { collide: false });
  place(g, F.plant('tropical', 1.15), 10.35, 0, 0.6, 0);
  art(g, 1.0, 0.7, 3, 10.0, 1.55, 3.83, N);
  // lustre de anéis no pé-direito duplo
  const rings = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc98a, emissiveIntensity: 1.2, roughness: 0.4 });
  world.nightEmissive.push({ mat: ringMat, on: 3.0, day: 1.0 });
  [[0.75, 3.7], [0.5, 3.25], [0.3, 2.95]].forEach(([r, y], i) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 10, 64), ringMat);
    t.rotation.x = PI / 2 + (i - 1) * 0.12;
    t.position.y = y;
    rings.add(t);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, CEIL2 - y), M.blackMetal);
    wire.position.set(r * 0.7, y + (CEIL2 - y) / 2, 0);
    rings.add(wire);
  });
  rings.position.set(7.65, 0, 1.95);
  g.add(rings);

  // --- Corredor ---
  place(g, F.console_(1.2, 0.3), 11.0, 0, 5.08, N);
  art(g, 0.9, 0.6, 1, 11.0, 1.6, 5.23, N);
  place(g, F.plant('small', 0.7), 11.95, 0, 5.05, 0);

  // --- Cozinha / copa ---
  place(g, F.counterRun(2.9, { sinkAt: 0.55 }), 13.75, 0, 0.42, S);
  place(g, F.fridge(), 15.7, 0, 0.47, S);
  place(g, F.ovenTower(0.62), 16.47, 0, 0.42, S);
  place(g, F.island(2.0, 1.0), 13.4, 0, 2.15, S);
  [12.75, 13.2, 13.65, 14.1].forEach((x) => place(g, F.stool(), x, 0, 3.0, N, { collide: false }));
  [12.9, 13.4, 13.9].forEach((x) => place(g, F.pendant(x < 13.6 ? 1.0 : 0.85, 0.14, M.blackMetal), x, x < 13.6 ? Y - 0.12 : CEIL1, 2.15, 0, { collide: false }));
  // mesa de jantar para 6 (+ cabeceira)
  place(g, F.diningTable(2.0, 0.95), 15.6, 0, 3.6, E);
  [15.0, 15.6, 16.2].forEach((x) => {
    place(g, F.chair(), x, 0, 2.95, S, { collide: false });
    place(g, F.chair(), x, 0, 4.25, N, { collide: false });
  });
  place(g, F.chair(), 14.38, 0, 3.6, E, { collide: false });
  const lin = new THREE.Group();
  box(lin, 0.08, 0.05, 1.4, M.blackMetal, 0, -0.85, 0);
  box(lin, 0.05, 0.01, 1.35, M.ledWarm, 0, -0.877, 0, { cast: false });
  box(lin, 0.004, 0.85, 0.004, M.blackMetal, 0, -0.42, -0.6, { cast: false });
  box(lin, 0.004, 0.85, 0.004, M.blackMetal, 0, -0.42, 0.6, { cast: false });
  place(g, lin, 15.6, CEIL1, 3.6, E, { collide: false });
  // aparador sob a janela da copa
  const buffet = new THREE.Group();
  box(buffet, 1.4, 0.7, 0.45, M.walnut, 0, 0.45, 0);
  for (const sx of [-1, 1]) box(buffet, 0.03, 0.1, 0.4, M.blackMetal, sx * 0.62, 0.05, 0);
  box(buffet, 0.004, 0.66, 0.005, M.blackMatte, 0, 0.45, 0.226, { cast: false });
  place(buffet, F.vase(0.45), -0.4, 0.8, 0, 0, { collide: false });
  place(g, buffet, 16.85, 0, 5.4, W);
  place(g, F.plant('tropical', 1.6), 16.75, 0, 6.05, 0);
  place(g, F.plant('small', 0.7), 12.35, 0, 4.0, 0);

  // --- Quarto 1 (cabeceira na parede do recuo) ---
  place(g, F.wardrobe(1.75, 2.6, 0.6), 5.98, 0, 5.66, S);
  place(g, F.bed(1.4, 1.95, M.linen, M.bed, 1.6), 6.4, 0, 7.355, N);
  place(g, F.nightstand(), 5.36, 0, 8.18, N);
  place(g, F.nightstand(), 7.45, 0, 8.18, N);
  place(g, F.rug(1.9, 1.3, M.rugDark), 6.4, 0, 6.6, 0, { collide: false });
  art(g, 0.9, 0.6, 1, 7.93, 1.6, 7.0, W);
  place(g, F.curtainPair(1.6, 2.65, 0.4), 5.16, 0, 6.8, E, { collide: false });

  // --- Banho social ---
  place(g, F.vanity(0.65, 1, M.marble, M.walnut, 0.6), 8.3, 0, 6.95, E);
  place(g, F.toilet(), 8.88, 0, 7.2, W);
  place(g, F.shower(1.08, 0.85), 8.6, 0, 8.015, N, { collide: false });

  // --- Quarto 2 ---
  place(g, F.wardrobe(1.75, 2.6, 0.6), 11.26, 0, 5.66, S);
  place(g, F.bed(1.4, 1.95, M.blueFab, M.bed, 1.6), 10.7, 0, 7.355, N);
  place(g, F.nightstand(), 9.65, 0, 8.18, N);
  place(g, F.nightstand(), 11.75, 0, 8.18, N);
  place(g, F.rug(1.9, 1.3, M.rug), 10.7, 0, 6.6, 0, { collide: false });
  art(g, 0.7, 0.5, 2, 12.13, 1.6, 7.0, W);

  // --- Lavabo ---
  place(g, F.vanity(0.6, 1, M.marbleDark, M.blackMatte, 0.45), 12.62, 0, 8.2, N);
  place(g, F.toilet(), 13.12, 0, 7.2, W);
  art(g, 0.35, 0.5, 3, 12.27, 1.5, 7.3, E);

  // --- Despensa ---
  place(g, F.shelves(1.6, 2.2, 0.35), 13.64, 0, 7.62, E);
  place(g, F.shelves(1.6, 2.2, 0.35), 14.66, 0, 7.62, W);

  // --- Lavanderia ---
  place(g, F.washer(), 15.3, 0, 8.12, N);
  place(g, F.washer(), 15.95, 0, 8.12, N);
  place(g, F.laundrySink(0.6), 16.7, 0, 8.15, N);
  place(g, F.shelves(1.4, 0.45, 0.3, true), 15.11, 1.55, 7.5, E, { collide: false });

  // ====================== SUPERIOR ======================
  // --- Circulação / mezanino ---
  place(up, F.plant('tropical', 1.4), 5.4, Y, 4.3, 0);
  art(up, 1.1, 0.75, 3, 7.8, Y + 1.55, 5.13, N);
  place(up, F.sofa(1.3, 0.55, M.leather, true), 7.8, Y, 4.86, N);
  place(up, F.plant('small', 0.7), 13.4, Y, 4.12, 0);

  // --- Suíte Master ---
  place(up, F.bed(1.6, 2.05, M.linen, M.bed), 8.1, Y, 7.305, N);
  place(up, F.nightstand(), 6.8, Y, 8.18, N);
  place(up, F.nightstand(), 9.4, Y, 8.18, N);
  place(up, F.rug(2.6, 1.8, M.rug), 8.1, Y, 6.6, 0, { collide: false });
  place(up, F.plant('tropical', 1.3), 6.8, Y, 6.6, 0);
  place(up, F.wardrobe(0.66, 2.5, 0.6), 6.18, Y, 8.1, E);
  art(up, 1.2, 0.5, 0, 8.1, Y + 1.85, 5.27, S);

  // --- Banho Master ---
  place(up, F.vanity(0.6, 1, M.marble, M.walnut, 0.7), 5.45, Y, 5.5, S);
  place(up, F.toilet(), 5.38, Y, 6.35, E);
  place(up, F.shower(1.34, 0.9), 5.77, Y, 7.19, N, { collide: false });
  place(up, F.towel(0.4), 6.43, Y, 6.9, W, { collide: false });

  // --- Closet ---
  place(up, F.wardrobe(1.8, 2.5, 0.55, M.oakFurn), 10.7, Y, 8.165, N);
  place(up, F.wardrobe(1.3, 2.5, 0.55, M.oakFurn), 11.365, Y, 6.85, W);
  const ott = new THREE.Group();
  box(ott, 0.8, 0.42, 0.5, M.leather, 0, 0.21, 0, { r: 0.05 });
  place(up, ott, 10.35, Y, 7.1, 0);
  box(up, 0.7, 1.7, 0.02, M.mirror, 10.35, Y + 1.0, 6.17, { cast: false });

  // --- Recanto de leitura (fim da circulação) ---
  place(up, F.armchair(M.sofa), 12.2, Y, 7.95, N + 0.2);
  place(up, F.floorLamp(), 11.95, Y, 8.3, 0, { collide: false });
  place(up, F.bookshelf(0.9, 2.2, 0.3), 12.49, Y, 6.8, W);

  // --- Suíte Isabela ---
  place(up, F.bed(1.4, 1.95, M.blueFab, M.bed, 1.6), 13.845, Y, 6.2, E);
  place(up, F.nightstand(), 12.97, Y, 7.25, E);
  place(up, F.wardrobe(1.8, 2.5, 0.6), 14.5, Y, 4.66, S);
  place(up, F.rug(1.6, 1.8, M.rug), 14.4, Y, 6.2, 0, { collide: false });
  place(up, F.plant('tropical', 1.2), 15.38, Y, 7.0, 0);
  place(up, F.curtainPair(2.2, 2.55, 0.4), 15.56, Y, 5.8, W, { collide: false });

  // --- Banho Isabela ---
  place(up, F.vanity(0.55, 1, M.marble, M.whiteLacquer, 0.4), 14.09, Y, 8.2, N);
  place(up, F.toilet(), 14.6, Y, 8.15, N);
  place(up, F.shower(1.08, 0.8), 15.22, Y, 7.9, W, { collide: false });

  // --- Estar íntimo ---
  place(up, F.sofa(1.9, 0.85, M.sofaDark), 14.5, Y, 3.8, N);
  place(up, F.tvPanel(1.6, 2.4), 14.5, Y, 0.24, S, { collide: false });
  solid(13.7, Y, 0.1, 15.3, Y + 0.7, 0.65);
  place(up, F.rug(1.8, 1.6, M.rugDark), 14.5, Y, 2.3, 0, { collide: false });
  place(up, F.coffeeTableRound(0.35), 14.5, Y, 2.35, 0);
  place(up, F.armchair(M.linen), 14.05, Y, 1.35, E + 0.4);
  place(up, F.curtainPair(3.3, 2.55, 0.4), 15.56, Y, 2.05, W, { collide: false });

  // --- Varanda ---
  place(up, F.armchair(M.linen), 16.5, Y, 1.3, E);
  place(up, F.armchair(M.linen), 16.5, Y, 2.6, E);
  place(up, F.outdoorTable(0.3), 16.6, Y, 1.95, 0);
  place(up, F.plant('tropical', 1.4, M.terracotta), 16.8, Y, 0.45, 0);
  place(up, F.plant('tropical', 1.4, M.terracotta), 16.8, Y, 8.0, 0);
  place(up, F.lounger(), 16.45, Y, 6.0, S);

  // ====================== LUZES INTERNAS ======================
  const lamps = [
    // [x, y, z, intensidade, alcance]
    [5.6, 2.55, 0.9, 1.2, 3], // escritório
    [7.8, 5.2, 2.0, 6, 12], // sala (pé-direito duplo)
    [5.6, 5.2, 2.9, 1.6, 6], // hall
    [7.4, 2.55, 4.6, 1.4, 5], // corredor
    [10.6, 2.55, 4.6, 1.2, 5],
    [14.4, 2.55, 1.9, 2.6, 7], // cozinha
    [15.6, 2.4, 3.6, 1.6, 5], // jantar
    [14.6, 2.55, 5.5, 1.2, 5],
    [6.5, 2.55, 6.9, 2.0, 5], // quarto 1
    [8.6, 2.55, 7.5, 0.9, 3], // banho social
    [10.7, 2.55, 6.9, 2.0, 5], // quarto 2
    [12.8, 2.55, 7.5, 0.7, 3], // lavabo
    [14.15, 2.55, 7.5, 0.6, 3], // despensa
    [16.0, 2.55, 7.5, 1.0, 4], // lavanderia
    [18.6, 2.55, 7.0, 2.0, 6], // gourmet
    [7.0, 5.5, 4.55, 1.6, 6], // circulação
    [11.4, 5.5, 4.2, 1.4, 5],
    [8.1, 5.5, 6.9, 2.2, 5], // suíte master
    [5.75, 5.5, 6.5, 1.0, 3], // banho master
    [10.7, 5.5, 7.3, 1.0, 4], // closet
    [12.2, 5.5, 7.2, 0.8, 3], // recanto
    [14.2, 5.5, 5.8, 2.0, 5], // suíte Isabela
    [14.7, 5.5, 7.9, 0.8, 3], // banho Isabela
    [14.6, 5.5, 2.1, 2.0, 5], // estar íntimo
    [16.45, 5.5, 4.2, 1.4, 6], // varanda
  ];
  const disc = new THREE.CircleGeometry(0.055, 20);
  for (const [x, y, z, I, d] of lamps) {
    const l = new THREE.PointLight(0xffd2a0, I, d, 1.6);
    l.position.set(x, y, z);
    l.userData.base = I;
    const parent = y > 4 ? up : scene;
    parent.add(l);
    world.nightLights.push(l);
    // spots de embutir no forro (menos no vazio da sala e sob a claraboia)
    const ceil = y > 4 ? CEIL2 : CEIL1;
    const inVoid = y > 4 && x < 11 && z < 3.9;
    if (!inVoid) {
      for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
        const px = x + dx * (d > 4 ? 1 : 0.5), pz = z + dz * (d > 4 ? 1 : 0.5);
        if (y < 4 && px > 12.1 && px < 13.6 && pz < 2.9) continue;
        const m = new THREE.Mesh(disc, M.bulb);
        m.rotation.x = PI / 2;
        m.position.set(px, ceil - 0.002, pz);
        parent.add(m);
      }
    }
  }
  return g;
}
