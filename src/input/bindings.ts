// Lane: input. Keyboard map for local play.
// S and ArrowDown are down during a match (menus still use them to move the list).
// Space jumps without aiming up, so a jump-tap does not become an up smash.

export const P1_BIND = {
  left: 'KeyA',
  right: 'KeyD',
  up: ['KeyW'] as const,
  down: 'KeyS',
  jump: ['KeyW', 'Space'] as const,
  attack: ['KeyJ', 'KeyF'] as const,
  grab: ['KeyH'] as const,
  dodge: ['KeyL', 'ShiftLeft'] as const,
};

export const P2_BIND = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: ['ArrowUp'] as const,
  down: 'ArrowDown',
  jump: ['ArrowUp'] as const,
  attack: ['KeyK', 'Semicolon'] as const,
  grab: ['KeyO'] as const,
  dodge: ['KeyP', 'ShiftRight'] as const,
};

export const P1_LABEL = 'A D   W/Space   S   J   H grab   L';
export const P2_LABEL = '← →   ↑   ↓   K   O grab   P';
