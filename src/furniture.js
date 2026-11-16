// Móveis e objetos modelados proceduralmente.
// Convenção: origem no chão, no centro; a "frente" do móvel aponta para +Z local.
import * as THREE from 'three';
import { box, cyl, sphere, boxGeo, world } from './geo.js';
import { artwork, tvScreen } from './textures.js';

let M;
export function setFurnitureMaterials(m) {
  M = m;
}

const G = () => new THREE.Group();

// ---------------- Sala ----------------
export function sofaL(len = 2.6, dep = 0.95, chaise = 1.6, mat = M.sofa) {
  const g = G();
  const seatH = 0.42, backH = 0.82, arm = 0.18;
  // base
  box(g, len, 0.12, dep, M.walnut, 0, 0.06, 0);
  box(g, dep, 0.12, chaise - dep, M.walnut, len / 2 - dep / 2, 0.06, dep / 2 + (chaise - dep) / 2);
  // assentos
  const nSeats = 3;
  const sw = (len - arm) / nSeats;
  for (let i = 0; i < nSeats; i++) {
    box(g, sw - 0.02, 0.2, dep - 0.25, mat, -len / 2 + arm + sw / 2 + i * sw, seatH - 0.1, 0.1, { r: 0.06 });
  }
  box(g, dep - 0.02, 0.2, chaise - dep + 0.1, mat, len / 2 - dep / 2, seatH - 0.1, dep / 2 + (chaise - dep) / 2 - 0.05, { r: 0.06 });
  box(g, len, 0.2, dep, mat, 0, 0.22, 0, { r: 0.04 });
  box(g, dep, 0.2, chaise - dep, mat, len / 2 - dep / 2, 0.22, dep / 2 + (chaise - dep) / 2, { r: 0.04 });
  // encosto
  box(g, len, backH - 0.12, 0.2, mat, 0, 0.12 + (backH - 0.12) / 2, -dep / 2 + 0.1, { r: 0.06 });
  // braço
  box(g, arm, 0.6, dep, mat, -len / 2 + arm / 2, 0.3 + 0.12 / 2, 0, { r: 0.06 });
  // almofadas de encosto
  for (let i = 0; i < nSeats; i++) {
    box(g, sw - 0.06, 0.42, 0.16, mat, -len / 2 + arm + sw / 2 + i * sw, 0.62, -dep / 2 + 0.27, { r: 0.07, rx: -0.2 });
  }
  // almofadas decorativas
  box(g, 0.42, 0.42, 0.12, M.throw, -len / 2 + 0.5, 0.62, -dep / 2 + 0.42, { r: 0.05, rx: -0.25, rz: 0.1 });
  box(g, 0.42, 0.42, 0.12, M.blueFab, len / 2 - 0.6, 0.62, -dep / 2 + 0.42, { r: 0.05, rx: -0.25, rz: -0.08 });
  return g;
}

export function sofa(len = 2.2, dep = 0.9, mat = M.sofa, legs = true) {
  const g = G();
  const y = legs ? 0.12 : 0;
  if (legs) for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.02, 0.015, 0.12, M.blackMetal, sx * (len / 2 - 0.1), 0.06, sz * (dep / 2 - 0.1));
  box(g, len, 0.22, dep, mat, 0, y + 0.11, 0, { r: 0.04 });
  const n = Math.max(2, Math.round(len / 0.8));
  const sw = (len - 0.3) / n;
  for (let i = 0; i < n; i++) box(g, sw - 0.02, 0.16, dep - 0.25, mat, -len / 2 + 0.15 + sw / 2 + i * sw, y + 0.29, 0.08, { r: 0.06 });
  box(g, len, 0.5, 0.2, mat, 0, y + 0.47, -dep / 2 + 0.1, { r: 0.06 });
  for (const s of [-1, 1]) box(g, 0.15, 0.4, dep, mat, s * (len / 2 - 0.075), y + 0.3, 0, { r: 0.05 });
  box(g, 0.4, 0.4, 0.12, M.throw, -len / 2 + 0.45, y + 0.52, -dep / 2 + 0.3, { r: 0.05, rx: -0.25 });
  return g;
}

export function armchair(mat = M.leather) {
  const g = G();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.015, 0.012, 0.2, M.walnut, sx * 0.3, 0.1, sz * 0.3);
  box(g, 0.72, 0.14, 0.72, M.walnut, 0, 0.24, 0, { r: 0.02 });
  box(g, 0.64, 0.12, 0.6, mat, 0, 0.36, 0.04, { r: 0.05 });
  box(g, 0.7, 0.5, 0.12, mat, 0, 0.6, -0.3, { r: 0.05, rx: -0.15 });
  for (const s of [-1, 1]) box(g, 0.06, 0.24, 0.62, M.walnut, s * 0.34, 0.42, 0, { r: 0.02 });
  return g;
}

