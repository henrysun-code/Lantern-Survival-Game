import Phaser from 'phaser';
import type { EnemyDefinition } from '../config/types';
import { runtimeConfig } from '../config/runtime';
import { applyVisual, playConfiguredAnimation, resolveTexture } from '../utils/visuals';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  lastAttackAt = -Infinity;
  private animationState = '';
  private readonly maxHp: number;
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private dashPhase: 'approach' | 'dash' | 'retreat' | 'cooldown' = 'approach';
  private dashPhaseRemaining = 0;
  private dashDirection = new Phaser.Math.Vector2();
  private dashHasHit = false;

  constructor(scene: Phaser.Scene, x: number, y: number, public readonly enemyId: string) {
    const config = runtimeConfig.config.enemies[enemyId] as EnemyDefinition;
    super(scene, x, y, resolveTexture(scene, config.texture));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    applyVisual(this, config.texture);
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.healthBar = scene.add.graphics().setDepth(40);
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.healthBar.destroy());
    this.setCircle(Math.min(this.width, this.height) * 0.38);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.drawHealthBar();
  }

  private drawHealthBar(): void {
    const width = 38;
    const height = 5;
    const x = this.x - width / 2;
    const y = this.y - this.displayHeight * 0.5 - 11;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.healthBar.setVisible(this.active && this.body?.enable !== false);
    this.healthBar.clear();
    if (!this.active || this.body?.enable === false) return;
    this.healthBar.fillStyle(0x160d16, 0.9).fillRoundedRect(x - 1, y - 1, width + 2, height + 2, 2);
    this.healthBar.fillStyle(ratio > 0.5 ? 0x57d66f : ratio > 0.25 ? 0xffc857 : 0xff5c70, 1).fillRect(x, y, width * ratio, height);
  }

  get definition(): EnemyDefinition { return runtimeConfig.config.enemies[this.enemyId]; }

  updateBehavior(player: Phaser.GameObjects.Sprite, deltaSeconds: number): void {
    const config = this.definition;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    if (config.behavior === 'dashRetreat') {
      this.updateDashRetreat(config, direction, distance, deltaSeconds);
      return;
    }
    let velocity = config.speed;
    if (config.behavior === 'ranged') {
      if (distance < config.preferredDistance * 0.72) velocity *= -1;
      else if (distance <= config.preferredDistance) velocity = 0;
    }
    this.setVelocity(direction.x * velocity, direction.y * velocity);
    this.animationState = playConfiguredAnimation(this, config.animations, velocity ? 'move' : 'idle', this.animationState);
    if (direction.x !== 0) this.setFlipX(direction.x < 0);
  }

  private updateDashRetreat(config: EnemyDefinition, direction: Phaser.Math.Vector2, distance: number, deltaSeconds: number): void {
    const triggerRange = config.triggerRange ?? 190;
    const dashSpeed = config.dashSpeed ?? config.speed * 3;
    const dashEndDistance = config.dashEndDistance ?? triggerRange + 160;
    const retreatSpeed = config.retreatSpeed ?? config.speed * 2;
    const retreatDuration = config.retreatDuration ?? 1.2;
    let velocity = config.speed;

    if (this.dashPhase === 'approach') {
      if (distance <= triggerRange) {
        this.dashPhase = 'dash';
        this.dashDirection.copy(direction);
        this.dashHasHit = false;
      }
      this.setVelocity(direction.x * velocity, direction.y * velocity);
    } else if (this.dashPhase === 'dash') {
      velocity = dashSpeed;
      this.setVelocity(this.dashDirection.x * velocity, this.dashDirection.y * velocity);
      // 沒撞到玩家就維持原本的衝刺方向，直到和玩家距離太遠，再回到追蹤。
      if (distance >= dashEndDistance) {
        this.dashPhase = 'approach';
        this.setVelocity(0, 0);
      }
    } else if (this.dashPhase === 'retreat') {
      this.dashPhaseRemaining -= deltaSeconds;
      velocity = retreatSpeed;
      this.setVelocity(-this.dashDirection.x * velocity, -this.dashDirection.y * velocity);
      if (this.dashPhaseRemaining <= 0) {
        this.dashPhase = 'cooldown';
        this.dashPhaseRemaining = config.attackInterval;
        this.setVelocity(0, 0);
      }
    } else {
      this.dashPhaseRemaining -= deltaSeconds;
      this.setVelocity(0, 0);
      if (this.dashPhaseRemaining <= 0) this.dashPhase = 'approach';
    }

    this.animationState = playConfiguredAnimation(this, config.animations, velocity ? 'move' : 'idle', this.animationState);
    const velocityX = this.body?.velocity.x ?? 0;
    if (velocityX !== 0) this.setFlipX(velocityX < 0);
  }

  private beginRetreat(duration: number): void {
    this.dashPhase = 'retreat';
    this.dashPhaseRemaining = duration;
  }

  canContactAttack(nowSeconds: number): boolean {
    const config = this.definition;
    if (config.behavior === 'dashRetreat') {
      return this.dashPhase === 'dash' && !this.dashHasHit;
    }
    return nowSeconds - this.lastAttackAt >= config.attackInterval;
  }

  recordContactHit(): void {
    if (this.definition.behavior !== 'dashRetreat' || this.dashPhase !== 'dash') return;
    this.dashHasHit = true;
    this.beginRetreat(this.definition.retreatDuration ?? 1.2);
  }

  hurt(damage: number): boolean {
    this.hp -= damage;
    if (this.hp > 0) {
      this.setTint(0xffffff);
      this.scene.time.delayedCall(55, () => this.active && this.clearTint());
      return false;
    }
    this.animationState = playConfiguredAnimation(this, this.definition.animations, 'death', this.animationState);
    this.healthBar.setVisible(false);
    this.disableBody(true, true);
    return true;
  }
}
