// Casa 43 — passeio virtual 3D
import * as THREE from 'three';
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
import { AmbientMusic } from './music.js';

const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const $ = (id) => document.getElementById(id);
const setStatus = (t) => ($('loading-status').textContent = t);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('casa3d.' + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('casa3d.' + k, JSON.stringify(v));
    } catch (e) {}
  },
};

// ------------------------------------------------------------------
// Renderizador e cena
// ------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc9d6e2, 0.008);
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 1500);
camera.rotation.order = 'YXZ';

const sky = new Sky();
sky.scale.setScalar(1200);
scene.add(sky);
const skyU = sky.material.uniforms;

const stars = (() => {
  const n = 1800;
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI * 0.45;
    p[i * 3] = 900 * Math.cos(th) * Math.sin(ph) + 10;
    p[i * 3 + 1] = 900 * Math.cos(ph);
    p[i * 3 + 2] = 900 * Math.sin(th) * Math.sin(ph) + 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
})();

// céu noturno: degradê azul-marinho (mais claro no horizonte, com brilho quente da cidade) + lua
function makeNightSky(radius = 1000) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uOpacity; varying vec3 vP;
      void main(){
        float h = clamp(vP.y, -0.2, 1.0);
        vec3 zen = vec3(0.012, 0.022, 0.06);
        vec3 hor = vec3(0.075, 0.1, 0.18);
        vec3 glow = vec3(0.16, 0.12, 0.13);
        vec3 c = mix(hor, zen, pow(max(h, 0.0), 0.55));
        c += glow * exp(-max(h, 0.0) * 14.0) * 0.45;
        c = mix(c, vec3(0.01, 0.012, 0.02), smoothstep(0.0, -0.08, vP.y));
        gl_FragColor = vec4(c, uOpacity);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
}
const nightSky = makeNightSky();
nightSky.renderOrder = -1;
scene.add(nightSky);
const MOON_DIR = new THREE.Vector3(0.62, 0.5, -0.6).normalize();
const moon = new THREE.Mesh(new THREE.SphereGeometry(13, 24, 12), new THREE.MeshBasicMaterial({ color: 0xeef2ff, fog: false }));
moon.position.copy(MOON_DIR).multiplyScalar(850).add(new THREE.Vector3(10, 0, 5));
scene.add(moon);

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
const sc = sun.shadow.camera;
sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 120;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.025;
sun.target.position.set(10, 0, 5);
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xeef0f2, 0x8a6f52, 0.25);
scene.add(hemi);

// ------------------------------------------------------------------
// Pós-processamento
// ------------------------------------------------------------------
const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1.2, scale: 1.0, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 8, rings: 2, samples: 16 });
gtao.blendIntensity = 0.7;
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.5, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------
// Qualidade gráfica
// ------------------------------------------------------------------
const QUALITY = {
  ultra: { label: 'Ultra', pr: 2, ao: true, shadow: 4096, bloom: true, msaa: 4 },
  alta: { label: 'Alta', pr: 1.5, ao: false, shadow: 4096, bloom: true, msaa: 4 },
  media: { label: 'Média', pr: 1, ao: false, shadow: 2048, bloom: true, msaa: 4 },
  baixa: { label: 'Baixa', pr: 0.75, ao: false, shadow: 1024, bloom: false, msaa: 0 },
};
const QORDER = ['ultra', 'alta', 'media', 'baixa'];
let qualityPref = store.get('quality', 'auto'); // 'auto' ou um dos níveis
let quality = qualityPref === 'auto' ? 'alta' : qualityPref;

