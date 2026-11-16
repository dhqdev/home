// Distribuição dos móveis por cômodo + iluminação interna
import * as THREE from 'three';
import * as F from './furniture.js';
import { place, world, box, boxMM } from './geo.js';
import { FLOOR2, CEIL1, CEIL2 } from './plan.js';

const PI = Math.PI;
const E = PI / 2; // virado para +X
const W = -PI / 2; // virado para -X
const N = PI; // virado para -Z
const S = 0; // virado para +Z

export function furnish(scene, M) {
  F.setFurnitureMaterials(M);
  const g = new THREE.Group();
  g.name = 'moveis';
  scene.add(g);
  const up = world.upperGroup;
  const Y = FLOOR2;

  // ====================== TÉRREO ======================
  // --- Escritório ---
  place(g, F.desk(1.2, 0.55), 5.75, 0, 0.39, S);
  place(g, F.officeChair(), 5.75, 0, 0.95, N, { collide: false });
  place(g, F.bookshelf(0.8, 2.2, 0.32), 6.38, 0, 1.3, W);
  place(g, F.plant('small', 0.6), 5.3, 0, 1.5, 0);
  place(g, F.frameArt(0.5, 0.65, ['#e8dfd2', '#c46b3d', '#2f4858', '#d9a441']), 5.12, 1.65, 0.9, E, { collide: false });

  // --- Sala de estar ---
  place(g, F.tvPanel(1.7, 2.6), 6.74, 0, 0.92, E, { collide: false });
  world.colliders.push(new THREE.Box3(new THREE.Vector3(6.66, 0, 0.1), new THREE.Vector3(7.12, 0.7, 1.75)));
  place(g, F.rug(2.6, 3.2), 8.0, 0, 2.7, E, { collide: false });
  place(g, F.sofaL(2.6, 0.95, 1.6, M.sofa), 9.3, 0, 2.65, W, { shrink: 0.05 });
  place(g, F.coffeeTableRound(0.45), 7.95, 0, 2.55, 0);
  place(g, F.sideTable(), 7.95, 0, 3.4, 0);
  place(g, F.armchair(M.leather), 7.2, 0, 4.35, PI * 0.8);
  place(g, F.floorLamp(), 6.85, 0, 4.85, 0, { collide: false });
  place(g, F.plant('tropical', 1.8), 6.95, 0, 1.55, 0);
  place(g, F.plant('tropical', 1.5), 5.4, 0, 4.7, 0);
  // lustre de anéis (pé-direito duplo), como no render do projeto
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
  rings.position.set(8.0, 0, 2.5);
  g.add(rings);

  // --- Cozinha / copa ---
  place(g, F.fridge(), 12.0, 0, 0.47, S);
  place(g, F.ovenTower(0.62), 12.76, 0, 0.42, S);
  place(g, F.counterRun(2.85, { sinkAt: 0.6 }), 14.5, 0, 0.42, S);
  place(g, F.island(2.0, 1.0), 13.05, 0, 2.4, S);
  [12.45, 12.85, 13.25, 13.65].forEach((x) => place(g, F.stool(), x, 0, 3.22, S, { collide: false }));
  [12.55, 13.05, 13.55].forEach((x) => place(g, F.pendant(0.85, 0.14, M.blackMetal), x, CEIL1, 2.35, 0, { collide: false }));
  place(g, F.diningTable(2.0, 0.95), 15.4, 0, 2.0, S);
  [1.4, 2.0, 2.6].forEach((z) => {
    place(g, F.chair(), 14.73, 0, z, E, { collide: false });
    place(g, F.chair(), 16.07, 0, z, W, { collide: false });
  });
  // pendente linear sobre a mesa
  const lin = new THREE.Group();
  box(lin, 0.08, 0.05, 1.4, M.blackMetal, 0, -0.85, 0);
  box(lin, 0.05, 0.01, 1.35, M.ledWarm, 0, -0.877, 0, { cast: false });
  box(lin, 0.004, 0.85, 0.004, M.blackMetal, 0, -0.42, -0.6, { cast: false });
  box(lin, 0.004, 0.85, 0.004, M.blackMetal, 0, -0.42, 0.6, { cast: false });
  place(g, lin, 15.4, CEIL1, 2.0, 0, { collide: false });
  place(g, F.plant('tropical', 1.6), 16.2, 0, 4.7, 0);
  place(g, F.plant('small', 0.6), 11.2, 0, 4.85, 0);

  // --- Quarto 1 ---
  place(g, F.wardrobe(1.8, 2.6, 0.6), 6.0, 0, 5.57, S);
  place(g, F.bed(1.4, 1.95, M.linen, M.bed), 6.4, 0, 7.35, N);
  place(g, F.nightstand(), 5.35, 0, 8.15, N);
  place(g, F.nightstand(), 7.45, 0, 8.15, N);
  place(g, F.rug(1.8, 1.2, M.rugDark), 6.4, 0, 6.6, 0, { collide: false });
  place(g, F.frameArt(0.9, 0.6, ['#f1ebe2', '#7d8f69', '#e3b779', '#3b3b3b']), 7.93, 1.6, 6.9, W, { collide: false });

  // --- Banho social ---
  place(g, F.vanity(0.7, 1, M.marble, M.walnut), 8.9, 0, 6.75, W);
  place(g, F.toilet(), 8.36, 0, 7.2, E);
  place(g, F.shower(1.08, 0.85), 8.6, 0, 8.02, S, { collide: false });
  place(g, F.towel(0.4), 8.6, 0, 6.36, S, { collide: false });

  // --- Quarto 2 ---
  place(g, F.wardrobe(1.7, 2.6, 0.6), 11.25, 0, 5.57, S);
  place(g, F.bed(1.4, 1.95, M.blueFab, M.bed), 10.75, 0, 7.35, N);
  place(g, F.nightstand(), 9.7, 0, 8.15, N);
  place(g, F.nightstand(), 11.8, 0, 8.15, N);
  place(g, F.armchair(M.blueFab), 9.68, 0, 6.9, E);
  place(g, F.frameArt(0.7, 0.5, ['#f5efe6', '#6c8ea4', '#e9c46a', '#264653']), 12.13, 1.6, 6.9, W, { collide: false });

  // --- Lavabo ---
  place(g, F.vanity(0.6, 1, M.marbleDark, M.blackMatte), 12.5, 0, 6.0, E);
  place(g, F.toilet(), 12.8, 0, 6.85, N);

  // --- Despensa ---
  place(g, F.shelves(1.2, 2.2, 0.4), 13.66, 0, 6.4, E);
  place(g, F.shelves(1.2, 2.2, 0.4), 14.64, 0, 6.4, W);

  // --- Lavanderia ---
  place(g, F.washer(), 15.27, 0, 8.1, E);
  place(g, F.washer(), 15.27, 0, 7.45, E);
  place(g, F.laundrySink(0.6), 16.15, 0, 8.18, N);
  place(g, F.shelves(1.5, 0.4, 0.3, true), 15.25, 1.6, 6.5, E, { collide: false });

  // ====================== SUPERIOR ======================
  // --- Circulação ---
  place(up, F.plant('tropical', 1.4), 5.45, Y, 4.5, 0);
  place(up, F.frameArt(1.1, 0.75, ['#efe7da', '#b5651d', '#1f3b4d', '#cfb997']), 7.8, Y + 1.55, 5.23, N, { collide: false });
  place(up, F.sofa(1.3, 0.55, M.leather, true), 7.9, Y, 4.95, N);
  place(up, F.plant('small', 0.7), 12.1, Y, 3.1, 0);

  // --- Suíte Master ---
  place(up, F.bed(1.6, 2.05, M.linen, M.bed), 7.8, Y, 6.47, S);
  place(up, F.nightstand(), 6.82, Y, 5.68, S);
  place(up, F.nightstand(), 8.8, Y, 5.68, S);
  place(up, F.rug(2.6, 2.0, M.rug), 7.8, Y, 7.0, 0, { collide: false });
  place(up, F.armchair(M.sofa), 9.45, Y, 7.85, PI * 1.2);
  place(up, F.sideTable(), 9.6, Y, 7.1, 0);
  place(up, F.plant('tropical', 1.3), 6.85, Y, 8.15, 0);

  // --- Banho Master ---
  place(up, F.toilet(), 5.4, Y, 6.4, E);
  const vm = F.vanity(0.75, 1, M.marble, M.walnut, 0.4);
  place(up, vm, 5.34, Y, 7.17, E);
  place(up, F.shower(1.34, 0.84), 5.77, Y, 8.02, S, { collide: false });

  // --- Closet ---
  place(up, F.wardrobe(2.3, 2.5, 0.55, M.oakFurn), 11.2, Y, 8.16, N);
  place(up, F.wardrobe(1.2, 2.5, 0.55, M.oakFurn), 12.08, Y, 7.2, W);
  const ott = new THREE.Group();
  box(ott, 0.8, 0.42, 0.5, M.leather, 0, 0.21, 0, { r: 0.05 });
  place(up, ott, 10.95, Y, 7.4, 0);
  box(up, 0.7, 1.7, 0.02, M.mirror, 10.9, Y + 1.0, 6.57, { cast: false });

  // --- Suíte Isabela ---
  place(up, F.bed(1.4, 1.95, M.blueFab, M.bed, 1.6), 14.0, Y, 3.37, S);
  place(up, F.nightstand(), 15.05, Y, 2.6, S);
  place(up, F.wardrobe(1.8, 2.5, 0.6), 12.76, Y, 3.35, E);
  place(up, F.desk(1.0, 0.5), 13.9, Y, 5.0, N);
  place(up, F.rug(1.6, 1.2, M.rug), 14.0, Y, 4.6, 0, { collide: false });

  // --- Banho Isabela ---
  place(up, F.vanity(0.6, 1, M.marble, M.whiteLacquer, 0.4), 15.1, Y, 5.85, W);
  place(up, F.toilet(), 14.5, Y, 6.0, E);
  place(up, F.shower(1.08, 0.78), 14.8, Y, 6.85, S, { collide: false });

  // --- Estar íntimo ---
  place(up, F.sofa(1.6, 0.85, M.sofaDark), 13.73, Y, 7.4, W);
  place(up, F.tvPanel(1.3, 2.4), 12.5, Y, 7.45, E, { collide: false });
  world.colliders.push(new THREE.Box3(new THREE.Vector3(12.45, Y, 6.8), new THREE.Vector3(12.85, Y + 0.7, 8.1)));
  place(up, F.rug(1.4, 1.6, M.rugDark), 13.2, Y, 7.4, 0, { collide: false });
  place(up, F.plant('tropical', 1.3), 12.75, Y, 8.15, 0);

  // ====================== LUZES INTERNAS ======================
  const lamps = [
    // [x, y, z, intensidade, alcance]
    [5.8, 2.55, 0.9, 1.4, 4],
    [8.2, 5.2, 2.4, 6, 12],
    [6.0, 2.55, 3.4, 1.6, 6],
    [11.3, 2.55, 2.4, 2.2, 6],
    [14.0, 2.55, 2.6, 2.6, 7],
    [15.4, 2.4, 2.0, 1.6, 5],
    [14.2, 2.55, 4.6, 1.4, 5],
    [6.5, 2.55, 6.9, 2.0, 5],
    [8.6, 2.55, 7.4, 1.0, 3],
    [10.7, 2.55, 6.9, 2.0, 5],
    [12.8, 2.55, 6.2, 0.8, 3],
    [14.1, 2.55, 6.2, 0.8, 3],
    [15.7, 2.55, 6.9, 1.2, 4],
    [18.2, 2.55, 6.7, 2.0, 6],
    [8.0, 5.5, 4.7, 1.8, 6],
    [11.4, 5.5, 4.0, 1.4, 5],
    [8.2, 5.5, 6.9, 2.2, 5],
    [5.75, 5.5, 7.2, 1.0, 3],
    [11.2, 5.5, 7.5, 1.2, 4],
    [13.9, 5.5, 3.8, 2.0, 5],
    [14.8, 5.5, 6.3, 0.9, 3],
    [13.3, 5.5, 6.9, 1.4, 4],
  ];
  const disc = new THREE.CircleGeometry(0.055, 20);
  for (const [x, y, z, I, d] of lamps) {
    const l = new THREE.PointLight(0xffd2a0, I, d, 1.6);
    l.position.set(x, y, z);
    l.userData.base = I;
    const parent = y > 4 ? up : scene;
    parent.add(l);
    world.nightLights.push(l);
    // spot de embutir no forro
    const ceil = y > 4 ? CEIL2 : CEIL1;
    if (!(x > 6.6 && x < 10.4 && z < 4 && y > 4)) {
      for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
        const m = new THREE.Mesh(disc, M.bulb);
        m.rotation.x = PI / 2;
        m.position.set(x + dx * (d > 4 ? 1 : 0.5), ceil - 0.002, z + dz * (d > 4 ? 1 : 0.5));
        parent.add(m);
      }
    }
  }
  return g;
}
