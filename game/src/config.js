// Lantern Ramen — game tuning, recipes and day structure.
// Every number that shapes difficulty lives here so the rest of the
// game can stay about behaviour, not magic constants.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

export const BROTHS = {
  shoyu:    { id: 'shoyu',    name: 'Shoyu',    cn: '酱油', color: '#8a5a2b', light: '#c98d4e', price: 12 },
  miso:     { id: 'miso',     name: 'Miso',     cn: '味噌', color: '#a86432', light: '#d99a55', price: 14 },
  tonkotsu: { id: 'tonkotsu', name: 'Tonkotsu', cn: '豚骨', color: '#e8d9b0', light: '#f5ead0', price: 16 },
};

export const TOPPINGS = {
  egg:      { id: 'egg',      name: 'Ajitama Egg', cn: '溏心蛋', color: '#fff3d6', price: 4 },
  chashu:   { id: 'chashu',   name: 'Chashu',      cn: '叉烧',   color: '#e58a7a', price: 5 },
  nori:     { id: 'nori',     name: 'Nori',        cn: '海苔',   color: '#1f4d2e', price: 2 },
  naruto:   { id: 'naruto',   name: 'Narutomaki',  cn: '鱼卷',   color: '#f6f0e6', price: 3 },
  corn:     { id: 'corn',     name: 'Corn',        cn: '玉米',   color: '#ffd23e', price: 3 },
  scallion: { id: 'scallion', name: 'Scallion',    cn: '葱花',   color: '#4caf50', price: 2 },
};

// Recipes: broth + noodle + a set of toppings. The ticket shows these
// icons; a bowl must match exactly to be served.
export const RECIPES = [
  { id: 'classic-shoyu', name: 'Classic Shoyu',  broth: 'shoyu',    toppings: ['egg', 'scallion'],            price: 18 },
  { id: 'pork-shoyu',    name: 'Pork Shoyu',     broth: 'shoyu',    toppings: ['chashu', 'nori'],            price: 22 },
  { id: 'midnight-miso', name: 'Midnight Miso',  broth: 'miso',     toppings: ['corn', 'chashu', 'scallion'], price: 26 },
  { id: 'golden-miso',   name: 'Golden Miso',    broth: 'miso',     toppings: ['egg', 'corn'],               price: 24 },
  { id: 'lantern-tonk',  name: 'Lantern Tonkotsu', broth: 'tonkotsu', toppings: ['egg', 'chashu', 'nori'],    price: 30 },
  { id: 'festival-tonk', name: 'Festival Tonkotsu', broth: 'tonkotsu', toppings: ['chashu', 'naruto', 'scallion'], price: 28 },
  { id: 'market-special',name: 'Market Special', broth: 'shoyu',    toppings: ['egg', 'chashu', 'naruto', 'nori'], price: 34 },
  { id: 'lantern-deluxe',name: 'Lantern Deluxe', broth: 'tonkotsu', toppings: ['egg', 'chashu', 'corn', 'nori', 'scallion'], price: 38 },
];

// One shift per day. Later days unlock recipes, spawn faster and pay more.
export const DAYS = [
  { day: 1, name: 'First Lantern',   shiftSeconds: 150, spawnEvery: 14, maxTickets: 3, recipes: ['classic-shoyu', 'pork-shoyu'], target: 120, rushAt: 75 },
  { day: 2, name: 'Miso Nights',    shiftSeconds: 150, spawnEvery: 12, maxTickets: 4, recipes: ['classic-shoyu', 'pork-shoyu', 'midnight-miso', 'golden-miso'], target: 180, rushAt: 75 },
  { day: 3, name: 'Tonkotsu Dawn',  shiftSeconds: 150, spawnEvery: 11, maxTickets: 4, recipes: ['classic-shoyu', 'midnight-miso', 'lantern-tonk', 'festival-tonk'], target: 230, rushAt: 70 },
  { day: 4, name: 'Festival Crowd', shiftSeconds: 150, spawnEvery: 10, maxTickets: 5, recipes: ['pork-shoyu', 'midnight-miso', 'lantern-tonk', 'festival-tonk', 'market-special'], target: 280, rushAt: 70 },
  { day: 5, name: 'Lantern Finale', shiftSeconds: 165, spawnEvery: 9,  maxTickets: 5, recipes: ['midnight-miso', 'lantern-tonk', 'festival-tonk', 'market-special', 'lantern-deluxe'], target: 340, rushAt: 80 },
];

export const TUNING = {
  noodleCookSeconds: 6,      // noodles finish after this long in the boiler
  noodleSoggyAfter: 11,      // left longer than this, they go soggy
  ticketPatience: 55,        // seconds a customer waits before walking out
  ticketPatienceRush: 45,    // patience during rush hour
  rushDuration: 25,          // rush hour length in seconds
  tipMaxFraction: 0.5,       // best tip is +50% of the dish price
  wrongServePenalty: 8,      // coins lost on a wrong serve
  walkoutPenalty: 5,         // coins lost when a ticket expires
  comboStep: 0.1,            // +10% pay per combo step
  comboMax: 5,               // combo caps at x5
  starTwo: 1.0,              // 2 stars at target
  starThree: 1.3,            // 3 stars at 130% of target
};