function applyQuality() {
  const q = QUALITY[quality];
  const pr = Math.min(window.devicePixelRatio || 1, q.pr);
  renderer.setPixelRatio(pr);
  composer.setPixelRatio(pr);
  gtao.enabled = q.ao;
  bloom.enabled = q.bloom;
  rt.samples = q.msaa;
  if (sun.shadow.mapSize.x !== q.shadow) {
    sun.shadow.mapSize.set(q.shadow, q.shadow);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  renderer.shadowMap.needsUpdate = true;
  onResize();
  document.querySelectorAll('[data-quality]').forEach((b) => b.classList.toggle('on', b.dataset.quality === qualityPref));
  $('quality-now').textContent = qualityPref === 'auto' ? `(agora: ${q.label})` : '';
}
function setQualityPref(p) {
  qualityPref = p;
  store.set('quality', p);
  if (p !== 'auto') quality = p;
  else quality = 'alta';
  fpsProbe.reset();
  applyQuality();
}
// ajuste automático: mede o FPS e baixa a qualidade se estiver travando
const fpsProbe = {
  frames: 0, time: 0, settle: 0,
  reset() { this.frames = 0; this.time = 0; this.settle = 0; },
  tick(dt) {
    if (qualityPref !== 'auto' || view === 'menu') return;
    this.settle += dt;
    if (this.settle < 2) return;
    this.frames++;
    this.time += dt;
    if (this.time > 3) {
      const fps = this.frames / this.time;
      const i = QORDER.indexOf(quality);
      if (fps < 32 && i < QORDER.length - 1) {
        quality = QORDER[i + 1];
        applyQuality();
      } else if (fps > 58 && i > 1) {
        quality = QORDER[i - 1];
        applyQuality();
      }
      this.reset();
    }
  },
};

// ------------------------------------------------------------------
// Horário do dia (6h às 23h) — sol, céu e luzes acompanham
// ------------------------------------------------------------------
const pmrem = new THREE.PMREMGenerator(renderer);
const envCache = new Map();
const sunDir = new THREE.Vector3();
const cA = new THREE.Color(), cB = new THREE.Color();
let hour = store.get('hour', 16);
let envTimer = null;

function sunFor(h) {
  const elev = h <= 18.6 ? 64 * Math.sin((Math.PI * (h - 5.8)) / 12.8) : -8 - (h - 18.6) * 6;
  const azim = 110 + ((h - 6) / 12.6) * 150;
  return { elev, azim };
}

function setHour(h, final = true) {
  hour = h;
  store.set('hour', h);
  const { elev, azim } = sunFor(h);
  sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(azim));
  const day = smooth(-3, 14, elev); // 0 noite … 1 dia
  const dark = 1 - smooth(-4, 6, elev); // luzes acesas
  const warm = smooth(25, 2, elev) * smooth(-6, 2, elev); // tom dourado

  skyU.sunPosition.value.copy(sunDir);
  skyU.turbidity.value = 3 + warm * 6;
  skyU.rayleigh.value = 0.6 + warm * 2.2 + (1 - day) * 0.5;
  skyU.mieCoefficient.value = 0.005;
  skyU.mieDirectionalG.value = 0.8;
  sky.visible = elev > -9;
  stars.material.opacity = 0.85 * smooth(-3, -10, elev);
  const nightK = smooth(2, -9, elev);
  nightSky.visible = nightK > 0.001;
  nightSky.material.uniforms.uOpacity.value = nightK;
  moon.visible = elev < -3;
  scene.background = elev > -9 ? null : new THREE.Color(0x03060f);

  cA.set(0xc9d6e2).lerp(cB.set(0xd6a988), warm).lerp(cB.set(0x111a2e), 1 - day);
  scene.fog.color.copy(cA);

  const night = elev < -2;
  // à noite a "luz do sol" vira o luar (azulado, fraco, vindo da lua)
  sun.position.copy(sun.target.position).addScaledVector(night ? MOON_DIR : sunDir, 60);
  sun.color.copy(cA.set(0xfff1e0).lerp(cB.set(0xff9a50), warm));
  if (night) sun.color.set(0x9db4e6);
  sun.intensity = night ? 0.5 * dark : 3.4 * smooth(-2, 12, elev);
  hemi.intensity = 0.1 + 0.15 * day + 0.06 * dark;
  hemi.color.copy(cA.set(0xeef0f2).lerp(cB.set(0xffc9a0), warm).lerp(cB.set(0x34466e), 1 - day));
  hemi.groundColor.copy(cA.set(0x8a6f52).lerp(cB.set(0x241a12), 1 - day));

  scene.environmentIntensity = 0.1 + 0.24 * day + 0.05 * dark;
  const interior = 0.55 + 0.45 * dark;
  for (const l of world.nightLights) {
    const u = l.userData;
    // externas e abajures só acendem à noite; luzes de teto dos quartos ficam mais baixas à noite (clima)
    const k = u.outdoor || u.nightOnly ? dark : interior * (1 - (1 - (u.nightScale ?? 1)) * dark);
    l.intensity = u.base * k;
    l.visible = l.intensity > 0.001;
  }
  for (const e of world.nightEmissive) e.mat.emissiveIntensity = Math.max(e.day || 0, e.on * dark);
  if (M) {
    M.ledWarm.emissiveIntensity = 2.2 * dark;
    M.poolLight.emissiveIntensity = 3 * dark;
    M.bulb.emissiveIntensity = 0.4 + 2.5 * dark;
  }
  renderer.toneMappingExposure = 0.85 + 0.25 * (1 - day);
  bloom.strength = 0.15 + 0.4 * dark;
  renderer.shadowMap.needsUpdate = true;

  // mapa de ambiente (refletido nos vidros, metais e pisos)
  clearTimeout(envTimer);
  const updEnv = () => {
    const key = elev < -6 ? 'noite' : (Math.round(h * 2) / 2).toFixed(1);
    if (!envCache.has(key)) {
      const envScene = new THREE.Scene();
      if (key === 'noite') envScene.add(makeNightSky(50));
      else {
        const s2 = new Sky();
        s2.scale.setScalar(100);
        for (const k of Object.keys(skyU)) {
          const v = skyU[k].value;
          s2.material.uniforms[k].value = v && v.clone ? v.clone() : v;
        }
        envScene.add(s2);
      }
      envCache.set(key, pmrem.fromScene(envScene, 0.02).texture);
    }
    scene.environment = envCache.get(key);
  };
  if (final || !scene.environment) updEnv();
  else envTimer = setTimeout(updEnv, 150);

  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  $('hour-label').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  $('hour').value = h;
  document.querySelectorAll('[data-hour]').forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.hour - h) < 0.01));
}

