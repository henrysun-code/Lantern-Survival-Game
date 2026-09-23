import type { AnimationDefinition } from './types';

/** 動畫 frame 與播放速度集中於此；沒有 spritesheet 時會安全略過。 */
export const ANIMATIONS: Record<string, Record<string, AnimationDefinition>> = {
  player: {
    idle: { key: 'player_idle', texture: 'player', startFrame: 0, endFrame: 1, frameRate: 6, repeat: -1 },
    walk: { key: 'player_walk', texture: 'player', startFrame: 0, endFrame: 5, frameRate: 10, repeat: -1 },
    idleDown: { key: 'player_idle_down', texture: 'player', startFrame: 0, endFrame: 1, frameRate: 6, repeat: -1 },
    walkDown: { key: 'player_walk_down', texture: 'player', startFrame: 0, endFrame: 5, frameRate: 10, repeat: -1 },
    walkUp: { key: 'player_walk_up', texture: 'player', startFrame: 6, endFrame: 11, frameRate: 10, repeat: -1 },
    walkSide: { key: 'player_walk_side', texture: 'player', startFrame: 12, endFrame: 17, frameRate: 10, repeat: -1 },
    hurt: { key: 'player_hurt', texture: 'player', startFrame: 18, endFrame: 23, frameRate: 12, repeat: 0 },
    death: { key: 'player_death', texture: 'player', startFrame: 24, endFrame: 29, frameRate: 9, repeat: 0 },
  },
  enemyMelee: {
    idle: { key: 'melee_idle', texture: 'enemyMelee', startFrame: 0, endFrame: 0, frameRate: 6, repeat: -1 },
    move: { key: 'melee_move', texture: 'enemyMelee', startFrame: 0, endFrame: 3, frameRate: 8, repeat: -1 },
    attack: { key: 'melee_attack', texture: 'enemyMelee', startFrame: 4, endFrame: 6, frameRate: 10, repeat: 0 },
    hurt: { key: 'melee_hurt', texture: 'enemyMelee', startFrame: 7, endFrame: 8, frameRate: 12, repeat: 0 },
    death: { key: 'melee_death', texture: 'enemyMelee', startFrame: 9, endFrame: 12, frameRate: 8, repeat: 0 },
  },
  enemyRanged: {
    idle: { key: 'ranged_idle', texture: 'enemyRanged', startFrame: 0, endFrame: 0, frameRate: 6, repeat: -1 },
    move: { key: 'ranged_move', texture: 'enemyRanged', startFrame: 0, endFrame: 3, frameRate: 8, repeat: -1 },
    attack: { key: 'ranged_attack', texture: 'enemyRanged', startFrame: 4, endFrame: 6, frameRate: 10, repeat: 0 },
    hurt: { key: 'ranged_hurt', texture: 'enemyRanged', startFrame: 7, endFrame: 8, frameRate: 12, repeat: 0 },
    death: { key: 'ranged_death', texture: 'enemyRanged', startFrame: 9, endFrame: 12, frameRate: 8, repeat: 0 },
  },
};
