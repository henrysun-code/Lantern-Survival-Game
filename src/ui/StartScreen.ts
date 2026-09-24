import { ASSETS } from '../config/assets';
import type { ItemDefinition } from '../config/types';

const ITEM_ORDER = ['nne', 'yss', 'bbb', 'ppa'];

function itemDescription(item: ItemDefinition): string {
  const ageReduction = item.ageReductionYears ?? (item.effectType === 'ageReduction' ? item.value : 0);
  const ageText = ageReduction > 0 ? `年輕 ${ageReduction} 歲` : '';
  if (item.effectType === 'lightRadius') return `照亮範圍 +${item.value}　${ageText}`.trim();
  if (item.effectType === 'moveSpeed') return `移動速度 +${item.value}　${ageText}`.trim();
  if (item.clearsStatusEffects) {
    const reduction = Math.round((1 - item.sharedHealthDrainReduction) * 100);
    return `清除持續傷害；年齡扣血降低 ${reduction}%（${item.effectDuration} 秒）`;
  }
  return itemDescriptionFallback(item);
}

function itemDescriptionFallback(item: ItemDefinition): string {
  if (item.effectType === 'lightDamage') return `提燈傷害 +${item.value}`;
  if (item.effectType === 'damageReduction') return `受到傷害降低 ${Math.round(item.value * 100)}%`;
  return '拾取後獲得特殊效果';
}

export class StartScreen {
  private readonly root: HTMLElement;

  constructor(items: Record<string, ItemDefinition>, onStart: () => void) {
    const mount = document.getElementById('game-root');
    if (!mount) throw new Error('Missing #game-root for start screen.');

    this.root = document.createElement('section');
    this.root.className = 'start-screen';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', 'start-screen-title');

    const backgroundPath = ASSETS.background?.path;
    if (backgroundPath) {
      const url = new URL(backgroundPath, document.baseURI).toString().replace(/"/g, '\\"');
      this.root.style.setProperty('--start-screen-background', `url("${url}")`);
    }

    const card = document.createElement('div');
    card.className = 'start-card';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'start-eyebrow';
    eyebrow.textContent = '提燈・冒險・生存';
    const title = document.createElement('h1');
    title.id = 'start-screen-title';
    title.className = 'start-title';
    title.textContent = '提燈生存遊戲';
    const introduction = document.createElement('p');
    introduction.className = 'start-introduction';
    introduction.textContent = '提起燈籠照亮黑暗、擊退怪物，收集補給並盡可能活下去。';
    const controls = document.createElement('p');
    controls.className = 'start-controls-hint';
    controls.textContent = '移動：WASD／方向鍵　・　手機：使用左下方搖桿';

    const itemHeading = document.createElement('h2');
    itemHeading.className = 'start-items-heading';
    itemHeading.textContent = '冒險補給品';
    const itemGrid = document.createElement('div');
    itemGrid.className = 'start-items-grid';
    ITEM_ORDER.forEach((id) => {
      const item = items[id];
      if (!item) return;
      itemGrid.append(this.createItemCard(id, item));
    });

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.className = 'start-button';
    startButton.textContent = '開始遊戲';
    startButton.addEventListener('click', onStart, { once: true });
    card.append(eyebrow, title, introduction, controls, itemHeading, itemGrid, startButton);
    this.root.append(card);
    mount.append(this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  private createItemCard(id: string, item: ItemDefinition): HTMLElement {
    const card = document.createElement('article');
    card.className = `start-item start-item--${id}`;
    const icon = document.createElement('img');
    icon.className = 'start-item-icon';
    icon.alt = '';
    icon.width = 48;
    icon.height = 48;
    icon.decoding = 'async';
    const assetPath = ASSETS[item.texture]?.path;
    if (assetPath) icon.src = new URL(assetPath, document.baseURI).toString();
    const details = document.createElement('div');
    details.className = 'start-item-details';
    const name = document.createElement('h3');
    name.textContent = item.name;
    const description = document.createElement('p');
    description.textContent = itemDescription(item);
    details.append(name, description);
    card.append(icon, details);
    return card;
  }
}
