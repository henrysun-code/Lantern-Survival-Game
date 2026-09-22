import Phaser from 'phaser';
import { runtimeConfig } from '../config/runtime';
import { applyVisual, resolveTexture } from '../utils/visuals';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  bornAt = 0;
  sourceX = 0;
  sourceY = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, resolveTexture(scene, 'projectile'));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    applyVisual(this, 'projectile');
    const radius = runtimeConfig.config.balance.projectile.radius;
    this.setCircle(radius, this.width / 2 - radius, this.height / 2 - radius);
  }
}
