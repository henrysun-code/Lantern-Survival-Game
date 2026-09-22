import Phaser from 'phaser';
import type { ItemDefinition } from '../config/types';
import { runtimeConfig } from '../config/runtime';
import { applyVisual, resolveTexture } from '../utils/visuals';

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  bornAt = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, public readonly itemId: string) {
    const config = runtimeConfig.config.items[itemId] as ItemDefinition;
    super(scene, x, y, resolveTexture(scene, config.texture));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    applyVisual(this, config.texture);
    this.setCircle(Math.min(this.width, this.height) * 0.45);
  }
  get definition(): ItemDefinition { return runtimeConfig.config.items[this.itemId]; }
}
