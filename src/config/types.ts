export type Vec2Config = { x: number; y: number };

export type VisualConfig = {
  texture: string;
  path?: string;
  spritesheet?: { frameWidth: number; frameHeight: number };
  scale?: number;
  displayWidth?: number;
  displayHeight?: number;
  origin?: Vec2Config;
  rotation?: number;
  depth?: number;
  placeholder: { shape: 'circle' | 'rect' | 'triangle'; color: number; width: number; height: number };
};

export type AnimationDefinition = {
  key: string;
  texture: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
};

export type EnemyBehavior = 'melee' | 'ranged';
export type EnemyDefinition = {
  id: string;
  name: string;
  hp: number;
  speed: number;
  contactDamage: number;
  attackInterval: number;
  projectileSpeed: number;
  projectileDamage: number;
  range: number;
  preferredDistance: number;
  texture: string;
  animations: string;
  behavior: EnemyBehavior;
  spawnWeight: number;
};

export type ItemEffect = 'lightRadius' | 'moveSpeed' | 'lightDamage' | 'damageReduction';
export type ItemDefinition = {
  id: string;
  name: string;
  texture: string;
  effectType: ItemEffect;
  value: number;
  sharedHealthDrainReduction: number;
  effectDuration: number;
};
