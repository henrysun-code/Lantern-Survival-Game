# 換圖與動畫：最短流程

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

每格 64×64，總共 15 格：

```text
[idle 0] [idle 1] [walk 2] [walk 3] [walk 4] [walk 5] [walk 6]
[hurt 7] [hurt 8] [hurt 9] [death 10] [death 11] [death 12] [death 13] [death 14]
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
  "walk":  { "key": "player_walk",  "texture": "player", "startFrame": 2,  "endFrame": 6,  "frameRate": 10, "repeat": -1 },
  "hurt":  { "key": "player_hurt",  "texture": "player", "startFrame": 7,  "endFrame": 9,  "frameRate": 12, "repeat": 0 },
  "death": { "key": "player_death", "texture": "player", "startFrame": 10, "endFrame": 14, "frameRate": 9,  "repeat": 0 }
}
```

## 只需要記住

```text
圖片位置：public/assets/...
圖片路徑：assets/...
每格大小：assets.json 的 spritesheet
動畫範圍：animations.json 的 startFrame / endFrame
```

`idleDown`、`walkDown`、`walkUp`、`walkSide`、`hurt`、`death` 這些名稱不要改。JSON 不可加入註解，也不要在最後一項加逗號。圖片找不到時會自動使用 Placeholder。

玩家建議使用 5 列、每列 6 格的 spritesheet（共 30 格）：

```text
第 1 列：下 (0-5)
第 2 列：上 (6-11)
第 3 列：側面 (12-17，左右共用並翻轉)
第 4 列：受傷 (18-23)
第 5 列：死亡 (24-29)
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

然後把 `enemies.json` 的 `texture` 改成 `enemyFast`。若新怪物有完全不同的 AI（例如衝刺、分裂、召喚），才需要工程師新增 `behavior` 程式；單純調整血量、速度、傷害、射程與外觀都不需要改核心程式。
