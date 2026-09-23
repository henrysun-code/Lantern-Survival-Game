import { DEFAULT_BALANCE } from './balance';
import { ENEMIES } from './enemies';
import { ITEMS } from './items';

export type RuntimeConfig = {
  balance: any;
  enemies: Record<string, any>;
  items: Record<string, any>;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const defaults = { balance: DEFAULT_BALANCE, enemies: ENEMIES, items: ITEMS };

export class RuntimeConfigStore {
  private data: RuntimeConfig = clone(defaults);
  private listeners = new Set<(path: string, value: number) => void>();

  get config(): RuntimeConfig { return this.data; }

  get(path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], this.data as any);
  }

  set(path: string, value: number): void {
    const keys = path.split('.');
    const leaf = keys.pop()!;
    const target = keys.reduce((current, key) => current[key], this.data as any);
    target[leaf] = value;
    this.listeners.forEach((listener) => listener(path, value));
  }

  subscribe(listener: (path: string, value: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 載入企劃資料檔；不完整或格式錯誤時保留內建預設值。 */
  loadExternal(partial: Partial<RuntimeConfig>): void {
    const merge = (base: any, incoming: any): any => {
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return incoming ?? base;
      const result = { ...base };
      Object.entries(incoming).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        result[key] = value && typeof value === 'object' && !Array.isArray(value)
          ? merge(base?.[key], value)
          : value;
      });
      return result;
    };
    this.data = merge(this.data, partial);
    this.listeners.forEach((listener) => listener('*', 0));
  }

  reset(): void {
    this.data = clone(defaults);
    this.listeners.forEach((listener) => listener('*', 0));
  }

  export(): RuntimeConfig { return clone(this.data); }
}

export const runtimeConfig = new RuntimeConfigStore();
