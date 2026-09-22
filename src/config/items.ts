import { DEFAULT_BALANCE } from './balance';
import type { ItemDefinition } from './types';

/** value 是該道具自己的補充值；共通生命流失緩和設定也可逐一覆寫。 */
export const ITEMS: Record<string, ItemDefinition> = {
  lightBoost: { id: 'lightBoost', name: '燈油', texture: 'pickupLight', effectType: 'lightRadius', value: 42, sharedHealthDrainReduction: DEFAULT_BALANCE.pickups.sharedHealthDrainReduction, effectDuration: DEFAULT_BALANCE.pickups.sharedEffectDuration },
  speedBoost: { id: 'speedBoost', name: '疾風', texture: 'pickupSpeed', effectType: 'moveSpeed', value: 48, sharedHealthDrainReduction: DEFAULT_BALANCE.pickups.sharedHealthDrainReduction, effectDuration: DEFAULT_BALANCE.pickups.sharedEffectDuration },
  damageBoost: { id: 'damageBoost', name: '烈光', texture: 'pickupDamage', effectType: 'lightDamage', value: 10, sharedHealthDrainReduction: DEFAULT_BALANCE.pickups.sharedHealthDrainReduction, effectDuration: DEFAULT_BALANCE.pickups.sharedEffectDuration },
  defenseBoost: { id: 'defenseBoost', name: '守護', texture: 'pickupDefense', effectType: 'damageReduction', value: 0.12, sharedHealthDrainReduction: DEFAULT_BALANCE.pickups.sharedHealthDrainReduction, effectDuration: DEFAULT_BALANCE.pickups.sharedEffectDuration },
};