// ------------------------------------------------------------------
// Construção da cena
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
  setHour(hour);
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.compile(scene, camera);
  $('loading').classList.add('hidden');
  openMenu(true);
}

// ------------------------------------------------------------------
// Controles
// ------------------------------------------------------------------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.495;
orbit.minDistance = 3;
orbit.maxDistance = 70;

const EYE = 1.62;
const RADIUS = 0.22;
const player = { pos: new THREE.Vector3(-6.5, 0, 4.2), vy: 0 };
const look = { yaw: -Math.PI / 2, pitch: 0 };
let sens = store.get('sens', 1);
let view = 'menu'; // 'walk' | 'orbit' | 'menu'
let lastView = 'walk';
const keys = {};
const canvas = renderer.domElement;

function applyLook() {
  look.pitch = Math.max(-1.45, Math.min(1.45, look.pitch));
  camera.rotation.set(look.pitch, look.yaw, 0, 'YXZ');
}

function setPlayer(x, z, yawDeg, floorY = null) {
  // térreo: o raio começa abaixo da laje do superior (senão o jogador "nasce" em cima dela)
  const y = floorY ?? groundHeight(x, z, 1.5) ?? 0;
  player.pos.set(x, y, z);
  player.vy = 0;
  // yaw em graus: 0 = olhando para +X (fundos), 90 = +Z
  look.yaw = THREE.MathUtils.degToRad(-yawDeg) - Math.PI / 2;
  look.pitch = 0;
  applyLook();
  camera.position.set(x, y + EYE, z);
}

