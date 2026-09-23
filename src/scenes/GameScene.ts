import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { Projectile } from '../entities/Projectile';
import { runtimeConfig } from '../config/runtime';
import { SpawnSystem } from '../systems/SpawnSystem';
import { DecaySystem } from '../systems/DecaySystem';
import { DamageSystem } from '../systems/DamageSystem';
import { GameHUD } from '../ui/GameHUD';
import { DebugPanel } from '../ui/DebugPanel';
import { TouchControls } from '../ui/TouchControls';

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
  private backdrop!: Phaser.GameObjects.Graphics;
  private gameOverTitle?: Phaser.GameObjects.Text;
  private gameOverHint?: Phaser.GameObjects.Text;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private light!: Phaser.GameObjects.Graphics;
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
    this.gameOverTitle = undefined;
    this.gameOverHint = undefined;
    this.viewportWidth = this.scale.width;
    this.viewportHeight = this.scale.height;
    this.physics.resume();
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.createBackdrop();
    this.light = this.add.graphics().setDepth(1);
    this.debugGraphics = this.add.graphics().setDepth(50);
    this.player = new Player(this, this.scale.width / 2, this.scale.height / 2);
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.pickups = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group({ runChildUpdate: false });
    this.spawnSystem = new SpawnSystem(this, this.enemies, this.pickups);
    this.hud = new GameHUD(this);
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
      this.touchControls.destroy();
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
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsed += dt;
    const age = this.decaySystem.ageYears(this.elapsed);
    const ageDecayMultiplier = this.decaySystem.decayMultiplier(age);
    this.player.updateMovement(this.touchControls.getDirection());
    this.decaySystem.update(this.player, dt, age);
    this.spawnSystem.update(this.elapsed);
    this.updateEnemies(dt);
    this.updateProjectiles();
    this.updatePickups();
    this.player.updateColor(this.elapsed, dt, ageDecayMultiplier);
    this.kills += this.damageSystem.updateLightDamage(this.player, this.enemies, dt);
    this.player.updateStatusEffects(dt, this.elapsed);
    const drain = this.decaySystem.currentHealthDrain(age) * this.player.getDrainMultiplier(this.elapsed);
    this.player.hp = Phaser.Math.Clamp(this.player.hp - drain * dt, 0, runtimeConfig.config.balance.player.maxHp);
    this.drawLight();
    this.drawDebug();
    this.hud.update(this.player, { elapsed: this.elapsed, age, drain, kills: this.kills, enemies: this.enemies.countActive(), fps: this.game.loop.actualFps });
    if (this.player.hp <= 0) this.endGame();
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
      if (pickup.definition.texture !== 'pickupLight') pickup.rotation += 0.012;
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
    this.player.applyPickup(item.effectType, item.value, item.sharedHealthDrainReduction, item.effectDuration, this.elapsed, item.restoresColor);
    this.showFloatingText(pickup.x, pickup.y, `${item.name} +${item.value}${item.restoresColor ? ' · 回色' : ''}`);
    pickup.destroy();
  }

  private drawLight(): void {
    this.light.clear();
    this.light.fillStyle(0xffd76a, 0.075);
    this.light.fillCircle(this.player.x, this.player.y, this.player.lightRadius);
    this.light.lineStyle(2, 0xffdc7a, 0.32);
    this.light.strokeCircle(this.player.x, this.player.y, this.player.lightRadius);
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
    this.backdrop = this.add.graphics().setDepth(0);
    this.drawBackdrop();
  }

  private drawBackdrop(): void {
    this.backdrop.clear();
    this.backdrop.fillStyle(0x0b0f18, 1).fillRect(0, 0, this.scale.width, this.scale.height);
    this.backdrop.lineStyle(1, 0x1b2535, 0.45);
    for (let x = 0; x <= this.scale.width; x += 64) this.backdrop.lineBetween(x, 0, x, this.scale.height);
    for (let y = 0; y <= this.scale.height; y += 64) this.backdrop.lineBetween(0, y, this.scale.width, y);
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
    this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 28);
    this.gameOverHint?.setPosition(this.scale.width / 2, this.scale.height / 2 + 42);
    const compact = this.scale.width < 500 || this.scale.height < 520;
    this.gameOverTitle?.setFontSize(compact ? 36 : 54);
    this.gameOverHint?.setFontSize(compact ? 16 : 21);
    this.gameOverHint?.setText(`活了 ${this.decaySystem.ageYears(this.elapsed)} 歲 · ${this.elapsed.toFixed(1)} 秒 · 擊殺 ${this.kills}\n${compact ? '點擊重新開始' : '按 R 或點擊此處重新開始'}`);
  }

  private showFloatingText(x: number, y: number, message: string): void {
    const text = this.add.text(x, y, message, { fontSize: '16px', color: '#fff3b0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: text, y: y - 45, alpha: 0, duration: 900, onComplete: () => text.destroy() });
  }

  private endGame(): void {
    this.gameOver = true;
    this.player.playDeathAnimation();
    this.player.setVelocity(0).setTint(0x777777);
    this.physics.pause();
    const compact = this.scale.width < 500 || this.scale.height < 520;
    this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 28, '燈火熄滅', { fontSize: compact ? '36px' : '54px', color: '#ffe5a0', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5).setDepth(200);
    this.gameOverHint = this.add.text(this.scale.width / 2, this.scale.height / 2 + 42, `活了 ${this.decaySystem.ageYears(this.elapsed)} 歲 · ${this.elapsed.toFixed(1)} 秒 · 擊殺 ${this.kills}\n${compact ? '點擊重新開始' : '按 R 或點擊此處重新開始'}`, { align: 'center', fontSize: compact ? '16px' : '21px', color: '#d7dbea', backgroundColor: '#101520cc', padding: { x: 18, y: 12 } })
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => this.scene.restart());
  }
}
