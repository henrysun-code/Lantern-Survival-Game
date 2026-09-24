export type HUDStats = {
  elapsed: number;
  livedAge: number;
  difficultyAge: number;
  kills: number;
};

// 分數公式：每存活一秒 1 分，每擊殺一隻怪物 10 分。
export const SCORE_PER_SECOND = 1;
export const SCORE_PER_KILL = 10;

export function calculateScore(elapsedSeconds: number, kills: number): number {
  return Math.floor(elapsedSeconds) * SCORE_PER_SECOND + Math.max(0, Math.floor(kills)) * SCORE_PER_KILL;
}

export class GameHUD {
  private root: HTMLElement;
  private livedAge: HTMLElement;
  private difficultyAge: HTMLElement;
  private kills: HTMLElement;
  private score: HTMLElement;

  constructor() {
    this.root = document.createElement('section');
    this.root.className = 'game-hud';
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', '遊戲狀態');
    this.root.innerHTML = `
      <div class="game-hud-stat game-hud-age">
        <span class="game-hud-label">年齡</span>
        <strong class="game-hud-value"><span data-hud="lived-age">0</span><span class="game-hud-unit">歲</span><small>（難度 <span data-hud="difficulty-age">0</span> 歲）</small></strong>
      </div>
      <div class="game-hud-stat">
        <span class="game-hud-label">怪物擊殺</span>
        <strong class="game-hud-value"><span data-hud="kills">0</span></strong>
      </div>
      <div class="game-hud-stat game-hud-score">
        <span class="game-hud-label">分數</span>
        <strong class="game-hud-value"><span data-hud="score">0</span></strong>
      </div>
    `;
    this.livedAge = this.root.querySelector('[data-hud="lived-age"]')!;
    this.difficultyAge = this.root.querySelector('[data-hud="difficulty-age"]')!;
    this.kills = this.root.querySelector('[data-hud="kills"]')!;
    this.score = this.root.querySelector('[data-hud="score"]')!;
    document.body.append(this.root);
  }

  update(stats: HUDStats): void {
    this.setText(this.livedAge, String(stats.livedAge));
    this.setText(this.difficultyAge, String(stats.difficultyAge));
    this.setText(this.kills, String(stats.kills));
    this.setText(this.score, String(calculateScore(stats.elapsed, stats.kills)));
  }

  setVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  destroy(): void {
    this.root.remove();
  }

  private setText(element: HTMLElement, value: string): void {
    if (element.textContent !== value) element.textContent = value;
  }
}