export function coffeeTableRound(r = 0.45, h = 0.38, mat = M.freijo) {
  const g = G();
  cyl(g, r, r, 0.05, mat, 0, h - 0.025, 0, { seg: 40 });
  cyl(g, r * 0.6, r * 0.6, h - 0.05, mat, 0, (h - 0.05) / 2, 0, { seg: 32 });
  // objetos
  cyl(g, 0.08, 0.06, 0.12, M.ceramicPot, r * 0.3, h + 0.06, 0.05);
  sphere(g, 0.1, M.leaf, r * 0.3, h + 0.17, 0.05, { sx: 1, sy: 0.7 });
  box(g, 0.24, 0.04, 0.3, M.book[0], -r * 0.3, h + 0.02, -0.05);
  box(g, 0.22, 0.03, 0.28, M.book[4], -r * 0.3, h + 0.055, -0.05);
  return g;
}

export function sideTable(mat = M.freijo) {
  const g = G();
  cyl(g, 0.22, 0.22, 0.03, mat, 0, 0.5, 0, { seg: 32 });
  cyl(g, 0.02, 0.02, 0.5, M.blackMetal, 0, 0.25, 0);
  cyl(g, 0.15, 0.15, 0.02, M.blackMetal, 0, 0.01, 0);
  return g;
}

export function rug(w, d, mat = M.rug) {
  const g = G();
  box(g, w, 0.012, d, mat, 0, 0.006, 0, { cast: false });
  return g;
}

export function tvPanel(w = 1.9, h = 2.6) {
  // painel ripado + rack suspenso + TV
  const g = G();
  const n = Math.floor(w / 0.06);
  for (let i = 0; i < n; i++) box(g, 0.04, h, 0.03, M.ripado, -w / 2 + 0.03 + i * 0.06, h / 2, -0.04);
  box(g, w, h, 0.02, M.blackMatte, 0, h / 2, -0.065, { cast: false });
  box(g, w * 0.95, 0.32, 0.42, M.walnut, 0, 0.42, 0.17);
  box(g, w * 0.95 - 0.02, 0.005, 0.4, M.blackMatte, 0, 0.42, 0.38);
  // TV 65"
  const tv = G();
  box(tv, 1.45, 0.83, 0.03, M.screen, 0, 0, 0);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.8), new THREE.MeshStandardMaterial({ map: tvScreen(), emissive: 0xffffff, emissiveMap: tvScreen(), emissiveIntensity: 0.35, roughness: 0.2 }));
  scr.position.z = 0.016;
  tv.add(scr);
  tv.position.set(0, 1.3, -0.01);
  g.add(tv);
  // soundbar e objetos
  box(g, 0.9, 0.06, 0.09, M.blackMatte, 0, 0.61, 0.1);
  cyl(g, 0.07, 0.09, 0.25, M.ceramicPot, w * 0.35, 0.71, 0.15);
  box(g, 0.25, 0.05, 0.18, M.book[2], -w * 0.33, 0.61, 0.17);
  return g;
}

export function floorLamp() {
  const g = G();
  cyl(g, 0.16, 0.16, 0.02, M.blackMetal, 0, 0.01, 0);
  cyl(g, 0.012, 0.012, 1.5, M.blackMetal, 0, 0.76, 0);
  const shade = cyl(g, 0.17, 0.22, 0.3, M.linen, 0, 1.55, 0, { open: true });
  shade.material = M.linen.clone();
  shade.material.side = THREE.DoubleSide;
  shade.material.emissive = new THREE.Color(0xffd7a0);
  shade.material.emissiveIntensity = 0.0;
  world.nightEmissive.push({ mat: shade.material, on: 0.6 });
  return g;
}

export function pendant(drop = 1.0, r = 0.18, mat = M.blackMetal) {
  const g = G();
  cyl(g, 0.004, 0.004, drop, M.blackMetal, 0, -drop / 2, 0, { cast: false });
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  s.position.y = -drop - r * 0.15;
  s.material.side = THREE.DoubleSide;
  s.castShadow = true;
  g.add(s);
  sphere(g, r * 0.3, M.bulb, 0, -drop - r * 0.2, 0, { cast: false });
  return g;
}

export function frameArt(w, h, palette) {
  const g = G();
  box(g, w + 0.06, h + 0.06, 0.03, M.blackMatte, 0, 0, 0);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: artwork(palette), roughness: 0.8 }));
  pic.position.z = 0.016;
  g.add(pic);
  return g;
}

