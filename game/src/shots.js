// Lantern Ramen — Screenshot staging.
// `?shot=title|busy|assemble|serve` puts the game into a fixed,
// paused tableau so screenshots are deterministic renders of the
// game's own code. Nothing here is a mock: the same state machine,
// the same renderer, just a staged starting position and a frozen clock.

import { emptyBowl } from './kitchen.js';

export function applyShot(game, shot) {
  if (!shot) return false;

  if (shot === 'title') {
    game.screen = 'title';
    return true;
  }

  // All play shots start Day 3 (three broths unlocked, full menu).
  // NOTE: startDay rebuilds the board and kitchen, so read them after.
  game.startDay(2);
  const board = game.board;
  const kitchen = game.kitchen;
  game.screen = 'playing';
  game.paused = true;

  if (shot === 'busy') {
    // Four tickets mid-wait, noodles on the boil, a bowl half built.
    board.spawnTicket(); board.tickets[0].patience = 42; board.tickets[0].patienceMax = 55;
    board.spawnTicket(); board.tickets[1].patience = 30; board.tickets[1].patienceMax = 55;
    board.spawnTicket(); board.tickets[2].patience = 18; board.tickets[2].patienceMax = 55;
    board.spawnTicket(); board.tickets[3].patience = 47; board.tickets[3].patienceMax = 55;
    kitchen.bowl = { broth: 'tonkotsu', noodles: 'none', toppings: ['egg'] };
    kitchen.noodles = { state: 'cooking', progress: 4.2 };
    game.coins = 186;
    game.combo = 3;
    game.shiftLeft = 96;
    game.toast = { text: 'Noodles on the boil — ladle, top, serve!', life: 10, bad: false };
    return true;
  }

  if (shot === 'assemble') {
    // One urgent ticket, a bowl mid-assembly: broth + noodles + 2 toppings,
    // one topping short of the ticket — the assemble moment.
    board.spawnTicket();
    const t = board.tickets[0];
    t.patience = 12; t.patienceMax = 55;
    kitchen.bowl = {
      broth: t.recipe.broth,
      noodles: 'ready',
      toppings: t.recipe.toppings.slice(0, Math.max(1, t.recipe.toppings.length - 1)),
    };
    kitchen.noodles = { state: 'idle', progress: 0 };
    game.coins = 142;
    game.combo = 2;
    game.shiftLeft = 61;
    game.toast = { text: `One more topping and the ${t.recipe.name} is ready!`, life: 10, bad: false };
    game.popups.push({ x: 640, y: 520, text: '+ topping!', color: '#7ee081', life: 0.9 });
    return true;
  }

  if (shot === 'serve') {
    // A finished bowl that matches the top ticket, at the serve window.
    board.spawnTicket();
    const t = board.tickets[0];
    t.patience = 38; t.patienceMax = 55;
    board.spawnTicket();
    board.tickets[1].patience = 24; board.tickets[1].patienceMax = 55;
    kitchen.bowl = {
      broth: t.recipe.broth,
      noodles: 'ready',
      toppings: [...t.recipe.toppings],
    };
    kitchen.noodles = { state: 'idle', progress: 0 };
    game.coins = 214;
    game.combo = 4;
    game.shiftLeft = 44;
    game.toast = { text: `${t.recipe.name} matches the ticket — serve it!`, life: 10, bad: false };
    return true;
  }

  return false;
}

export function clearBowl(kitchen) {
  kitchen.bowl = emptyBowl();
}
