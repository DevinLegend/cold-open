# Cold Open art

Shared palette and arcade nameplates for the flat stage. Gameplay, hitboxes, boot, and combat stay in `src/`. This folder does not replace them.

Stage lock: [docs/design/01-design-one-pager.md](../docs/design/01-design-one-pager.md). Silhouette notes: [docs/design](../docs/design/README.md). If a note disagrees with the one-pager, the one-pager wins.

## Palette

`palette.ts` mirrors the one-pager. `palette.css` uses the same hexes.

| | Body | Accent |
| --- | --- | --- |
| Stage ground | top `#8B4513`, mid `#A0522D`, lip `#3D2314` | |
| Stage sky | `#C47A6A` → `#D4A574`, horizon `#9B6B7A` | |
| Blast | void `#0B0A12` | cyan `#3DE0FF` and magenta `#FF3D9A` rims, edge only |
| Rockets | vapor `#E8DCC8`, ember `#FF6B35` | parallax only |
| ELON | charcoal `#1a1f2a` | teal `#2ee6c5` |
| SAM | navy `#1c2a4a` | gold `#e8b84a` |
| DARIO | slate `#3a4558` | mint `#7dffb3` accent only |

Slab target on `SLAB`: about 18–22 fighter-widths wide, about 1.2 fighter-heights thick, about 1.5 fighter-heights of air at rest. Miles owns the collision box.

Blast rims and rocket colors are stage light. They are not fighter colors.

Cloth, hair, and DARIO's glasses frames are on `FIGHTERS` in `palette.ts`.

## Nameplates

Labels are `ELON`, `SAM`, and `DARIO`. Teal on charcoal, gold on navy, mint on slate.

- Pixel plates: `nameplates/elon.svg`, `nameplates/sam.svg`, `nameplates/dario.svg`
- Stage preview: `nameplates/sheet.svg` and [sheet.html](sheet.html)
- Text chips: `nameplates.css` (`.co-nameplate`, `.co-nameplate--elon`, `--sam`, `--dario`)
- Canvas painter: `paintNameplate` in `nameplates.ts`

The match draws every fighter with `paintNameplate`: a world billboard above the head, and the same plate scaled beside the HUD percent. `nameplates.css` is the text-chip feel and stays as it is. Combat numbers stay as they are.

## Elon kit

`art/elon/` reads `FIGHTERS.elon` and `STAGE`. Dust stays in the ground family. The thrust streak is the locked teal, with a darker teal edge so the blade holds on ochre. Blast cyan, magenta, and rocket ember are not fighter colors. Regenerate the sheets with `node --experimental-strip-types art/elon/emit-sheet.ts`.

## SAM kit

`art/sam/` is the executive outline: broader shoulders than Elon, a short hair dome, and an open-collar blazer that tapers. Fills come from `FIGHTERS.sam`. The forward tell is a horizontal gold close, the back tell is a shrug wave, and the up tell is an abstract gavel bar. The match reads that kit from `src/fighters/sam-art.ts`. The gold-on-navy plate is the shared billboard. Regenerate after a pose change:

```bash
node --experimental-strip-types art/sam/render-sheets.mjs
```

## Dario kit

`art/dario/` is the Dario pose set: idle, walk, jump, aerial, palm wind-up, palm-check, containment, the vertical safety wall, and tumble. Fills come from `FIGHTERS.dario` and `STAGE`. The wall is slate. Mint on that pose is a short flash, not the slab. Regenerate after a pose change:

```bash
node --experimental-strip-types art/dario/render-sheets.mjs
```

Letterforms are the 5×7 bitmaps in `glyphs.ts`. Regenerate the SVGs after a glyph change:

```bash
node --experimental-strip-types art/export-nameplates.mjs
```

```html
<link rel="stylesheet" href="art/nameplates.css" />
<span class="co-nameplate co-nameplate--sam">SAM</span>
<img src="art/nameplates/dario.svg" alt="DARIO" />
```

## Silhouette rules

- Slightly oversized heads and thick limbs. Torso mass stays readable. No noodle arms.
- At about one-sixth of the screen height, idle, walk, jump, smash wind-up, aerial, and KO tumble still separate the three outlines.
- **ELON:** tall lean rectangle, wild hair wedge, shoulders narrower than Sam. A rocket pack is an unbranded prop only.
- **SAM:** broadest torso, short hair dome, open-collar blazer. The executive outline.
- **DARIO:** rounder shoulders, taller forehead, glasses mass, slightly shorter stance. Slate is the body. Mint is a pip, a ripple, or the nameplate — not the sweater.
- Smash poses can stretch for a frame or two. They still have to read as that fighter.

## Do not

- Stolen photos, photoreal faces, or headshots
- SpaceX, Tesla, X, OpenAI, Chat product chrome, Anthropic, or Claude marks
- Nintendo assets, console-fighter names, or another game's stage name
- Branded vehicle props
- Corporation wordmarks on the plates (the labels are the fighter names only)
- All-black suits
- Mint as DARIO's body color — it disappears into the sky haze
