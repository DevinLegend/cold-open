# Cold Open — design one-pager (Iris)

Working title stays **Cold Open**. Do not brand the game as Smash, Mars, or CEO. This is an original 2D platform fighter. Browser MVP on grok.me.

This file is the in-repo source of truth for stage layout and the Mars look (pull-in), rocket parallax, blast zones, camera framing, juice ideas, and menu / character-select feel. Iris owns this document. Miles owns collision AABB. Jules owns fighters.

Source brief (local, not in this repo): `notes/games/cold-open-brief.md`. If that note and this page disagree, this page wins.

## Fantasy in one line

Two stylized tech CEOs knock each other off a single Mars slab while rockets drift behind them. Clip-friendly juice, not a Nintendo homage.

## Stage (v1 — one map)

- **Ground:** one long flat platform. FD-style language only, and only here: single ground, no soft platforms. After this, call it the **Mars flat slab** or **single ground**. Dusty basalt / rust metal top. Readable silhouette against the sky.
- **Blast zones:** left, right, and below the platform. Fall or knockoff = stock loss. Prefer **% damage + knockback** off stage (not instant fall-death on first touch unless % is already lethal).
- **Background (parallax only, never collision):**
  - Far: thin Mars horizon + dusty pink/ochre sky gradient.
  - Mid: 2–3 rockets on slow parallax (launch trail, vapor, tiny engine glow). They never cross the playfield as solid, and they never take a hitbox or hurtbox.
  - Near: light dust / heat shimmer at the platform edges only.
- **Edges that read:** soft drop-shadow under the slab; cyan/magenta rim light on the blast-zone void so "out" is obvious in a clip.
- **Miles owns:** collision AABB and edges that match this silhouette.
- **Iris owns:** visual framing.
- **Jules owns:** fighter silhouettes that read against this ground.

## Stage palette (v1 lock for Jules contrast)

- Ground top: rust basalt `#8B4513` → mid `#A0522D` (readable dark under fighters)
- Ground lip / side: deep umber `#3D2314`
- Sky far: dusty rose `#C47A6A` → ochre haze `#D4A574`
- Horizon band: soft mauve `#9B6B7A`
- Blast void: near-black `#0B0A12` with cyan rim `#3DE0FF` / magenta rim `#FF3D9A` (edge readability only)
- Rocket trails (parallax): pale vapor `#E8DCC8` + ember tip `#FF6B35` — never on collision

**Slab dims (design target for Miles AABB):** platform width ~18–22 fighter-widths; thickness ~1.2 fighter-heights; playable top Y fixed. Camera rest framing: full slab + ~1.5 fighter-heights of air above + visible blast rim left, right, and below.

## Camera

- Keep the full platform readable at rest (both fighters + a little air above).
- Follow the fight: mild lerp toward the midpoint of living fighters; tighten when they cluster; ease out on KO launch.
- Never crop the blast-zone rim when someone is near an edge.
- KO zoom: brief punch-in on the launched fighter, then snap back. Hitstop freezes camera motion for the freeze frames.
- HUD never steals the stage: stocks + % at screen edges, not over the slab center.

## Juice (ideas for feel — Elena/Miles implement; Jules skins)

- **Hitstop:** 2–6 frames on medium/heavy; longer on smash connect. Screen holds; SFX click.
- **Screenshake:** scaled to knockback. Soft on jabs, hard on smash KO. Horizontal preferred so the slab stays readable.
- **Hit sparks:** short directional streak + dust from the platform when grounded. No Nintendo-style star burst.
- **KO:** trail smear + rocket-flare accent (theme, not a borrowed game). Stock icon crack or blink.
- **Landing / tech:** small dust puff. Dodge: brief afterimage, no invulnerability VFX soup.
- Clip test: a successful smash KO should look good muted with just shake + hitstop + trail.

## Fighters (Jules owns look; Iris locks roles)

Three only. Stylized silhouettes + nameplates. No photo likeness. No SpaceX, OpenAI, or Anthropic marks.

Accent colors below are the Jules lock. They replace the older reads (acid white / ember, navy / cream, soft teal).

| Fighter | Color read (locked) | Signature smash feel |
|---|---|---|
| **Elon** | Acid teal `#2ee6c5` on charcoal | Long-range rocket-kick / forward smash with hang-time launch |
| **Sam** | Warm gold `#e8b84a` on navy | Polished horizontal smash — fast startup, crisp sweetspot |
| **Dario** | Safety mint `#7dffb3` on slate. Slate body stays dominant so mint does not melt into sky haze `#C47A6A` / `#D4A574` | Up-smash / anti-air safety wall; patient, heavy vertical |

Every fighter gets: walk/run, short hop + full hop, double-jump or a recovery up-special, ground + aerial smash set (forward / back / down / up), grab (+ cheap throw directions), ground dodge (roll / spot). Shield is optional if time allows.

## Menu / character select feel

- **Cold Open** wordmark: tight sans, cold white on deep void. No Mars badge in the title.
- Character select: three big cards, silhouette first, nameplate under. Hover = idle animation + that fighter's locked color wash. Confirm = short camera push into the stage.
- Versus card: name vs name, then drop onto the slab (no long cinematic).
- Pause / rematch: same cold UI. Rematch is one click — shame is a design bug.
- Audio: dry UI ticks; no licensed stings.

## Controls (keyboard MVP)

WASD / arrows move · jump · attack / smash · grab · dodge. Local 1v1 vs CPU (or same-keyboard 2P if cheap). Online is out of v1.

## Non-goals v1

Online, 8-player, items, more characters, Nintendo names / assets / sounds, soft platforms, a second stage.

## Fun = success

Pick a fighter → Mars flat slab → % + knockoff → stocks → rematch. It feels good in the first 30 seconds. Juice is enough for a short clip.

## Hand-offs

- **Jules:** character silhouettes, the locked accent colors above, smash VFX skin, menu art direction pairing. Fighters are Jules's lane.
- **Miles:** stage collision matching this slab (AABB), blast zones, % + knockback off stage, playable moveset hooks. Rockets stay parallax scenery and never enter the collision set.
- **Iris:** this one-pager plus camera, juice, and menu framing. This document is Iris's lane.
- **Model lock:** `grok-4.7` · `reasoning_effort: xhigh` · `fast: false` · `context: 500k`. Cap 5. Docs and design only from Iris.

## Cut list

Nintendo IP, the FD product name, soft platforms, photo faces, brand logos, online, item rain, a second map, and "Mars Smash" or CEO branding in the title.
