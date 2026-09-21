# Cold Open — platform fighter lock

Stage palette, slab scale, and fighter accent colors are locked in [01-design-one-pager.md](01-design-one-pager.md). If this note disagrees with that page, that page wins.

Working title: **Cold Open**. The name stays off the theme on purpose. It is not a planet name, a job title, or another game's title.

Target: a playable match in the browser. One stage, three fighters, local play.

## Genre

Original 2D platform fighter. One flat stage, with blast zones off the sides and below.

Do not use Nintendo names, characters, assets, or sounds. Do not use another game's stage name.

## Stage (v1 — one map)

- A single flat platform. No soft platforms.
- Background: dusty sky, horizon, and generic rockets as parallax scenery. Rockets do not collide and carry no marks.
- Leaving the left edge, the right edge, or the pit spends a stock. Damage is percent that scales knockback.
- The camera follows the fighters and keeps the platform readable.

Colors for new stage paint are the Iris lock in `art/palette.ts`.

## Fighters (v1 — three only)

1. **Elon** — tech / rocket flavor. Stylized silhouette and an `ELON` nameplate. No photographic likeness.
2. **Sam** — polished / operator flavor. `SAM` nameplate.
3. **Dario** — researcher / safety flavor. `DARIO` nameplate.

Distinct silhouettes, colors, and one signature smash feel each. No SpaceX, OpenAI, or Anthropic marks. Full color and pose notes: [fighters-concept.md](fighters-concept.md).

## Moves every fighter needs

Ground: forward smash, back smash, down smash, up smash.

Aerial, same directions: forward, back, down, up.

Universal: grab (throw direction if it stays cheap), dodge (at least a grounded spot-dodge or roll).

Also for playability: walk and run, short hop and full hop, a second jump or an up-recovery, shield if there is time.

This art slice does not implement moves. Smash notes in the concept file are pose direction only.

## Controls

Keyboard first. WASD or arrows move. Jump, smash, grab, dodge. Local 1v1 against a CPU, or two players on one keyboard. Online is not in v1.

## Non-goals

No online multiplayer, no eight-player rooms, no item chaos, no extra characters, no Nintendo names or assets.

## Success

Playable in the browser: pick a fighter, fight on the flat stage, watch percent and knockoff, lose stocks, rematch.