// ---------------- Plantas ----------------
export function plant(kind = 'tropical', h = 1.4, pot = M.potDark) {
  const g = G();
  const pr = kind === 'small' ? 0.13 : 0.22;
  const ph = kind === 'small' ? 0.22 : 0.42;
  cyl(g, pr, pr * 0.8, ph, pot, 0, ph / 2, 0);
  cyl(g, pr * 0.95, pr * 0.95, 0.02, M.soil, 0, ph - 0.02, 0, { cast: false });
  const leafGeo = new THREE.SphereGeometry(1, 10, 6);
  leafGeo.scale(0.06, 0.012, 0.28);
  leafGeo.translate(0, 0, 0.26);
  const n = kind === 'small' ? 10 : 22;
  for (let i = 0; i < n; i++) {
    const stemH = ph + (h - ph) * (0.35 + 0.65 * ((i * 37) % 11) / 11);
    const a = i * 2.39996;
    const tilt = 0.35 + ((i * 13) % 7) * 0.12;
    const s = kind === 'small' ? 0.45 : 1;
    // haste
    const stem = cyl(g, 0.006, 0.008, stemH - ph, M.leaf, Math.cos(a) * 0.05, ph + (stemH - ph) / 2, Math.sin(a) * 0.05, { cast: false, seg: 5 });
    stem.rotation.z = Math.cos(a) * 0.15;
    stem.rotation.x = -Math.sin(a) * 0.15;
    const l = new THREE.Mesh(leafGeo, i % 3 ? M.leaf : M.leafLight);
    l.position.set(Math.cos(a) * 0.08, stemH, Math.sin(a) * 0.08);
    l.rotation.order = 'YXZ';
    l.rotation.y = -a + Math.PI / 2;
    l.rotation.x = tilt;
    l.scale.setScalar(s * (0.9 + (i % 4) * 0.12));
    l.castShadow = true;
    g.add(l);
  }
  return g;
}

export function palm(h = 3.5) {
  const g = G();
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const y = (h / segs) * i;
    cyl(g, 0.11 - i * 0.004, 0.13 - i * 0.004, h / segs + 0.02, M.trunk, Math.sin(i * 0.3) * 0.04, y + h / segs / 2, 0, { seg: 10 });
  }
  const frondGeo = new THREE.PlaneGeometry(0.5, 1.8, 1, 6);
  const pos = frondGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + 0.9;
    pos.setZ(i, -0.15 * y * y);
    pos.setX(i, pos.getX(i) * Math.sin((y / 1.8) * Math.PI) * 1.2);
  }
  frondGeo.translate(0, 0.9, 0);
  frondGeo.computeVertexNormals();
  for (let i = 0; i < 12; i++) {
    const f = new THREE.Mesh(frondGeo, i % 2 ? M.leaf : M.leafLight);
    f.position.set(0, h, 0);
    f.rotation.order = 'YXZ';
    f.rotation.y = (i / 12) * Math.PI * 2;
    f.rotation.x = 0.9 + (i % 3) * 0.25;
    f.castShadow = true;
    g.add(f);
  }
  return g;
}

export function bush(r = 0.5, mat = M.leaf) {
  const g = G();
  for (let i = 0; i < 6; i++) {
    const a = i * 1.7;
    sphere(g, r * (0.55 + (i % 3) * 0.15), i % 2 ? M.leaf : M.leafLight, Math.cos(a) * r * 0.45, r * (0.5 + (i % 2) * 0.2), Math.sin(a) * r * 0.45, { seg: 10, sx: 1, sy: 0.8 });
  }
  return g;
}

export function tree(h = 5) {
  const g = G();
  cyl(g, 0.1, 0.16, h * 0.55, M.trunk, 0, h * 0.275, 0, { seg: 10 });
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9;
    sphere(g, h * 0.18 + (i % 3) * 0.2, i % 2 ? M.leaf : M.leafLight, Math.cos(a) * h * 0.12, h * 0.62 + (i % 3) * 0.35, Math.sin(a) * h * 0.12, { seg: 12 });
  }
  return g;
}