const isLocked = () => document.pointerLockElement === canvas;
function tryLock() {
  try {
    const p = canvas.requestPointerLock();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

function enterWalk() {
  view = 'walk';
  lastView = 'walk';
  orbit.enabled = false;
  world.upperGroup.visible = true;
  world.roofGroup.visible = true;
  if (world.neighbors) world.neighbors.visible = true;
  closeMenu();
  applyLook();
  camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
  $('crosshair').classList.remove('hidden');
  $('orbit-tools').classList.add('hidden');
  tryLock();
}

function enterOrbit() {
  view = 'orbit';
  lastView = 'orbit';
  if (isLocked()) document.exitPointerLock();
  closeMenu();
  orbit.enabled = true;
  camera.position.set(-11, 17, -3);
  orbit.target.set(10, 1, 5);
  orbit.update();
  $('crosshair').classList.add('hidden');
  $('orbit-tools').classList.remove('hidden');
}

// olhar com o mouse: com o ponteiro travado OU arrastando com o botão esquerdo
let dragging = false, dragMoved = 0;
canvas.addEventListener('mousedown', (e) => {
  if (view !== 'walk') return;
  if (e.button === 0) {
    if (isLocked()) {
      const d = doorInSight();
      if (d) toggleDoor(d);
    } else {
      dragging = true;
      dragMoved = 0;
    }
  }
});
window.addEventListener('mouseup', () => {
  if (dragging && dragMoved < 4 && view === 'walk') {
    // clique simples: porta em vista ou travar o mouse
    const d = doorInSight();
    if (d) toggleDoor(d);
    else tryLock();
  }
  dragging = false;
});
document.addEventListener('mousemove', (e) => {
  if (view !== 'walk') return;
  if (isLocked() || dragging) {
    const k = 0.0022 * sens * (dragging && !isLocked() ? 1.4 : 1);
    look.yaw -= e.movementX * k;
    look.pitch -= e.movementY * k;
    dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
    applyLook();
  }
});
document.addEventListener('pointerlockchange', () => {
  $('lock-hint').classList.toggle('hidden', isLocked() || view !== 'walk');
});
document.addEventListener('pointerlockerror', () => {
  $('lock-hint').classList.toggle('hidden', view !== 'walk');
});

// ---------------- colisão ----------------
const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
function isVisible(o) {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}
function groundHeight(x, z, fromY) {
  ray.set(new THREE.Vector3(x, fromY, z), DOWN);
  ray.far = 30;
  const hits = ray.intersectObjects(world.walkables, false);
  for (const h of hits) if (isVisible(h.object)) return h.point.y;
  return null;
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
let bob = 0;
function updateWalk(dt) {
  const run = keys.ShiftLeft || keys.ShiftRight;
  const speed = run ? 3.4 : 1.6;
  // setas esquerda/direita giram a visão (útil sem mouse)
  if (keys.ArrowLeft) (look.yaw += dt * 1.8), applyLook();
  if (keys.ArrowRight) (look.yaw -= dt * 1.8), applyLook();
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  right.crossVectors(fwd, camera.up).normalize();
  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) (mx += fwd.x), (mz += fwd.z);
  if (keys.KeyS || keys.ArrowDown) (mx -= fwd.x), (mz -= fwd.z);
  if (keys.KeyD) (mx += right.x), (mz += right.z);
  if (keys.KeyA) (mx -= right.x), (mz -= right.z);
  const len = Math.hypot(mx, mz);
  const p = player.pos;
  if (len > 0) {
    // passos menores para não atravessar paredes em quadros lentos
    const total = speed * dt;
    const n = Math.ceil(total / 0.08);
    for (let i = 0; i < n; i++) {
      const step = total / n / len;
      const nx = p.x + mx * step;
      if (!blocked(nx, p.z, p.y)) p.x = nx;
      const nz = p.z + mz * step;
      if (!blocked(p.x, nz, p.y)) p.z = nz;
    }
  }
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
    if (p.y < -10) setPlayer(-3.5, 6.8, -18);
  }
  bob += len > 0 ? dt * speed * 5 : 0;
  camera.position.set(p.x, p.y + EYE + (len > 0 ? Math.sin(bob) * 0.015 : 0), p.z);
}

// ---------------- portas ----------------
const center = new THREE.Vector2(0, 0);
const doorRay = new THREE.Raycaster();
function doorInSight() {
  doorRay.setFromCamera(center, camera);
  doorRay.far = 2.6;
  const hits = doorRay.intersectObjects(world.doors.map((d) => d.pivot), true);
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
      d.angle += Math.sign(diff) * Math.min(Math.abs(diff), dt * 2.4);
      d.pivot.rotation.y = d.angle;
      moving = true;
    }
  }
  if (moving) renderer.shadowMap.needsUpdate = true;
}

