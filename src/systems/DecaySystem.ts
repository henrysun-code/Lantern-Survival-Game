import { runtimeConfig } from '../config/runtime';
import type { Player } from '../entities/Player';

export class DecaySystem {
  update(player: Player, deltaSeconds: number): void {
    const b = runtimeConfig.config.balance;
    player.moveSpeed = Math.max(b.player.moveSpeed.minimum, player.moveSpeed - b.player.moveSpeed.decayPerSecond * deltaSeconds);
    player.lightRadius = Math.max(b.lantern.radius.minimum, player.lightRadius - b.lantern.radius.decayPerSecond * deltaSeconds);
    player.lightDamage = Math.max(b.lightDamage.dps.minimum, player.lightDamage - b.lightDamage.dps.decayPerSecond * deltaSeconds);
    player.damageReduction = Math.max(b.damageReduction.ratio.minimum, player.damageReduction - b.damageReduction.ratio.decayPerSecond * deltaSeconds);
  }

  currentHealthDrain(elapsedSeconds: number): number {
    const config = runtimeConfig.config.balance.healthDrain;
    if (config.curve === 'quadratic') return config.startPerSecond + elapsedSeconds * elapsedSeconds * config.quadraticFactor;
    return config.startPerSecond + elapsedSeconds * config.increasePerSecond;
  }
}
