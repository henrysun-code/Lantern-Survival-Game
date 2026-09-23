import Phaser from 'phaser';
import type { Player } from '../entities/Player';

export type HUDStats = { elapsed: number; age: number; drain: number; kills: number; enemies: number; fps: number };

export class GameHUD {
  private text: Phaser.GameObjects.Text;
  constructor(private scene: Phaser.Scene) {
    this.text = scene.add.text(18, 16, '', {
      fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '16px', color: '#eef3ff',
      backgroundColor: '#080b12bb', padding: { x: 10, y: 8 }, lineSpacing: 3,
    }).setDepth(100).setScrollFactor(0);
  }

  update(player: Player, stats: HUDStats): void {
    const compact = this.scene.scale.width < 700 || this.scene.scale.height < 520;
    const restoreRemaining = player.getColorRestoreRemaining(stats.elapsed);
    const statuses = player.getActiveStatusEffects().map((id) => id === 'mosquitoBite' ? '蚊蟲叮咬中' : id).join('、');
    const healthFlow = stats.drain < 0 ? `回復  ${Math.abs(stats.drain).toFixed(2)} /s` : `流失  ${stats.drain.toFixed(2)} /s`;
    this.text.setFontSize(compact ? 14 : 16);
    this.text.setPosition(compact ? 8 : 18, compact ? 8 : 16);
    if (compact) {
      this.text.setText([
        `年齡 ${stats.age} 歲  時間 ${stats.elapsed.toFixed(1)} s`,
        `擊殺 ${stats.kills}`,
        `HP ${Math.ceil(player.hp)}  光圈 ${Math.round(player.lightRadius)}`,
        healthFlow,
        `原色 ${Math.round(player.colorBrightness * 100)}%${restoreRemaining > 0 ? `  回色 ${restoreRemaining.toFixed(1)} s` : ''}`,
        ...(statuses ? [`狀態 ${statuses}`] : []),
      ]);
      return;
    }
    this.text.setText([
      `時間  ${stats.elapsed.toFixed(1)} s`,
      `年齡  ${stats.age} 歲`,
      `HP    ${player.hp.toFixed(1)}`,
      `原色  ${(player.colorBrightness * 100).toFixed(0)} %`,
      `回色  ${restoreRemaining > 0 ? `${restoreRemaining.toFixed(1)} s` : '—'}`,
      ...(statuses ? [`狀態  ${statuses}`] : []),
      healthFlow,
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
