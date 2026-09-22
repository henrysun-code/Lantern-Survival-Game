import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { createConfiguredAnimations, fallbackKey } from '../utils/visuals';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    Object.values(ASSETS).forEach((asset) => {
      if (!asset.path) return;
      if (asset.spritesheet) this.load.spritesheet(asset.texture, asset.path, asset.spritesheet);
      else this.load.image(asset.texture, asset.path);
    });
  }

  create(): void {
    Object.entries(ASSETS).forEach(([key, asset]) => {
      if (!this.textures.exists(asset.texture)) this.createPlaceholder(fallbackKey(key), asset.placeholder);
    });
    createConfiguredAnimations(this);
    this.scene.start('GameScene');
  }

  private createPlaceholder(key: string, spec: { shape: string; color: number; width: number; height: number }): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(spec.color, 1);
    graphics.lineStyle(2, 0xffffff, 0.55);
    const pad = 3;
    if (spec.shape === 'circle') {
      graphics.fillCircle(spec.width / 2 + pad, spec.height / 2 + pad, Math.min(spec.width, spec.height) / 2);
      graphics.strokeCircle(spec.width / 2 + pad, spec.height / 2 + pad, Math.min(spec.width, spec.height) / 2);
    } else if (spec.shape === 'triangle') {
      graphics.fillTriangle(pad + spec.width / 2, pad, pad + spec.width, pad + spec.height, pad, pad + spec.height);
      graphics.strokeTriangle(pad + spec.width / 2, pad, pad + spec.width, pad + spec.height, pad, pad + spec.height);
    } else {
      graphics.fillRoundedRect(pad, pad, spec.width, spec.height, 5);
      graphics.strokeRoundedRect(pad, pad, spec.width, spec.height, 5);
    }
    graphics.generateTexture(key, spec.width + pad * 2, spec.height + pad * 2);
    graphics.destroy();
  }
}