// ---------------- Quartos ----------------
export function bed(w = 1.6, l = 2.05, headMat = M.linen, duvet = M.bed, headW = w + 0.5) {
  const g = G();
  // base
  box(g, w + 0.1, 0.25, l, M.walnut, 0, 0.18, 0, { r: 0.02 });
  box(g, w, 0.24, l - 0.05, M.plasticWhite, 0, 0.42, 0.02, { r: 0.05 });
  // edredom
  box(g, w + 0.08, 0.1, l * 0.72, duvet, 0, 0.55, l * 0.13, { r: 0.04 });
  // peseira de tecido caindo pelas laterais
  box(g, w + 0.12, 0.025, 0.55, M.sofaDark, 0, 0.615, l * 0.3, { r: 0.01 });
  for (const sx of [-1, 1]) box(g, 0.025, 0.28, 0.55, M.sofaDark, sx * (w / 2 + 0.06), 0.48, l * 0.3, { r: 0.01 });
  // travesseiros
  const np = w > 1.5 ? 2 : 1;
  for (let i = 0; i < np; i++) {
    const x = np === 1 ? 0 : (i - 0.5) * (w * 0.5);
    box(g, Math.min(0.7, w * 0.45), 0.16, 0.42, M.bed, x, 0.63, -l / 2 + 0.32, { r: 0.07, rx: -0.3 });
    box(g, Math.min(0.55, w * 0.38), 0.14, 0.36, duvet === M.bed ? M.linen : duvet, x, 0.66, -l / 2 + 0.55, { r: 0.06, rx: -0.2 });
  }
  // cabeceira estofada
  box(g, headW, 1.15, 0.1, headMat, 0, 0.62, -l / 2 - 0.06, { r: 0.04 });
  return g;
}

export function nightstand(lamp = true) {
  const g = G();
  box(g, 0.5, 0.42, 0.4, M.walnut, 0, 0.33, 0, { r: 0.01 });
  box(g, 0.46, 0.005, 0.005, M.brass, 0, 0.35, 0.2);
  for (const sx of [-1, 1]) cyl(g, 0.012, 0.012, 0.12, M.blackMetal, sx * 0.2, 0.06, 0);
  if (lamp) {
    cyl(g, 0.07, 0.09, 0.22, M.ceramicPot, 0.08, 0.65, -0.05);
    const shade = cyl(g, 0.12, 0.15, 0.2, M.linen, 0.08, 0.86, -0.05, { open: true });
    shade.material = M.linen.clone();
    shade.material.side = THREE.DoubleSide;
    shade.material.emissive = new THREE.Color(0xffd29a);
    shade.material.emissiveIntensity = 0;
    world.nightEmissive.push({ mat: shade.material, on: 0.7 });
    box(g, 0.16, 0.03, 0.22, M.book[1], -0.12, 0.555, 0.05);
  }
  return g;
}

export function wardrobe(w = 1.8, h = 2.6, d = 0.6, mat = M.whiteLacquer) {
  const g = G();
  box(g, w, h, d, mat, 0, h / 2, 0);
  const n = Math.max(2, Math.round(w / 0.5));
  for (let i = 1; i < n; i++) box(g, 0.006, h - 0.04, 0.005, M.blackMatte, -w / 2 + (w / n) * i, h / 2, d / 2 + 0.002, { cast: false });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w / n) * (i + (i % 2 ? 0.12 : 0.88));
    box(g, 0.015, 0.5, 0.02, M.brass, x, 1.1, d / 2 + 0.012);
  }
  return g;
}

export function desk(w = 1.2, d = 0.55, mat = M.freijo) {
  const g = G();
  box(g, w, 0.035, d, mat, 0, 0.74, 0);
  for (const sx of [-1, 1]) box(g, 0.03, 0.72, d - 0.05, M.blackMetal, sx * (w / 2 - 0.05), 0.36, 0);
  // monitor / notebook
  box(g, 0.55, 0.32, 0.02, M.screen, 0, 1.0, -d / 2 + 0.12);
  box(g, 0.05, 0.2, 0.05, M.blackMetal, 0, 0.84, -d / 2 + 0.1);
  box(g, 0.4, 0.015, 0.13, M.plasticWhite, 0, 0.765, 0.05);
  cyl(g, 0.04, 0.035, 0.1, M.porcelainWhite, w / 2 - 0.15, 0.81, 0.05);
  return g;
}

export function officeChair() {
  const g = G();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    box(g, 0.3, 0.03, 0.04, M.blackMetal, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, { ry: -a });
  }
  cyl(g, 0.025, 0.025, 0.38, M.chrome, 0, 0.25, 0);
  box(g, 0.5, 0.08, 0.48, M.sofaDark, 0, 0.47, 0, { r: 0.03 });
  box(g, 0.46, 0.55, 0.06, M.sofaDark, 0, 0.82, -0.24, { r: 0.03, rx: -0.1 });
  return g;
}

