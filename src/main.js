// Casa 43 — passeio virtual 3D
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createMaterials } from './materials.js';
import { world } from './geo.js';
import { buildHouse } from './house.js';
import { buildSite } from './site.js';
import { furnish } from './furnish.js';
import { setFurnitureMaterials } from './furniture.js';
import { ROOMS, roomAt, FLOOR2 } from './plan.js';
import { Minimap } from './minimap.js';

const $ = (id) => document.getElementById(id);
const setStatus = (t) => ($('loading-status').textContent = t);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

// ------------------------------------------------------------------
// Renderizador e cena
// ------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc9d6e2, 0.009);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 1500);
camera.rotation.order = 'YXZ';

// Céu
const sky = new Sky();
sky.scale.setScalar(1200);
scene.add(sky);
const skyU = sky.material.uniforms;

// Estrelas (noite)
const stars = (() => {
  const n = 1500;
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI * 0.45;
    const r = 900;
    p[i * 3] = r * Math.cos(th) * Math.sin(ph) + 10;
    p[i * 3 + 1] = r * Math.cos(ph);
    p[i * 3 + 2] = r * Math.sin(th) * Math.sin(ph) + 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
  pts.visible = false;
  scene.add(pts);
  return pts;
})();

// Sol
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
const sc = sun.shadow.camera;
sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 120;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.025;
sun.target.position.set(10, 0, 5);
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a6f52, 0.5);
scene.add(hemi);

// ------------------------------------------------------------------
// Pós-processamento
// ------------------------------------------------------------------
const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(renderer.getPixelRatio());
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const gtao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.5, scale: 1.1, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
gtao.blendIntensity = 0.85;
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.5, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let quality = 'alta';
function applyQuality() {
  gtao.enabled = quality === 'alta';
  const pr = quality === 'baixa' ? 1 : Math.min(window.devicePixelRatio, quality === 'alta' ? 2 : 1.25);
  renderer.setPixelRatio(pr);
  composer.setPixelRatio(pr);
  sun.shadow.mapSize.set(quality === 'baixa' ? 2048 : 4096, quality === 'baixa' ? 2048 : 4096);
  if (sun.shadow.map) {
    sun.shadow.map.dispose();
    sun.shadow.map = null;
  }
  renderer.shadowMap.needsUpdate = true;
  onResize();
  $('btn-quality').textContent = 'Qualidade: ' + quality;
}

// ------------------------------------------------------------------
// Modos de luz: dia / entardecer / noite
// ------------------------------------------------------------------
const pmrem = new THREE.PMREMGenerator(renderer);
const envCache = {};
const MODES = {
  dia: { elev: 42, azim: 215, sun: 3.4, sunColor: 0xfff1e0, hemi: 0.25, env: 0.32, interior: 0.6, outdoor: 0, emissive: 0, exposure: 0.85, turb: 4, ray: 1.2, bloom: 0.15 },
  entardecer: { elev: 7, azim: 250, sun: 2.6, sunColor: 0xffb26b, hemi: 0.15, env: 0.35, interior: 0.9, outdoor: 0.7, emissive: 0.8, exposure: 1.0, turb: 8, ray: 2.5, bloom: 0.35 },
  noite: { elev: -12, azim: 250, sun: 0.0, sunColor: 0x9db4ff, hemi: 0.14, env: 0.1, interior: 1.0, outdoor: 1.0, emissive: 1.0, exposure: 1.1, turb: 2, ray: 0.3, bloom: 0.55 },
};
let mode = 'dia';
const sunDir = new THREE.Vector3();

