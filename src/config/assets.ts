import type { VisualConfig } from './types';

/**
 * path 留空會使用 placeholder。要換圖時將檔案放進 public/assets，填入以 /assets 開頭的網址。
 * 若是 spritesheet，再填 spritesheet.frameWidth / frameHeight。
 */
export const ASSETS: Record<string, VisualConfig> = {
  background: { texture: 'background', path: 'assets/backgrounds/underworld-chapter-1.png', depth: -1, placeholder: { shape: 'rect', color: 0x0b0f18, width: 64, height: 64 } },
  player: { texture: 'player', path: 'assets/player/player-sheet.png', spritesheet: { frameWidth: 64, frameHeight: 64 }, scale: 1, origin: { x: 0.5, y: 0.65 }, depth: 10, placeholder: { shape: 'circle', color: 0xf4f7ff, width: 38, height: 38 } },
  enemyMelee: { texture: 'enemyMelee', path: 'assets/enemies/enemy-melee-sheet.png', spritesheet: { frameWidth: 64, frameHeight: 64 }, scale: 1, origin: { x: 0.5, y: 0.5 }, depth: 5, placeholder: { shape: 'circle', color: 0xe84855, width: 34, height: 34 } },
  enemyRanged: { texture: 'enemyRanged', path: 'assets/enemies/enemy-ranged-sheet.png', spritesheet: { frameWidth: 64, frameHeight: 64 }, scale: 1, origin: { x: 0.5, y: 0.5 }, depth: 5, placeholder: { shape: 'rect', color: 0xa855f7, width: 34, height: 34 } },
  enemyMosquito: { texture: 'enemyMosquito', path: 'assets/enemies/enemy-mosquito-sheet.png', spritesheet: { frameWidth: 64, frameHeight: 64 }, scale: 1, origin: { x: 0.5, y: 0.5 }, depth: 5, placeholder: { shape: 'triangle', color: 0xff7b9c, width: 24, height: 24 } },
  projectile: { texture: 'projectile', path: '', depth: 6, placeholder: { shape: 'circle', color: 0xff75d8, width: 12, height: 12 } },
  pickupLight: { texture: 'pickupLight', path: 'assets/items/light-radius.png', depth: 4, placeholder: { shape: 'circle', color: 0xffd166, width: 24, height: 24 } },
  pickupSpeed: { texture: 'pickupSpeed', path: '', depth: 4, placeholder: { shape: 'triangle', color: 0x49dcb1, width: 26, height: 26 } },
  pickupDamage: { texture: 'pickupDamage', path: '', depth: 4, placeholder: { shape: 'rect', color: 0xff8c42, width: 24, height: 24 } },
  pickupDefense: { texture: 'pickupDefense', path: '', depth: 4, placeholder: { shape: 'rect', color: 0x55a7ff, width: 24, height: 24 } },
  pickupAge: { texture: 'pickupAge', path: '', depth: 4, placeholder: { shape: 'circle', color: 0xb678e7, width: 24, height: 24 } },
};
