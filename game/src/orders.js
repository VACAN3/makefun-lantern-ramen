// Lantern Ramen — OrderBoard.
// Tickets arrive on the rail, wait with a patience bar, and leave happy
// or angry. Serving is an exact match: broth + noodles + topping set.

import { RECIPES, BROTHS, TOPPINGS, TUNING } from './config.js';

let nextTicketId = 1;

export class OrderBoard {
  constructor(day) {
    this.day = day;
    this.tickets = [];
    this.spawnTimer = 3; // first order arrives quickly
    this.served = 0;
    this.walkouts = 0;
    this.wrongServes = 0;
  }

  recipePool() {
    return this.day.recipes.map((id) => RECIPES.find((r) => r.id === id));
  }

  spawnTicket() {
    const pool = this.recipePool();
    const recipe = pool[Math.floor(Math.random() * pool.length)];
    const patience = TUNING.ticketPatience;
    this.tickets.push({
      id: nextTicketId++,
      recipe,
      patience,
      patienceMax: patience,
      age: 0,
      state: 'waiting', // waiting | served | walked
      flash: 0,
    });
  }

  update(dt, rushActive) {
    this.spawnTimer -= dt;
    const interval = rushActive ? this.day.spawnEvery * 0.45 : this.day.spawnEvery;
    if (this.spawnTimer <= 0 && this.tickets.length < this.day.maxTickets) {
      this.spawnTicket();
      this.spawnTimer = interval * (0.85 + Math.random() * 0.3);
    }
    for (const t of this.tickets) {
      t.age += dt;
      t.patience -= dt * (rushActive ? 1.25 : 1);
      if (t.flash > 0) t.flash -= dt;
    }
    // Expired tickets walk out.
    const expired = this.tickets.filter((t) => t.patience <= 0);
    for (const t of expired) {
      t.state = 'walked';
      this.walkouts++;
    }
    this.tickets = this.tickets.filter((t) => t.patience > 0);
  }

  // Does this bowl exactly match any waiting ticket? Returns it or null.
  findMatch(bowl) {
    if (!bowl.broth || bowl.noodles !== 'ready') return null;
    const have = [...bowl.toppings].sort().join(',');
    for (const t of this.tickets) {
      const want = [...t.recipe.toppings].sort().join(',');
      if (t.recipe.broth === bowl.broth && have === want) return t;
    }
    return null;
  }

  // Price of a serve: dish price + patience tip, scaled by the combo.
  servePrice(ticket, combo) {
    const patienceFrac = Math.max(0, ticket.patience / ticket.patienceMax);
    const tip = Math.round(ticket.recipe.price * TUNING.tipMaxFraction * patienceFrac);
    const mult = 1 + Math.min(combo, TUNING.comboMax) * TUNING.comboStep;
    const total = Math.round((ticket.recipe.price + tip) * mult);
    return { total, tip, mult };
  }

  removeTicket(ticket) {
    ticket.state = 'served';
    this.tickets = this.tickets.filter((t) => t.id !== ticket.id);
    this.served++;
  }

  // The most urgent ticket drives the customers' mood.
  urgency() {
    if (!this.tickets.length) return 0;
    const worst = Math.min(...this.tickets.map((t) => t.patience / t.patienceMax));
    return 1 - worst;
  }

  brothName(id) { return BROTHS[id].name; }
  toppingName(id) { return TOPPINGS[id].name; }
}
