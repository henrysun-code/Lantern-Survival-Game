import Phaser from 'phaser';
import { runtimeConfig } from '../config/runtime';
import type { ItemEffect } from '../config/types';
import { applyVisual, playConfiguredAnimation, resolveTexture } from '../utils/visuals';

type ActiveStatusEffect = { damagePerSecond: number; remainingSeconds: number; timeUntilNextTick: number };

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = 100;
  moveSpeed = 0;
  lightRadius = 0;
  lightDamage = 0;
  damageReduction = 0;
  ageReductionYears = 0;
  drainReductionUntil = 0;
  drainReductionMultiplier = 1;
  colorBrightness = 1;
  colorRestoreUntil = 0;
  private lastDamageAt = -Infinity;
  private animationState = '';
  private facing: 'down' | 'up' | 'side' = 'down';
  private readonly maxHp: number;
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private readonly statusLabel: Phaser.GameObjects.Text;
  private readonly outline: Phaser.GameObjects.Sprite;
  private readonly statusEffects = new Map<string, ActiveStatusEffect>();
  private statusFlashRemaining = 0;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, resolveTexture(scene, 'player'));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    applyVisual(this, 'player');
    this.outline = scene.add.sprite(x, y, resolveTexture(scene, 'player'));
    applyVisual(this.outline, 'player');
    this.outline.setScale(this.scaleX * 1.12, this.scaleY * 1.12);
    this.outline.setDepth(this.depth - 0.1).setTintFill(0x82cfff).setAlpha(0.2);
    const b = runtimeConfig.config.balance;
    this.hp = b.player.maxHp;
    this.maxHp = b.player.maxHp;
    this.healthBar = scene.add.graphics().setDepth(40);
    this.statusLabel = scene.add.text(x, y, '', {
      fontFamily: 'ui-monospace, Consolas, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ff727c',
      backgroundColor: '#270c19dd',
      padding: { x: 3, y: 1 },
      shadow: { color: '#130811', fill: true, offsetX: 1, offsetY: 1 },
    }).setOrigin(0.5, 1).setDepth(40).setVisible(false);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.healthBar.destroy();
      this.statusLabel.destroy();
      this.outline.destroy();
    });
    this.moveSpeed = b.player.moveSpeed.start;
    this.lightRadius = b.lantern.radius.start;
    this.lightDamage = b.lightDamage.dps.start;
    this.damageReduction = b.damageReduction.ratio.start;
    this.setCircle(b.player.collisionRadius, this.width / 2 - b.player.collisionRadius, this.height / 2 - b.player.collisionRadius);
    this.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.drawHealthBar();
  }

  private drawHealthBar(): void {
    const width = 48;
    const height = 6;
    const x = this.x - width / 2;
    const y = this.y - this.displayHeight * 0.5 - 14;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.healthBar.clear();
    this.healthBar.fillStyle(0x160d16, 0.9).fillRoundedRect(x - 1, y - 1, width + 2, height + 2, 2);
    this.healthBar.fillStyle(ratio > 0.5 ? 0x57d66f : ratio > 0.25 ? 0xffc857 : 0xff5c70, 1).fillRect(x, y, width * ratio, height);
    const bite = this.statusEffects.get('mosquitoBite');
    const remaining = bite?.remainingSeconds ?? Math.max(0, ...[...this.statusEffects.values()].map((effect) => effect.remainingSeconds));
    const statusText = this.statusEffects.size > 0
      ? `${bite ? '蚊蟲叮咬' : '持續傷害'} ${Math.ceil(remaining)}s`
      : '';
    this.statusLabel.setText(statusText).setPosition(this.x, y - 2).setVisible(Boolean(statusText));
  }

  updateMovement(touchDirection = { x: 0, y: 0 }): void {
    const keyboardX = Number(this.cursors.right.isDown || this.wasd.D.isDown) - Number(this.cursors.left.isDown || this.wasd.A.isDown);
    const keyboardY = Number(this.cursors.down.isDown || this.wasd.S.isDown) - Number(this.cursors.up.isDown || this.wasd.W.isDown);
    const x = keyboardX || keyboardY ? keyboardX : touchDirection.x;
    const y = keyboardX || keyboardY ? keyboardY : touchDirection.y;
    const direction = new Phaser.Math.Vector2(x, y).normalize();
    this.setVelocity(direction.x * this.moveSpeed, direction.y * this.moveSpeed);
    if (this.hp <= 0) {
      this.playDeathAnimation();
      return;
    }
    if (this.anims.isPlaying && this.animationState.startsWith('hurt')) return;
    if (!direction.lengthSq()) {
      if (this.facing === 'down') {
        this.animationState = playConfiguredAnimation(this, 'player', 'idleDown', this.animationState);
        this.setFlipX(false);
      } else if (this.animationState !== 'idleUp' && this.animationState !== 'idleSide') {
        this.anims.stop();
        this.animationState = this.facing === 'up' ? 'idleUp' : 'idleSide';
      }
    } else if (Math.abs(y) > Math.abs(x)) {
      this.facing = y < 0 ? 'up' : 'down';
      this.animationState = playConfiguredAnimation(this, 'player', y < 0 ? 'walkUp' : 'walkDown', this.animationState);
      this.setFlipX(false);
    } else {
      this.facing = 'side';
      this.animationState = playConfiguredAnimation(this, 'player', 'walkSide', this.animationState);
      this.setFlipX(x < 0);
    }
  }

  takeDamage(amount: number, nowSeconds: number): boolean {
    const invulnerability = runtimeConfig.config.balance.player.invulnerabilitySeconds;
    if (nowSeconds - this.lastDamageAt < invulnerability || this.hp <= 0) return false;
    this.lastDamageAt = nowSeconds;
    this.hp = Math.max(0, this.hp - amount);
    this.updateColorTint(nowSeconds);
    if (this.hp <= 0) this.playDeathAnimation();
    else {
      const state = this.facing === 'up' ? 'hurtUp' : this.facing === 'side' ? 'hurtSide' : 'hurt';
      this.animationState = playConfiguredAnimation(this, 'player', state, this.animationState);
    }
    return true;
  }

  playDeathAnimation(): void {
    this.outline.setVisible(false);
    const state = this.facing === 'up' ? 'deathUp' : this.facing === 'side' ? 'deathSide' : 'death';
    this.animationState = playConfiguredAnimation(this, 'player', state, this.animationState);
  }

  applyPickup(
    effect: ItemEffect,
    value: number,
    reduction: number,
    duration: number,
    nowSeconds: number,
    restoresColor = false,
    ageReductionYears = 0,
    clearsStatusEffects = false,
  ): void {
    if (effect === 'ageReduction') {
      this.ageReductionYears += Math.max(0, Math.floor(value));
    } else {
      if (effect === 'lightRadius') this.lightRadius = Math.min(runtimeConfig.config.balance.lantern.radius.maximum, this.lightRadius + value);
      if (effect === 'moveSpeed') this.moveSpeed = Math.min(runtimeConfig.config.balance.player.moveSpeed.maximum, this.moveSpeed + value);
      if (effect === 'lightDamage') this.lightDamage = Math.min(runtimeConfig.config.balance.lightDamage.dps.maximum, this.lightDamage + value);
      if (effect === 'damageReduction') this.damageReduction = Math.min(runtimeConfig.config.balance.damageReduction.ratio.maximum, this.damageReduction + value);
      this.drainReductionMultiplier = Math.min(this.drainReductionMultiplier, reduction);
      this.drainReductionUntil = Math.max(this.drainReductionUntil, nowSeconds + duration);
      if (restoresColor) this.colorRestoreUntil = nowSeconds + duration;
    }
    this.ageReductionYears += Math.max(0, Math.floor(ageReductionYears));
    if (clearsStatusEffects) this.clearStatusEffects();
  }

  updateColor(nowSeconds: number, deltaSeconds: number, decayMultiplier = 1): void {
    const config = runtimeConfig.config.balance.player.color;
    const minimum = Phaser.Math.Clamp(config.minimumBrightness, 0, 1);
    const restoringSeconds = Math.max(0, Math.min(deltaSeconds, this.colorRestoreUntil - (nowSeconds - deltaSeconds)));
    const darkeningSeconds = (deltaSeconds - restoringSeconds) * decayMultiplier;
    const restoredBrightness = Math.min(1, this.colorBrightness + restoringSeconds * config.restorePerSecond);
    this.colorBrightness = Phaser.Math.Clamp(
      restoredBrightness - darkeningSeconds * config.darkenPerSecond,
      minimum,
      1,
    );
    this.updateColorTint(nowSeconds);
    this.syncOutline();
  }

  private syncOutline(): void {
    if (this.hp <= 0) return;
    if (this.outline.frame.name !== this.frame.name) this.outline.setFrame(this.frame.name);
    this.outline.setPosition(this.x, this.y);
    this.outline.setFlipX(this.flipX);
    this.outline.setFlipY(this.flipY);
    this.outline.setRotation(this.rotation);
    this.outline.setTintFill(this.statusFlashRemaining > 0 ? 0xff3348 : 0x82cfff);
    this.outline.setAlpha(this.statusFlashRemaining > 0 ? 0.9 : 0.2 + (1 - this.colorBrightness) * 0.7);
  }

  getColorRestoreRemaining(nowSeconds: number): number {
    return Math.max(0, this.colorRestoreUntil - nowSeconds);
  }

  applyStatusEffect(id: string, damagePerSecond: number, durationSeconds: number): void {
    if (!id || damagePerSecond <= 0 || durationSeconds <= 0) return;
    const current = this.statusEffects.get(id);
    this.statusEffects.set(id, {
      damagePerSecond: Math.max(current?.damagePerSecond ?? 0, damagePerSecond),
      remainingSeconds: Math.max(current?.remainingSeconds ?? 0, durationSeconds),
      timeUntilNextTick: current?.timeUntilNextTick ?? 1,
    });
  }

  updateStatusEffects(deltaSeconds: number, nowSeconds: number): void {
    this.statusFlashRemaining = Math.max(0, this.statusFlashRemaining - deltaSeconds);
    if (this.statusEffects.size === 0 || this.hp <= 0) {
      this.syncOutline();
      return;
    }
    let damage = 0;
    this.statusEffects.forEach((effect, id) => {
      const activeSeconds = Math.min(deltaSeconds, effect.remainingSeconds);
      let secondsUntilStepEnds = activeSeconds;
      while (effect.timeUntilNextTick <= secondsUntilStepEnds + 1e-9) {
        damage += effect.damagePerSecond;
        this.statusFlashRemaining = 0.12;
        secondsUntilStepEnds -= effect.timeUntilNextTick;
        effect.timeUntilNextTick = 1;
      }
      effect.timeUntilNextTick -= secondsUntilStepEnds;
      effect.remainingSeconds -= activeSeconds;
      if (effect.remainingSeconds <= 1e-9) this.statusEffects.delete(id);
    });
    if (damage > 0) {
      this.hp = Math.max(0, this.hp - damage);
      this.updateColorTint(nowSeconds);
      if (this.hp <= 0) this.playDeathAnimation();
    }
    this.syncOutline();
  }

  getActiveStatusEffects(): string[] {
    return [...this.statusEffects.keys()];
  }

  clearStatusEffects(): void {
    this.statusEffects.clear();
    this.statusFlashRemaining = 0;
    this.syncOutline();
  }

  private updateColorTint(nowSeconds: number): void {
    if (this.hp <= 0) return;
    const channel = Math.round(this.colorBrightness * 255);
    const hurt = nowSeconds - this.lastDamageAt < 0.12;
    const otherChannel = hurt ? Math.round(channel * 0.55) : channel;
    this.setTint(Phaser.Display.Color.GetColor(channel, otherChannel, otherChannel));
  }

  getDrainMultiplier(nowSeconds: number): number {
    if (nowSeconds <= this.drainReductionUntil) return this.drainReductionMultiplier;
    this.drainReductionMultiplier = 1;
    return 1;
  }
}