export function bookshelf(w = 1.0, h = 2.0, d = 0.35) {
  const g = G();
  const t = 0.025;
  box(g, t, h, d, M.walnut, -w / 2 + t / 2, h / 2, 0);
  box(g, t, h, d, M.walnut, w / 2 - t / 2, h / 2, 0);
  const shelves = Math.round(h / 0.38);
  for (let i = 0; i <= shelves; i++) {
    const y = (h - t) * (i / shelves) + t / 2;
    box(g, w, t, d, M.walnut, 0, y, 0);
    if (i < shelves) {
      let x = -w / 2 + 0.05;
      let k = i * 3;
      while (x < w / 2 - 0.15) {
        const bw = 0.025 + ((k * 7) % 5) * 0.008;
        const bh = 0.2 + ((k * 3) % 4) * 0.025;
        if ((k % 9) === 4) {
          x += 0.12;
        } else {
          box(g, bw, bh, d * 0.75, M.book[k % M.book.length], x + bw / 2, y + t / 2 + bh / 2, 0, { cast: false });
          x += bw + 0.003;
        }
        k++;
        if (x > w / 2 - 0.4 && i % 2) break;
      }
    }
  }
  return g;
}

// ---------------- Cozinha ----------------
export function counterRun(len, { uppers = true, sinkAt = null, cooktopAt = null, h = 0.9, d = 0.62, top = M.marble, fronts = M.greyLacquer } = {}) {
  const g = G();
  box(g, len, 0.1, d - 0.05, M.blackMatte, 0, 0.05, 0.02, { cast: false });
  box(g, len, h - 0.14, d - 0.02, fronts, 0, 0.1 + (h - 0.14) / 2, 0.0);
  const n = Math.max(1, Math.round(len / 0.6));
  for (let i = 1; i < n; i++) box(g, 0.004, h - 0.16, 0.005, M.blackMatte, -len / 2 + (len / n) * i, 0.1 + (h - 0.14) / 2, d / 2 - 0.005, { cast: false });
  box(g, len, 0.005, 0.005, M.blackMatte, 0, h - 0.25, d / 2 - 0.005, { cast: false });
  box(g, len + 0.02, 0.04, d + 0.02, top, 0, h - 0.02, 0.01);
  if (sinkAt !== null) {
    box(g, 0.6, 0.012, 0.4, M.steel, sinkAt, h + 0.001, 0.02, { cast: false });
    const neck = cyl(g, 0.012, 0.012, 0.35, M.chrome, sinkAt, h + 0.175, -0.2);
    box(g, 0.02, 0.02, 0.2, M.chrome, sinkAt, h + 0.35, -0.11);
  }
  if (cooktopAt !== null) {
    box(g, 0.75, 0.008, 0.5, M.screen, cooktopAt, h + 0.004, 0.02, { cast: false });
    for (const [cx, cz] of [[-0.18, -0.1], [0.18, -0.1], [-0.18, 0.13], [0.18, 0.13]]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.085, 32), M.greyLacquer);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cooktopAt + cx, h + 0.009, 0.02 + cz);
      g.add(ring);
    }
  }
  if (uppers) {
    box(g, len, 0.75, 0.35, M.whiteLacquer, 0, 1.55 + 0.375, -d / 2 + 0.175);
    for (let i = 1; i < n; i++) box(g, 0.004, 0.73, 0.005, M.blackMatte, -len / 2 + (len / n) * i, 1.925, -d / 2 + 0.352, { cast: false });
    box(g, len, 0.01, 0.3, M.ledWarm, 0, 1.545, -d / 2 + 0.16, { cast: false });
    // revestimento entre bancada e armário
    box(g, len, 0.65, 0.01, M.marble, 0, h + 0.325, -d / 2 + 0.005, { cast: false });
  }
  return g;
}

export function fridge() {
  const g = G();
  box(g, 0.9, 1.9, 0.7, M.steel, 0, 0.95, 0);
  box(g, 0.004, 1.85, 0.005, M.blackMatte, 0, 0.95, 0.351, { cast: false });
  for (const sx of [-1, 1]) box(g, 0.02, 0.8, 0.03, M.chrome, sx * 0.05, 1.1, 0.37);
  box(g, 0.9, 0.7, 0.62, M.greyLacquer, 0, 2.25, -0.04);
  return g;
}

export function ovenTower(w = 0.62) {
  const g = G();
  box(g, w, 2.6, 0.62, M.greyLacquer, 0, 1.3, 0);
  box(g, w - 0.06, 0.55, 0.02, M.screen, 0, 1.15, 0.31);
  box(g, w - 0.06, 0.42, 0.02, M.screen, 0, 1.68, 0.31);
  box(g, w - 0.2, 0.015, 0.03, M.steel, 0, 1.38, 0.33);
  return g;
}