function setMode(name) {
  mode = name;
  const m = MODES[name];
  const phi = THREE.MathUtils.degToRad(90 - m.elev);
  const theta = THREE.MathUtils.degToRad(m.azim);
  sunDir.setFromSphericalCoords(1, phi, theta);
  skyU.sunPosition.value.copy(sunDir);
  skyU.turbidity.value = m.turb;
  skyU.rayleigh.value = m.ray;
  skyU.mieCoefficient.value = 0.005;
  skyU.mieDirectionalG.value = 0.8;
  const night = name === 'noite';
  sky.visible = !night;
  stars.visible = night;
  scene.background = night ? new THREE.Color(0x070b16) : null;
  scene.fog.color.set(night ? 0x0a0f1c : name === 'entardecer' ? 0xc9a184 : 0xc9d6e2);
  scene.fog.density = night ? 0.012 : 0.009;

  sun.position.copy(sun.target.position).addScaledVector(night ? new THREE.Vector3(0.3, 1, 0.5).normalize() : sunDir, 60);
  sun.color.set(night ? 0x8fa6d8 : m.sunColor);
  sun.intensity = night ? 0.3 : m.sun;
  hemi.intensity = m.hemi;
  hemi.color.set(night ? 0x2b3a5a : name === 'entardecer' ? 0xffc9a0 : 0xeef0f2);

  // mapa de ambiente gerado a partir do céu
  if (!envCache[name]) {
    const envScene = new THREE.Scene();
    if (night) envScene.background = new THREE.Color(0x0b1224);
    else {
      const s2 = new Sky();
      s2.scale.setScalar(100);
      Object.keys(skyU).forEach((k) => {
        const v = skyU[k].value;
        s2.material.uniforms[k].value = v && v.clone ? v.clone() : v;
      });
      envScene.add(s2);
    }
    envCache[name] = pmrem.fromScene(envScene, 0.02).texture;
  }
  scene.environment = envCache[name];
  scene.environmentIntensity = m.env;

  for (const l of world.nightLights) {
    l.intensity = l.userData.base * (l.userData.outdoor ? m.outdoor : m.interior);
    l.visible = l.intensity > 0;
  }
  for (const e of world.nightEmissive) e.mat.emissiveIntensity = night || name === 'entardecer' ? e.on * m.emissive : e.day || 0;
  M.ledWarm.emissiveIntensity = 2.2 * m.emissive;
  M.poolLight.emissiveIntensity = 3 * m.emissive;
  M.bulb.emissiveIntensity = 0.4 + 2.5 * m.emissive;
  renderer.toneMappingExposure = m.exposure;
  bloom.strength = m.bloom;
  renderer.shadowMap.needsUpdate = true;
  $('btn-mode').textContent = { dia: '☀️ Dia', entardecer: '🌇 Entardecer', noite: '🌙 Noite' }[name];
}

// ------------------------------------------------------------------
// Construção
// ------------------------------------------------------------------
let M;
const minimap = new Minimap($('minimap'));

async function build() {
  setStatus('Gerando texturas...');
  await nextFrame();
  M = createMaterials();
  setFurnitureMaterials(M);
  setStatus('Levantando paredes...');
  await nextFrame();
  buildHouse(scene, M);
  setStatus('Paisagismo, piscina e garagem...');
  await nextFrame();
  buildSite(scene, M);
  setStatus('Mobiliando os cômodos...');
  await nextFrame();
  furnish(scene, M);
  setStatus('Acendendo as luzes...');
  await nextFrame();
  setMode('dia');
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  // compila shaders antes de mostrar
  renderer.compile(scene, camera);
  setStatus('Pronto!');
  $('loading').classList.add('hidden');
  $('start').classList.remove('hidden');
}

// ------------------------------------------------------------------
// Controles: 1ª pessoa (caminhar) e maquete (órbita)
// ------------------------------------------------------------------
const fps = new PointerLockControls(camera, document.body);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.target.set(10, 1.5, 5);
orbit.maxPolarAngle = Math.PI * 0.495;
orbit.minDistance = 3;
orbit.maxDistance = 70;

const EYE = 1.62;
const RADIUS = 0.22;
const player = { pos: new THREE.Vector3(-6.5, 0, 4.2), vy: 0, yaw: -Math.PI / 2, pitch: 0 };
let view = 'menu'; // 'walk' | 'orbit' | 'menu'
const keys = {};

