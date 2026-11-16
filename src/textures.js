// Texturas procedurais (geradas em canvas) — nada de arquivos externos.
// Cada textura representa um pedaço do mundo com tamanho conhecido em metros;
// as geometrias usam UV em metros (ver geo.js), então "repeat = 1 / tamanho".
import * as THREE from 'three';

let seed = 1337;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Ruído de valor 2D, periódico (para a textura repetir sem emenda)
function makeNoise(period) {
  const g = new Float32Array(period * period);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = s(x - xi), yf = s(y - yi);
    const x0 = ((xi % period) + period) % period, y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    const a = g[y0 * period + x0], b = g[y0 * period + x1];
    const c = g[y1 * period + x0], d = g[y1 * period + x1];
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

function fbm(noise, x, y, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * noise(x * f, y * f);
    amp *= 0.5;
    f *= 2;
  }
  return v;
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function toTex(c, meters, opts = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / meters, 1 / meters);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData.meters = meters;
  return t;
}

// Aplica ruído por pixel a uma imagem já desenhada
function pixelPass(ctx, size, fn) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const out = fn(x, y, d[i], d[i + 1], d[i + 2]);
      d[i] = out[0];
      d[i + 1] = out[1];
      d[i + 2] = out[2];
    }
  }
  ctx.putImageData(img, 0, 0);
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// ---------- Madeira em réguas (piso) ----------
export function woodPlanks({ base = [178, 132, 92], plankW = 0.2, meters = 2.4, size = 1024, gap = true, vary = 0.18 } = {}) {
  const [c, ctx] = canvas(size);
  const rows = Math.round(meters / plankW);
  const ph = size / rows;
  const noise = makeNoise(64);
  // tom por régua
  const tones = [];
  for (let r = 0; r < rows; r++) {
    let x = -rand() * size * 0.5;
    while (x < size) {
      const len = size * (0.35 + rand() * 0.4);
      tones.push({ r, x, len, k: 1 + (rand() - 0.5) * vary * 2, o: rand() * 100 });
      x += len;
    }
  }
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (const p of tones) {
    const y0 = Math.floor(p.r * ph), y1 = Math.floor((p.r + 1) * ph);
    for (let y = y0; y < y1; y++) {
      for (let xx = Math.max(0, Math.floor(p.x)); xx < Math.min(size, p.x + p.len); xx++) {
        const u = xx / size * 6, v = (y - y0) / ph;
        const grain = fbm(noise, u * 0.6 + p.o, v * 3 + p.o * 0.3, 3);
        const lines = Math.sin((v * 9 + grain * 6) * Math.PI) * 0.5 + 0.5;
        let f = p.k * (0.86 + grain * 0.22 + lines * 0.06);
        const edge = gap && (y - y0 < 1.5 || xx - p.x < 1.5);
        if (edge) f *= 0.55;
        const i = (y * size + xx) * 4;
        d[i] = clamp(base[0] * f);
        d[i + 1] = clamp(base[1] * f);
        d[i + 2] = clamp(base[2] * f);
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTex(c, meters);
}

// ---------- Veio de madeira contínuo (móveis, ripado) ----------
export function woodGrain({ base = [150, 100, 62], meters = 1, size = 512 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const u = x / size * 4, v = y / size * 16;
    const g = fbm(noise, u, v * 0.25, 4);
    const ring = Math.sin((u * 3 + g * 5) * Math.PI) * 0.5 + 0.5;
    const f = 0.8 + g * 0.25 + ring * 0.1;
    return [base[0] * f, base[1] * f, base[2] * f];
  });
  return toTex(c, meters);
}

// ---------- Porcelanato grande ----------
export function porcelain({ base = [226, 219, 207], tile = 0.9, tiles = 2, veins = 0.25, grout = [180, 172, 160], size = 1024 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  const ts = size / tiles;
  pixelPass(ctx, size, (x, y) => {
    const u = x / size * 4, v = y / size * 4;
    const n = fbm(noise, u, v, 5);
    const vein = Math.pow(1 - Math.abs(Math.sin((u + v * 0.6 + n * 3) * 2.2)), 18) * veins;
    const tileK = 1 + ((Math.floor(x / ts) * 7 + Math.floor(y / ts) * 13) % 5 - 2) * 0.006;
    const f = (0.965 + n * 0.06 - vein * 0.25) * tileK;
    const gx = x % ts, gy = y % ts;
    if (gx < 1.2 || gy < 1.2) return grout;
    return [base[0] * f, base[1] * f, base[2] * f];
  });
  return toTex(c, tile * tiles);
}

// ---------- Mármore ----------
export function marble({ base = [238, 236, 232], vein = [120, 118, 116], meters = 1.5, size = 1024, strength = 1 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(16);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const u = x / size * 4, v = y / size * 4;
    const n = fbm(noise, u, v, 6);
    const t = Math.abs(Math.sin((u * 0.8 + v * 1.3 + n * 4.5) * Math.PI));
    const vv = Math.pow(1 - t, 10) * strength + Math.pow(1 - t, 40) * 0.6 * strength;
    const k = 0.97 + n * 0.05;
    return [
      base[0] * k * (1 - vv) + vein[0] * vv,
      base[1] * k * (1 - vv) + vein[1] * vv,
      base[2] * k * (1 - vv) + vein[2] * vv,
    ];
  });
  return toTex(c, meters);
}

// ---------- Concreto / reboco ----------
export function concrete({ base = [150, 150, 148], meters = 2, size = 512, amount = 0.14, pores = true } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const u = x / size * 8, v = y / size * 8;
    const n = fbm(noise, u, v, 5);
    let f = 1 - amount / 2 + n * amount;
    if (pores && rand() < 0.004) f *= 0.75;
    f += (rand() - 0.5) * 0.03;
    return [base[0] * f, base[1] * f, base[2] * f];
  });
  return toTex(c, meters);
}