// ------------------------------------------------------------------
// Menu
// ------------------------------------------------------------------
const music = new AmbientMusic();
music.volume = store.get('volume', 0.45);
let musicOn = store.get('music', true);

function openMenu(first = false) {
  if (isLocked()) document.exitPointerLock();
  if (view !== 'menu') lastView = view;
  view = 'menu';
  dragging = false;
  for (const k in keys) keys[k] = false;
  $('menu').classList.remove('hidden');
  $('btn-continue').textContent = first ? 'Entrar na casa' : 'Continuar';
  $('menu-title').textContent = first ? 'Casa 43 — Passeio Virtual' : 'Menu';
  $('lock-hint').classList.add('hidden');
  $('crosshair').classList.add('hidden');
  $('hud').classList.toggle('hidden', first);
  menuFirst = first;
}
let menuFirst = true;
function closeMenu() {
  $('menu').classList.add('hidden');
  $('hud').classList.remove('hidden');
  if (musicOn && !music.on) music.start();
}
function resume() {
  if (menuFirst) setPlayer(-3.5, 6.8, -18);
  if (lastView === 'orbit' && !menuFirst) enterOrbit();
  else enterWalk();
}

$('btn-continue').onclick = resume;
$('btn-orbit').onclick = enterOrbit;
$('btn-menu').onclick = () => openMenu();
$('btn-walk2').onclick = () => {
  if (menuFirst) setPlayer(-3.5, 6.8, -18);
  menuFirst = false;
  enterWalk();
};
$('btn-upper').onclick = () => {
  const v = !world.upperGroup.visible;
  world.upperGroup.visible = v;
  world.roofGroup.visible = v;
  $('btn-upper').textContent = v ? 'Ver só o térreo' : 'Mostrar pavimento superior';
  renderer.shadowMap.needsUpdate = true;
};
$('btn-roof').onclick = () => {
  world.roofGroup.visible = !world.roofGroup.visible;
  $('btn-roof').textContent = world.roofGroup.visible ? 'Tirar a cobertura' : 'Pôr a cobertura';
  renderer.shadowMap.needsUpdate = true;
};
$('btn-nb').onclick = () => {
  world.neighbors.visible = !world.neighbors.visible;
  $('btn-nb').textContent = world.neighbors.visible ? 'Ocultar vizinhos' : 'Mostrar vizinhos';
  renderer.shadowMap.needsUpdate = true;
};

// cômodos (teletransporte)
(function buildRooms() {
  const list = $('tp-list');
  for (const [title, f] of [['Térreo', 0], ['Pavimento superior', 1]]) {
    const h = document.createElement('h4');
    h.textContent = title;
    list.appendChild(h);
    for (const r of ROOMS.filter((r) => r.floor === f && r.spawn)) {
      const b = document.createElement('button');
      b.className = 'room';
      b.innerHTML = `<span>${r.name}</span><small>${r.size || ''}</small>`;
      b.onclick = () => {
        const [x, z, yaw] = r.spawn;
        setPlayer(x, z, yaw, f === 1 ? FLOOR2 : null);
        menuFirst = false;
        enterWalk();
      };
      list.appendChild(b);
    }
  }
})();

