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
      maximum: 360, // 道具加成後的移動速度上限。
      decayPerSecond: 1.4, // 每秒降低多少移動速度。
    },
    color: {
      darkenPerSecond: 0.02, // 每秒失去的原色比例，約 46 秒到最暗。
      restorePerSecond: 0.25, // 指定道具效果期間，每秒恢復的原色比例。
      minimumBrightness: 0.08, // 最暗時仍保留少量輪廓，範圍 0~1。
    },
  },
  lantern: {
    radius: {
      start: 210, // 初始光照與傷害作用半徑。
      minimum: 75, // 光圈能縮小到的最小半徑。
      maximum: 300, // 道具加成後的光圈上限。
      decayPerSecond: 1.05, // 每秒縮小的 pixel 數。
    },
  },
  lightDamage: {
    dps: {
      start: 28, // 光圈對圈內敵人的初始每秒傷害。
      minimum: 5, // 光照 DPS 最低值。
      maximum: 50, // 道具加成後的光照 DPS 上限。
      decayPerSecond: 0.18, // 每秒降低的 DPS。
    },
  },
  damageReduction: {
    ratio: {
      start: 0.55, // 光圈內敵人的攻擊傷害初始減免比例；0.55 = 55%。
      minimum: 0.08, // 減傷效果最低比例。
      maximum: 0.95, // 減傷比例上限。
      decayPerSecond: 0.004, // 每秒降低的比例。
    },
  },
  healthDrain: {
    startPerSecond: -1.2, // 負值代表回復；遊戲開始時每秒回復 1.2 點生命。
    increasePerSecond: 0.03, // 每歲讓生命流動量下降；40 歲左右由回復轉為扣血。
    ageMultiplierScale: 0.5, // 生命流失使用其他屬性退化速度的一半，還原上一版速度。
    curve: 'linear' as 'linear' | 'quadratic', // linear 或 quadratic。
    quadraticFactor: 0.0007, // 曲線模式的 elapsedSeconds² 係數。
  },
  age: {
    secondsPerYear: 3, // 每幾秒增加一歲；300 秒時為 100 歲。
    slowStart: 40, // 40 歲開始緩慢衰退。
    mediumStart: 50, // 50 歲開始中等衰退。
    fastStart: 60, // 60 歲開始快速衰退。
    slowMultiplier: 0.8,
    mediumMultiplier: 1.7,
    fastMultiplier: 4,
  },
  pickups: {
    spawnInterval: 8, // 道具生成間隔。
    lifetime: 14, // 道具未拾取時存在秒數。
    pickupRange: 34, // 拾取判定距離。
    sharedHealthDrainReduction: 0.5, // 未被個別道具覆寫時的生命流失倍率。
    sharedEffectDuration: 5, // 未被個別道具覆寫時的共通效果秒數。
  },
  enemies: {
    spawnInterval: 4.5, // 初始敵人生成間隔。
    earlyAgeSpawnIntervalMultiplier: 0.8, // 未達 age.slowStart 前，生成間隔乘以 0.8。
    minimumSpawnInterval: 1.8, // 最快生成間隔。
    spawnIntervalDecayPerSecond: 0.0035, // 每秒縮短多少生成間隔。
    countStart: 2, // 每波初始生成數量。
    countIncreaseAmount: 2, // 每次增加的生成數量；讓原本每波數量精確翻倍。
    countIncreaseEverySeconds: 120, // 每隔多久每波多生成一隻。
    countMaximum: 6, // 每波最大生成數量。
  },
  projectile: {
    lifetime: 5, // 敵方投射物最長存在秒數。
    radius: 6, // 投射物碰撞半徑。
  },
} as const;

export type BalanceConfig = typeof DEFAULT_BALANCE;
