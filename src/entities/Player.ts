import Phaser from 'phaser';
import { runtimeConfig } from '../config/runtime';
import type { ItemEffect } from '../config/types';
import { applyVisual, playConfiguredAnimation, resolveTexture } from '../utils/visuals';

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = 100;
  moveSpeed = 0;
  lightRadius = 0;
  lightDamage = 0;
  damageReduction = 0;
  drainReductionUntil = 0;
  drainReductionMultiplier = 1;
  private lastDamageAt = -Infinity;
  private animationState = '';
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, resolveTexture(scene, 'player'));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    applyVisual(this, 'player');
    const b = runtimeConfig.config.balance;
    this.hp = b.player.maxHp;
    this.moveSpeed = b.player.moveSpeed.start;
    this.lightRadius = b.lantern.radius.start;
    this.lightDamage = b.lightDamage.dps.start;
    this.damageReduction = b.damageReduction.ratio.start;
    this.setCircle(b.player.collisionRadius, this.width / 2 - b.player.collisionRadius, this.height / 2 - b.player.collisionRadius);
    this.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  updateMovement(): void {
    const x = Number(this.cursors.right.isDown || this.wasd.D.isDown) - Number(this.cursors.left.isDown || this.wasd.A.isDown);
    const y = Number(this.cursors.down.isDown || this.wasd.S.isDown) - Number(this.cursors.up.isDown || this.wasd.W.isDown);
    const direction = new Phaser.Math.Vector2(x, y).normalize();
    this.setVelocity(direction.x * this.moveSpeed, direction.y * this.moveSpeed);
    this.animationState = playConfiguredAnimation(this, 'player', direction.lengthSq() ? 'walk' : 'idle', this.animationState);
    if (x !== 0) this.setFlipX(x < 0);
  }

  takeDamage(amount: number, nowSeconds: number): boolean {
    const invulnerability = runtimeConfig.config.balance.player.invulnerabilitySeconds;
    if (nowSeconds - this.lastDamageAt < invulnerability || this.hp <= 0) return false;
    this.lastDamageAt = nowSeconds;
    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xff8b8b);
    this.scene.time.delayedCall(120, () => this.active && this.clearTint());
    this.animationState = playConfiguredAnimation(this, 'player', this.hp <= 0 ? 'death' : 'hurt', this.animationState);
    return true;
  }

  applyPickup(effect: ItemEffect, value: number, reduction: number, duration: number, nowSeconds: number): void {
    if (effect === 'lightRadius') this.lightRadius += value;
    if (effect === 'moveSpeed') this.moveSpeed += value;
    if (effect === 'lightDamage') this.lightDamage += value;
    if (effect === 'damageReduction') this.damageReduction = Math.min(0.95, this.damageReduction + value);
    this.drainReductionMultiplier = Math.min(this.drainReductionMultiplier, reduction);
    this.drainReductionUntil = Math.max(this.drainReductionUntil, nowSeconds + duration);
  }

  getDrainMultiplier(nowSeconds: number): number {
    if (nowSeconds <= this.drainReductionUntil) return this.drainReductionMultiplier;
    this.drainReductionMultiplier = 1;
    return 1;
  }
}
