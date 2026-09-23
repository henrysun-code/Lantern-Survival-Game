import * as XLSX from 'xlsx';

type Row = Record<string, unknown>;

const numberOrText = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  if (text === '') return undefined;
  const numeric = Number(text);
  return Number.isFinite(numeric) && text !== '' ? numeric : text;
};

const rows = (workbook: XLSX.WorkBook, sheetName: string): Row[] => {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json<Row>(sheet, { defval: undefined }) : [];
};

const setPath = (target: Record<string, any>, path: string, value: unknown): void => {
  const keys = path.split('.').filter(Boolean);
  if (!keys.length || value === undefined) return;
  let current = target;
  keys.slice(0, -1).forEach((key) => { current[key] ??= {}; current = current[key]; });
  current[keys[keys.length - 1]] = value;
};

export function parseGameConfigXlsx(data: ArrayBuffer): {
  balance: Record<string, any>;
  enemies: Record<string, any>;
  items: Record<string, any>;
  assets: Record<string, any>;
  animations: Record<string, Record<string, any>>;
} {
  const workbook = XLSX.read(data, { type: 'array' });
  const balance: Record<string, any> = {};
  rows(workbook, 'Balance').forEach((row) => setPath(balance, String(row.path ?? ''), numberOrText(row.value)));

  const enemies: Record<string, any> = {};
  rows(workbook, 'Enemies').forEach((row) => {
    const id = String(row.id ?? '').trim();
    if (!id) return;
    const item: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => { if (key !== 'id' && value !== undefined) item[key] = numberOrText(value); });
    item.id = id;
    enemies[id] = item;
  });

  const items: Record<string, any> = {};
  rows(workbook, 'Items').forEach((row) => {
    const id = String(row.id ?? '').trim();
    if (!id) return;
    const item: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => { if (key !== 'id' && value !== undefined) item[key] = numberOrText(value); });
    item.id = id;
    items[id] = item;
  });

  const assets: Record<string, any> = {};
  rows(workbook, 'Assets').forEach((row) => {
    const id = String(row.id ?? '').trim();
    if (!id) return;
    const asset: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => { if (key !== 'id' && value !== undefined) asset[key] = numberOrText(value); });
    asset.texture ??= id;
    if (asset.frameWidth !== undefined && asset.frameHeight !== undefined) asset.spritesheet = { frameWidth: asset.frameWidth, frameHeight: asset.frameHeight };
    delete asset.frameWidth; delete asset.frameHeight;
    if (asset.originX !== undefined || asset.originY !== undefined) asset.origin = { x: asset.originX ?? 0.5, y: asset.originY ?? 0.5 };
    delete asset.originX; delete asset.originY;
    if (asset.placeholderShape) asset.placeholder = { shape: asset.placeholderShape, color: asset.placeholderColor ?? 0xffffff, width: asset.placeholderWidth ?? 24, height: asset.placeholderHeight ?? 24 };
    ['placeholderShape', 'placeholderColor', 'placeholderWidth', 'placeholderHeight'].forEach((key) => delete asset[key]);
    assets[id] = asset;
  });

  const animations: Record<string, Record<string, any>> = {};
  rows(workbook, 'Animations').forEach((row) => {
    const group = String(row.group ?? '').trim();
    const name = String(row.name ?? '').trim();
    if (!group || !name) return;
    animations[group] ??= {};
    const animation: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => { if (key !== 'group' && key !== 'name' && value !== undefined) animation[key] = numberOrText(value); });
    animations[group][name] = animation;
  });

  return { balance, enemies, items, assets, animations };
}
