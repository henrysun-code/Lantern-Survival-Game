import Phaser from 'phaser';
import { runtimeConfig } from '../config/runtime';
import { StartScreen } from '../ui/StartScreen';

export class StartScene extends Phaser.Scene {
  private startScreen?: StartScreen;

  constructor() { super('StartScene'); }

  create(): void {
    this.startScreen = new StartScreen(runtimeConfig.config.items, () => this.scene.start('GameScene'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.startScreen?.destroy();
      this.startScreen = undefined;
    });
  }
}
