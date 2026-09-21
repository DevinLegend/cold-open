# Fighter readability — contrast on the live slab

Iris owns the one-pager. Miles owns the collision box and the rest camera. Elon and Dario own their kits. This note is only the contrast check. It does not change those files.

Open `npm run dev`, then [http://127.0.0.1:47331/lookdev.html](http://127.0.0.1:47331/lookdev.html). `npm run build` writes `publish/lookdev.html`.

## What this pass touches

- The live standing surface in `drawPlatform` uses the one-pager ground: top `#8B4513`, face `#A0522D`, lip `#3D2314`. The cream highlight on the old deck is gone so the soles are not standing on a pale stripe. Sky, mesas, rockets, end caps, and the AABB are unchanged.
- `lookdev.html` places the three current fighters on a slab that is the live `PLATFORM` at zoom 1: 920×113, which is 20 reference widths and 1.2 reference heights. Side and bottom rims use blast cyan `#3DE0FF` and magenta `#FF3D9A` on void `#0B0A12`. A dark tick marks 1.5 reference heights of air (141px). The shared billboards sit above that tick; the mock does not move them.
- The sheet under it scales Elon to 120px, one sixth of 720, so the small-size read can be checked without resizing the live slab.

## Poses

The buttons set match state the kits already understand. They do not add moves.

| Pose | State the kits read |
| --- | --- |
| Idle | Grounded, no attack, no velocity |
| Walk | Grounded, `vx` past the walk threshold |
| Jump | Airborne, a jump still in hand, rising |
| Wind-up | `forwardSmash` during startup |
| Aerial | `forwardAerial` during its active frames |
| KO tumble | Hitstun, `koHold`, off the deck |

Elon, Sam, and Dario draw their kits. Sam is warm gold `#e8b84a` on navy `#1c2a4a`, the one-pager lock. The body is the broad blazer. Gold is the accent on that navy.

## Contrast

Bodies on the mock sit on ochre `#D4A574`. The horizon `#9B6B7A` is a 16px band on the slab, not a field behind the chest. The standing rust is `#8B4513`.

Elon’s charcoal, Sam’s navy, and Dario’s slate are the kit fills from `art/palette.ts`. Navy and charcoal separate from the ochre. Dario’s slate does not separate from the standing rust; the hem and the ink do that work, and the sweater stays in the sky. Sam’s gold `#e8b84a` is the accent on the navy. The close swipe keeps a darker gold edge so the flash holds on the ochre haze. The hair sits near that haze, so the dome carries the void ink outline.

Nameplates use Elena’s placement in `src/render/nameplate.ts`. A world billboard sits above the head and is drawn inside the view at her rest scale, so the sheet zoom shrinks it with the fighter. The stage frame is zoom 1, so her camera damp stays at rest. The same plate repeats beside a 0% at the HUD scale, in screen space. `art/nameplates.css` and both plate scales are unchanged. Elon’s billboard tops out about 191px above his feet. The 1.5-height air mark is 141px, so the plate crosses that line. The live rest camera already has several heights of air, which is why the plates fit in a match. This mock keeps the 141px mark and leaves sky above it.

## Left alone

`PLATFORM`, `BLAST`, `REST_CAMERA`, `src/combat/`, `art/elon/`, `art/dario/`, and the roster numbers are unchanged.
