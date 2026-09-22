import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export class DamageSystem {
  updateLightDamage(player: Player, enemies: Phaser.GameObjects.Group, deltaSeconds: number): number {
    let kills = 0;
    enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (distance <= player.lightRadius && enemy.hurt(player.lightDamage * deltaSeconds)) kills += 1;
    });
    return kills;
  }

  mitigatedDamage(player: Player, sourceX: number, sourceY: number, rawDamage: number): number {
    const sourceInLight = Phaser.Math.Distance.Between(player.x, player.y, sourceX, sourceY) <= player.lightRadius;
    return rawDamage * (sourceInLight ? 1 - player.damageReduction : 1);
  }
}
