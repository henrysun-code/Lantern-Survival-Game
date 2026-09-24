# 換圖與動畫：最短流程

## 0. 用 Excel 編輯（推薦）

開啟同資料夾的 `Lantern-Survival-Game-Config.xlsx`，修改黃色欄位即可。遊戲會優先讀取這份 Excel，工作表用途如下：

```text
Balance     遊戲平衡數值
Enemies     怪物
Items       道具
Animations  動畫幀與速度
Assets      圖片路徑、Spritesheet 大小與 Placeholder
```

修改後請直接儲存。圖片仍需放到 `public/assets/`，Assets 的 `path` 填 `assets/...`。本地執行 `pnpm dev` 後按 `Ctrl+F5` 就會看到變更；確認無誤再提交 GitHub。若 Excel 檔案損壞或無法讀取，遊戲會退回使用下方的 JSON 設定。

玩家變黑與回色可在 Balance 調整 `player.color.darkenPerSecond`、`player.color.restorePerSecond`、`player.color.minimumBrightness`。在 Items 的 `restoresColor` 欄填 `1` 可讓該道具於 `effectDuration` 秒內逐漸恢復玩家原色，填 `0` 則不影響顏色。重複吃到回色道具會重新計時；效果到期後繼續變黑。

怪物生成可在 Balance 調整 `enemies.earlyAgeSpawnIntervalMultiplier`；目前未滿 `age.slowStart`（40 歲）時為 `0.8`，代表生成間隔是原本的 80%，40 歲起恢復目前的生成規則。

目前 NNE、BBB 會增加 42 點照亮範圍並讓玩家年輕 1 歲，YSS 會增加 48 點移動速度並讓玩家年輕 1 歲（降低有效年齡）。PPA 會清除玩家目前所有持續傷害，並在 5 秒內讓年齡造成的生命流失減少 50%。可在 Items 工作表調整 `ageReductionYears` 和 `clearsStatusEffects`。

## A. 單張圖片（沒有逐格動畫）

把圖放到：

```text
public/assets/player/player.png
```

修改 `assets.json` 的 `player.path`：

```json
"path": "assets/player/player.png"
```

檔名可以不同，但 `texture: "player"` 必須保留。

## B. Spritesheet 動畫

### 1. 圖片格式

把一張橫向 spritesheet 放到：

```text
public/assets/player/player-sheet.png
```

每格 64×64，總共 54 格：

```text
[idleDown 0-1 / walkDown 0-5]
[walkUp 6-11] [walkSide 12-17]
[hurt 18-23] [death 24-29]
[hurtUp 30-35] [hurtSide 36-41]
[deathUp 42-47] [deathSide 48-53]
```

### 2. assets.json

在 `player` 加入或修改：

```json
"path": "assets/player/player-sheet.png",
"spritesheet": { "frameWidth": 64, "frameHeight": 64 }
```

### 3. animations.json

只修改 frame 範圍和速度：

```json
"player": {
  "idle":  { "key": "player_idle",  "texture": "player", "startFrame": 0,  "endFrame": 1,  "frameRate": 6,  "repeat": -1 },
  "walk":  { "key": "player_walk",  "texture": "player", "startFrame": 0,  "endFrame": 5,  "frameRate": 10, "repeat": -1 },
  "idleDown": { "key": "player_idle_down", "texture": "player", "startFrame": 0, "endFrame": 1, "frameRate": 6, "repeat": -1 },
  "walkDown": { "key": "player_walk_down", "texture": "player", "startFrame": 0, "endFrame": 5, "frameRate": 10, "repeat": -1 },
  "walkUp": { "key": "player_walk_up", "texture": "player", "startFrame": 6, "endFrame": 11, "frameRate": 10, "repeat": -1 },
  "walkSide": { "key": "player_walk_side", "texture": "player", "startFrame": 12, "endFrame": 17, "frameRate": 10, "repeat": -1 },
  "hurt":  { "key": "player_hurt",  "texture": "player", "startFrame": 18, "endFrame": 23, "frameRate": 12, "repeat": 0 },
  "death": { "key": "player_death", "texture": "player", "startFrame": 24, "endFrame": 29, "frameRate": 9, "repeat": 0 },
  "hurtUp": { "key": "player_hurt_up", "texture": "player", "startFrame": 30, "endFrame": 35, "frameRate": 12, "repeat": 0 },
  "hurtSide": { "key": "player_hurt_side", "texture": "player", "startFrame": 36, "endFrame": 41, "frameRate": 12, "repeat": 0 },
  "deathUp": { "key": "player_death_up", "texture": "player", "startFrame": 42, "endFrame": 47, "frameRate": 9, "repeat": 0 },
  "deathSide": { "key": "player_death_side", "texture": "player", "startFrame": 48, "endFrame": 53, "frameRate": 9, "repeat": 0 }
}
```