export function island(len = 2.4, d = 1.0) {
  const g = G();
  box(g, len - 0.1, 0.86, d - 0.25, M.walnut, 0, 0.43, -0.12);
  box(g, len, 0.06, d, M.marble, 0, 0.9, 0);
  // cascata
  for (const s of [-1, 1]) box(g, 0.06, 0.9, d, M.marble, s * (len / 2 - 0.03), 0.45, 0);
  // cooktop
  box(g, 0.75, 0.008, 0.5, M.screen, 0, 0.934, -0.15, { cast: false });
  for (const [cx, cz] of [[-0.18, -0.1], [0.18, -0.1], [-0.18, 0.12], [0.18, 0.12]]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.085, 32), M.greyLacquer);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cx, 0.94, -0.15 + cz);
    g.add(ring);
  }
  // fruteira
  cyl(g, 0.16, 0.1, 0.07, M.walnut, len / 2 - 0.4, 0.965, 0.1);
  for (let i = 0; i < 4; i++) sphere(g, 0.04, i % 2 ? M.terracotta : M.leafLight, len / 2 - 0.4 + Math.cos(i * 1.6) * 0.06, 1.02, 0.1 + Math.sin(i * 1.6) * 0.06, { seg: 10 });
  return g;
}

export function stool() {
  const g = G();
  cyl(g, 0.18, 0.18, 0.06, M.leather, 0, 0.66, 0, { seg: 24 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = cyl(g, 0.012, 0.014, 0.66, M.blackMetal, Math.cos(a) * 0.13, 0.33, Math.sin(a) * 0.13);
    leg.rotation.z = Math.cos(a) * -0.12;
    leg.rotation.x = Math.sin(a) * 0.12;
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 24), M.blackMetal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.25;
  g.add(ring);
  return g;
}

export function diningTable(l = 2.0, w = 0.95, mat = M.freijo) {
  const g = G();
  box(g, w, 0.05, l, mat, 0, 0.75, 0, { r: 0.01 });
  for (const sz of [-1, 1]) {
    box(g, 0.08, 0.72, 0.08, mat, -w / 2 + 0.12, 0.36, sz * (l / 2 - 0.15));
    box(g, 0.08, 0.72, 0.08, mat, w / 2 - 0.12, 0.36, sz * (l / 2 - 0.15));
  }
  // centro de mesa
  box(g, 0.25, 0.01, l * 0.55, M.linen, 0, 0.78, 0, { cast: false });
  cyl(g, 0.06, 0.08, 0.28, M.porcelainWhite, 0, 0.92, 0);
  sphere(g, 0.12, M.leafLight, 0, 1.1, 0, { seg: 10, sx: 1, sy: 0.8 });
  return g;
}

export function chair(mat = M.freijo, seat = M.linen) {
  const g = G();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.016, 0.014, 0.45, mat, sx * 0.19, 0.225, sz * 0.19);
  box(g, 0.45, 0.05, 0.45, seat, 0, 0.47, 0, { r: 0.02 });
  for (const sx of [-1, 1]) box(g, 0.03, 0.45, 0.03, mat, sx * 0.19, 0.7, -0.2);
  box(g, 0.42, 0.18, 0.025, mat, 0, 0.82, -0.21, { r: 0.01 });
  return g;
}

// ---------------- Banheiros ----------------
export function toilet() {
  const g = G();
  box(g, 0.38, 0.4, 0.35, M.porcelainWhite, 0, 0.2, -0.05, { r: 0.08 });
  box(g, 0.36, 0.05, 0.5, M.porcelainWhite, 0, 0.42, 0.02, { r: 0.04 });
  box(g, 0.38, 0.32, 0.18, M.porcelainWhite, 0, 0.6, -0.25, { r: 0.04 });
  box(g, 0.06, 0.012, 0.03, M.chrome, 0, 0.765, -0.25);
  return g;
}

export function vanity(w = 0.9, basins = 1, top = M.marble, cab = M.walnut, mirrorH = 0.8) {
  const g = G();
  box(g, w, 0.45, 0.48, cab, 0, 0.6, 0);
  box(g, w + 0.02, 0.03, 0.5, top, 0, 0.84, 0.01);
  for (let i = 0; i < basins; i++) {
    const x = basins === 1 ? 0 : (i - 0.5) * w * 0.5;
    const b = cyl(g, 0.2, 0.15, 0.13, M.porcelainWhite, x, 0.92, 0.04, { seg: 32 });
    const inner = cyl(g, 0.17, 0.12, 0.005, M.greyLacquer, x, 0.985, 0.04, { seg: 32, cast: false });
    cyl(g, 0.012, 0.012, 0.3, M.blackMetal, x, 1.0, -0.2);
    box(g, 0.02, 0.02, 0.16, M.blackMetal, x, 1.14, -0.13);
  }
  // espelho com LED
  box(g, w, mirrorH, 0.02, M.mirror, 0, 1.15 + mirrorH / 2 + 0.05, -0.23, { cast: false });
  box(g, w - 0.04, 0.02, 0.02, M.ledWarm, 0, 1.15 + 0.06, -0.22, { cast: false });
  return g;
}

