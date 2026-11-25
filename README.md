# makefun-lantern-ramen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/vacan3/makefun-lantern-ramen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/vacan3/makefun-lantern-ramen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Lantern Ramen: a lantern-lit midnight noodle stall game — ladle broth, boil noodles, pile on toppings, and serve every ticket before patience runs out. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## Run it

```sh
# Play in a desktop browser:
open game/index.html
# or serve it:
node serve.ts   # http://localhost:8080
# Grader entrypoint (Node 22):
MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

---

# Lantern Ramen — 灯笼拉面 · Midnight Noodle Stall

A complete, original cooking game that runs offline in a desktop browser.
You run a tiny lantern-lit ramen stall through five nights: ladle broth,
boil noodles, pile on toppings, and serve every ticket before the
customer's patience runs out.

## How to play

Open `game/index.html` in desktop Chrome (or serve `game/` with any
static server, e.g. `node serve.ts` then http://localhost:8080). No build
step, no network requests — every file the game loads lives under `game/`.

| Action | Mouse | Keyboard |
| --- | --- | --- |
| Ladle broth (Shoyu / Miso / Tonkotsu) | Click a broth pot | `1` / `2` / `3` |
| Start noodles / scoop when ready | Click the boiler | `N` |
| Dump soggy noodles | Click the boiler when soggy | `D` |
| Add a topping | Click a topping bin | `Q` `W` `E` `R` `T` `Y` |
| Serve the bowl | Click the serve window | `Space` |
| Trash the bowl | Click the trash bin | `X` |
| Pause / mute | — | `P` / `M` |

## The cooking loop

1. **Ladle broth** into your bowl — each ticket wants one of three broths.
2. **Start the noodles** early: they take 6 seconds in the boiler and go
   soggy if left past 11. Scoop them into the bowl when the ring turns green.
3. **Add toppings** to match the ticket exactly — broth + noodles + topping set.
4. **Serve** at the window. A matching bowl pays the dish price plus a
   patience tip, multiplied by your combo. A wrong bowl costs ¥8 and resets
   the combo; a ticket that runs out of patience walks out (¥5).

## Depth

- **8 recipes** across 3 broths and 6 toppings, unlocked night by night.
- **5 nights**, each with its own menu, order rate and earnings target.
- **Rush hour** once per night: orders flood in at double speed and
  patience drains faster.
- **Combo multiplier** up to x5 for consecutive correct serves.
- **Day ratings**: 1–3 stars per night; miss the target and you replay
  the night.
- **WebAudio sound, all synthesised**: chopping, pouring, boiling,
  the serve bell, and a quiet pentatonic pluck loop. `M` mutes.

## Structure

```
game/
  index.html        page shell, loads the modules below
  style.css         centres the canvas on a night backdrop
  src/config.js     recipes, broths, toppings, days, tuning
  src/audio.js      SoundEngine — every sound synthesised in WebAudio
  src/orders.js     OrderBoard — tickets, patience, matching, tips
  src/kitchen.js    Kitchen — broth pots, boiler, toppings, the bowl
  src/render.js     Renderer — all art drawn with canvas primitives
  src/input.js      click zones + keyboard shortcuts
  src/shots.js      ?shot= staging for deterministic screenshots
  src/main.js       Game — state machine, shift clock, rush hour, loop
main.ts             Node 22 entrypoint: writes game/ + screenshots/ +
                    dossier.json to /output (MAKEFUN_OUTPUT_DIR outside
                    the grader)
vendor/makefun-game.ts   kit library, unchanged
```

## Screenshots

`?shot=title|busy|assemble|serve` stages the game into a fixed, paused
tableau for screenshots — the same state machine and renderer, just a
staged starting position and a frozen clock.

## License

MIT — see `LICENSE.md`.
