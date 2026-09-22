import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // GitHub Pages 專案網站位於 /<repository>/；本機與公司網站建置維持根目錄。
  base: mode === 'github-pages' ? '/Lantern-Survival-Game/' : '/',
}));