function setPlayer(x, z, yawDeg, floorY = null) {
  const y = floorY ?? groundHeight(x, z, 10) ?? 0;
  player.pos.set(x, y, z);
  player.vy = 0;
  // yaw: 0 graus = olhando para +X
  camera.rotation.set(0, THREE.MathUtils.degToRad(-yawDeg) - Math.PI / 2, 0, 'YXZ');
  camera.position.set(x, y + EYE, z);
}

function enterWalk() {
  view = 'walk';
  orbit.enabled = false;
  world.upperGroup.visible = true;
  world.roofGroup.visible = true;
  $('orbit-tools').classList.add('hidden');
  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  fps.lock();
}

function enterOrbit() {
  view = 'orbit';
  if (fps.isLocked) fps.unlock();
  orbit.enabled = true;
  camera.position.set(-11, 17, -3);
  orbit.target.set(10, 1, 5);
  orbit.update();
  $('start').classList.add('hidden');
  $('orbit-tools').classList.remove('hidden');
  $('hud').classList.remove('hidden');
}

fps.addEventListener('lock', () => {
  $('start').classList.add('hidden');
  $('teleport').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('crosshair').classList.remove('hidden');
});
fps.addEventListener('unlock', () => {
  $('crosshair').classList.add('hidden');
  if (view === 'walk' && $('teleport').classList.contains('hidden')) {
    $('start').classList.remove('hidden');
    $('start-title').textContent = 'Pausado';
  }
});

// colisão ----------------------------------------------------------
const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
function groundHeight(x, z, fromY) {
  ray.set(new THREE.Vector3(x, fromY, z), DOWN);
  ray.far = 30;
  const hits = ray.intersectObjects(world.walkables, false);
  for (const h of hits) if (h.object.visible !== false && isVisible(h.object)) return h.point.y;
  return null;
}
function isVisible(o) {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

function blocked(x, z, feet) {
  const lo = feet + 0.32, hi = feet + 1.75;
  const test = (b) => {
    if (b.max.y < lo || b.min.y > hi) return false;
    const cx = Math.max(b.min.x, Math.min(x, b.max.x));
    const cz = Math.max(b.min.z, Math.min(z, b.max.z));
    const dx = x - cx, dz = z - cz;
    return dx * dx + dz * dz < RADIUS * RADIUS;
  };
  for (const b of world.colliders) if (test(b)) return true;
  for (const d of world.doors) if (Math.abs(d.angle) < 0.3 && test(d.closedBox)) return true;
  return false;
}

const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
function updateWalk(dt) {
  const speed = keys.ShiftLeft || keys.ShiftRight ? 3.6 : 1.7;
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  right.crossVectors(fwd, camera.up).normalize();
  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) (mx += fwd.x), (mz += fwd.z);
  if (keys.KeyS || keys.ArrowDown) (mx -= fwd.x), (mz -= fwd.z);
  if (keys.KeyD || keys.ArrowRight) (mx += right.x), (mz += right.z);
  if (keys.KeyA || keys.ArrowLeft) (mx -= right.x), (mz -= right.z);
  const len = Math.hypot(mx, mz);
  const p = player.pos;
  if (len > 0) {
    const step = (speed * dt) / len;
    const nx = p.x + mx * step;
    if (!blocked(nx, p.z, p.y)) p.x = nx;
    const nz = p.z + mz * step;
    if (!blocked(p.x, nz, p.y)) p.z = nz;
  }
  // gravidade e degraus
  const gy = groundHeight(p.x, p.z, p.y + 0.45);
  if (gy !== null && gy >= p.y - 0.28 && player.vy <= 0) {
    p.y += (gy - p.y) * Math.min(1, dt * 18);
    if (Math.abs(gy - p.y) < 0.002) p.y = gy;
    player.vy = 0;
  } else {
    player.vy -= 9.8 * dt;
    p.y += player.vy * dt;
    if (gy !== null && p.y < gy) {
      p.y = gy;
      player.vy = 0;
    }
    if (p.y < -10) setPlayer(-6.5, 4.2, 0);
  }
  // balanço suave da cabeça
  bob += len > 0 ? dt * speed * 5 : 0;
  const bobY = len > 0 ? Math.sin(bob) * 0.018 : 0;
  camera.position.set(p.x, p.y + EYE + bobY, p.z);
}
let bob = 0;