// horário
$('hour').addEventListener('input', (e) => setHour(+e.target.value, false));
$('hour').addEventListener('change', (e) => setHour(+e.target.value, true));
document.querySelectorAll('[data-hour]').forEach((b) => (b.onclick = () => setHour(+b.dataset.hour)));
// qualidade
document.querySelectorAll('[data-quality]').forEach((b) => (b.onclick = () => setQualityPref(b.dataset.quality)));
// música
function syncMusicUI() {
  $('music-toggle').textContent = musicOn ? 'Ligada' : 'Desligada';
  $('music-toggle').classList.toggle('on', musicOn);
  $('volume').value = music.volume;
}
$('music-toggle').onclick = () => {
  musicOn = !musicOn;
  store.set('music', musicOn);
  if (musicOn) music.start();
  else music.stop();
  syncMusicUI();
};
$('volume').addEventListener('input', (e) => {
  music.setVolume(+e.target.value);
  store.set('volume', +e.target.value);
});
syncMusicUI();
// sensibilidade
$('sens').value = sens;
$('sens').addEventListener('input', (e) => {
  sens = +e.target.value;
  store.set('sens', sens);
});

// atualizações
$('version').textContent = 'Versão ' + VERSION;
$('btn-update').onclick = async () => {
  const out = $('update-status');
  const btn = $('btn-update');
  btn.disabled = true;
  out.textContent = 'Procurando atualizações...';
  try {
    if (window.casaApp && window.casaApp.checkUpdate) {
      const r = await window.casaApp.checkUpdate();
      if (!r.available) out.textContent = `Você já está na versão mais recente (${r.current}).`;
      else {
        out.textContent = `Baixando a versão ${r.latest}...`;
        window.casaApp.onUpdateProgress && window.casaApp.onUpdateProgress((t) => (out.textContent = t));
        await window.casaApp.applyUpdate();
        out.textContent = 'Atualizado! Reiniciando...';
      }
    } else {
      // aberto direto no navegador: só verifica e explica como atualizar
      const res = await fetch('https://raw.githubusercontent.com/dhqdev/home/main/package.json?t=' + Date.now(), { cache: 'no-store' });
      const latest = (await res.json()).version;
      if (latest === VERSION) out.textContent = `Você já está na versão mais recente (${VERSION}).`;
      else out.innerHTML = `Há uma versão nova (${latest}). Abra pelo atalho <b>Casa 3D</b> da Área de Trabalho e use este botão de novo, ou rode o comando de instalação outra vez.`;
    }
  } catch (e) {
    out.textContent = 'Não consegui verificar agora (sem internet?). ' + (e && e.message ? e.message : '');
  }
  btn.disabled = false;
};
if (window.casaApp) $('btn-quit').classList.remove('hidden');
$('btn-quit').onclick = () => window.casaApp && window.casaApp.quit();
// no programa: avisa sozinho quando houver versão nova no GitHub
if (window.casaApp && window.casaApp.checkUpdate) {
  setTimeout(() => {
    window.casaApp
      .checkUpdate()
      .then((r) => {
        if (!r.available) return;
        $('update-status').textContent = `Nova versão ${r.latest} disponível. Clique em "Buscar atualizações" para instalar.`;
        $('btn-update').classList.add('primary');
      })
      .catch(() => {});
  }, 4000);
}