export function shower(w = 0.9, d = 0.9, h = 2.0, openSide = 'z') {
  // box de vidro (sem colisão — é passável pela abertura)
  const g = G();
  const p = new THREE.Mesh(boxGeo(w, h, 0.01), M.glassShower);
  p.position.set(0, h / 2 + 0.05, d / 2);
  p.scale.x = 0.55;
  p.position.x = -w * 0.225;
  p.renderOrder = 2;
  g.add(p);
  box(g, w, 0.03, d, M.marbleDark, 0, 0.015, 0, { cast: false });
  box(g, 0.025, 0.025, d, M.blackMetal, w / 2 - 0.0125, h + 0.05, 0);
  box(g, w * 0.55, 0.025, 0.025, M.blackMetal, -w * 0.225, h + 0.05, d / 2);
  // chuveiro
  cyl(g, 0.012, 0.012, 0.35, M.blackMetal, 0, 2.15, -d / 2 + 0.1, { rx: Math.PI / 2 });
  box(g, 0.25, 0.012, 0.25, M.blackMetal, 0, 2.15, -d / 2 + 0.3);
  box(g, 0.08, 0.15, 0.02, M.blackMetal, 0, 1.1, -d / 2 + 0.01);
  // nicho
  box(g, 0.4, 0.3, 0.02, M.marbleDark, w * 0.2, 1.3, -d / 2 + 0.005, { cast: false });
  return g;
}

export function towel(w = 0.5, mat = M.linen) {
  const g = G();
  box(g, w + 0.1, 0.015, 0.015, M.blackMetal, 0, 1.2, 0.04);
  box(g, w, 0.55, 0.035, mat, 0, 0.95, 0.06, { r: 0.012 });
  return g;
}

// ---------------- Serviço ----------------
export function washer() {
  const g = G();
  box(g, 0.6, 0.85, 0.6, M.plasticWhite, 0, 0.425, 0, { r: 0.02 });
  cyl(g, 0.2, 0.2, 0.03, M.chrome, 0, 0.42, 0.3, { rx: Math.PI / 2, seg: 32 });
  cyl(g, 0.16, 0.16, 0.035, M.screen, 0, 0.42, 0.3, { rx: Math.PI / 2, seg: 32 });
  box(g, 0.5, 0.06, 0.01, M.screen, 0, 0.77, 0.301);
  return g;
}

export function laundrySink(w = 0.6) {
  const g = G();
  box(g, w, 0.82, 0.55, M.whiteLacquer, 0, 0.41, 0);
  box(g, w, 0.08, 0.57, M.porcelainWhite, 0, 0.86, 0.01, { r: 0.02 });
  box(g, w - 0.1, 0.01, 0.45, M.greyLacquer, 0, 0.9, 0.03, { cast: false });
  cyl(g, 0.012, 0.012, 0.3, M.chrome, 0, 1.05, -0.22);
  return g;
}

export function shelves(w, h, d, filled = true) {
  const g = G();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const y = 0.15 + (i * (h - 0.2)) / (n - 1);
    box(g, w, 0.025, d, M.oakFurn, 0, y, 0);
    if (filled && i < n - 1) {
      let x = -w / 2 + 0.06;
      let k = i * 5;
      while (x < w / 2 - 0.1) {
        const kind = k % 4;
        if (kind === 0) cyl(g, 0.05, 0.05, 0.18, M.glassFrosted, x + 0.05, y + 0.1, 0, { seg: 12 }), (x += 0.13);
        else if (kind === 1) box(g, 0.16, 0.24, d * 0.7, M.book[(k * 3) % 6], x + 0.08, y + 0.13, 0), (x += 0.19);
        else if (kind === 2) cyl(g, 0.04, 0.04, 0.22, M.terracotta, x + 0.04, y + 0.12, 0.02, { seg: 12 }), (x += 0.1);
        else box(g, 0.2, 0.12, d * 0.8, M.plasticWhite, x + 0.1, y + 0.07, 0), (x += 0.24);
        k++;
      }
    }
  }
  for (const sx of [-1, 1]) box(g, 0.02, h, d, M.oakFurn, sx * (w / 2), h / 2, 0);
  return g;
}

