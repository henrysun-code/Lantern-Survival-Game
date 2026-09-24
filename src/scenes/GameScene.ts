import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { Projectile } from '../entities/Projectile';
import { runtimeConfig } from '../config/runtime';
import { SpawnSystem } from '../systems/SpawnSystem';
import { DecaySystem } from '../systems/DecaySystem';
import { DamageSystem } from '../systems/DamageSystem';
import { calculateScore, GameHUD } from '../ui/GameHUD';
import { GameOverCard } from '../ui/GameOverCard';
import { DebugPanel } from '../ui/DebugPanel';
import { TouchControls } from '../ui/TouchControls';

const LANTERN_GLOW_TEXTURE = 'lanternGlowGradient';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private spawnSystem!: SpawnSystem;
  private decaySystem = new DecaySystem();
  private damageSystem = new DamageSystem();
  private hud!: GameHUD;
  private panel!: DebugPanel;
  private touchControls!: TouchControls;
  private backdrop?: Phaser.GameObjects.Image;
  private backdropFallback?: Phaser.GameObjects.Graphics;
  private resultCard?: GameOverCard;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private light!: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private kills = 0;
  private gameOver = false;
  private debugVisible = false;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private unsubscribeConfig?: () => void;
  private toggleDebug = (): void => { this.debugVisible = !this.debugVisible; };

  constructor() { super('GameScene'); }

  create(): void {
    const b = runtimeConfig.config.balance;
    // scene.restart() 會重用同一個 Scene instance，這些執行期狀態必須明確歸零。
    this.elapsed = 0;
    this.kills = 0;
    this.gameOver = false;
    this.debugVisible = false;
    this.resultCard?.destroy();
    this.resultCard = undefined;
    this.viewportWidth = this.scale.width;
    this.viewportHeight = this.scale.height;
    this.physics.resume();
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.createBackdrop();
    this.createLanternGlowTexture();
    this.debugGraphics = this.add.graphics().setDepth(50);
    this.player = new Player(this, this.scale.width / 2, this.scale.height / 2);
    this.light = this.textures.exists(LANTERN_GLOW_TEXTURE)
      ? this.add.image(this.player.x, this.player.y, LANTERN_GLOW_TEXTURE)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.82)
      : this.add.graphics().setDepth(1);
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.pickups = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group({ runChildUpdate: false });
    this.spawnSystem = new SpawnSystem(this, this.enemies, this.pickups);
    this.hud = new GameHUD();
    this.panel = new DebugPanel(() => this.scene.restart());
    this.touchControls = new TouchControls(() => this.panel.toggle());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.input.keyboard!.on('keydown-F3', this.toggleDebug);
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.onEnemyContact(enemy as Enemy));
    this.physics.add.overlap(this.player, this.projectiles, (_, projectile) => this.onProjectileHit(projectile as Projectile));
    this.unsubscribeConfig = runtimeConfig.subscribe((path, value) => {
      if (path === '*' || path === 'balance.player.moveSpeed.start') this.player.moveSpeed = runtimeConfig.config.balance.player.moveSpeed.start;
      if (path === '*' || path === 'balance.lantern.radius.start') this.player.lightRadius = runtimeConfig.config.balance.lantern.radius.start;
      if (path === '*' || path === 'balance.lightDamage.dps.start') this.player.lightDamage = runtimeConfig.config.balance.lightDamage.dps.start;
      if (path === '*' || path === 'balance.damageReduction.ratio.start') this.player.damageReduction = runtimeConfig.config.balance.damageReduction.ratio.start;
      void value;
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.panel.destroy();
      this.hud.destroy();
      this.touchControls.destroy();
      this.resultCard?.destroy();
      this.resultCard = undefined;
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.keyboard!.off('keydown-F3', this.toggleDebug);
      this.unsubscribeConfig?.();
    });
    void b;
  }

  update(_time: number, deltaMs: number): void {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) this.scene.restart();
      return;
    }
    // 物理碰撞傷害可能在上一個 frame 的 update 之後發生；先判死，避免回血復活。
    if (this.player.hp <= 0) {
      this.endGame();
      return;
    }
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsed += dt;
    const age = this.decaySystem.effectiveAgeYears(this.elapsed, this.player.ageReductionYears);
    const ageDecayMultiplier = this.decaySystem.decayMultiplier(age);
    this.player.updateMovement(this.touchControls.getDirection());
    this.decaySystem.update(this.player, dt, age);
    this.spawnSystem.update(this.elapsed, age);
    this.updateEnemies(dt);
    this.updateProjectiles();
    this.updatePickups();
    this.player.updateColor(this.elapsed, dt, ageDecayMultiplier);
    this.kills += this.damageSystem.updateLightDamage(this.player, this.enemies, dt);
    this.player.updateStatusEffects(dt, this.elapsed);
    // 持續傷害也可能在本次 update 內致死，不能讓下面的生命回復把 HP 加回來。
    if (this.player.hp <= 0) {
      this.endGame();
      return;
    }
    const drain = this.decaySystem.currentHealthDrain(age) * this.player.getDrainMultiplier(this.elapsed);
    this.player.hp = Phaser.Math.Clamp(this.player.hp - drain * dt, 0, runtimeConfig.config.balance.player.maxHp);
    this.drawLight();
    this.drawDebug();
    this.updateHUD();
    if (this.player.hp <= 0) this.endGame();
  }

  private updateHUD(): void {
    this.hud.update({
      elapsed: this.elapsed,
      livedAge: this.decaySystem.ageYears(this.elapsed),
      difficultyAge: this.decaySystem.effectiveAgeYears(this.elapsed, this.player.ageReductionYears),
      kills: this.kills,
    });
  }

  private updateEnemies(deltaSeconds: number): void {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      enemy.updateBehavior(this.player, deltaSeconds);
      const config = enemy.definition;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (config.behavior === 'ranged' && distance <= config.range && this.elapsed - enemy.lastAttackAt >= config.attackInterval) {
        enemy.lastAttackAt = this.elapsed;
        this.fireProjectile(enemy);
      }
    });
  }

  private fireProjectile(enemy: Enemy): void {
    const config = enemy.definition;
    enemy.playAttackAnimation();
    const projectile = new Projectile(this, enemy.x, enemy.y);
    projectile.damage = config.projectileDamage;
    projectile.bornAt = this.elapsed;
    projectile.sourceX = enemy.x;
    projectile.sourceY = enemy.y;
    this.projectiles.add(projectile);
    // 先加入 Arcade Group，再設定速度。Group 在接管物件時可能重新啟用 body，
    // 若順序相反會把剛設定的 velocity 清成 0，造成投射物停在出生點。
    this.physics.moveToObject(projectile, this.player, config.projectileSpeed);
  }

  private updateProjectiles(): void {
    const lifetime = runtimeConfig.config.balance.projectile.lifetime;
    this.projectiles.getChildren().forEach((child) => {
      const projectile = child as Projectile;
      if (this.elapsed - projectile.bornAt > lifetime || projectile.x < -30 || projectile.y < -30 || projectile.x > this.scale.width + 30 || projectile.y > this.scale.height + 30) projectile.destroy();
    });
  }

  private updatePickups(): void {
    const lifetime = runtimeConfig.config.balance.pickups.lifetime;
    this.pickups.getChildren().forEach((child) => {
      const pickup = child as Pickup;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y) <= runtimeConfig.config.balance.pickups.pickupRange) this.onPickup(pickup);
      else if (this.elapsed - pickup.bornAt > lifetime) pickup.destroy();
    });
  }

  private onEnemyContact(enemy: Enemy): void {
    if (!enemy.active) return;
    if (!enemy.canContactAttack(this.elapsed)) return;
    const damage = this.damageSystem.mitigatedDamage(this.player, enemy.x, enemy.y, enemy.definition.contactDamage);
    if (this.player.takeDamage(damage, this.elapsed)) {
      enemy.lastAttackAt = this.elapsed;
      enemy.playAttackAnimation();
      enemy.recordContactHit();
      const definition = enemy.definition;
      if (definition.statusEffect && definition.statusDamagePerSecond && definition.statusDuration) {
        this.player.applyStatusEffect(definition.statusEffect, definition.statusDamagePerSecond, definition.statusDuration);
      }
    }
  }

  private onProjectileHit(projectile: Projectile): void {
    if (!projectile.active) return;
    const damage = this.damageSystem.mitigatedDamage(this.player, projectile.sourceX, projectile.sourceY, projectile.damage);
    if (this.player.takeDamage(damage, this.elapsed)) projectile.destroy();
  }

  private onPickup(pickup: Pickup): void {
    if (!pickup.active) return;
    const item = pickup.definition;
    this.player.applyPickup(
      item.effectType,
      item.value,
      item.sharedHealthDrainReduction,
      item.effectDuration,
      this.elapsed,
      item.restoresColor,
      item.ageReductionYears,
      item.clearsStatusEffects,
    );
    const effectMessage = item.effectType === 'ageReduction'
      ? `年齡 -${Math.floor(item.value)} 歲`
      : item.effectType === 'healthDrainReduction'
        ? `年齡扣血降低 ${Math.round((1 - item.sharedHealthDrainReduction) * 100)}%`
        : item.effectType === 'lightRadius'
          ? `光圈 +${item.value}`
          : item.effectType === 'moveSpeed'
            ? `移速 +${item.value}`
            : `+${item.value}${item.restoresColor ? ' · 回色' : ''}`;
    const additionalEffects = [
      item.ageReductionYears ? `年輕 ${Math.floor(item.ageReductionYears)} 歲` : '',
      item.clearsStatusEffects ? '解除持續傷害' : '',
    ].filter(Boolean);
    const message = `${item.name} · ${[effectMessage, ...additionalEffects].join(' · ')}`;
    this.showFloatingText(pickup.x, pickup.y, message);
    pickup.destroy();
  }

  private drawLight(): void {
    const diameter = this.player.lightRadius * 2;
    if (this.light instanceof Phaser.GameObjects.Image) {
      this.light
        .setPosition(this.player.x, this.player.y)
        .setDisplaySize(diameter, diameter);
      return;
    }
    this.light.clear();
    this.light.fillStyle(0xffb957, 0.06).fillCircle(this.player.x, this.player.y, this.player.lightRadius);
    this.light.fillStyle(0xffd27f, 0.06).fillCircle(this.player.x, this.player.y, this.player.lightRadius * 0.68);
    this.light.fillStyle(0xffebbc, 0.05).fillCircle(this.player.x, this.player.y, this.player.lightRadius * 0.32);
  }

  private drawDebug(): void {
    this.debugGraphics.clear();
    if (!this.debugVisible) return;
    this.debugGraphics.lineStyle(1, 0x4fffd2, 0.8).strokeCircle(this.player.x, this.player.y, runtimeConfig.config.balance.player.collisionRadius);
    this.debugGraphics.lineStyle(1, 0xffdf66, 0.8).strokeCircle(this.player.x, this.player.y, this.player.lightRadius);
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      this.debugGraphics.lineStyle(1, 0xff5577, 0.75).strokeCircle(enemy.x, enemy.y, Math.min(enemy.width, enemy.height) * 0.38);
      if (enemy.definition.behavior === 'ranged') this.debugGraphics.lineStyle(1, 0xba7dff, 0.25).strokeCircle(enemy.x, enemy.y, enemy.definition.range);
    });
  }

  private createBackdrop(): void {
    const background = ASSETS.background;
    if (background && this.textures.exists(background.texture)) {
      this.backdrop = this.add.image(0, 0, background.texture).setDepth(background.depth ?? -1);
    } else {
      this.backdropFallback = this.add.graphics().setDepth(0);
    }
    this.drawBackdrop();
  }

  private createLanternGlowTexture(): void {
    if (this.textures.exists(LANTERN_GLOW_TEXTURE)) return;
    const size = 256;
    const center = size / 2;
    const texture = this.textures.createCanvas(LANTERN_GLOW_TEXTURE, size, size);
    if (!texture) return;
    const context = texture.getContext();
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 246, 202, 0.82)');
    gradient.addColorStop(0.12, 'rgba(255, 228, 151, 0.62)');
    gradient.addColorStop(0.34, 'rgba(255, 199, 105, 0.29)');
    gradient.addColorStop(0.68, 'rgba(255, 174, 87, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 162, 77, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    texture.refresh();
  }

  private drawBackdrop(): void {
    if (this.backdrop) {
      const source = this.textures.get(ASSETS.background.texture).getSourceImage();
      const scale = Math.max(this.scale.width / source.width, this.scale.height / source.height);
      this.backdrop
        .setPosition(this.scale.width / 2, this.scale.height / 2)
        .setDisplaySize(source.width * scale, source.height * scale);
      return;
    }
    if (!this.backdropFallback) return;
    this.backdropFallback.clear();
    this.backdropFallback.fillStyle(0x0b0f18, 1).fillRect(0, 0, this.scale.width, this.scale.height);
    this.backdropFallback.lineStyle(1, 0x1b2535, 0.45);
    for (let x = 0; x <= this.scale.width; x += 64) this.backdropFallback.lineBetween(x, 0, x, this.scale.height);
    for (let y = 0; y <= this.scale.height; y += 64) this.backdropFallback.lineBetween(0, y, this.scale.width, y);
  }

  private handleResize(): void {
    const shiftX = (this.scale.width - this.viewportWidth) / 2;
    const shiftY = (this.scale.height - this.viewportHeight) / 2;
    this.viewportWidth = this.scale.width;
    this.viewportHeight = this.scale.height;
    this.player.setPosition(this.player.x + shiftX, this.player.y + shiftY);
    for (const group of [this.enemies, this.pickups, this.projectiles]) {
      group.getChildren().forEach((child) => {
        const sprite = child as Phaser.GameObjects.Sprite;
        sprite.setPosition(sprite.x + shiftX, sprite.y + shiftY);
      });
    }
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.player.setPosition(
      Phaser.Math.Clamp(this.player.x, 32, Math.max(32, this.scale.width - 32)),
      Phaser.Math.Clamp(this.player.y, 32, Math.max(32, this.scale.height - 32)),
    );
    this.drawBackdrop();
  }

  private showFloatingText(x: number, y: number, message: string): void {
    const text = this.add.text(x, y, message, { fontSize: '16px', color: '#fff3b0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: text, y: y - 45, alpha: 0, duration: 900, onComplete: () => text.destroy() });
  }

  private endGame(): void {
    this.updateHUD();
    this.gameOver = true;
    this.player.playDeathAnimation();
    this.player.setVelocity(0).setTint(0x777777);
    this.physics.pause();
    this.hud.setVisible(false);
    this.resultCard = new GameOverCard({
      livedAge: this.decaySystem.ageYears(this.elapsed),
      difficultyAge: this.decaySystem.effectiveAgeYears(this.elapsed, this.player.ageReductionYears),
      kills: this.kills,
      score: calculateScore(this.elapsed, this.kills),
    }, () => this.scene.restart());
  }
}
