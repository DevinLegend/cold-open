# Cold Open

A browser stub of an original 2D platform fighter. One flat stage, three stylized fighters, local play. The title stays **Cold Open**.

This is the base other lanes can PR against. The match rules run without a canvas, so combat changes can be checked with `npm test` before anyone opens a browser.

## Play

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47331](http://127.0.0.1:47331). The dev server is pinned to that port.

Fighter contrast on the live slab, with the one-pager sky and rust: [http://127.0.0.1:47331/lookdev.html](http://127.0.0.1:47331/lookdev.html). Notes are in `src/fighters/READABILITY.md`. Collision, camera, and the Elon and Dario kits are unchanged.

## Static export

grok.me Build Mode should use the **`publish/`** directory.

```bash
npm run build
```

Vite writes the playable site to `publish/` (`build.outDir` in `vite.config.ts`). Entry file: `publish/index.html`. `publish/` is generated and gitignored.

Preview that export locally:

```bash
npm run preview
```

## Controls

| | Move | Jump | Down | Attack | Grab | Dodge |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | A / D | W or Space | S | J | H | L (or Left Shift) |
| P2 | Arrow keys | Up | Down | K | O | P (or Right Shift) |

Hold a direction to run. Tap jump for a short hop, hold for a full hop, and press jump again in the air for a second jump. After that jump is spent, press jump once more for the recovery. Space jumps without aiming up.

Attack on the ground is a smash: no direction is forward, the opposite direction is back, S / Down is down, W / Up is up. The swing starts on the press. The same button in the air is the matching aerial. Space jumps without counting as up, so Space does not turn a smash into an up smash. Grab on the ground, then a direction or attack, throws. Dodge with no direction is a spot dodge, with left or right is a roll, and in the air is an air dodge. Shift still dodges if that is easier. In menus, S and Down still move the mode list.

Esc pauses. When `readRematchState(match).canRematch` is true, the result card slides in. The percents and stock pips on that card are `fighter.damage` and `fighter.stocks`. Enter or Space calls `App.requestRematch()` (same fighters, same match object). Esc returns to fighter picks. Q quits to the title. The same three actions are buttons. In a dev build, F8 or `?results=1` forces the card without writing stocks, percent, or KO history.

Menus take the same keys, or a click.

## What the stub plays

- **Red Horizon** — one solid slab. No soft platforms. The slab is 20 reference fighter-widths wide and 1.2 reference fighter-heights thick (`src/stage/layout.ts`). Walk off either end and you are offstage. The camera springs toward both fighters, keeps the whole slab in view, and eases out slightly when someone nears a blast line.
- Blast zones past the left edge, the right edge, and the pit. No ceiling blast. Crossing one spends a stock and respawns you at 0% if a stock remains. Three stocks (`STOCKS` in `src/stage/layout.ts`). Last one standing takes the match. Each KO is appended to `match.koLog` before percent clears, then drained into local history when the match ends.
- Percent rises on hit and scales the launch. It resets when you respawn.
- Every fighter has four smashes, four aerials, grab with four throws, spot dodge, roll, air dodge, and a recovery up-special after the double jump.
- Fighters are geometric silhouettes with nameplates: **Elon Musk**, **Sam Altman**, and **Dario**. Same fighter can be picked twice; slot color keeps them apart. Elon hangs and lifts, Sam is faster and flatter, Dario's up smash is the tall one. Elon’s poses live in `art/elon/` and take charcoal, white tee, hair, and acid teal from `art/palette.ts`. The match plate is the shared `ELON` nameplate (teal on charcoal). Regenerate the sheets with `node --experimental-strip-types art/elon/emit-sheet.ts`.
- Versus CPU, or two players on one keyboard.
- Rockets are parallax scenery. They do not collide. The only solid is the slab AABB.

Not in this stub: shield, items, online play, extra fighters, extra stages.

## Lanes

Stay inside your lane’s folders. Shared types live in `src/game/types.ts`. The headless API is `createMatch` / `stepMatch` in `src/match/sim.ts`.

| Lane | Owns | Stub already | Next change looks like |
| --- | --- | --- | --- |
| Stage | `src/stage/` | Red Horizon layout, blast zones, camera, parallax rockets | Stage read, camera feel. Do not add a second platform in v1. |
| Fighters | `src/fighters/`, `art/elon/` | Three silhouettes, weights, walk/run/jump stats, nameplates. Elon kit: idle, walk, jump, smash wind-up, aerial, KO tumble, up-hop vapor, landing dust | Clearer shapes and per-fighter motion. No photos, no logos. |
| Combat | `src/combat/` | Four smashes, four aerials, grab, throws, dodge, recovery | Feel numbers in `attacks.ts` and `dodge.ts`. Do not rename `forwardSmash` / `forwardAerial`. |
| Input | `src/input/` | P1, P2, CPU that can smash, grab, dodge, and recover | Better CPU, input buffer. |
| Match | `src/match/` | Intro, hitstop, stocks, respawn, win / draw, `koLog`, rematch, local KO history | Rules only. Do not import the canvas here. |
| Presentation | `src/render/`, `src/shell/`, `src/audio/`, `index.html`, `src/style.css` | Menus, HUD, pause, results, tones | Juice. The title on screen stays Cold Open. The match HUD reads `fighter.damage` and `fighter.stocks`. |
| Art | `art/`, `docs/design/` | Shared stage + fighter palette, arcade nameplates, art bible | Adopt `art/palette.ts` when recoloring. Do not invent a second accent set. |
| Export | `vite.config.ts` | `publish/` static build | Keep `build.outDir` pointed at `publish/` so Build Mode does not have to guess. |

## Stocks, KO history, rematch

The HUD reads `fighter.damage` and `fighter.stocks`. Nothing else is the source of those numbers.

- **Starting stocks:** `STOCKS` in `src/stage/layout.ts` (3). `STARTING_STOCKS` in `src/match/rematch.ts` is that same constant.
- **Rematch:** `requestRematch(match)` in `src/match/rematch.ts`, also `App.requestRematch()`. It runs when `readRematchState(match).canRematch` is true (`over`, and the KO hitstop has finished). `startRematch(match)` resets even mid-round. Both put stocks, percent, positions, winner, and `koLog` back to a fresh round on the same match object.
- **Persist:** `drainKoLog` writes `localStorage` key `cold-open.ko-history.v1`. Shape: `{ version: 1, matches: SavedMatch[] }`. Each `SavedMatch` is `{ id, savedAt, fighters, control, stocksEach, winner, draw, complete, kos }`. `kos` entries are the `KoRecord`s (slot, fighter id, stocks left, percent at blast, position). The sim drains the log when a match-ending KO finishes its hitstop. Leaving the match drains whatever is still queued.

Adding a move:

1. Extend `AttackKind` in `src/game/types.ts`.
2. Add numbers in `src/combat/attacks.ts`.
3. Choose the kind in `src/match/body.ts` from grounded/airborne and direction.
4. Draw the swing in `src/fighters/draw.ts` if the pose should change.

```bash
npm test
```

## Design lock

- Title is Cold Open. Do not rename it, and do not brand the game with a console fighter, a planet, or a job title.
- The stage is a flat slab with blast zones off the sides and below. Do not use another game’s stage name.
- No Nintendo names, characters, assets, or sounds.
- No SpaceX, OpenAI, or Anthropic marks or wordmarks. Rockets stay generic scenery.
- No photographic likenesses. Fighters stay stylized geometry plus a nameplate. New stage and fighter colors come from `art/palette.ts`, matching `docs/design/01-design-one-pager.md`.
- v1 is local only: one stage, these three fighters, no items, no netplay.

## Layout

```
index.html
vite.config.ts          publish/ is the static export
src/main.ts             canvas boot
src/game/               shared types, math, sparks
src/stage/              layout, camera, scenery
src/fighters/           roster, spawn, silhouettes
art/elon/               Elon palette, poses, contact sheet
src/combat/             attack data and hit tests
src/input/              keyboard, pointer, CPU
src/match/              movement and rules
src/render/             world, HUD, menus
                         match HUD: `#co-hud` `[data-hud-slot]` `data-damage` / `data-stocks`
src/shell/              screen flow
src/audio/              tones
art/                    shared palette and nameplate kit
docs/design/            art bible
tests/sim.test.ts       headless rules
```

Node 22 or newer.
