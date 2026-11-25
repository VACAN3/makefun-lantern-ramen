// Lantern Ramen — Input.
// Mouse clicks on stations and keyboard shortcuts do the same jobs,
// so the game plays either way. Click zones are data, not magic:
// each station owns a rectangle and an action.

export const CLICK_ZONES = [
  { id: 'broth-shoyu',    x: 70,  y: 216, w: 110, h: 118, action: 'broth', arg: 'shoyu' },
  { id: 'broth-miso',     x: 200, y: 216, w: 110, h: 118, action: 'broth', arg: 'miso' },
  { id: 'broth-tonkotsu', x: 330, y: 216, w: 110, h: 118, action: 'broth', arg: 'tonkotsu' },
  { id: 'boiler',         x: 500, y: 210, w: 300, h: 150, action: 'noodles' },
  { id: 'topping-egg',      x: 846,  y: 216, w: 122, h: 74, action: 'topping', arg: 'egg' },
  { id: 'topping-chashu',   x: 978,  y: 216, w: 122, h: 74, action: 'topping', arg: 'chashu' },
  { id: 'topping-nori',     x: 1110, y: 216, w: 122, h: 74, action: 'topping', arg: 'nori' },
  { id: 'topping-naruto',   x: 846,  y: 300, w: 122, h: 74, action: 'topping', arg: 'naruto' },
  { id: 'topping-corn',     x: 978,  y: 300, w: 122, h: 74, action: 'topping', arg: 'corn' },
  { id: 'topping-scallion', x: 1110, y: 300, w: 122, h: 74, action: 'topping', arg: 'scallion' },
  { id: 'serve',  x: 964, y: 452, w: 276, h: 196, action: 'serve' },
  { id: 'trash',  x: 74,  y: 570, w: 52,  h: 56,  action: 'trash' },
  { id: 'bowl',   x: 420, y: 530, w: 200, h: 110, action: 'inspect' },
];

export const KEY_ACTIONS = {
  Digit1: { action: 'broth', arg: 'shoyu' },
  Digit2: { action: 'broth', arg: 'miso' },
  Digit3: { action: 'broth', arg: 'tonkotsu' },
  KeyN: { action: 'noodles' },
  KeyQ: { action: 'topping', arg: 'egg' },
  KeyW: { action: 'topping', arg: 'chashu' },
  KeyE: { action: 'topping', arg: 'nori' },
  KeyR: { action: 'topping', arg: 'naruto' },
  KeyT: { action: 'topping', arg: 'corn' },
  KeyY: { action: 'topping', arg: 'scallion' },
  Space: { action: 'serve' },
  KeyX: { action: 'trash' },
  KeyD: { action: 'dump' },
};

export function zoneAt(x, y) {
  for (let i = CLICK_ZONES.length - 1; i >= 0; i--) {
    const z = CLICK_ZONES[i];
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
  }
  return null;
}

// Convert a mouse event to canvas coordinates (the canvas is scaled by CSS).
export function eventToCanvas(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
    y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
  };
}