// portas ------------------------------------------------------------
const center = new THREE.Vector2(0, 0);
const doorRay = new THREE.Raycaster();
function doorInSight() {
  doorRay.setFromCamera(center, camera);
  doorRay.far = 2.6;
  const objs = world.doors.map((d) => d.pivot);
  const hits = doorRay.intersectObjects(objs, true);
  return hits.length ? hits[0].object.userData.door : null;
}
function toggleDoor(d) {
  d.target = Math.abs(d.target) > 0.01 ? 0 : d.openAngle;
}
function updateDoors(dt) {
  let moving = false;
  for (const d of world.doors) {
    if (d.angle !== d.target) {
      const diff = d.target - d.angle;
      const stepA = Math.sign(diff) * Math.min(Math.abs(diff), dt * 2.4);
      d.angle += stepA;
      d.pivot.rotation.y = d.angle;
      moving = true;
    }
  }
  if (moving) renderer.shadowMap.needsUpdate = true;
}

// ------------------------------------------------------------------
// Interface
// ------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE' && view === 'walk' && fps.isLocked) {
    const d = doorInSight();
    if (d) toggleDoor(d);
  }
  if (e.code === 'KeyL') cycleMode();
  if (e.code === 'KeyT' && view === 'walk') openTeleport();
  if (e.code === 'KeyV') (view === 'orbit' ? walkFromOrbit() : enterOrbit());
  if (e.code === 'KeyM') $('minimap-wrap').classList.toggle('big');
  if (e.code === 'KeyQ') cycleQuality();
  if (e.code === 'KeyH') $('help').classList.toggle('hidden');
});
document.addEventListener('keyup', (e) => (keys[e.code] = false));
document.addEventListener('mousedown', (e) => {
  if (view === 'walk' && fps.isLocked && e.button === 0) {
    const d = doorInSight();
    if (d) toggleDoor(d);
  }
});

function cycleMode() {
  const order = ['dia', 'entardecer', 'noite'];
  setMode(order[(order.indexOf(mode) + 1) % 3]);
}
function cycleQuality() {
  const order = ['alta', 'média', 'baixa'];
  quality = order[(order.indexOf(quality) + 1) % 3];
  applyQuality();
}

$('btn-walk').onclick = () => {
  if (view === 'menu') setPlayer(-6.5, 4.2, 0);
  enterWalk();
};
$('btn-orbit').onclick = enterOrbit;
$('btn-mode').onclick = cycleMode;
$('btn-quality').onclick = cycleQuality;
$('btn-tp').onclick = () => openTeleport();
$('btn-orbit2').onclick = enterOrbit;
$('btn-walk2').onclick = () => walkFromOrbit();
$('btn-upper').onclick = () => {
  const v = !world.upperGroup.visible;
  world.upperGroup.visible = v;
  world.roofGroup.visible = v;
  $('btn-upper').textContent = v ? 'Ver só o térreo' : 'Mostrar pavimento superior';
  renderer.shadowMap.needsUpdate = true;
};
$('btn-nb').onclick = () => {
  world.neighbors.visible = !world.neighbors.visible;
  $('btn-nb').textContent = world.neighbors.visible ? 'Ocultar vizinhos' : 'Mostrar vizinhos';
  renderer.shadowMap.needsUpdate = true;
};
$('btn-roof').onclick = () => {
  world.roofGroup.visible = !world.roofGroup.visible;
  $('btn-roof').textContent = world.roofGroup.visible ? 'Tirar a cobertura' : 'Pôr a cobertura';
  renderer.shadowMap.needsUpdate = true;
};

function walkFromOrbit() {
  if (view === 'menu') setPlayer(-6.5, 4.2, 0);
  enterWalk();
}

// duplo clique na maquete: caminhar a partir daquele ponto
renderer.domElement.addEventListener('dblclick', (e) => {
  if (view !== 'orbit') return;
  const v = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(v, camera);
  ray.far = 500;
  const hits = ray.intersectObjects(world.walkables, false).filter((h) => isVisible(h.object));
  if (hits.length) {
    const p = hits[0].point;
    const dir = new THREE.Vector3(p.x - camera.position.x, 0, p.z - camera.position.z);
    const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.z, dir.x));
    setPlayer(p.x, p.z, yaw, p.y);
    enterWalk();
  }
});

