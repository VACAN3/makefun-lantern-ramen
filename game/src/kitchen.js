// Lantern Ramen — Kitchen.
// The stations of the stall and the one bowl the chef carries.
// Flow: ladle broth -> start noodles -> add toppings -> serve.
// Noodles cook on their own clock, so a good chef starts them early
// and plates other things while they boil.

import { BROTHS, TOPPINGS, TUNING } from './config.js';

export function emptyBowl() {
  return { broth: null, noodles: 'none', toppings: [] };
}

export class Kitchen {
  constructor() {
    this.bowl = emptyBowl();
    // Noodle boiler state: idle | cooking | ready | soggy
    this.noodles = { state: 'idle', progress: 0 };
    this.bowlDirty = false;
    this.lastAction = '';
    this.lastActionAt = 0;
  }

  update(dt) {
    if (this.noodles.state === 'cooking' || this.noodles.state === 'ready') {
      this.noodles.progress += dt;
      if (this.noodles.progress >= TUNING.noodleCookSeconds && this.noodles.state === 'cooking') {
        this.noodles.state = 'ready';
      }
      if (this.noodles.progress >= TUNING.noodleSoggyAfter) {
        this.noodles.state = 'soggy';
      }
    }
  }

  ladleBroth(brothId) {
    if (!BROTHS[brothId]) return { ok: false, why: 'no such broth' };
    if (this.bowl.broth) return { ok: false, why: 'bowl already has broth' };
    this.bowl.broth = brothId;
    this.lastAction = `Ladled ${BROTHS[brothId].name} broth`;
    this.lastActionAt = performance.now();
    return { ok: true, sound: 'pour' };
  }

  startNoodles() {
    if (this.noodles.state === 'cooking') return { ok: false, why: 'already boiling' };
    if (this.noodles.state === 'ready') {
      // Scoop the finished noodles into the bowl.
      if (!this.bowl.broth) return { ok: false, why: 'ladle broth first' };
      if (this.bowl.noodles !== 'none') return { ok: false, why: 'bowl already has noodles' };
      this.bowl.noodles = 'ready';
      this.noodles = { state: 'idle', progress: 0 };
      this.lastAction = 'Noodles in the bowl';
      this.lastActionAt = performance.now();
      return { ok: true, sound: 'plop' };
    }
    if (this.noodles.state === 'soggy') return { ok: false, why: 'soggy — dump them first' };
    this.noodles = { state: 'cooking', progress: 0 };
    this.lastAction = 'Noodles on the boil';
    this.lastActionAt = performance.now();
    return { ok: true, sound: 'plop' };
  }

  dumpNoodles() {
    if (this.noodles.state !== 'soggy') return { ok: false, why: 'nothing to dump' };
    this.noodles = { state: 'idle', progress: 0 };
    this.lastAction = 'Dumped soggy noodles';
    this.lastActionAt = performance.now();
    return { ok: true, sound: 'wrong' };
  }

  addTopping(toppingId) {
    if (!TOPPINGS[toppingId]) return { ok: false, why: 'no such topping' };
    if (!this.bowl.broth) return { ok: false, why: 'ladle broth first' };
    if (this.bowl.noodles === 'none') return { ok: false, why: 'add noodles first' };
    if (this.bowl.toppings.includes(toppingId)) return { ok: false, why: 'already in the bowl' };
    this.bowl.toppings.push(toppingId);
    this.lastAction = `Added ${TOPPINGS[toppingId].name}`;
    this.lastActionAt = performance.now();
    return { ok: true, sound: 'chop' };
  }

  trashBowl() {
    if (!this.bowl.broth && this.bowl.toppings.length === 0) return { ok: false, why: 'bowl is empty' };
    this.bowl = emptyBowl();
    this.lastAction = 'Bowl cleared';
    this.lastActionAt = performance.now();
    return { ok: true, sound: 'wrong' };
  }

  clearBowlAfterServe() {
    this.bowl = emptyBowl();
  }

  // How complete is the bowl, for the assembly progress ring?
  bowlProgress() {
    let done = 0;
    if (this.bowl.broth) done++;
    if (this.bowl.noodles === 'ready') done++;
    done += this.bowl.toppings.length;
    return done;
  }

  isBoiling() {
    return this.noodles.state === 'cooking';
  }
}