// ---------------- Área externa ----------------
export function churrasqueira(w = 1.6) {
  const g = G();
  box(g, w, 0.9, 0.65, M.concreteDark, 0, 0.45, 0);
  box(g, w + 0.04, 0.04, 0.68, M.marbleDark, 0, 0.92, 0.01);
  // boca
  box(g, 0.75, 0.6, 0.6, M.stoneWall, -w / 2 + 0.4, 1.24, -0.02);
  box(g, 0.65, 0.45, 0.02, M.blackMatte, -w / 2 + 0.4, 1.2, 0.29);
  box(g, 0.6, 0.01, 0.4, M.steel, -w / 2 + 0.4, 1.1, 0.1);
  // coifa
  box(g, 0.85, 0.5, 0.62, M.blackMetal, -w / 2 + 0.4, 2.0, -0.02);
  box(g, 0.32, 0.6, 0.32, M.blackMetal, -w / 2 + 0.4, 2.55, -0.1);
  // pia
  box(g, 0.45, 0.01, 0.35, M.steel, w / 2 - 0.4, 0.94, 0.03, { cast: false });
  cyl(g, 0.012, 0.012, 0.3, M.blackMetal, w / 2 - 0.4, 1.08, -0.2);
  return g;
}

export function lounger() {
  const g = G();
  box(g, 0.7, 0.08, 1.9, M.walnut, 0, 0.25, 0, { r: 0.02 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, 0.22, 0.05, M.walnut, sx * 0.3, 0.11, sz * 0.85);
  box(g, 0.64, 0.07, 1.25, M.linen, 0, 0.32, 0.3, { r: 0.03 });
  box(g, 0.64, 0.07, 0.65, M.linen, 0, 0.5, -0.6, { r: 0.03, rx: 0.6 });
  box(g, 0.66, 0.03, 0.66, M.walnut, 0, 0.42, -0.66, { rx: 0.6 });
  return g;
}

export function outdoorTable(r = 0.4) {
  const g = G();
  cyl(g, r, r, 0.04, M.walnut, 0, 0.45, 0, { seg: 32 });
  cyl(g, 0.03, 0.03, 0.43, M.blackMetal, 0, 0.22, 0);
  cyl(g, 0.2, 0.2, 0.02, M.blackMetal, 0, 0.01, 0);
  return g;
}

// ---------------- Carros ----------------
export function car(paint, type = 'suv') {
  const g = G();
  const L = type === 'suv' ? 4.6 : 4.5;
  const W = 1.86;
  const bodyH = type === 'suv' ? 0.75 : 0.6;
  const clear = type === 'suv' ? 0.28 : 0.2;
  // carroceria
  box(g, W, bodyH, L, paint, 0, clear + bodyH / 2, 0, { r: 0.18 });
  // cabine
  const cabH = type === 'suv' ? 0.62 : 0.5;
  const cabL = type === 'suv' ? L * 0.6 : L * 0.5;
  const cab = box(g, W - 0.12, cabH, cabL, M.carGlass, 0, clear + bodyH + cabH / 2 - 0.04, type === 'suv' ? -0.15 : -0.1, { r: 0.12 });
  box(g, W - 0.08, 0.06, cabL - 0.25, paint, 0, clear + bodyH + cabH - 0.06, type === 'suv' ? -0.2 : -0.1, { r: 0.03 });
  // colunas
  for (const sx of [-1, 1]) box(g, 0.04, cabH - 0.05, 0.1, paint, sx * (W / 2 - 0.08), clear + bodyH + cabH / 2 - 0.05, type === 'suv' ? -0.15 : -0.1);
  // rodas
  const wheelZ = L / 2 - 0.8;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wgrp = G();
      cyl(wgrp, 0.36, 0.36, 0.26, M.tire, 0, 0, 0, { rz: Math.PI / 2, seg: 28 });
      cyl(wgrp, 0.23, 0.23, 0.27, M.rim, 0, 0, 0, { rz: Math.PI / 2, seg: 20 });
      wgrp.position.set(sx * (W / 2 - 0.12), 0.36, sz * wheelZ);
      g.add(wgrp);
    }
  }
  // faróis e lanternas
  for (const sx of [-1, 1]) {
    box(g, 0.45, 0.08, 0.04, M.headLight, sx * 0.62, clear + bodyH - 0.15, L / 2 - 0.03, { cast: false });
    box(g, 0.5, 0.08, 0.04, M.tailLight, sx * 0.6, clear + bodyH - 0.12, -L / 2 + 0.03, { cast: false });
  }
  box(g, 0.6, 0.18, 0.05, M.blackMatte, 0, clear + 0.3, L / 2 - 0.01, { cast: false });
  // retrovisores
  for (const sx of [-1, 1]) box(g, 0.18, 0.1, 0.12, paint, sx * (W / 2 + 0.06), clear + bodyH + 0.08, L * 0.17, { r: 0.03 });
  return g;
}
