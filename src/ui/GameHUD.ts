import Phaser from 'phaser';
import type { Player } from '../entities/Player';

export type HUDStats = { elapsed: number; drain: number; kills: number; enemies: number; fps: number };

export class GameHUD {
  private text: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(18, 16, '', {
      fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '16px', color: '#eef3ff',
      backgroundColor: '#080b12bb', padding: { x: 10, y: 8 }, lineSpacing: 3,
    }).setDepth(100).setScrollFactor(0);
  }

  update(player: Player, stats: HUDStats): void {
    this.text.setText([
      `時間  ${stats.elapsed.toFixed(1)} s`,
      `HP    ${player.hp.toFixed(1)}`,
      `流失  ${stats.drain.toFixed(2)} /s`,
      `移速  ${player.moveSpeed.toFixed(1)}`,
      `光圈  ${player.lightRadius.toFixed(1)}`,
      `光傷  ${player.lightDamage.toFixed(1)} DPS`,
      `減傷  ${(player.damageReduction * 100).toFixed(1)} %`,
      `擊殺  ${stats.kills}`,
      `敵人  ${stats.enemies}`,
      `FPS   ${stats.fps.toFixed(0)}`,
      '',
      '移動：WASD / 方向鍵',
      '調整面板：F2',
    ]);
  }
}
