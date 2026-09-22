/**
 * 遊戲平衡唯一來源。時間單位都是秒、速度單位是 pixel/秒、比例使用 0~1。
 * 企劃日常調整原則上只需修改本檔，不必進入 entity 或 scene。
 */
export const DEFAULT_BALANCE = {
  world: {
    width: 1280,
    height: 720,
  },
  player: {
    maxHp: 100, // 玩家最大生命值。
    collisionRadius: 18, // 玩家 Arcade Physics 碰撞半徑。
    invulnerabilitySeconds: 0.45, // 受直接傷害後的短暫無敵時間。
    moveSpeed: {
      start: 260, // 遊戲開始時移動速度。
      minimum: 90, // 時間衰退能降到的最低移動速度。
      decayPerSecond: 1.4, // 每秒降低多少移動速度。
    },
  },
  lantern: {
    radius: {
      start: 210, // 初始光照與傷害作用半徑。
      minimum: 75, // 光圈能縮小到的最小半徑。
      decayPerSecond: 1.05, // 每秒縮小的 pixel 數。
    },
  },
  lightDamage: {
    dps: {
      start: 28, // 光圈對圈內敵人的初始每秒傷害。
      minimum: 5, // 光照 DPS 最低值。
      decayPerSecond: 0.18, // 每秒降低的 DPS。
    },
  },
  damageReduction: {
    ratio: {
      start: 0.55, // 光圈內敵人的攻擊傷害初始減免比例；0.55 = 55%。
      minimum: 0.08, // 減傷效果最低比例。
      decayPerSecond: 0.004, // 每秒降低的比例。
    },
  },
  healthDrain: {
    startPerSecond: 0.8, // 遊戲開始時每秒自然流失的生命。
    increasePerSecond: 0.035, // 線性模式下，每經過一秒增加的每秒流失量。
    curve: 'linear' as 'linear' | 'quadratic', // linear 或 quadratic。
    quadraticFactor: 0.0007, // 曲線模式的 elapsedSeconds² 係數。
  },
  pickups: {
    spawnInterval: 8, // 道具生成間隔。
    lifetime: 14, // 道具未拾取時存在秒數。
    pickupRange: 34, // 拾取判定距離。
    sharedHealthDrainReduction: 0.5, // 未被個別道具覆寫時的生命流失倍率。
    sharedEffectDuration: 5, // 未被個別道具覆寫時的共通效果秒數。
  },
  enemies: {
    spawnInterval: 2.2, // 初始敵人生成間隔。
    minimumSpawnInterval: 0.55, // 最快生成間隔。
    spawnIntervalDecayPerSecond: 0.012, // 每秒縮短多少生成間隔。
    countStart: 1, // 每波初始生成數量。
    countIncreaseEverySeconds: 35, // 每隔多久每波多生成一隻。
    countMaximum: 4, // 每波最大生成數量。
  },
  projectile: {
    lifetime: 5, // 敵方投射物最長存在秒數。
    radius: 6, // 投射物碰撞半徑。
  },
} as const;

export type BalanceConfig = typeof DEFAULT_BALANCE;
