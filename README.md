# 提燈生存遊戲

以 Phaser 3、TypeScript、Vite 製作的資料驅動 2D Web 小遊戲。專案的重點是讓企劃能在 `src/config` 調整玩法，讓美術能透過資產設定換圖，而不需要修改主要遊戲程式。

## 啟動與建置

需求：Node.js 20.19 以上（建議使用目前 LTS 版本）與 npm。

```bash
npm install
npm run dev
```

Vite 會顯示本機網址。桌機操作使用 `WASD` 或方向鍵。

正式建置：

```bash
npm run build
```

GitHub Pages 建置：

```bash
npm run build:pages
```

輸出位於 `dist/`。將 `dist/` 內的靜態檔案放到公司網站即可。可用 `npm run preview` 在本機預覽正式建置結果。

## 專案結構

```text
src/
  config/       平衡、敵人、道具、素材、動畫設定
  entities/     Player、Enemy、Projectile、Pickup
  systems/      生成、衰退、傷害規則
  scenes/       載入與遊戲組裝
  ui/           HUD 與即時 Debug Panel
  utils/        素材與動畫共用工具
public/assets/  正式圖片、特效、UI、音效
```

`GameScene` 只組裝系統和處理 Phaser 碰撞事件；常用數字不寫在實體或場景中。

## 如何修改遊戲數值

主要數值位於 [`src/config/balance.ts`](src/config/balance.ts)，每個欄位都有單位與用途註解。常見例子：

```ts
player.moveSpeed.start
player.moveSpeed.minimum
player.moveSpeed.decayPerSecond
lantern.radius.start
lantern.radius.minimum
lantern.radius.decayPerSecond
```

敵人個別數值位於 [`src/config/enemies.ts`](src/config/enemies.ts)，道具補充值位於 [`src/config/items.ts`](src/config/items.ts)。

遊戲中按 `F2` 可開啟即時調整面板。Slider 和數字輸入同步，修改立即生效。面板可恢復預設值、重新開始，或將目前完整設定匯出成 JSON 並複製到剪貼簿。

按 `F3` 可顯示／隱藏玩家與敵人碰撞範圍、實際光照範圍及遠程敵人的射程。

## 如何更換玩家或敵人貼圖

1. 將圖片放入 `public/assets/player/` 或 `public/assets/enemies/`。
2. 開啟 [`src/config/assets.ts`](src/config/assets.ts)。
3. 將對應項目的 `path` 改為 `/assets/...`，例如：

```ts
player: {
  texture: 'player',
  path: '/assets/player/player.png',
  scale: 1,
  origin: { x: 0.5, y: 0.7 },
  depth: 10,
  placeholder: { shape: 'circle', color: 0xf4f7ff, width: 38, height: 38 },
}
```

可用 `scale`、`displayWidth`、`displayHeight`、`origin`、`rotation`、`depth` 校正不同尺寸素材。`displayWidth` / `displayHeight` 會覆蓋最終顯示尺寸；若不需要請省略。

路徑留空或圖片載入失敗時，遊戲使用 `placeholder` 幾何圖形，仍可繼續測試。

## 如何加入 spritesheet 與動畫

先在 [`src/config/assets.ts`](src/config/assets.ts) 的素材加入 spritesheet 尺寸：

```ts
player: {
  texture: 'player',
  path: '/assets/player/player_sheet.png',
  spritesheet: { frameWidth: 64, frameHeight: 64 },
  // 其餘視覺設定...
}
```

再编辑 [`src/config/animations.ts`](src/config/animations.ts)：

```ts
walk: {
  key: 'player_walk',
  texture: 'player',
  startFrame: 0,
  endFrame: 5,
  frameRate: 10,
  repeat: -1,
}
```

支援 `startFrame`、`endFrame`、`frameRate`、`repeat`、`yoyo`。Player 與 Enemy 只提出 `idle`、`walk/move`、`hurt`、`death` 等狀態，不知道具體 frame；動畫工具也會避免每一幀重複啟動同一個動畫。

## 如何新增敵人

在 [`src/config/enemies.ts`](src/config/enemies.ts) 增加一筆資料：

```ts
fastEnemy: {
  id: 'fastEnemy',
  name: '迅捷怪',
  hp: 35,
  speed: 190,
  contactDamage: 8,
  attackInterval: 0.6,
  projectileSpeed: 0,
  projectileDamage: 0,
  range: 0,
  preferredDistance: 0,
  texture: 'enemyFast',
  animations: 'enemyFast',
  behavior: 'melee',
  spawnWeight: 0.2,
}
```

接著在 `assets.ts` 加入 `enemyFast` 的貼圖設定，在 `animations.ts` 加入同名動畫群組。`melee` 與 `ranged` 行為不需要新程式；只有完全不同的移動／攻擊模式才需要擴充 `EnemyBehavior` 與行為邏輯。

`spawnWeight` 是隨機生成權重，不必加總為 1。

## 如何新增道具

在 [`src/config/items.ts`](src/config/items.ts) 增加一筆資料，並在 `assets.ts` 增加對應 `texture`：

```ts
largeLampOil: {
  id: 'largeLampOil',
  name: '大瓶灯油',
  texture: 'pickupLargeLight',
  effectType: 'lightRadius',
  value: 80,
  sharedHealthDrainReduction: 0.45,
  effectDuration: 7,
}
```

現有 `effectType`：`lightRadius`、`moveSpeed`、`lightDamage`、`damageReduction`。同類型的新道具不需要修改 Pickup。新效果種類才需要擴充 `ItemEffect` 與 `Player.applyPickup()`。

所有道具的個別補值不會停止自然衰退，只會把目前數值向上補；共通效果則在指定秒數內降低持續生命流失。

## 发布前建议

- 把 `src/config` 的最終數值與 Debug Panel 匯出的 JSON 對齊。
- 用實際部署子路徑測試素材網址；目前 `/assets/...` 適合部署於網域根目錄。若公司網站使用子路徑，可在 Vite 設定 `base`，並統一調整資產 URL。
- 在目標桌機瀏覽器測試 WebGL/Canvas、音效自動播放政策與不同視窗比例。
- 正式環境可在產品層隱藏 Debug Panel 的入口，或使用環境變數控制是否啟用。
