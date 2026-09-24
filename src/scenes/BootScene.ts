import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { ANIMATIONS } from '../config/animations';
import { runtimeConfig } from '../config/runtime';
import { parseGameConfigXlsx } from '../config/excelConfig';
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

  async create(): Promise<void> {
    await this.loadContentData();
    await this.reloadConfiguredAssets();
    Object.entries(ASSETS).forEach(([key, asset]) => {
      if (key === 'background' && !this.textures.exists(asset.texture)) return;
      if (!this.textures.exists(asset.texture)) this.createPlaceholder(fallbackKey(key), asset.placeholder);
    });
    createConfiguredAnimations(this);
    this.scene.start('StartScene');
  }

  private async loadContentData(): Promise<void> {
    // 使用目前頁面的 URL 組合路徑，因此本機與 GitHub Pages 子路徑都能工作。
    const base = new URL('.', window.location.href);
    const readJson = async (file: string): Promise<any | null> => {
      try {
        const response = await fetch(new URL(`game-data/${file}`, base));
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    };
    try {
      const response = await fetch(new URL('game-data/Lantern-Survival-Game-Config.xlsx', base));
      if (response.ok) {
        const config = parseGameConfigXlsx(await response.arrayBuffer());
        runtimeConfig.loadExternal(config);
        Object.entries(config.assets).forEach(([key, override]) => {
          ASSETS[key] = { ...ASSETS[key], ...override };
        });
        if (Object.keys(config.animations).length) Object.assign(ANIMATIONS, config.animations);
        return;
      }
    } catch {
      // Fall back to the individual JSON files below.
    }
    const [balance, enemies, items, assets, animations] = await Promise.all([
      readJson('balance.json'), readJson('enemies.json'), readJson('items.json'), readJson('assets.json'), readJson('animations.json'),
    ]);
    runtimeConfig.loadExternal({ balance, enemies, items });
    if (assets) Object.assign(ASSETS, assets);
    if (animations) Object.assign(ANIMATIONS, animations);
  }

  private async reloadConfiguredAssets(): Promise<void> {
    const pending = Object.values(ASSETS).filter((asset) => asset.path);
    if (!pending.length) return;
    pending.forEach((asset) => {
      if (this.textures.exists(asset.texture)) this.textures.remove(asset.texture);
      if (asset.spritesheet) this.load.spritesheet(asset.texture, asset.path, asset.spritesheet);
      else this.load.image(asset.texture, asset.path);
    });
    await new Promise<void>((resolve) => { this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve()); this.load.start(); });
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