// ---------- Grama ----------
export function grass({ meters = 2, size = 1024 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const n = fbm(noise, x / size * 8, y / size * 8, 5);
    const r = rand();
    const f = 0.75 + n * 0.45 + (r - 0.5) * 0.25;
    return [58 * f, 92 * f + r * 8, 40 * f];
  });
  // lâminas
  for (let i = 0; i < 26000; i++) {
    const x = rand() * size, y = rand() * size;
    const l = 3 + rand() * 7;
    const a = -Math.PI / 2 + (rand() - 0.5) * 1.2;
    const g = 90 + rand() * 80;
    ctx.strokeStyle = `rgba(${45 + rand() * 40},${g * 0.85},${35 + rand() * 25},0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  return toTex(c, meters);
}

// ---------- Pastilha de piscina ----------
export function poolTiles({ meters = 0.5, size = 512 } = {}) {
  const [c, ctx] = canvas(size);
  const n = 20;
  const s = size / n;
  ctx.fillStyle = '#d8e4e6';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const k = rand();
      const r = 30 + k * 40, g = 150 + k * 50, b = 185 + k * 40;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
    }
  }
  return toTex(c, meters);
}

// ---------- Placas de pedra / piso externo ----------
export function pavers({ base = [190, 186, 178], tileW = 0.6, tileH = 0.6, meters = 2.4, size = 1024, joint = [120, 118, 112] } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  const pw = size * tileW / meters, phh = size * tileH / meters;
  pixelPass(ctx, size, (x, y) => {
    const row = Math.floor(y / phh);
    const xo = (row % 2) * pw * 0.5;
    const gx = (x + xo) % pw, gy = y % phh;
    if (gx < 2 || gy < 2) return joint;
    const tk = 1 + (((Math.floor((x + xo) / pw) * 31 + row * 17) % 7) - 3) * 0.015;
    const n = fbm(noise, x / size * 10, y / size * 10, 4);
    const f = (0.9 + n * 0.18) * tk;
    return [base[0] * f, base[1] * f, base[2] * f];
  });
  return toTex(c, meters);
}

// ---------- Concregrama (vaga descoberta) ----------
export function concregrama({ meters = 1.2, size = 512 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(16);
  ctx.fillRect(0, 0, size, size);
  const cell = size / 3;
  pixelPass(ctx, size, (x, y) => {
    const n = fbm(noise, x / size * 8, y / size * 8, 4);
    const gx = x % cell, gy = y % cell;
    const inHole = gx > cell * 0.18 && gx < cell * 0.82 && gy > cell * 0.18 && gy < cell * 0.82;
    if (inHole) {
      const r = rand();
      const f = 0.7 + n * 0.5 + (r - 0.5) * 0.3;
      return [58 * f, 110 * f, 38 * f];
    }
    const f = 0.88 + n * 0.2;
    return [176 * f, 172 * f, 164 * f];
  });
  return toTex(c, meters);
}

// ---------- Tecido ----------
export function fabric({ base = [200, 192, 178], meters = 0.5, size = 256 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(16);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const w = ((x % 4 < 2) !== (y % 4 < 2)) ? 1.03 : 0.97;
    const n = fbm(noise, x / size * 6, y / size * 6, 3);
    const f = w * (0.93 + n * 0.12) + (rand() - 0.5) * 0.04;
    return [base[0] * f, base[1] * f, base[2] * f];
  });
  return toTex(c, meters);
}

// ---------- Tapete ----------
export function rug({ base = [214, 204, 186], accent = [150, 128, 104], meters = 3, size = 512 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const n = fbm(noise, x / size * 12, y / size * 12, 4);
    const stripe = Math.abs(Math.sin(x / size * Math.PI * 14 + n * 2)) > 0.96 ? 1 : 0;
    const f = 0.9 + n * 0.15 + (rand() - 0.5) * 0.08;
    const b = stripe ? accent : base;
    return [b[0] * f, b[1] * f, b[2] * f];
  });
  return toTex(c, meters);
}

// ---------- Asfalto ----------
export function asphalt({ meters = 3, size = 512 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  pixelPass(ctx, size, (x, y) => {
    const n = fbm(noise, x / size * 10, y / size * 10, 4);
    const r = rand();
    const f = 0.8 + n * 0.3 + (r > 0.97 ? 0.4 : 0) + (r - 0.5) * 0.15;
    return [62 * f, 63 * f, 66 * f];
  });
  return toTex(c, meters);
}

// ---------- Revestimento de banheiro (60x120) ----------
export function wallTile({ base = [205, 200, 192], meters = 2.4, size = 1024 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(32);
  ctx.fillRect(0, 0, size, size);
  const tw = size / 4, th = size / 2;
  pixelPass(ctx, size, (x, y) => {
    if (x % tw < 1.5 || y % th < 1.5) return [235, 232, 226];
    const n = fbm(noise, x / size * 5, y / size * 5, 5);
    const f = 0.95 + n * 0.1;
    return [base[0] * f, base[1] * f, base[2] * f];
  });
  return toTex(c, meters);
}

// ---------- Normal map animado para a água ----------
export function waterNormal({ size = 256 } = {}) {
  const [c, ctx] = canvas(size);
  const noise = makeNoise(16);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = fbm(noise, x / size * 8, y / size * 8, 4);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const dx = h[y * size + ((x + 1) % size)] - h[y * size + ((x - 1 + size) % size)];
      const dy = h[((y + 1) % size) * size + x] - h[((y - 1 + size) % size) * size + x];
      const v = new THREE.Vector3(-dx * 6, -dy * 6, 1).normalize();
      img.data[i * 4] = (v.x * 0.5 + 0.5) * 255;
      img.data[i * 4 + 1] = (v.y * 0.5 + 0.5) * 255;
      img.data[i * 4 + 2] = (v.z * 0.5 + 0.5) * 255;
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTex(c, 2, { linear: true });
}

// ---------- Quadro decorativo (arte abstrata) ----------
export function artwork(palette, w = 512, h = 640) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = palette[1 + (i % (palette.length - 1))];
    ctx.globalAlpha = 0.55 + rand() * 0.4;
    ctx.beginPath();
    const x = rand() * w, y = rand() * h, r = 60 + rand() * 180;
    if (i % 2) ctx.arc(x, y, r, 0, Math.PI * 2);
    else ctx.ellipse(x, y, r, r * 0.4, rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Número da casa / textos ----------
export function textTexture(text, { w = 512, h = 256, color = '#111', bg = null, font = 'bold 200px Helvetica, Arial, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tela de TV (imagem de paisagem desfocada)
export function tvScreen() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 288);
  g.addColorStop(0, '#1d3a5f');
  g.addColorStop(0.55, '#e08a4c');
  g.addColorStop(0.56, '#2a4a3a');
  g.addColorStop(1, '#0f1d17');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 288);
  ctx.fillStyle = 'rgba(255,220,160,0.9)';
  ctx.beginPath();
  ctx.arc(330, 150, 26, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
