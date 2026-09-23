import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const root = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/^\/(?:[A-Z]:)/, (value) => value.slice(1));
const readJson = async (name) => JSON.parse(await fs.readFile(`${root}/public/game-data/${name}`, 'utf8'));
const balance = await readJson('balance.json');
const enemies = await readJson('enemies.json');
const items = await readJson('items.json');
const assets = await readJson('assets.json');
const animations = await readJson('animations.json');

const workbook = Workbook.create();
const title = '#17365D';
const header = '#1F4E78';
const input = '#FFF2CC';
const note = '#F3F6FA';
const styleSheet = (sheet) => { sheet.showGridLines = false; const used = sheet.getUsedRange(); if (used) used.format.font = { name: 'Arial', size: 10, color: '#1F2937' }; };
const makeTable = (name, headers, data) => {
  const sheet = workbook.worksheets.add(name);
  styleSheet(sheet);
  sheet.getRange('A1').values = [[name === 'README' ? '提燈生存遊戲｜企劃設定檔' : `${name}｜可編輯資料`]];
  sheet.getRange(`A1:${String.fromCharCode(64 + Math.min(headers.length, 26))}1`).format = { font: { name: 'Arial', size: 14, bold: true, color: title } };
  sheet.getRange('A3').write([headers, ...data]);
  const endCol = String.fromCharCode(64 + Math.min(headers.length, 26));
  sheet.getRange(`A3:${endCol}3`).format = { fill: header, font: { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' }, wrapText: true, verticalAlignment: 'center' };
  if (data.length) sheet.getRange(`A4:${endCol}${data.length + 3}`).format = { fill: input, verticalAlignment: 'center' };
  sheet.freezePanes.freezeRows(3);
  sheet.getRange(`A:${endCol}`).format.autofitColumns();
  sheet.getRange(`A1:${endCol}${data.length + 3}`).format.autofitRows();
  return sheet;
};

const readme = workbook.worksheets.add('README');
readme.showGridLines = false;
readme.getRange('A1').values = [['提燈生存遊戲｜Excel 設定檔']];
readme.getRange('A1:F1').format = { font: { name: 'Arial', size: 16, bold: true, color: title } };
readme.getRange('A3:B11').values = [
  ['用途', '修改黃色儲存格即可調整遊戲資料。不要改工作表名稱或欄位名稱。'],
  ['操作', '修改後儲存檔案，將此 xlsx 放回 public/game-data/，重新整理本地遊戲。'],
  ['本地測試', 'PowerShell 執行 pnpm dev，瀏覽器開啟 http://localhost:5173/，按 Ctrl+F5。'],
  ['部署', '確認本地無誤後再 git add、git commit、git push。'],
  ['新增道具', 'Items 工作表新增一列，id 必須唯一，texture 必須對應 Assets 的 id。'],
  ['新增怪物', 'Enemies 工作表新增一列；behavior 可使用 melee、ranged 或 dashRetreat。'],
  ['替換圖片', '圖片放到 public/assets/，Assets 的 path 填 assets/... 的相對路徑。'],
  ['動畫', 'Animations 的 startFrame/endFrame 是圖片序列編號，從 0 開始。'],
  ['注意', '所有數值請填數字；比例請填 0 到 1，例如 0.55。'],
];
readme.getRange('A3:A11').format = { fill: header, font: { name: 'Arial', bold: true, color: '#FFFFFF' } };
readme.getRange('B3:B11').format = { fill: note, wrapText: true };
readme.getRange('A:A').format.columnWidth = 18; readme.getRange('B:B').format.columnWidth = 90;
readme.getRange('A1:B11').format.autofitRows();

const balanceRows = [];
const flatten = (value, prefix = '') => Object.entries(value).forEach(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path);
  else balanceRows.push([path, child, '', '在這裡調整遊戲平衡數值']);
});
flatten(balance);
makeTable('Balance', ['path', 'value', 'unit', 'description'], balanceRows);

const enemyRows = Object.values(enemies).map((e) => [e.id, e.name, e.hp, e.speed, e.contactDamage, e.attackInterval, e.projectileSpeed, e.projectileDamage, e.range, e.preferredDistance, e.texture, e.animations, e.behavior, e.spawnWeight, e.triggerRange ?? '', e.dashSpeed ?? '', e.dashEndDistance ?? '', e.retreatSpeed ?? '', e.retreatDuration ?? '', e.statusEffect ?? '', e.statusDamagePerSecond ?? '', e.statusDuration ?? '']);
makeTable('Enemies', ['id', 'name', 'hp', 'speed', 'contactDamage', 'attackInterval', 'projectileSpeed', 'projectileDamage', 'range', 'preferredDistance', 'texture', 'animations', 'behavior', 'spawnWeight', 'triggerRange', 'dashSpeed', 'dashEndDistance', 'retreatSpeed', 'retreatDuration', 'statusEffect', 'statusDamagePerSecond', 'statusDuration'], enemyRows);

const itemRows = Object.values(items).map((e) => [e.id, e.name, e.texture, e.effectType, e.value, e.sharedHealthDrainReduction, e.effectDuration, e.minimumAge ?? '']);
makeTable('Items', ['id', 'name', 'texture', 'effectType', 'value', 'sharedHealthDrainReduction', 'effectDuration', 'minimumAge'], itemRows);

const animationRows = [];
Object.entries(animations).forEach(([group, states]) => Object.entries(states).forEach(([name, a]) => animationRows.push([group, name, a.key, a.texture, a.startFrame, a.endFrame, a.frameRate, a.repeat])));
makeTable('Animations', ['group', 'name', 'key', 'texture', 'startFrame', 'endFrame', 'frameRate', 'repeat'], animationRows);

const assetRows = Object.entries(assets).map(([id, a]) => [id, a.texture, a.path, a.spritesheet?.frameWidth ?? '', a.spritesheet?.frameHeight ?? '', a.scale ?? 1, a.origin?.x ?? 0.5, a.origin?.y ?? 0.5, a.depth ?? 0, a.placeholder?.shape ?? 'circle', a.placeholder?.color ?? 0xffffff, a.placeholder?.width ?? 24, a.placeholder?.height ?? 24]);
makeTable('Assets', ['id', 'texture', 'path', 'frameWidth', 'frameHeight', 'scale', 'originX', 'originY', 'depth', 'placeholderShape', 'placeholderColor', 'placeholderWidth', 'placeholderHeight'], assetRows);

workbook.recalculate();
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${root}/public/game-data/Lantern-Survival-Game-Config.xlsx`);
