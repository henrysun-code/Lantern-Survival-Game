import Phaser from 'phaser';
import type { EnemyDefinition } from '../config/types';
import { runtimeConfig } from '../config/runtime';
import { applyVisual, playConfiguredAnimation, resolveTexture } from '../utils/visuals';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  lastAttackAt = -Infinity;
  private animationState = '';

  constructor(scene: Phaser.Scene, x: number, y: number, public readonly enemyId: string) {
    const config = runtimeConfig.config.enemies[enemyId] as EnemyDefinition;
    super(scene, x, y, resolveTexture(scene, config.texture));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    applyVisual(this, config.texture);
    this.hp = config.hp;
    this.setCircle(Math.min(this.width, this.height) * 0.38);
  }

  get definition(): EnemyDefinition { return runtimeConfig.config.enemies[this.enemyId]; }

  updateBehavior(player: Phaser.GameObjects.Sprite): void {
    const config = this.definition;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    let velocity = config.speed;
    if (config.behavior === 'ranged') {
      if (distance < config.preferredDistance * 0.72) velocity *= -1;
      else if (distance <= config.preferredDistance) velocity = 0;
    }
    this.setVelocity(direction.x * velocity, direction.y * velocity);
    this.animationState = playConfiguredAnimation(this, config.animations, velocity ? 'move' : 'idle', this.animationState);
    if (direction.x !== 0) this.setFlipX(direction.x < 0);
  }

  hurt(damage: number): boolean {
    this.hp -= damage;
    if (this.hp > 0) {
      this.setTint(0xffffff);
      this.scene.time.delayedCall(55, () => this.active && this.clearTint());
      return false;
    }
    this.animationState = playConfiguredAnimation(this, this.definition.animations, 'death', this.animationState);
    this.disableBody(true, true);
    return true;
  }
}
