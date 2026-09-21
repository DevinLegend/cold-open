# Cold Open — fighter art concepts

Silhouette and nameplate notes for the three fighters. Stage palette, slab scale, blast rims, and signature smash roles follow [01-design-one-pager.md](01-design-one-pager.md). If this note disagrees with that page, that page wins.

The working title stays **Cold Open**. Fighter labels are arcade names, not corporation wordmarks.

## Visual system

- Medium: 2D stylized fighters (sprite sheets, layered canvas, or mesh-cards) readable at platform-fighter camera distance on a long flat platform.
- Proportions: slightly oversized heads and clear limb mass so wind-ups and aerials read in silhouette.
- Nameplates: short arcade labels under each fighter — `ELON` / `SAM` / `DARIO`. Chunky, pixel-adjacent or a heavy sans, high contrast. No corporation wordmarks.
- Palette rule: each fighter owns a distinct body plus accent that separates on rust ground and pale sky. Avoid all-black suits.
- Stage pairing: fighters pop against rust ground and dusty sky. Cyan `#3DE0FF` and magenta `#FF3D9A` rims are shared blast-edge light, not character identity.
- Hitbox friendliness (art constraint only): torso mass stays readable; limbs are not noodle-thin; smash poses telegraph with a short stretch. Volumes themselves belong to combat.

## ELON — tech / rocket flavor

**Silhouette:** Tall lean rectangle and a wild hair wedge. Shoulders narrower than Sam. A rocket-pack silhouette is optional as an unbranded prop.

**Colors:** Charcoal jacket `#1a1f2a`, white tee `#f2f4f8`, hair `#2b241c`, accent acid teal `#2ee6c5` (thruster or UI glow — not a corporation blue).

**Nameplate:** `ELON` · teal on charcoal.

**Signature smash feel (art only):** Long-range rocket-kick. Forward smash with hang-time launch. Teal is the streak, not a brand mark.

**Do not:** Photoreal face. Tesla, X, or SpaceX marks. Branded vehicle props.

## SAM — polished / operator flavor

**Silhouette:** Broader torso, clean short hair dome, open-collar blazer taper. The most executive outline of the three.

**Colors:** Navy blazer `#1c2a4a`, soft shirt `#d8e0ef`, hair `#c4a882`, accent warm gold `#e8b84a`.

**Nameplate:** `SAM` · gold on navy.

**Signature smash feel (art only):** Polished horizontal smash. Fast startup, crisp sweetspot, gold flash. No logo.

**Do not:** OpenAI logo. Chat product chrome. Photoreal headshot.

## DARIO — researcher / safety flavor

**Silhouette:** Soft rounder shoulders, taller forehead, glasses mass, slightly shorter stance. The most lab-like outline.

**Colors:** Soft slate sweater `#3a4558`, cream undershirt `#efe8dc`, hair `#5a4638`, glasses frames `#111318`, accent safety mint `#7dffb3`.

**Nameplate:** `DARIO` · mint on slate.

**Signature smash feel (art only):** Up-smash as an anti-air safety wall. Patient, heavy vertical. Mint is the flash only. Original shape, no brand mark.

**Do not:** Anthropic logo. Claude branding. Photoreal photo. Mint as the body color.

Slate stays the dominant mass. Mint is accent only, so it does not melt into the sky haze.

## Stage palette lock

Numbers below are the one-pager. Shared tokens live in `art/palette.ts` (and the CSS mirror `art/palette.css`).

- Ground top `#8B4513` → mid `#A0522D`, lip / side `#3D2314`
- Sky `#C47A6A` → `#D4A574`, horizon `#9B6B7A`
- Blast void `#0B0A12`, cyan rim `#3DE0FF`, magenta rim `#FF3D9A` (edge only)
- Rocket parallax: vapor `#E8DCC8`, ember `#FF6B35`. Never on collision
- Slab: about 18–22 fighter-widths wide and about 1.2 fighter-heights thick
- Camera rest: full slab, about 1.5 fighter-heights of air, and the blast rim visible

ELON teal, SAM gold, and DARIO mint punch on the rust top. DARIO’s slate body stays the mass so mint does not melt into `#C47A6A` / `#D4A574`. The blast rims are not a fighter color.

## Readability checklist

- Idle, walk, jump, smash wind-up, aerial, and KO tumble frames keep the three silhouettes distinct at about one-sixth of the screen height.
- Nameplates stay visible as world plates or HUD chips. Plate art is this lane. Stage framing is Iris.
- Limb length follows combat volumes. Do not stretch a sprite past the hit volume to chase a pose.
- Recheck accents against the rust ground and the dusty sky before calling a kit done.

## Art sequence

1. Shared palette and nameplate kit (this slice)
2. ELON fighter kit — idle, smash poses, silhouette sheet
3. SAM fighter kit
4. DARIO fighter kit
5. Readability pass of all three on a flat-stage mock
