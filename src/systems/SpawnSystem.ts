import Phaser from 'phaser';
import { runtimeConfig } from '../config/runtime';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import type { ItemDefinition } from '../config/types';

export class SpawnSystem {
  private nextEnemyAt = 0;
  private nextPickupAt = 0;

  constructor(private scene: Phaser.Scene, private enemies: Phaser.Physics.Arcade.Group, private pickups: Phaser.Physics.Arcade.Group) {}

  update(nowSeconds: number, currentAgeYears = Math.floor(nowSeconds / runtimeConfig.config.balance.age.secondsPerYear + 1e-9)): void {
    const balance = runtimeConfig.config.balance;
    if (nowSeconds >= this.nextEnemyAt) {
      const baseInterval = balance.enemies.spawnInterval - nowSeconds * balance.enemies.spawnIntervalDecayPerSecond;
      const earlyAgeMultiplier = currentAgeYears < balance.age.slowStart
        ? (balance.enemies.earlyAgeSpawnIntervalMultiplier ?? 1)
        : 1;
      const interval = Math.max(balance.enemies.minimumSpawnInterval, baseInterval * earlyAgeMultiplier);
      const count = Math.min(balance.enemies.countMaximum, balance.enemies.countStart + Math.floor(nowSeconds / balance.enemies.countIncreaseEverySeconds) * (balance.enemies.countIncreaseAmount ?? 1));
      for (let index = 0; index < count; index += 1) this.spawnEnemy();
      this.nextEnemyAt = nowSeconds + interval;
    }
    if (nowSeconds >= this.nextPickupAt) {
      this.spawnPickup(nowSeconds, currentAgeYears);
      this.nextPickupAt = nowSeconds + balance.pickups.spawnInterval;
    }
  }

  private spawnEnemy(): void {
    const entries = Object.values(runtimeConfig.config.enemies);
    const total = entries.reduce((sum: number, enemy: any) => sum + enemy.spawnWeight, 0);
    let roll = Math.random() * total;
    const chosen = entries.find((enemy: any) => (roll -= enemy.spawnWeight) <= 0) ?? entries[0];
    const { width, height } = this.scene.scale;
    const edge = Phaser.Math.Between(0, 3);
    const margin = 35;
    const x = edge === 0 ? -margin : edge === 1 ? width + margin : Phaser.Math.Between(0, width);
    const y = edge === 2 ? -margin : edge === 3 ? height + margin : Phaser.Math.Between(0, height);
    this.enemies.add(new Enemy(this.scene, x, y, chosen.id));
  }

  private spawnPickup(nowSeconds: number, currentAgeYears: number): void {
    const eligibleItems = Object.values(runtimeConfig.config.items as Record<string, ItemDefinition>)
      .filter((item) => currentAgeYears >= (item.minimumAge ?? 0));
    if (eligibleItems.length === 0) return;
    const item = Phaser.Utils.Array.GetRandom(eligibleItems);
    const x = Phaser.Math.Between(70, this.scene.scale.width - 70);
    const y = Phaser.Math.Between(70, this.scene.scale.height - 70);
    const pickup = new Pickup(this.scene, x, y, item.id);
    pickup.bornAt = nowSeconds;
    this.pickups.add(pickup);
  }
}
