// Lantern Ramen — Game.
// The state machine and the main loop: title -> day intro -> playing ->
// day summary -> next night -> finale. Owns coins, combo, the shift
// clock, rush hour, popups and toasts; the kitchen and the order board
// own their own rules.

import { DAYS, TUNING } from './config.js';
import { Kitchen } from './kitchen.js';
import { OrderBoard } from './orders.js';
import { Renderer } from './render.js';
import { SoundEngine } from './audio.js';
import { zoneAt, eventToCanvas, KEY_ACTIONS } from './input.js';
import { applyShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sound = new SoundEngine();
    this.screen = 'title';
    this.dayIndex = 0;
    this.day = DAYS[0];
    this.kitchen = new Kitchen();
    this.board = new OrderBoard(this.day);
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.shiftLeft = this.day.shiftSeconds;
    this.rushActive = false;
    this.rushLeft = 0;
    this.rushFired = false;
    this.dayEarned = 0;
    this.totalEarned = 0;
    this.totalServed = 0;
    this.totalWalkouts = 0;
    this.bestComboOverall = 0;
    this.daySummary = null;
    this.popups = [];
    this.toast = null;
    this.paused = false;
    this.muted = false;
    this.time = 0;
    this.lastTs = 0;
    this.shotMode = false;
  }

  get daySummaryStars() {
    if (!this.daySummary) return 0;
    if (this.daySummary.earned >= this.day.target * TUNING.starThree) return 3;
    if (this.daySummary.earned >= this.day.target) return 2;
    return 1;
  }

  startDay(index) {
    this.dayIndex = index;
    this.day = DAYS[index];
    this.kitchen = new Kitchen();
    this.board = new OrderBoard(this.day);
    this.shiftLeft = this.day.shiftSeconds;
    this.dayEarned = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.rushActive = false;
    this.rushLeft = 0;
    this.rushFired = false;
    this.popups = [];
    this.toast = null;
    this.screen = 'dayIntro';
  }

  beginShift() {
    this.screen = 'playing';
    this.sound.ensure();
    this.toast = { text: `Night ${this.day.day} — serve ¥${this.day.target} before closing!`, life: 3, bad: false };
  }

  // --- actions -----------------------------------------------------------
  doAction(action, arg) {
    if (this.screen !== 'playing' || this.paused) return;
    this.sound.ensure();
    const k = this.kitchen;
    let res = { ok: false, why: '' };
    if (action === 'broth') res = k.ladleBroth(arg);
    else if (action === 'noodles') res = k.noodles.state === 'soggy' ? k.dumpNoodles() : k.startNoodles();
    else if (action === 'dump') res = k.dumpNoodles();
    else if (action === 'topping') res = k.addTopping(arg);
    else if (action === 'trash') res = k.trashBowl();
    else if (action === 'serve') { this.serveBowl(); return; }
    else if (action === 'inspect') {
      this.toast = { text: this.describeBowl(), life: 2.5, bad: false };
      return;
    }
    if (res.ok) {
      if (res.sound) this.sound[res.sound]();
    } else if (res.why) {
      this.toast = { text: res.why, life: 1.6, bad: true };
      this.sound.wrong();
    }
  }

  describeBowl() {
    const b = this.kitchen.bowl;
    if (!b.broth) return 'Empty bowl — ladle some broth first.';
    const parts = [`${b.broth} broth`];
    parts.push(b.noodles === 'ready' ? 'noodles' : 'no noodles yet');
    if (b.toppings.length) parts.push(b.toppings.join(', '));
    return 'Bowl: ' + parts.join(' + ');
  }

  serveBowl() {
    const k = this.kitchen;
    const b = k.bowl;
    if (!b.broth || b.noodles !== 'ready' || b.toppings.length === 0) {
      this.toast = { text: 'Nothing to serve yet — build a full bowl first.', life: 1.8, bad: true };
      this.sound.wrong();
      return;
    }
    const match = this.board.findMatch(b);
    if (!match) {
      this.board.wrongServes++;
      this.combo = 0;
      this.coins = Math.max(0, this.coins - TUNING.wrongServePenalty);
      this.toast = { text: `Wrong order! No ticket wants that bowl. -¥${TUNING.wrongServePenalty}`, life: 2.2, bad: true };
      this.popups.push({ x: 1100, y: 560, text: `WRONG -¥${TUNING.wrongServePenalty}`, color: '#ff8a7a', life: 1 });
      this.sound.wrong();
      k.clearBowlAfterServe();
      return;
    }
    const price = this.board.servePrice(match, this.combo);
    this.coins += price.total;
    this.dayEarned += price.total;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.board.removeTicket(match);
    this.popups.push({ x: 1100, y: 520, text: `+¥${price.total}`, color: '#ffd23e', life: 1 });
    if (price.tip > 0) this.popups.push({ x: 1100, y: 550, text: `tip +¥${price.tip}`, color: '#7ee081', life: 1 });
    this.toast = { text: `${match.recipe.name} served! +¥${price.total}${this.combo >= 2 ? `  ·  combo x${this.combo}` : ''}`, life: 2, bad: false };
    this.sound.serve();
    k.clearBowlAfterServe();
  }

  // --- flow --------------------------------------------------------------
  endShift() {
    const passed = this.dayEarned >= this.day.target;
    this.totalEarned += this.dayEarned;
    this.totalServed += this.board.served;
    this.totalWalkouts += this.board.walkouts;
    this.bestComboOverall = Math.max(this.bestComboOverall, this.bestCombo);
    this.daySummary = {
      earned: this.dayEarned,
      served: this.board.served,
      walkouts: this.board.walkouts,
      wrong: this.board.wrongServes,
      bestCombo: this.bestCombo,
      passed,
    };
    this.screen = 'summary';
    if (passed) this.sound.star();
    else this.sound.walkout();
  }

  advanceAfterSummary() {
    if (!this.daySummary) return;
    if (!this.daySummary.passed) {
      this.startDay(this.dayIndex); // retry the night
      return;
    }
    if (this.dayIndex >= DAYS.length - 1) {
      this.screen = 'gameover';
      return;
    }
    this.startDay(this.dayIndex + 1);
  }

  restartAll() {
    this.coins = 0;
    this.totalEarned = 0;
    this.totalServed = 0;
    this.totalWalkouts = 0;
    this.bestComboOverall = 0;
    this.daySummary = null;
    this.startDay(0);
  }

  // --- loop --------------------------------------------------------------
  update(dt) {
    this.time += dt;
    this.sound.update(dt);
    if (this.toast && this.toast.life > 0) this.toast.life -= dt;
    for (const p of this.popups) p.life -= dt * 0.8;
    this.popups = this.popups.filter((p) => p.life > 0);
    if (this.screen !== 'playing' || this.paused) return;

    this.shiftLeft -= dt;
    // Rush hour: once per night, orders flood in.
    if (!this.rushFired && this.shiftLeft <= this.day.rushAt) {
      this.rushFired = true;
      this.rushActive = true;
      this.rushLeft = TUNING.rushDuration;
      this.toast = { text: 'RUSH HOUR! The crowd is here!', life: 2.5, bad: false };
      this.sound.rush();
    }
    if (this.rushActive) {
      this.rushLeft -= dt;
      if (this.rushLeft <= 0) this.rushActive = false;
    }

    const walkoutsBefore = this.board.walkouts;
    this.kitchen.update(dt);
    this.board.update(dt, this.rushActive);
    this.sound.setBoiling(this.kitchen.isBoiling());
    if (this.board.walkouts > walkoutsBefore) {
      const lost = this.board.walkouts - walkoutsBefore;
      this.coins = Math.max(0, this.coins - TUNING.walkoutPenalty * lost);
      this.combo = 0;
      this.toast = { text: `A customer walked out! -¥${TUNING.walkoutPenalty * lost}`, life: 2.2, bad: true };
      this.sound.walkout();
    }
    if (this.shiftLeft <= 0) {
      this.shiftLeft = 0;
      this.sound.setBoiling(false);
      this.endShift();
    }
  }

  frame(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0.016);
    this.lastTs = ts;
    if (!this.shotMode) this.update(dt);
    this.renderer.draw(this, dt);
    requestAnimationFrame((t) => this.frame(t));
  }

  // --- wiring ------------------------------------------------------------
  attach() {
    const canvas = this.canvas;
    canvas.addEventListener('click', (evt) => {
      this.sound.ensure();
      const { x, y } = eventToCanvas(canvas, evt);
      if (this.screen === 'title') { this.startDay(0); return; }
      if (this.screen === 'dayIntro') { this.beginShift(); return; }
      if (this.screen === 'summary') { this.advanceAfterSummary(); return; }
      if (this.screen === 'gameover') { this.restartAll(); return; }
      if (this.screen !== 'playing') return;
      const zone = zoneAt(x, y);
      if (zone) this.doAction(zone.action, zone.arg);
    });

    window.addEventListener('keydown', (evt) => {
      if (evt.code === 'KeyM') {
        this.muted = !this.muted;
        this.sound.setMuted(this.muted);
        return;
      }
      if (evt.code === 'KeyP' && this.screen === 'playing') {
        this.paused = !this.paused;
        return;
      }
      if (evt.code === 'Enter' || evt.code === 'NumpadEnter') {
        this.sound.ensure();
        if (this.screen === 'title') this.startDay(0);
        else if (this.screen === 'dayIntro') this.beginShift();
        else if (this.screen === 'summary') this.advanceAfterSummary();
        else if (this.screen === 'gameover') this.restartAll();
        return;
      }
      if (this.screen !== 'playing' || this.paused) return;
      const key = KEY_ACTIONS[evt.code];
      if (key) {
        evt.preventDefault();
        this.doAction(key.action, key.arg);
      }
    });

    // Screenshot staging: ?shot=title|busy|assemble|serve
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      this.shotMode = applyShot(this, shot);
      if (this.shotMode) {
        // Keep steam gently alive for the photo, but freeze the clock.
        this.renderer.time = 1.2;
      }
    }
  }
}
