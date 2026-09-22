import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { ANIMATIONS } from '../config/animations';

export const fallbackKey = (assetKey: string) => `placeholder:${assetKey}`;

export function resolveTexture(scene: Phaser.Scene, assetKey: string): string {
  const visual = ASSETS[assetKey];
  return scene.textures.exists(visual.texture) ? visual.texture : fallbackKey(assetKey);
}

export function applyVisual(sprite: Phaser.GameObjects.Sprite, assetKey: string): void {
  const visual = ASSETS[assetKey];
  if (visual.scale !== undefined) sprite.setScale(visual.scale);
  if (visual.displayWidth !== undefined) sprite.displayWidth = visual.displayWidth;
  if (visual.displayHeight !== undefined) sprite.displayHeight = visual.displayHeight;
  if (visual.origin) sprite.setOrigin(visual.origin.x, visual.origin.y);
  if (visual.rotation !== undefined) sprite.setRotation(visual.rotation);
  if (visual.depth !== undefined) sprite.setDepth(visual.depth);
}

export function createConfiguredAnimations(scene: Phaser.Scene): void {
  Object.values(ANIMATIONS).forEach((states) => {
    Object.values(states).forEach((definition) => {
      if (scene.anims.exists(definition.key) || !scene.textures.exists(definition.texture)) return;
      const texture = scene.textures.get(definition.texture);
      if (texture.frameTotal <= definition.startFrame) return;
      const end = Math.min(definition.endFrame, texture.frameTotal - 1);
      scene.anims.create({
        key: definition.key,
        frames: scene.anims.generateFrameNumbers(definition.texture, { start: definition.startFrame, end }),
        frameRate: definition.frameRate,
        repeat: definition.repeat,
        yoyo: definition.yoyo ?? false,
      });
    });
  });
}

export function playConfiguredAnimation(
  sprite: Phaser.GameObjects.Sprite,
  group: string,
  state: string,
  currentState: string,
): string {
  if (state === currentState) return currentState;
  const definition = ANIMATIONS[group]?.[state];
  if (definition && sprite.scene.anims.exists(definition.key)) sprite.play(definition.key, true);
  return state;
}
