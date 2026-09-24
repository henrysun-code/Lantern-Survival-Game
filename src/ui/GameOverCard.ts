export type GameOverResult = {
  livedAge: number;
  difficultyAge: number;
  kills: number;
  score: number;
};

export class GameOverCard {
  private root: HTMLElement;

  constructor(result: GameOverResult, onRestart: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'game-result-overlay';
    this.root.innerHTML = `
      <section class="game-result-card" role="dialog" aria-modal="true" aria-labelledby="game-result-title">
        <p class="game-result-kicker">本次旅程</p>
        <h1 id="game-result-title">旅程告一段落</h1>
        <dl class="game-result-stats">
          <div class="game-result-row">
            <dt>年齡</dt>
            <dd><span data-result="lived-age"></span><span class="game-result-unit">歲</span><small>（難度 <span data-result="difficulty-age"></span> 歲）</small></dd>
          </div>
          <div class="game-result-row">
            <dt>怪物擊殺</dt>
            <dd data-result="kills"></dd>
          </div>
          <div class="game-result-row game-result-score">
            <dt>分數</dt>
            <dd data-result="score"></dd>
          </div>
        </dl>
        <button class="game-result-restart" type="button">再走一程</button>
      </section>
    `;
    this.setResult('lived-age', String(result.livedAge));
    this.setResult('difficulty-age', String(result.difficultyAge));
    this.setResult('kills', String(result.kills));
    this.setResult('score', String(result.score));
    this.root.querySelector('.game-result-restart')!.addEventListener('click', onRestart);
    document.body.append(this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  private setResult(name: string, value: string): void {
    this.root.querySelector(`[data-result="${name}"]`)!.textContent = value;
  }
}
