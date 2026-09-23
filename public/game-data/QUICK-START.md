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
[idle 0] [walk 1] [walk 2] [walk 3] [walk 4] [walk 5] [walk 6]
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
  "idle":  { "key": "player_idle",  "texture": "player", "startFrame": 0,  "endFrame": 0,  "frameRate": 6,  "repeat": -1 },
  "walk":  { "key": "player_walk",  "texture": "player", "startFrame": 1,  "endFrame": 6,  "frameRate": 10, "repeat": -1 },
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

`idle`、`walk`、`hurt`、`death` 這四個名稱不要改。JSON 不可加入註解，也不要在最後一項加逗號。圖片找不到時會自動使用 Placeholder。
