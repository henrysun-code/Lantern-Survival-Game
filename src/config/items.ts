import { DEFAULT_BALANCE } from './balance';
import type { ItemDefinition } from './types';

/** value 是道具本身的補充值；healthDrainReduction 使用生命流失倍率與持續時間欄位。 */
export const ITEMS: Record<string, ItemDefinition> = {
  nne: { id: 'nne', name: 'NNE', texture: 'pickupNNE', effectType: 'lightRadius', value: 42, sharedHealthDrainReduction: 1, effectDuration: 0, ageReductionYears: 1 },
  yss: { id: 'yss', name: 'YSS', texture: 'pickupYSS', effectType: 'moveSpeed', value: 48, sharedHealthDrainReduction: 1, effectDuration: 0, ageReductionYears: 1 },
  bbb: { id: 'bbb', name: 'BBB', texture: 'pickupBBB', effectType: 'lightRadius', value: 42, sharedHealthDrainReduction: 1, effectDuration: 0, ageReductionYears: 1 },
  ppa: { id: 'ppa', name: 'PPA', texture: 'pickupPPA', effectType: 'healthDrainReduction', value: 0, sharedHealthDrainReduction: DEFAULT_BALANCE.pickups.sharedHealthDrainReduction, effectDuration: DEFAULT_BALANCE.pickups.sharedEffectDuration, clearsStatusEffects: true },
};
