// Minimapa: planta baixa do pavimento atual com a posição do visitante
import { ROOMS, LOT } from './plan.js';

export class Minimap {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.cache = {};
  }

  // pré-desenha a planta de cada pavimento
  plan(floor) {
    if (this.cache[floor]) return this.cache[floor];
    const W = 600, H = 320, pad = 10;
    const s = (W - pad * 2) / LOT.w;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(20,22,24,0.88)';
    g.fillRect(0, 0, W, H);
    // lote
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.strokeRect(pad, pad, LOT.w * s, LOT.d * s);
    const colors = {
      garagem: '#4a4a4a', jardim: '#2f5a2c', corredor: '#55524c', piscina: '#2a6f86', gourmet: '#6b5440',
      vazio: 'rgba(255,255,255,0.05)', luz: 'rgba(120,180,255,0.12)',
    };
    for (const r of ROOMS.filter((r) => r.floor === floor && r.id !== 'rua')) {
      const x = pad + r.x0 * s, y = pad + r.z0 * s, w = (r.x1 - r.x0) * s, h = (r.z1 - r.z0) * s;
      g.fillStyle = colors[r.id] || '#d8cbb6';
      g.fillRect(x, y, w, h);
      g.strokeStyle = '#1a1a1a';
      g.lineWidth = 2;
      g.strokeRect(x, y, w, h);
      g.fillStyle = colors[r.id] ? '#eee' : '#2a2520';
      g.font = '600 11px system-ui, sans-serif';
      g.textAlign = 'center';
      const label = r.name.replace(/ \(.*\)/, '');
      const words = label.split(' ');
      const lines = w < 70 && words.length > 1 ? words : [label];
      lines.forEach((ln, i) => g.fillText(ln, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 12 + 4, w - 4));
    }
    if (floor === 0) {
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.font = '600 12px system-ui';
      g.fillText('RUA', pad + 4, H - 6);
    }
    g.fillStyle = '#fff';
    g.font = '700 13px system-ui';
    g.textAlign = 'right';
    g.fillText(floor ? 'PAVIMENTO SUPERIOR' : 'TÉRREO', W - pad - 4, H - 8);
    this.cache[floor] = { c, s, pad };
    return this.cache[floor];
  }

  draw(px, pz, angle, floor) {
    const { c, s, pad } = this.plan(floor);
    const g = this.ctx;
    this.c.width = c.width;
    this.c.height = c.height;
    g.drawImage(c, 0, 0);
    const x = pad + px * s, y = pad + pz * s;
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.fillStyle = 'rgba(255,180,80,0.25)';
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, 46, -0.5, 0.5);
    g.closePath();
    g.fill();
    g.fillStyle = '#ff8a2a';
    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(-6, -6);
    g.lineTo(-3, 0);
    g.lineTo(-6, 6);
    g.closePath();
    g.fill();
    g.restore();
  }
}
