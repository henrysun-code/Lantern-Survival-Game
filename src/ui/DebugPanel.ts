import { runtimeConfig } from '../config/runtime';

type Control = { label: string; path: string; min: number; max: number; step: number; section: string };

const CONTROLS: Control[] = [
  { section: '玩家', label: '目前移速', path: 'balance.player.moveSpeed.start', min: 20, max: 600, step: 1 },
  { section: '玩家', label: '移速衰退', path: 'balance.player.moveSpeed.decayPerSecond', min: 0, max: 10, step: 0.01 },
  { section: '玩家', label: '變黑速度', path: 'balance.player.color.darkenPerSecond', min: 0, max: 0.2, step: 0.001 },
  { section: '玩家', label: '回色速度', path: 'balance.player.color.restorePerSecond', min: 0, max: 1, step: 0.01 },
  { section: '玩家', label: '最暗亮度', path: 'balance.player.color.minimumBrightness', min: 0, max: 1, step: 0.01 },
  { section: '提燈', label: '目前光圈', path: 'balance.lantern.radius.start', min: 20, max: 500, step: 1 },
  { section: '提燈', label: '光圈衰退', path: 'balance.lantern.radius.decayPerSecond', min: 0, max: 10, step: 0.01 },
  { section: '提燈', label: '目前光傷', path: 'balance.lightDamage.dps.start', min: 0, max: 150, step: 0.1 },
  { section: '提燈', label: '傷害衰退', path: 'balance.lightDamage.dps.decayPerSecond', min: 0, max: 5, step: 0.01 },
  { section: '防禦', label: '目前減傷', path: 'balance.damageReduction.ratio.start', min: 0, max: 0.95, step: 0.01 },
  { section: '防禦', label: '減傷衰退', path: 'balance.damageReduction.ratio.decayPerSecond', min: 0, max: 0.05, step: 0.001 },
  { section: '生命', label: 'HP 流失', path: 'balance.healthDrain.startPerSecond', min: 0, max: 15, step: 0.05 },
  { section: '生命', label: '流失加速度', path: 'balance.healthDrain.increasePerSecond', min: 0, max: 1, step: 0.005 },
  { section: '生成', label: '敵人間隔', path: 'balance.enemies.spawnInterval', min: 0.2, max: 10, step: 0.1 },
  { section: '生成', label: '道具間隔', path: 'balance.pickups.spawnInterval', min: 1, max: 30, step: 0.5 },
  { section: '近戰敵人', label: '移動速度', path: 'enemies.melee.speed', min: 10, max: 400, step: 1 },
  { section: '遠程敵人', label: '移動速度', path: 'enemies.ranged.speed', min: 10, max: 400, step: 1 },
  { section: '道具補值', label: '光圈增加', path: 'items.lightBoost.value', min: 0, max: 200, step: 1 },
  { section: '道具補值', label: '移速增加', path: 'items.speedBoost.value', min: 0, max: 200, step: 1 },
  { section: '道具補值', label: '光傷增加', path: 'items.damageBoost.value', min: 0, max: 80, step: 0.5 },
  { section: '道具補值', label: '減傷增加', path: 'items.defenseBoost.value', min: 0, max: 0.5, step: 0.01 },
];

export class DebugPanel {
  private root: HTMLElement;
  private output: HTMLTextAreaElement;
  private inputs = new Map<string, HTMLInputElement[]>();

  constructor(private onRestart: () => void) {
    this.root = document.createElement('aside');
    this.root.className = 'debug-panel';
    this.root.hidden = true;
    this.root.innerHTML = '<h2>即時平衡調整</h2><p class="hint">F2 關閉 · 修改後立即套用</p>';
    let currentSection = '';
    let sectionElement: HTMLElement | null = null;
    CONTROLS.forEach((control) => {
      if (control.section !== currentSection) {
        currentSection = control.section;
        sectionElement = document.createElement('section');
        sectionElement.className = 'debug-section';
        sectionElement.innerHTML = `<h3>${control.section}</h3>`;
        this.root.append(sectionElement);
      }
      sectionElement!.append(this.createControl(control));
    });
    const actions = document.createElement('div');
    actions.className = 'debug-actions';
    actions.append(
      this.button('恢復預設值', 'secondary', () => { runtimeConfig.reset(); this.refresh(); }),
      this.button('重新開始遊戲', '', this.onRestart),
      this.button('匯出目前設定', 'secondary', () => this.exportConfig()),
    );
    this.root.append(actions);
    this.output = document.createElement('textarea');
    this.output.className = 'debug-output';
    this.output.hidden = true;
    this.output.readOnly = true;
    this.root.append(this.output);
    document.body.append(this.root);
    window.addEventListener('keydown', this.keyHandler);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.keyHandler);
    this.root.remove();
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
  }

  private keyHandler = (event: KeyboardEvent): void => {
    if (event.key === 'F2') { event.preventDefault(); this.toggle(); }
  };

  private createControl(control: Control): HTMLElement {
    const row = document.createElement('div');
    row.className = 'debug-row';
    const label = document.createElement('label');
    label.textContent = control.label;
    const range = this.input('range', control);
    const number = this.input('number', control);
    const update = (source: HTMLInputElement, target: HTMLInputElement) => {
      const value = Number(source.value);
      target.value = String(value);
      runtimeConfig.set(control.path, value);
    };
    range.addEventListener('input', () => update(range, number));
    number.addEventListener('input', () => update(number, range));
    this.inputs.set(control.path, [range, number]);
    row.append(label, range, number);
    return row;
  }

  private input(type: string, control: Control): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    input.min = String(control.min); input.max = String(control.max); input.step = String(control.step);
    input.value = String(runtimeConfig.get(control.path));
    return input;
  }

  private button(text: string, className: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text; button.className = className; button.addEventListener('click', action);
    return button;
  }

  private refresh(): void {
    this.inputs.forEach((inputs, path) => inputs.forEach((input) => { input.value = String(runtimeConfig.get(path)); }));
  }

  private async exportConfig(): Promise<void> {
    const text = JSON.stringify(runtimeConfig.export(), null, 2);
    this.output.value = text;
    this.output.hidden = false;
    this.output.select();
    try { await navigator.clipboard.writeText(text); } catch { /* textarea remains available for manual copy */ }
  }
}
