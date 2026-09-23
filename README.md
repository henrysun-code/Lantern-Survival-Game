# 提燈生存遊戲

以 Phaser 3、TypeScript、Vite 製作的資料驅動 2D Web 小遊戲。專案的重點是讓企劃能在 `src/config` 調整玩法，讓美術能透過資產設定換圖，而不需要修改主要遊戲程式。

## 啟動與建置

需求：Node.js 20.19 以上（建議使用目前 LTS 版本）與 npm。

```bash
npm install
npm run dev
```

Vite 會顯示本機網址。桌機使用 `WASD` 或方向鍵移動；手機使用畫面左下角的搖桿移動，右下角「調整」可開啟設定面板。遊戲會依螢幕尺寸調整畫面，直式與橫式皆可遊玩；死亡後點擊畫面中央的提示即可重新開始。

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

現有 `effectType`：`lightRadius`、`moveSpeed`、`lightDamage`、`damageReduction`、`ageReduction`。設定 `minimumAge` 可限制道具從幾歲開始出現；`ageReduction` 道具會永久降低遊戲中的有效年齡，結算仍依遊玩秒數計算實際年齡。

所有道具的個別補值不會停止自然衰退，只會把目前數值向上補；共通效果則在指定秒數內降低持續生命流失。

玩家會依 `player.color.darkenPerSecond` 持續變黑，最低亮度由 `player.color.minimumBrightness` 決定。道具加上 `restoresColor: true` 後，拾取時會在該道具的 `effectDuration` 秒內依 `player.color.restorePerSecond` 逐漸恢復原色；再次拾取會從當下重新計時，到期後從目前顏色繼續變黑。預設的燈油和烈光會回色，疾風與守護不會。Excel 設定檔的 `Items.restoresColor` 欄以 `1` 表示開啟、`0` 表示關閉。

## 发布前建议

- 把 `src/config` 的最終數值與 Debug Panel 匯出的 JSON 對齊。
- 用實際部署子路徑測試素材網址；目前 `/assets/...` 適合部署於網域根目錄。若公司網站使用子路徑，可在 Vite 設定 `base`，並統一調整資產 URL。
- 在目標桌機瀏覽器測試 WebGL/Canvas、音效自動播放政策與不同視窗比例。
- 正式環境可在產品層隱藏 Debug Panel 的入口，或使用環境變數控制是否啟用。

## 企劃／非工程師資料維護方式

## 編碼與中文檔案

本專案所有原始碼、JSON、Markdown 與設定檔統一使用 UTF-8。專案已包含 `.vscode/settings.json` 與 `.editorconfig`，VS Code 開啟此資料夾後會使用 UTF-8，不要手動選 Big5、ANSI 或 GBK。

如果 VS Code 已經把某個檔案顯示成亂碼，請先關閉該檔案，再用右下角編碼按鈕選擇 `Reopen with Encoding` → `UTF-8`；確認文字正常後再選 `Save with Encoding` → `UTF-8`。

PowerShell 終端機的文字顯示編碼和 VS Code 編輯器是兩件事；若只有終端機亂碼，可先執行 `chcp 65001`，不需要改動遊戲檔案。

正式遊戲執行時會優先讀取 `public/game-data/` 的 JSON；若檔案不存在或格式有誤，才會退回 `src/config/` 內建預設值。日常調整建議只修改這個資料夾：

```text
public/game-data/
  balance.json      玩家、提燈、衰退、生成與生命流失
  enemies.json      敵人種類與戰鬥數值
  items.json        道具名稱、效果與補充值
  assets.json       圖片路徑、縮放、尺寸與 Placeholder
  animations.json   spritesheet 動畫 frame 與速度
```

圖片則放在 `public/assets/player/`、`public/assets/enemies/`、`public/assets/items/` 等資料夾，然後在 `assets.json` 修改 `path`。例如：

```json
{
  "texture": "player",
  "path": "assets/player/player-new.png",
  "scale": 1,
  "origin": { "x": 0.5, "y": 0.65 }
}
```

這些 JSON 不可加入註解；請使用清楚的欄位名稱，並保留一份可工作的預設檔。若要在 GitHub 網頁維護，只需編輯 JSON 或上傳圖片、Commit changes，GitHub Actions 會自動重新建置。業界更大型的專案通常會在這些資料檔上再加 Schema 驗證、企劃編輯器或 CMS，避免非工程師輸入錯誤格式；目前這個結構已保留日後接編輯器的界線。
