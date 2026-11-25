// Lantern Ramen — Renderer.
// All art is drawn with canvas primitives: lantern light, wooden
// counters, steam, bowls of ramen, tickets and customers. No images,
// no network — the game paints its own night market every frame.

import { CANVAS_W, CANVAS_H, BROTHS, TOPPINGS, TUNING } from './config.js';

const FONT = '"Trebuchet MS", "Noto Sans", sans-serif';
const SERIF = '"Noto Serif CJK SC", "Noto Serif", serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'center', font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.steam = [];
    this.time = 0;
  }

  spawnSteam(x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      this.steam.push({
        x: x + (Math.random() - 0.5) * 40, y,
        vy: 20 + Math.random() * 22, vx: (Math.random() - 0.5) * 6,
        r: 3 + Math.random() * 4, life: 1, decay: 0.6 + Math.random() * 0.5,
      });
    }
    if (this.steam.length > 160) this.steam.splice(0, this.steam.length - 160);
  }

  updateSteam(dt) {
    for (const p of this.steam) {
      p.y -= p.vy * dt;
      p.x += p.vx * dt + Math.sin(this.time * 2 + p.y * 0.05) * 6 * dt;
      p.life -= p.decay * dt;
      p.r += 4 * dt;
    }
    this.steam = this.steam.filter((p) => p.life > 0);
  }

  // ------------------------------------------------------------------
  draw(game, dt) {
    const ctx = this.ctx;
    this.time += dt;
    this.updateSteam(dt);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    this.drawBackground(ctx);
    if (game.screen === 'title') { this.drawTitle(ctx, game); return; }
    if (game.screen === 'dayIntro') { this.drawDayIntro(ctx, game); return; }
    if (game.screen === 'summary') { this.drawSummary(ctx, game); return; }
    if (game.screen === 'gameover') { this.drawGameOver(ctx, game); return; }
    this.drawHUD(ctx, game);
    this.drawOrderRail(ctx, game);
    this.drawBrothPots(ctx, game);
    this.drawBoiler(ctx, game);
    this.drawToppingBins(ctx, game);
    this.drawCounter(ctx, game);
    this.drawServeWindow(ctx, game);
    this.drawBottomBar(ctx, game);
    this.drawSteam(ctx);
    this.drawPopups(ctx, game);
    this.drawToast(ctx, game);
    if (game.rushActive) this.drawRushBanner(ctx, game);
  }

  // ------------------------------------------------------------------
  drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, '#171233');
    g.addColorStop(0.55, '#241a3f');
    g.addColorStop(1, '#120d24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Night city silhouette + moon through the stall window.
    ctx.fillStyle = '#0d0a1e';
    ctx.beginPath();
    ctx.moveTo(0, 210);
    const skyline = [0, 150, 60, 170, 120, 130, 190, 165, 260, 120, 330, 160, 420, 140, 500, 175, 580, 135, 660, 165, 740, 125, 830, 160, 920, 140, 1010, 170, 1100, 130, 1180, 160, 1280, 145];
    for (let i = 0; i < skyline.length; i += 2) ctx.lineTo(skyline[i], skyline[i + 1]);
    ctx.lineTo(CANVAS_W, 210);
    ctx.closePath();
    ctx.fill();
    // Lit windows in the skyline.
    ctx.fillStyle = 'rgba(255, 190, 90, 0.75)';
    for (let i = 0; i < 46; i++) {
      const x = (i * 97) % 1240 + 20;
      const y = 138 + ((i * 53) % 55);
      if ((i * 7) % 3 === 0) ctx.fillRect(x, y, 5, 7);
    }
    // Moon.
    const mg = ctx.createRadialGradient(1120, 82, 8, 1120, 82, 60);
    mg.addColorStop(0, 'rgba(255, 244, 200, 0.95)');
    mg.addColorStop(0.35, 'rgba(255, 240, 190, 0.45)');
    mg.addColorStop(1, 'rgba(255, 240, 190, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(1120, 82, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffedb8';
    ctx.beginPath(); ctx.arc(1120, 82, 26, 0, Math.PI * 2); ctx.fill();

    // Hanging paper lanterns with warm glow.
    this.drawLantern(ctx, 120, 46, 1.0);
    this.drawLantern(ctx, 640, 34, 0.85);
    this.drawLantern(ctx, 1160, 52, 1.0);
    this.drawLantern(ctx, 380, 30, 0.6);
    this.drawLantern(ctx, 900, 28, 0.6);

    // String lights across the top.
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(640, 34, CANVAS_W, 8);
    ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const x = 40 + i * 78;
      const y = 10 + Math.sin((x / CANVAS_W) * Math.PI) * 18;
      const colors = ['#ff5a4e', '#ffb347', '#7ee081', '#6ec6ff'];
      ctx.fillStyle = colors[i % 4];
      ctx.beginPath(); ctx.arc(x, y + 8, 5, 0, Math.PI * 2); ctx.fill();
      const glow = ctx.createRadialGradient(x, y + 8, 1, x, y + 8, 14);
      glow.addColorStop(0, colors[i % 4] + '55');
      glow.addColorStop(1, colors[i % 4] + '00');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y + 8, 14, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawLantern(ctx, x, y, s) {
    const w = 46 * s, h = 58 * s;
    const glow = ctx.createRadialGradient(x, y + h / 2, 4, x, y + h / 2, 90 * s);
    glow.addColorStop(0, 'rgba(255, 170, 80, 0.5)');
    glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y + h / 2, 90 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y); ctx.stroke();
    const lg = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
    lg.addColorStop(0, '#c22f24');
    lg.addColorStop(0.5, '#ff6b52');
    lg.addColorStop(1, '#c22f24');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120, 20, 10, 0.6)';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(x, y + h / 2, (w / 2) * (1 - Math.abs(i) * 0.18), h / 2, 0, -1.2, 1.2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.ellipse(x, y + h / 2, w * 0.16, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a1f16';
    ctx.fillRect(x - 9 * s, y - 4, 18 * s, 6);
    ctx.fillRect(x - 9 * s, y + h - 2, 18 * s, 6);
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(x - 1.5, y + h + 4, 3, 14 * s);
  }

  // ------------------------------------------------------------------
  drawHUD(ctx, game) {
    ctx.fillStyle = 'rgba(10, 7, 22, 0.72)';
    ctx.fillRect(0, 0, CANVAS_W, 62);
    ctx.fillStyle = '#f5b942';
    ctx.fillRect(0, 62, CANVAS_W, 3);

    // Logo.
    this.drawMiniLantern(ctx, 34, 31, 0.62);
    text(ctx, 'LANTERN RAMEN', 62, 24, 24, '#ffe9b8', 'bold', 'left');
    text(ctx, '灯笼拉面 · Midnight Noodle Stall', 62, 46, 12, '#c9a86a', 'normal', 'left');

    // Day + shift timer.
    const day = game.day;
    text(ctx, `DAY ${day.day} — ${day.name}`, 640, 20, 15, '#ffe9b8', 'bold');
    const remain = Math.max(0, game.shiftLeft);
    const total = day.shiftSeconds;
    const frac = remain / total;
    ctx.fillStyle = '#3a2f5e';
    rr(ctx, 470, 32, 340, 16, 8); ctx.fill();
    ctx.fillStyle = frac > 0.35 ? '#7ee081' : frac > 0.15 ? '#ffb347' : '#ff5a4e';
    rr(ctx, 470, 32, 340 * frac, 16, 8); ctx.fill();
    text(ctx, `${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`, 640, 56, 12, '#fff', 'bold');
    text(ctx, `TARGET ¥${day.target}`, 830, 31, 14, remain <= 0 ? '#fff' : '#ffd23e', 'bold', 'left');

    // Coins.
    text(ctx, `¥ ${game.coins}`, 1150, 24, 26, '#ffd23e', 'bold', 'right');
    text(ctx, `served ${game.board.served} · walkouts ${game.board.walkouts}`, 1150, 48, 12, '#b9a8d8', 'normal', 'right');

    // Combo badge.
    if (game.combo >= 2) {
      const cx = 990;
      ctx.fillStyle = '#ff5a4e';
      rr(ctx, cx - 46, 12, 92, 38, 19); ctx.fill();
      text(ctx, `COMBO x${game.combo}`, cx, 32, 16, '#fff');
    }
  }

  drawMiniLantern(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    g.addColorStop(0, 'rgba(255,170,80,0.55)');
    g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b52';
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.ellipse(0, 0, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ------------------------------------------------------------------
  drawOrderRail(ctx, game) {
    // Rail label + tickets.
    ctx.fillStyle = 'rgba(10, 7, 22, 0.55)';
    rr(ctx, 16, 74, CANVAS_W - 32, 104, 12); ctx.fill();
    text(ctx, 'ORDER BOARD', 30, 92, 12, '#c9a86a', 'bold', 'left');
    text(ctx, 'match the ticket exactly — broth + noodles + toppings', 30, 164, 11, '#8f80b8', 'normal', 'left');
    if (!game.board.tickets.length) {
      text(ctx, 'No orders yet — the night is young…', 640, 128, 16, '#8f80b8', 'normal');
    }
    game.board.tickets.forEach((t, i) => {
      this.drawTicket(ctx, t, 150 + i * 212, 84, 200, 92);
    });
  }

  drawTicket(ctx, t, x, y, w, h) {
    const frac = Math.max(0, t.patience / t.patienceMax);
    const urgent = frac < 0.35;
    const pulse = urgent ? 0.5 + 0.5 * Math.sin(this.time * 8) : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((t.id % 3 - 1) * 0.012);
    ctx.fillStyle = urgent ? `rgba(255, 90, 78, ${0.25 + pulse * 0.2})` : 'rgba(0,0,0,0.35)';
    rr(ctx, 3, 5, w, h, 10); ctx.fill();
    ctx.fillStyle = '#f7ead2';
    rr(ctx, 0, 0, w, h, 10); ctx.fill();
    ctx.strokeStyle = urgent ? '#ff5a4e' : '#d9c49a';
    ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, 1, 1, w - 2, h - 2, 9); ctx.stroke();
    // Broth dot + name.
    ctx.fillStyle = BROTHS[t.recipe.broth].color;
    ctx.beginPath(); ctx.arc(16, 18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, t.recipe.name, 30, 18, 14, '#3a2a1a', 'bold', 'left');
    text(ctx, `¥${t.recipe.price}`, w - 10, 18, 14, '#b3541e', 'bold', 'right');
    // Topping icons + a noodle glyph.
    t.recipe.toppings.forEach((tid, i) => this.drawToppingIcon(ctx, tid, 22 + i * 26, 48, 10));
    this.drawNoodleIcon(ctx, 22 + t.recipe.toppings.length * 26, 48, 10);
    // Patience bar.
    ctx.fillStyle = '#e5d9bd';
    rr(ctx, 10, h - 18, w - 20, 10, 5); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#ffb347' : '#ff5a4e';
    rr(ctx, 10, h - 18, (w - 20) * frac, 10, 5); ctx.fill();
    if (urgent) text(ctx, 'HURRY!', w - 12, h - 34, 11, '#ff5a4e', 'bold', 'right');
    ctx.restore();
  }

  // ------------------------------------------------------------------
  drawBrothPots(ctx, game) {
    text(ctx, 'BROTH POTS — click to ladle  (keys 1 / 2 / 3)', 60, 200, 13, '#c9a86a', 'bold', 'left');
    const ids = ['shoyu', 'miso', 'tonkotsu'];
    const unlocked = game.day.recipes.some((r) => r.includes('miso'));
    const unlockedTonk = game.day.recipes.some((r) => r.includes('tonk'));
    ids.forEach((id, i) => {
      const x = 70 + i * 130;
      const y = 216;
      const locked = (id === 'miso' && !unlocked) || (id === 'tonkotsu' && !unlockedTonk);
      const b = BROTHS[id];
      // Pot body.
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(x + 55, y + 118, 58, 12, 0, 0, Math.PI * 2); ctx.fill();
      const pg = ctx.createLinearGradient(x, y, x, y + 110);
      pg.addColorStop(0, '#4a4a58');
      pg.addColorStop(1, '#23232e');
      ctx.fillStyle = pg;
      rr(ctx, x, y + 18, 110, 96, 14); ctx.fill();
      ctx.strokeStyle = '#6a6a7a';
      ctx.lineWidth = 2;
      rr(ctx, x, y + 18, 110, 96, 14); ctx.stroke();
      // Broth surface.
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.ellipse(x + 55, y + 30, 48, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b.light;
      ctx.beginPath(); ctx.ellipse(x + 42, y + 27, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (!locked && Math.random() < 0.12) this.spawnSteam(x + 55, y + 22, 1);
      // Label + key.
      text(ctx, b.name, x + 55, y + 66, 15, '#ffe9b8');
      text(ctx, b.cn, x + 55, y + 88, 13, '#c9a86a', 'normal', 'center', SERIF);
      ctx.fillStyle = '#f5b942';
      rr(ctx, x + 38, y + 100, 34, 18, 5); ctx.fill();
      text(ctx, `key ${i + 1}`, x + 55, y + 109, 11, '#3a2a1a');
      if (locked) {
        ctx.fillStyle = 'rgba(12, 8, 24, 0.72)';
        rr(ctx, x, y, 110, 118, 14); ctx.fill();
        text(ctx, 'DAY ' + (id === 'miso' ? '2' : '3'), x + 55, y + 58, 15, '#ffd23e');
      }
      if (game.kitchen.bowl.broth === id) {
        ctx.strokeStyle = '#7ee081';
        ctx.lineWidth = 4;
        rr(ctx, x - 4, y + 14, 118, 104, 16); ctx.stroke();
        text(ctx, 'IN BOWL', x + 55, y + 2, 11, '#7ee081');
      }
    });
  }

  drawBoiler(ctx, game) {
    const x = 500, y = 210, w = 300, h = 150;
    const k = game.kitchen;
    text(ctx, 'NOODLE BOILER — click to start / scoop  (key N)', x, 200, 13, '#c9a86a', 'bold', 'left');
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h + 8, 150, 14, 0, 0, Math.PI * 2); ctx.fill();
    const pg = ctx.createLinearGradient(x, y, x, y + h);
    pg.addColorStop(0, '#565664');
    pg.addColorStop(1, '#262632');
    ctx.fillStyle = pg;
    rr(ctx, x, y + 10, w, h, 18); ctx.fill();
    ctx.strokeStyle = '#7a7a8a';
    ctx.lineWidth = 2;
    rr(ctx, x, y + 10, w, h, 18); ctx.stroke();
    // Water.
    const water = k.noodles.state === 'soggy' ? '#8a7a4a' : '#bfe3ea';
    ctx.fillStyle = water;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 34, 138, 20, 0, 0, Math.PI * 2); ctx.fill();
    if (k.noodles.state === 'cooking' || k.noodles.state === 'ready') {
      // Noodle strands in the water.
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const nx = x + 60 + i * 38;
        ctx.moveTo(nx, y + 26);
        ctx.quadraticCurveTo(nx + 10, y + 40 + Math.sin(this.time * 3 + i) * 3, nx + 4, y + 48);
        ctx.stroke();
      }
      if (Math.random() < 0.22) this.spawnSteam(x + w / 2, y + 20, 1);
    }
    // Progress ring.
    const cx = x + w / 2, cy = y + 96;
    const state = k.noodles.state;
    const frac = state === 'idle' ? 0 : Math.min(1, k.noodles.progress / 6);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2f5e';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.stroke();
    if (state !== 'idle') {
      ctx.strokeStyle = state === 'soggy' ? '#ff5a4e' : state === 'ready' ? '#7ee081' : '#ffd23e';
      ctx.beginPath(); ctx.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    }
    const label = state === 'idle' ? 'EMPTY' : state === 'cooking' ? 'BOIL…' : state === 'ready' ? 'READY!' : 'SOGGY!';
    text(ctx, label, cx, cy, 12, state === 'soggy' ? '#ff8a7a' : '#fff');
    text(ctx, state === 'ready' ? 'click to scoop into bowl' : state === 'soggy' ? 'click to dump the soggy noodles' : state === 'cooking' ? 'wait for the ring…' : 'click to drop noodles', cx, y + h + 26, 12, '#b9a8d8', 'normal');
  }

  drawToppingBins(ctx, game) {
    text(ctx, 'TOPPINGS — click to add  (keys Q W E R T Y)', 846, 200, 13, '#c9a86a', 'bold', 'left');
    const ids = ['egg', 'chashu', 'nori', 'naruto', 'corn', 'scallion'];
    const keys = ['Q', 'W', 'E', 'R', 'T', 'Y'];
    ids.forEach((id, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 846 + col * 132;
      const y = 216 + row * 84;
      const t = TOPPINGS[id];
      const inBowl = game.kitchen.bowl.toppings.includes(id);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      rr(ctx, x + 2, y + 4, 122, 74, 10); ctx.fill();
      ctx.fillStyle = inBowl ? '#2e4d33' : '#3a2f5e';
      rr(ctx, x, y, 122, 74, 10); ctx.fill();
      ctx.strokeStyle = inBowl ? '#7ee081' : '#5a4a7a';
      ctx.lineWidth = inBowl ? 3 : 2;
      rr(ctx, x, y, 122, 74, 10); ctx.stroke();
      this.drawToppingIcon(ctx, id, x + 22, y + 22, 14);
      text(ctx, t.name, x + 42, y + 18, 12, '#ffe9b8', 'bold', 'left');
      text(ctx, t.cn + '  ¥' + t.price, x + 42, y + 36, 11, '#b9a8d8', 'normal', 'left');
      if (inBowl) text(ctx, '✓ in bowl', x + 10, y + 60, 11, '#7ee081', 'bold', 'left');
      else text(ctx, 'click to add', x + 10, y + 60, 11, '#8f80b8', 'normal', 'left');
      ctx.fillStyle = '#f5b942';
      rr(ctx, x + 98, y + 50, 18, 16, 5); ctx.fill();
      text(ctx, keys[i], x + 107, y + 58, 11, '#3a2a1a');
    });
  }

  // A little noodle swirl, used on tickets after the topping icons.
  drawNoodleIcon(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.4 + i * r * 0.4);
      ctx.quadraticCurveTo(0, -r * 0.7 + i * r * 0.4, r * 0.7, -r * 0.4 + i * r * 0.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // One topping, drawn as a little food icon. Shared by bins, tickets, bowls.
  drawToppingIcon(ctx, id, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    if (id === 'egg') {
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath(); ctx.arc(1, 1, r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.18, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'chashu') {
      ctx.fillStyle = '#e58a7a';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f7c8b8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0.5, 0.5 + Math.PI * 1.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0.5, 0.5 + Math.PI * 1.4); ctx.stroke();
    } else if (id === 'nori') {
      ctx.fillStyle = '#1f4d2e';
      rr(ctx, -r * 0.9, -r * 0.7, r * 1.8, r * 1.4, 3); ctx.fill();
      ctx.strokeStyle = '#3a7a4a';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-r * 0.7, i * r * 0.4); ctx.lineTo(r * 0.7, i * r * 0.4); ctx.stroke(); }
    } else if (id === 'naruto') {
      ctx.fillStyle = '#f6f0e6';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ff7a9e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 4; a += 0.3) {
        const rad = (a / (Math.PI * 4)) * r * 0.85;
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (id === 'corn') {
      ctx.fillStyle = '#ffd23e';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.32, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'scallion') {
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(-r * 0.4 + i * r * 0.4, 0, r * 0.28, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#81c784';
      ctx.beginPath(); ctx.arc(-r * 0.4, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.4, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  drawCounter(ctx, game) {
    const x = 60, y = 452, w = 880, h = 196;
    // Wooden counter.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    rr(ctx, x + 4, y + 8, w, h, 16); ctx.fill();
    const wg = ctx.createLinearGradient(x, y, x, y + h);
    wg.addColorStop(0, '#a9743f');
    wg.addColorStop(1, '#7a5230');
    ctx.fillStyle = wg;
    rr(ctx, x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = '#5d3d20';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x + 12, y + i * (h / 5)); ctx.lineTo(x + w - 12, y + i * (h / 5) + 6); ctx.stroke();
    }
    ctx.strokeStyle = '#c98d4e';
    ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 16); ctx.stroke();
    text(ctx, 'ASSEMBLY COUNTER', x + 16, y + 20, 12, '#f7e3b8', 'bold', 'left');

    // The bowl being built, centre of the counter.
    const bx = x + w / 2 - 40, by = y + 74;
    this.drawBowl(ctx, bx, by, 1.1, game.kitchen.bowl, game.time);
    // Assembly progress ring around the bowl.
    const done = game.kitchen.bowlProgress();
    const frac = Math.min(1, done / 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(bx + 62, by + 52, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = done >= 2 ? '#7ee081' : '#ffd23e';
    ctx.beginPath(); ctx.arc(bx + 62, by + 52, 70, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    text(ctx, done === 0 ? 'empty bowl — ladle broth first' : done < 4 ? 'building…' : 'ready to check the ticket!', x + w - 16, y + 20, 13, '#ffe9b8', 'bold', 'right');

    // Chopsticks + spoon resting on the counter.
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 90, y + 150); ctx.lineTo(x + 210, y + 138); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 90, y + 162); ctx.lineTo(x + 210, y + 150); ctx.stroke();
    ctx.fillStyle = '#d9d9d9';
    ctx.beginPath(); ctx.ellipse(x + 830, y + 150, 22, 10, 0.3, 0, Math.PI * 2); ctx.fill();

    // Trash bin.
    const tx = x + 14, ty = y + 118;
    ctx.fillStyle = '#3a3a48';
    rr(ctx, tx, ty, 52, 56, 8); ctx.fill();
    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 2;
    rr(ctx, tx, ty, 52, 56, 8); ctx.stroke();
    text(ctx, 'TRASH', tx + 26, ty + 22, 11, '#fff');
    text(ctx, 'key X', tx + 26, ty + 40, 10, '#b9a8d8', 'normal');
  }

  drawBowl(ctx, x, y, s, bowl, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(62, 108, 62, 10, 0, 0, Math.PI * 2); ctx.fill();
    // Bowl body.
    const bg = ctx.createLinearGradient(0, 0, 0, 110);
    bg.addColorStop(0, '#274690');
    bg.addColorStop(1, '#16264f');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(0, 100, 62, 104);
    ctx.quadraticCurveTo(124, 100, 124, 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(2, 34); ctx.quadraticCurveTo(62, 46, 122, 34); ctx.stroke();
    // Broth surface.
    if (bowl.broth) {
      const b = BROTHS[bowl.broth];
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.ellipse(62, 24, 56, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b.light;
      ctx.beginPath(); ctx.ellipse(48, 21, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (Math.random() < 0.2) this.spawnSteam(x + 62, y + 8, 1);
    } else {
      ctx.fillStyle = '#d9d2c2';
      ctx.beginPath(); ctx.ellipse(62, 24, 56, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Noodles.
    if (bowl.noodles === 'ready') {
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 3.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const nx = 26 + i * 24;
        ctx.moveTo(nx, 16);
        ctx.quadraticCurveTo(nx + 8, 24 + Math.sin((time || 0) * 2 + i) * 2, nx + 2, 30);
        ctx.stroke();
      }
    }
    // Toppings arranged on the bowl.
    const slots = [[34, 18], [62, 12], [90, 18], [48, 30], [78, 30]];
    bowl.toppings.forEach((tid, i) => {
      const [sx, sy] = slots[i % slots.length];
      this.drawToppingIcon(ctx, tid, sx, sy, 12);
    });
    // Chopsticks across the bowl when it has food.
    if (bowl.broth && bowl.noodles === 'ready') {
      ctx.strokeStyle = '#c98d4e';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(96, 2); ctx.lineTo(140, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(102, 8); ctx.lineTo(142, -6); ctx.stroke();
    }
    ctx.restore();
  }

  drawServeWindow(ctx, game) {
    const x = 964, y = 452, w = 276, h = 196;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    rr(ctx, x + 4, y + 8, w, h, 16); ctx.fill();
    ctx.fillStyle = '#2a2144';
    rr(ctx, x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 16); ctx.stroke();
    text(ctx, 'SERVE WINDOW', x + w / 2, y + 20, 13, '#ffd23e');
    // Customers waiting at the window.
    const urgency = game.board.urgency();
    const faces = [
      { mood: urgency > 0.7 ? 'angry' : urgency > 0.4 ? 'worried' : 'happy', skin: '#f2c89b' },
      { mood: urgency > 0.6 ? 'worried' : 'happy', skin: '#e8b48a' },
      { mood: 'happy', skin: '#d9a06b' },
    ];
    faces.forEach((f, i) => {
      const fx = x + 52 + i * 86, fy = y + 62;
      // Body.
      ctx.fillStyle = i === 0 ? '#7a4a8a' : i === 1 ? '#3f6d8e' : '#8e6d3f';
      rr(ctx, fx - 30, fy + 18, 60, 46, 10); ctx.fill();
      // Head.
      ctx.fillStyle = f.skin;
      ctx.beginPath(); ctx.arc(fx, fy, 26, 0, Math.PI * 2); ctx.fill();
      // Hair.
      ctx.fillStyle = i === 0 ? '#2a1a12' : i === 1 ? '#4a2a1a' : '#888';
      ctx.beginPath(); ctx.arc(fx, fy - 6, 26, Math.PI, Math.PI * 2); ctx.fill();
      // Eyes.
      ctx.fillStyle = '#241a12';
      if (f.mood === 'angry') {
        ctx.beginPath(); ctx.moveTo(fx - 14, fy - 8); ctx.lineTo(fx - 4, fy - 4); ctx.lineTo(fx - 14, fy - 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(fx + 14, fy - 8); ctx.lineTo(fx + 4, fy - 4); ctx.lineTo(fx + 14, fy - 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(fx - 9, fy - 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(fx + 9, fy - 2, 3, 0, Math.PI * 2); ctx.fill();
      }
      // Mouth.
      ctx.strokeStyle = '#7a3a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (f.mood === 'happy') ctx.arc(fx, fy + 8, 8, 0.15 * Math.PI, 0.85 * Math.PI);
      else if (f.mood === 'worried') ctx.arc(fx, fy + 16, 6, 1.15 * Math.PI, 1.85 * Math.PI);
      else { ctx.moveTo(fx - 8, fy + 12); ctx.lineTo(fx + 8, fy + 12); }
      ctx.stroke();
    });
    // Serve bell / button.
    const ready = game.kitchen.bowl.broth && game.kitchen.bowl.noodles === 'ready' && game.kitchen.bowl.toppings.length > 0;
    const match = ready ? game.board.findMatch(game.kitchen.bowl) : null;
    ctx.fillStyle = match ? '#58b368' : ready ? '#f5b942' : '#4a3f66';
    rr(ctx, x + 28, y + 140, w - 56, 40, 12); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    rr(ctx, x + 28, y + 140, w - 56, 40, 12); ctx.stroke();
    text(ctx, match ? '✓ SERVE — IT MATCHES!' : ready ? 'SERVE  (SPACE)' : 'SERVE  (SPACE)', x + w / 2, y + 160, match ? 14 : 15, '#fff');
  }

  // ------------------------------------------------------------------
  drawBottomBar(ctx, game) {
    ctx.fillStyle = 'rgba(10, 7, 22, 0.72)';
    ctx.fillRect(0, 668, CANVAS_W, 132);
    ctx.fillStyle = '#f5b942';
    ctx.fillRect(0, 668, CANVAS_W, 3);
    const hints = [
      '1/2/3 broth', 'N noodles', 'Q–Y toppings', 'SPACE serve', 'X trash', 'M mute', 'P pause',
    ];
    text(ctx, hints.join('   ·   '), 640, 692, 13, '#b9a8d8', 'normal');
    // Tonight's menu: which recipes are live today.
    const pool = game.board.recipePool();
    text(ctx, "TONIGHT'S MENU:  " + pool.map((r) => `${r.name} ¥${r.price}`).join('   ·   '), 640, 716, 13, '#ffe9b8', 'normal');
    // Day progress dots.
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < game.day.day - 1 ? '#7ee081' : i === game.day.day - 1 ? '#ffd23e' : '#4a3f66';
      ctx.beginPath(); ctx.arc(560 + i * 32, 748, 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, String(i + 1), 560 + i * 32, 748, 11, '#241a3f');
    }
    text(ctx, 'DAYS', 500, 748, 12, '#b9a8d8', 'bold', 'right');
    // In screenshot staging the game is frozen on purpose; don't print PAUSED.
    if (game.paused && !game.shotMode) text(ctx, 'PAUSED — press P to resume', 640, 772, 12, '#ff8a7a', 'normal');
    else if (!game.paused) text(ctx, 'click a station, or use the keys', 640, 772, 12, '#8f80b8', 'normal');
    if (game.muted) text(ctx, 'MUTED', 1240, 692, 12, '#ff8a7a', 'bold', 'right');
  }

  drawSteam(ctx) {
    for (const p of this.steam) {
      ctx.fillStyle = `rgba(255,255,255,${0.16 * p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawPopups(ctx, game) {
    for (const p of game.popups) {
      const a = Math.max(0, Math.min(1, p.life));
      ctx.globalAlpha = a;
      text(ctx, p.text, p.x, p.y - (1 - p.life) * 40, 22, p.color, 'bold');
      ctx.globalAlpha = 1;
    }
  }

  drawToast(ctx, game) {
    if (!game.toast || game.toast.life <= 0) return;
    const a = Math.min(1, game.toast.life * 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = game.toast.bad ? 'rgba(180, 40, 30, 0.92)' : 'rgba(30, 60, 40, 0.92)';
    ctx.font = `bold 15px ${FONT}`;
    const w = ctx.measureText(game.toast.text).width + 60;
    rr(ctx, 640 - w / 2, 414, w, 34, 17); ctx.fill();
    text(ctx, game.toast.text, 640, 432, 15, '#fff');
    ctx.globalAlpha = 1;
  }

  drawRushBanner(ctx, game) {
    const pulse = 0.6 + 0.4 * Math.sin(this.time * 6);
    ctx.fillStyle = `rgba(255, 90, 78, ${0.85 * pulse})`;
    rr(ctx, 440, 186, 400, 34, 17); ctx.fill();
    text(ctx, `RUSH HOUR! Orders x2 — ${Math.ceil(game.rushLeft)}s left`, 640, 204, 16, '#fff');
  }

  // ------------------------------------------------------------------
  drawTitle(ctx, game) {
    // Big signboard.
    ctx.fillStyle = 'rgba(10, 7, 22, 0.55)';
    rr(ctx, 240, 150, 800, 470, 24); ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 4;
    rr(ctx, 240, 150, 800, 470, 24); ctx.stroke();
    this.drawLantern(ctx, 330, 170, 1.1);
    this.drawLantern(ctx, 950, 170, 1.1);
    text(ctx, '灯笼拉面', 640, 250, 64, '#ffd23e', 'bold', 'center', SERIF);
    text(ctx, 'LANTERN RAMEN', 640, 310, 44, '#ffe9b8');
    text(ctx, '— a midnight noodle stall —', 640, 348, 18, '#c9a86a', 'normal');
    text(ctx, 'Ladle broth, boil noodles, pile on toppings,', 640, 402, 18, '#fff', 'normal');
    text(ctx, 'and serve every ticket before patience runs out.', 640, 428, 18, '#fff', 'normal');
    text(ctx, 'Five nights. Five menus. One little lantern-lit stall.', 640, 462, 16, '#b9a8d8', 'normal');
    // Start button.
    const pulse = 0.85 + 0.15 * Math.sin(this.time * 3);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff5a4e';
    rr(ctx, 460, 500, 360, 56, 28); ctx.fill();
    ctx.globalAlpha = 1;
    text(ctx, 'OPEN THE STALL  (click or Enter)', 640, 529, 18, '#fff');
    text(ctx, 'mouse + keyboard  ·  sound on for the full night-market mood', 640, 586, 13, '#8f80b8', 'normal');
    // A sample bowl of the house special, steaming on the signboard.
    this.drawBowl(ctx, 830, 518, 0.72, { broth: 'tonkotsu', noodles: 'ready', toppings: ['egg', 'chashu', 'nori'] }, this.time);
    text(ctx, 'Lantern Tonkotsu ¥30', 892, 604, 13, '#ffd23e', 'bold');
  }

  drawDayIntro(ctx, game) {
    const day = game.day;
    ctx.fillStyle = 'rgba(10, 7, 22, 0.6)';
    rr(ctx, 300, 200, 680, 380, 24); ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 3;
    rr(ctx, 300, 200, 680, 380, 24); ctx.stroke();
    text(ctx, `DAY ${day.day}`, 640, 250, 20, '#c9a86a');
    text(ctx, day.name, 640, 296, 40, '#ffe9b8');
    text(ctx, `Earn ¥${day.target} before closing time`, 640, 350, 20, '#fff', 'normal');
    text(ctx, `Shift: ${Math.floor(day.shiftSeconds / 60)}:${String(day.shiftSeconds % 60).padStart(2, '0')}   ·   ${day.maxTickets} tickets at most`, 640, 384, 16, '#b9a8d8', 'normal');
    const pool = game.board.recipePool();
    text(ctx, 'ON THE MENU TONIGHT', 640, 424, 14, '#ffd23e');
    pool.forEach((r, i) => {
      text(ctx, `${r.name} — ${BROTHS[r.broth].name} + ${r.toppings.map((t) => TOPPINGS[t].name).join(', ')}  ·  ¥${r.price}`, 640, 452 + i * 24, 15, '#fff', 'normal');
    });
    text(ctx, 'click or press Enter to start the shift', 640, 548, 15, '#7ee081');
  }

  drawSummary(ctx, game) {
    const s = game.daySummary;
    const day = game.day;
    const stars = s.earned >= day.target * TUNING.starThree ? 3 : s.earned >= day.target ? 2 : 1;
    ctx.fillStyle = 'rgba(10, 7, 22, 0.65)';
    rr(ctx, 320, 170, 640, 440, 24); ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 3;
    rr(ctx, 320, 170, 640, 440, 24); ctx.stroke();
    text(ctx, `DAY ${day.day} — ${day.name}  ·  CLOSING TIME`, 640, 220, 20, '#c9a86a');
    text(ctx, `¥${s.earned}`, 640, 290, 56, '#ffd23e');
    text(ctx, `target was ¥${day.target}`, 640, 330, 16, '#b9a8d8', 'normal');
    text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 372, 34, '#ffd23e');
    text(ctx, `served ${s.served} bowls  ·  ${s.walkouts} walkouts  ·  ${s.wrong} wrong serves  ·  best combo x${s.bestCombo}`, 640, 420, 15, '#fff', 'normal');
    const passed = s.earned >= day.target;
    text(ctx, passed ? (day.day === 5 ? 'The lanterns burn brightest tonight. You did it!' : 'Target met — the stall survives another night.') : 'Target missed — the stall closes early…', 640, 462, 16, passed ? '#7ee081' : '#ff8a7a', 'normal');
    ctx.fillStyle = '#ff5a4e';
    rr(ctx, 490, 500, 300, 56, 28); ctx.fill();
    text(ctx, passed ? (day.day === 5 ? 'SEE THE FINALE  (Enter)' : 'NEXT NIGHT  (Enter)') : 'TRY THE NIGHT AGAIN  (Enter)', 640, 529, 17, '#fff');
  }

  drawGameOver(ctx, game) {
    ctx.fillStyle = 'rgba(10, 7, 22, 0.7)';
    rr(ctx, 280, 180, 720, 420, 24); ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 3;
    rr(ctx, 280, 180, 720, 420, 24); ctx.stroke();
    text(ctx, 'THE LANTERN FINALE', 640, 240, 22, '#c9a86a');
    text(ctx, 'Five nights of ramen.', 640, 300, 30, '#ffe9b8');
    text(ctx, `Total earned: ¥${game.totalEarned}   ·   Bowls served: ${game.totalServed}`, 640, 352, 20, '#fff', 'normal');
    text(ctx, `Best combo: x${game.bestComboOverall}   ·   Walkouts: ${game.totalWalkouts}`, 640, 386, 16, '#b9a8d8', 'normal');
    text(ctx, 'Thank you for cooking at the Lantern Ramen stall.', 640, 430, 16, '#b9a8d8', 'normal');
    ctx.fillStyle = '#ff5a4e';
    rr(ctx, 490, 490, 300, 56, 28); ctx.fill();
    text(ctx, 'COOK AGAIN  (Enter)', 640, 519, 19, '#fff');
  }
}