## 只需要記住

```text
圖片位置：public/assets/...
圖片路徑：assets/...
每格大小：assets.json 的 spritesheet
動畫範圍：animations.json 的 startFrame / endFrame
```

`idleDown`、`walkDown`、`walkUp`、`walkSide`、`hurt`、`hurtUp`、`hurtSide`、`death`、`deathUp`、`deathSide` 這些名稱不要改。JSON 不可加入註解，也不要在最後一項加逗號。圖片找不到時會自動使用 Placeholder。

玩家使用橫向 54 格 spritesheet，每組 6 格：

```text
第 1 組：下 (0-5)
第 2 組：上 (6-11)
第 3 組：側面 (12-17，左右共用並翻轉)
第 4 組：正面受傷 (18-23)
第 5 組：正面死亡 (24-29)
第 6 組：背面受傷 (30-35)
第 7 組：側面受傷 (36-41，左右共用並翻轉)
第 8 組：背面死亡 (42-47)
第 9 組：側面死亡 (48-53，左右共用並翻轉)
```

## C. 新增怪物

### 沿用近戰行為（不用改程式）

在 `enemies.json` 的最外層加入：

```json
"fastEnemy": {
  "id": "fastEnemy", "name": "迅捷怪", "hp": 35, "speed": 190,
  "contactDamage": 8, "attackInterval": 0.6,
  "projectileSpeed": 0, "projectileDamage": 0, "range": 0,
  "preferredDistance": 0, "texture": "enemyMelee",
  "animations": "enemyMelee", "behavior": "melee", "spawnWeight": 0.2
}
```

這個例子會使用既有近戰圖片與動畫，但速度更快。`spawnWeight` 越大，隨機出現機率越高。

### 蚊子衝刺行為

`behavior` 填 `dashRetreat` 可以使用共用的「接近、衝刺、逃離、冷卻」行為。可調整欄位：

```text
triggerRange          觸發衝刺距離
dashSpeed             衝刺速度
dashEndDistance      未命中時，和玩家距離超過此值就回到追蹤
retreatSpeed          逃離速度
retreatDuration       逃離秒數
statusEffect          碰撞後狀態名稱
statusDamagePerSecond 狀態每秒傷害
statusDuration        狀態持續秒數
```

蚊子的 `statusEffect` 使用 `mosquitoBite`，玩家被撞到後每秒扣 2 點生命、持續 20 秒，單次最多扣 40 點。每次扣血時玩家外框會短暫閃紅，血條上方會顯示狀態和剩餘秒數。持續傷害不受提燈減傷影響；再次中叮咬時不會疊加 DPS，但會把剩餘時間延長到最多 20 秒。PPA 可清除目前的持續傷害狀態。

### 沿用遠程行為

把上面幾個欄位改成：

```json
"projectileSpeed": 300,
"projectileDamage": 16,
"range": 500,
"preferredDistance": 320,
"texture": "enemyRanged",
"animations": "enemyRanged",
"behavior": "ranged"
```

### 使用新圖片

先把圖片放入 `public/assets/enemies/`，再在 `assets.json` 加入同名設定：

```json
"enemyFast": {
  "texture": "enemyFast",
  "path": "assets/enemies/fast.png",
  "scale": 1,
  "origin": { "x": 0.5, "y": 0.5 },
  "depth": 5,
  "placeholder": { "shape": "circle", "color": 16753920, "width": 34, "height": 34 }
}
```

然後把 `enemies.json` 的 `texture` 改成 `enemyFast`。目前 `melee`、`ranged`、`dashRetreat` 是共用行為；分裂、召喚、改變地形等全新 AI 才需要工程師新增 `behavior` 程式。
