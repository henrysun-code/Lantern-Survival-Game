import { runtimeConfig } from '../config/runtime';
import type { Player } from '../entities/Player';

export class DecaySystem {
  ageYears(elapsedSeconds: number): number {
    return Math.floor(elapsedSeconds / runtimeConfig.config.balance.age.secondsPerYear);
  }

  decayMultiplier(ageYears: number): number {
    const age = runtimeConfig.config.balance.age;
    if (ageYears < age.slowStart) return 0;
    if (ageYears < age.mediumStart) return age.slowMultiplier;
    if (ageYears < age.fastStart) return age.mediumMultiplier;
    return age.fastMultiplier;
  }

  update(player: Player, deltaSeconds: number, ageYears: number): void {
    const b = runtimeConfig.config.balance;
    const multiplier = this.decayMultiplier(ageYears);
    player.moveSpeed = Math.max(b.player.moveSpeed.minimum, player.moveSpeed - b.player.moveSpeed.decayPerSecond * multiplier * deltaSeconds);
    player.lightRadius = Math.max(b.lantern.radius.minimum, player.lightRadius - b.lantern.radius.decayPerSecond * multiplier * deltaSeconds);
    player.lightDamage = Math.max(b.lightDamage.dps.minimum, player.lightDamage - b.lightDamage.dps.decayPerSecond * multiplier * deltaSeconds);
    player.damageReduction = Math.max(b.damageReduction.ratio.minimum, player.damageReduction - b.damageReduction.ratio.decayPerSecond * multiplier * deltaSeconds);
  }

  currentHealthDrain(ageYears: number): number {
    const config = runtimeConfig.config.balance.healthDrain;
    const multiplier = this.decayMultiplier(ageYears);
    const rawFlow = config.curve === 'quadratic'
      ? config.startPerSecond + ageYears * ageYears * config.quadraticFactor
      : config.startPerSecond + ageYears * config.increasePerSecond;
    // 40 歲前照正常年齡曲線變化；達到衰退階段後再放大扣血速度。
    return multiplier === 0 ? rawFlow : rawFlow * multiplier * (config.ageMultiplierScale ?? 1);
  }
}