// teclado
const HOURS = [8, 12, 16, 18, 21];
document.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.code === 'Escape' || e.code === 'Tab') {
    e.preventDefault();
    if (view === 'menu') {
      if (!menuFirst) resume();
    } else if (!isLocked() || e.code === 'Tab') openMenu();
    return;
  }
  if (view === 'menu') return;
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE' && view === 'walk') {
    const d = doorInSight();
    if (d) toggleDoor(d);
  }
  if (e.code === 'KeyL') {
    const i = HOURS.findIndex((x) => x > hour + 0.01);
    setHour(HOURS[i < 0 ? 0 : i]);
  }
  if (e.code === 'KeyT') {
    openMenu();
    $('tp-list').scrollIntoView({ block: 'start' });
  }
  if (e.code === 'KeyV') view === 'orbit' ? enterWalk() : enterOrbit();
  if (e.code === 'KeyM') $('minimap-wrap').classList.toggle('big');
});
document.addEventListener('keyup', (e) => (keys[e.code] = false));
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
});

// duplo clique na maquete: caminhar a partir daquele ponto
canvas.addEventListener('dblclick', (e) => {
  if (view !== 'orbit') return;
  const v = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(v, camera);
  ray.far = 500;
  const hits = ray.intersectObjects(world.walkables, false).filter((h) => isVisible(h.object));
  if (hits.length) {
    const p = hits[0].point;
    const yaw = THREE.MathUtils.radToDeg(Math.atan2(p.z - camera.position.z, p.x - camera.position.x));
    setPlayer(p.x, p.z, yaw, p.y);
    menuFirst = false;
    enterWalk();
  }
});

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
  if (view === 'walk') updateWalk(dt);
  if (view === 'orbit') orbit.update();
  updateDoors(dt);
  for (const f of world.animated) f(t);
  fpsProbe.tick(dt);

  hudTimer += dt;
  if (hudTimer > 0.12 && view !== 'menu') {
    hudTimer = 0;
    const p = player.pos;
    const r = view === 'walk' ? roomAt(p.x, p.z, p.y + 0.1) : null;
    const name = r ? r.name : view === 'orbit' ? 'Maquete 3D' : '';
    const sz = r && r.size ? r.size + ' m' : '';
    if (name + sz !== lastRoom) {
      lastRoom = name + sz;
      $('room-name').textContent = name;
      $('room-size').textContent = sz;
    }
    const d = view === 'walk' ? doorInSight() : null;
    $('door-hint').classList.toggle('hidden', !d);
    if (d) $('door-hint').textContent = Math.abs(d.target) > 0.01 ? 'E / clique — fechar porta' : 'E / clique — abrir porta';
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const pos = view === 'walk' ? player.pos : orbit.target;
    minimap.draw(pos.x, pos.z, Math.atan2(dir.z, dir.x), view === 'walk' && player.pos.y > FLOOR2 - 0.5 ? 1 : 0);
  }
  composer.render(dt);
}

build().then(() => {
  setPlayer(-3.5, 6.8, -18);
  camera.position.set(-9, 2.2, 4.2);
  applyQuality();
  loop();
});

// gancho de depuração (testes automatizados)
window.__casa = {
  camera, scene, world, orbit, setHour, enterOrbit, enterWalk, setPlayer, player, renderer,
  get view() { return view; },
  look(x, y, z, tx, ty, tz) {
    view = 'shot';
    orbit.enabled = false;
    $('menu').classList.add('hidden');
    camera.position.set(x, y, z);
    camera.lookAt(tx, ty, tz);
  },
  shot(q) {
    if (q) {
      quality = q;
      applyQuality();
    }
    updateDoors(1);
    for (const f of world.animated) f(1);
    composer.render(0.016);
    return renderer.domElement.toDataURL('image/jpeg', 0.9);
  },
  walkTest(code, seconds) {
    view = 'walk';
    keys[code] = true;
    for (let t = 0; t < seconds; t += 1 / 60) updateWalk(1 / 60);
    keys[code] = false;
    return { x: +player.pos.x.toFixed(2), y: +player.pos.y.toFixed(2), z: +player.pos.z.toFixed(2) };
  },
};
