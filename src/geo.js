// Utilitários de geometria e o "registro" do mundo (colisões, pisos, portas, luzes)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const world = {
  colliders: [], // THREE.Box3 (paredes, móveis, vidros)
  walkables: [], // meshes que servem de piso (raycast para baixo)
  doors: [], // portas interativas
  dayLights: [],
  nightLights: [],
  nightEmissive: [], // materiais que acendem à noite
  upperGroup: null, // pavimento superior (para o modo maquete)
  roofGroup: null,
  animated: [],
};

// Caixa com UV em metros (texturas ficam na escala certa em qualquer tamanho)
export function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // ordem das faces: +x, -x, +y, -y, +z, -z (4 vértices cada)
  const dims = [
    [d, h], [d, h],
    [w, d], [w, d],
    [w, h], [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return g;
}

export function rboxGeo(w, h, d, r = 0.04, seg = 3) {
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  // UV em metros aproximado (projeção planar)
  const pos = g.attributes.pos ?? g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (ny > 0.6) uv.setXY(i, x, z);
    else if (nx > 0.6) uv.setXY(i, z, y);
    else uv.setXY(i, x, y);
  }
  return g;
}

function setShadow(m, cast = true, receive = true) {
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Caixa definida por canto mínimo e máximo (coordenadas do mundo, metros)
export function boxMM(parent, x0, y0, z0, x1, y1, z1, mat, opts = {}) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2);
  setShadow(m, opts.cast !== false, opts.receive !== false);
  parent.add(m);
  if (opts.collide) world.colliders.push(new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)));
  if (opts.walk) world.walkables.push(m);
  return m;
}

// Caixa centrada (uso em móveis, coordenadas locais do grupo)
export function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, opts = {}) {
  const geo = opts.r ? rboxGeo(w, h, d, opts.r) : boxGeo(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  setShadow(m, opts.cast !== false, opts.receive !== false);
  parent.add(m);
  return m;
}

export function cyl(parent, rt, rb, h, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, opts.seg || 24, 1, !!opts.open), mat);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  setShadow(m, opts.cast !== false, opts.receive !== false);
  parent.add(m);
  return m;
}

export function sphere(parent, r, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, opts.seg || 20, Math.round((opts.seg || 20) * 0.7)), mat);
  m.position.set(x, y, z);
  if (opts.sx) m.scale.set(opts.sx, opts.sy || 1, opts.sz || opts.sx);
  setShadow(m, opts.cast !== false, opts.receive !== false);
  parent.add(m);
  return m;
}

// Posiciona um grupo de móvel e registra a caixa de colisão dele
export function place(parent, group, x, y, z, ry = 0, opts = {}) {
  group.position.set(x, y, z);
  group.rotation.y = ry;
  parent.add(group);
  if (opts.collide !== false) {
    group.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(group);
    if (opts.shrink) b.expandByScalar(-opts.shrink);
    world.colliders.push(b);
  }
  return group;
}