// teletransporte
function openTeleport() {
  if (fps.isLocked) {
    $('teleport').classList.remove('hidden');
    fps.unlock();
  } else $('teleport').classList.remove('hidden');
}
(function buildTeleport() {
  const list = $('tp-list');
  const groups = [['Térreo', 0], ['Pavimento superior', 1]];
  for (const [title, f] of groups) {
    const h = document.createElement('h3');
    h.textContent = title;
    list.appendChild(h);
    for (const r of ROOMS.filter((r) => r.floor === f && r.spawn)) {
      const b = document.createElement('button');
      b.innerHTML = `<span>${r.name}</span><small>${r.size || ''}</small>`;
      b.onclick = () => {
        const [x, z, yaw] = r.spawn;
        setPlayer(x, z, yaw, f === 1 ? FLOOR2 : null);
        $('teleport').classList.add('hidden');
        enterWalk();
      };
      list.appendChild(b);
    }
  }
})();
$('tp-close').onclick = () => {
  $('teleport').classList.add('hidden');
  if (view === 'walk') enterWalk();
};

// ------------------------------------------------------------------
// Loop
// ------------------------------------------------------------------
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  gtao.setSize(w, h);
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();
let lastRoom = '';
let hudTimer = 0;
function loop() {
  requestAnimationFrame(loop);
  if (window.__casa && window.__casa.paused) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (view === 'walk' && fps.isLocked) updateWalk(dt);
  if (view === 'orbit') orbit.update();
  updateDoors(dt);
  for (const f of world.animated) f(t);

  hudTimer += dt;
  if (hudTimer > 0.12 && view !== 'menu') {
    hudTimer = 0;
    const p = view === 'walk' ? player.pos : orbit.target;
    const r = view === 'walk' ? roomAt(p.x, p.z, p.y + 0.1) : null;
    const name = r ? r.name : view === 'orbit' ? 'Maquete 3D' : '';
    const sz = r && r.size ? r.size + ' m' : '';
    if (name + sz !== lastRoom) {
      lastRoom = name + sz;
      $('room-name').textContent = name;
      $('room-size').textContent = sz;
    }
    const d = view === 'walk' && fps.isLocked ? doorInSight() : null;
    $('door-hint').classList.toggle('hidden', !d);
    if (d) $('door-hint').textContent = Math.abs(d.target) > 0.01 ? 'E / clique — fechar porta' : 'E / clique — abrir porta';
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const pos = view === 'walk' ? player.pos : camera.position;
    minimap.draw(pos.x, pos.z, Math.atan2(dir.z, dir.x), view === 'walk' && player.pos.y > FLOOR2 - 0.5 ? 1 : 0);
  }
  composer.render(dt);
}

build().then(() => {
  setPlayer(-6.5, 4.2, 0);
  applyQuality();
  loop();
});

// gancho de depuração (usado nos testes automatizados)
window.__casa = {
  camera, scene, world, orbit, setMode, enterOrbit, setPlayer, player, renderer,
  look(x, y, z, tx, ty, tz) {
    view = 'shot';
    orbit.enabled = false;
    camera.position.set(x, y, z);
    camera.lookAt(tx, ty, tz);
    $('start').classList.add('hidden');
  },
  shot(q) {
    if (q) { quality = q; applyQuality(); }
    updateDoors(1);
    for (const f of world.animated) f(1);
    composer.render(0.016);
    return renderer.domElement.toDataURL('image/jpeg', 0.9);
  },
  walkTest(code, seconds) {
    view = 'walk';
    keys[code] = true;
    let t = 0;
    while (t < seconds) {
      updateWalk(1 / 60);
      t += 1 / 60;
    }
    keys[code] = false;
    return { x: player.pos.x, y: player.pos.y, z: player.pos.z };
  },
};
