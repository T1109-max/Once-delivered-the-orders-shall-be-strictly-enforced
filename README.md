# 中文语音交互 2D 横版打怪小游戏 V2

本版本在 V2 基础上继续修改：加入更明显区分的技能专属音效，将「吹风」改名为「吹风」，并把「火焰」技能范围增大 10%。同时保留 `assets` 素材文件夹、开始界面视频、五关流程、关卡怪兽差异、技能解锁、第五关远程攻击、成功/失败结算视频。

## 一、文件结构

```text
chinese_voice_2d_game_v2/
├─ index.html
├─ style.css
├─ game.js
├─ server.py
├─ README.md
└─ assets/
   ├─ player.png
   ├─ bg_level_1.png ~ bg_level_5.png
   ├─ monster_l1_1.png ~ monster_l5_2.png
   ├─ skill_fire.png / skill_ice.png / ...
   ├─ start_intro.mp4
   ├─ win_ending.mp4
   └─ fail_ending.mp4
```

## 二、V3 新增修改

1. 每个技能现在都有不同节奏、频率和波形组合的专属音效。
2. 「吹风」技能已改名为「吹风」，语音关键词也改为「吹风」。
3. 「火焰」技能的命中范围和视觉范围都增大 10%。

## 三、新增功能对应说明

### 1. 所有游戏素材进入 assets 文件夹

新版中，主角、每关怪兽、背景、技能图标都从 `assets/` 文件夹读取。

如果你以后想替换素材，只需要保持文件名不变即可，例如：

```text
assets/player.png
assets/monster_l3_1.png
assets/bg_level_5.png
```

### 2. 开始界面视频

进入游戏前会显示开始界面，背景视频是：

```text
assets/start_intro.mp4
```

点击「进入游戏」后进入主程序，并启动语音识别。

### 3. 五关机制

游戏一共五关：

| 关卡 | 规则 |
|---|---|
| 第1关 | 两种第1关怪兽随机出现 |
| 第2关 | 两种第2关怪兽随机出现 |
| 第3关 | 两种第3关怪兽随机出现，怪物速度比前面快 5%，解锁「治愈」 |
| 第4关 | 两种第4关怪兽随机出现，解锁「重拳」 |
| 第5关 | 两种第5关怪兽随机出现，怪物可以远程攻击 |

### 4. 第五关远程攻击

第五关怪物会发射远程弹幕：

- 命中主角扣除 2 点生命值
- 如果主角有「护盾」，护盾会抵挡远程攻击
- 护盾抵挡后会消失

### 5. 技能解锁

| 技能 | 解锁关卡 |
|---|---|
| 火焰 | 第1关 |
| 寒冰 | 第1关 |
| 雷电 | 第1关 |
| 吹风 | 第1关 |
| 护盾 | 第1关 |
| 治愈 | 第3关 |
| 重拳 | 第4关 |

如果在未解锁关卡说「治愈」或「重拳」，游戏会显示技能解锁提示，不会释放技能。

### 6. 技能伤害加强

新版已经提高：

```js
iceDamage: 48
punchDamage: 88
```

## 三、运行步骤

1. 解压压缩包。
2. 用 VS Code 打开 `chinese_voice_2d_game_v2` 文件夹。
3. 打开 VS Code 终端。
4. 运行：

```bash
python server.py
```

如果系统使用 `python3`：

```bash
python3 server.py
```

5. 浏览器打开：

```text
http://localhost:8000
```

6. 点击「进入游戏」。
7. 允许麦克风权限。

## 四、推荐浏览器

推荐：

- Chrome
- Edge

不推荐 Safari / Firefox，因为 Web Speech Recognition 中文识别支持可能不完整。

## 五、关键词

```text
火焰
寒冰
雷电
吹风
护盾
治愈
重拳
```

## 六、参数修改位置

打开 `game.js`，顶部有 `CONFIG` 配置区。

### 修改总关卡数

默认是 5 关：

```js
totalLevels: 5
```

### 修改每关击杀数量

```js
killGoalByLevel: [8, 10, 12, 14, 16]
```

想让游戏更简单可以改成：

```js
killGoalByLevel: [5, 6, 7, 8, 9]
```

### 修改第三关速度提升

```js
level3SpeedBonus: 1.05
```

`1.05` 表示提升 5%。

### 修改第五关远程攻击伤害

```js
remoteDamage: 2
```

### 修改第五关远程弹幕间隔

```js
level5ShootGapMs: 2600
```

数值越小，攻击越频繁。

### 修改寒冰和重拳伤害

```js
iceDamage: 48
punchDamage: 88
```

### 修改技能解锁关卡

在 `SKILL_DEFS` 中修改：

```js
{ key: "治愈", type: "heal", unlockLevel: 3 }
{ key: "重拳", type: "punch", unlockLevel: 4 }
```

## 七、替换素材教程

### 替换怪兽图片

例如替换第三关第一种怪兽：

```text
assets/monster_l3_1.png
```

保持文件名不变，重新刷新网页即可。

### 替换开始界面视频

替换：

```text
assets/start_intro.mp4
```

保持文件名不变即可。

### 替换成功 / 失败视频

```text
assets/win_ending.mp4
assets/fail_ending.mp4
```

## 八、注意事项

1. 请使用 `http://localhost:8000` 运行，不建议直接双击 `index.html`。
2. 必须允许麦克风权限。
3. 背景音乐因为浏览器限制，需要手动点击右下角按钮开启。
4. 如果视频不播放，确认浏览器支持 mp4；当前视频是静音循环视频，适合浏览器自动播放。


## V3 参数补充

火焰范围在 `game.js` 顶部配置：

```js
fireRangeScale: 1.10
```

`1.10` 表示火焰范围比原来大 10%。


## V4 新增修改

本版本继续在 V3 基础上修改：

1. 技能特效已经改成图片素材，并放入：

```text
assets/effects/
```

对应文件：

```text
effect_fire.png
effect_ice.png
effect_thunder.png
effect_wind.png
effect_shield.png
effect_heal.png
effect_punch.png
```

后续你想替换火焰、寒冰、雷电、吹风、护盾、治愈、重拳的特效，只需要保持文件名不变，直接覆盖对应图片即可。

2. 技能音效和其他音效已经改成音频文件，并放入：

```text
assets/audio/
```

对应文件：

```text
skill_fire.wav
skill_ice.wav
skill_thunder.wav
skill_wind.wav
skill_shield.wav
skill_heal.wav
skill_punch.wav
monster_kill.wav
player_hurt.wav
shield_break.wav
bgm_loop.wav
```

3. 已加入整个游戏的循环背景音乐：

```text
assets/audio/bgm_loop.wav
```

右下角点击「音乐：关 / 开」即可开启或关闭背景音乐。

## 替换音频教程

例如你要替换火焰技能音效：

1. 准备一个新的音效文件。
2. 命名为：

```text
skill_fire.wav
```

3. 放入：

```text
assets/audio/
```

4. 覆盖原文件。
5. 刷新网页。

建议使用 `.wav` 文件。如果想使用 `.mp3`，需要同时修改 `game.js` 中 `ASSETS.audio` 里的路径。

## 替换技能特效图片教程

例如你要替换寒冰技能特效：

1. 准备一张透明背景 PNG 图片。
2. 命名为：

```text
effect_ice.png
```

3. 放入：

```text
assets/effects/
```

4. 覆盖原文件。
5. 刷新网页。

建议使用透明背景 `.png`，这样技能特效不会有白色方块背景。


## V5 新增修改

本版本在 V4 基础上继续增加：

### 1. 主人公释放技能时切换不同形态

所有主人公形态图片都放在：

```text
assets/player_forms/
```

包含：

```text
player_idle.png
player_fire.png
player_ice.png
player_thunder.png
player_wind.png
player_shield.png
player_heal.png
player_punch.png
```

对应关系：

| 文件名 | 用途 |
|---|---|
| player_idle.png | 默认待机形态 |
| player_fire.png | 释放火焰时的形态 |
| player_ice.png | 释放寒冰时的形态 |
| player_thunder.png | 释放雷电时的形态 |
| player_wind.png | 释放吹风时的形态 |
| player_shield.png | 释放护盾时的形态 |
| player_heal.png | 释放治愈时的形态 |
| player_punch.png | 释放重拳时的形态 |

后续你只需要把新图片改成同样文件名，放入 `assets/player_forms/` 覆盖原文件，就能替换对应形态。

建议使用透明背景 PNG 图片。

### 2. 技能释放灵敏度提高

已做三处优化：

1. 技能公共冷却从 `500ms` 降到 `360ms`。
2. 语音识别候选数量从 1 个提高到 3 个。
3. 语音识别断开后的自动重连延迟从 `300ms` 降到 `80ms`。
4. 加入常见中文识别近似词，例如「来电」也能识别为「雷电」，「韩冰」也能识别为「寒冰」。

如果还想更灵敏，可以在 `game.js` 顶部继续调低：

```js
globalCdMs: 360
```

例如改成：

```js
globalCdMs: 280
```

但太低可能导致一次喊话触发太频繁。


## V6 新增修改：解决识别错技能和延迟

本版本重点优化语音识别：

### 1. 删除容易误触发的单字识别

V5 中为了提高灵敏度，加入了「冰」「雷」「吹」「护」「拳」这类单字容错。  
这些词太短，容易把普通说话误识别成技能，所以 V6 已经删除。

现在主要识别：

```text
火焰 / 寒冰 / 雷电 / 吹风 / 护盾 / 治愈 / 重拳
```

同时保留少量两字以上近似词，例如：

```text
韩冰 → 寒冰
来电 → 雷电
治疗 → 治愈
中拳 → 重拳
```

### 2. 多候选只选最可靠技能

浏览器语音识别会同时返回多个候选结果。  
V6 改成先比较候选，再只释放最可靠的一个技能，减少识别错技能。

### 3. 延迟继续降低

已修改：

```text
技能公共冷却：360ms → 280ms
语音候选数量：3 个 → 5 个
语音重连延迟：80ms → 40ms
```

### 4. 增加“识别：技能名”短提示

每次成功释放技能时，会短暂显示识别到的技能名，方便你判断是否识别错。


## V7 小修正：左侧怪兽自动镜像

本版本修正怪兽朝向问题：

- `assets/monster_l*_*.png` 默认作为“右侧来的怪兽图片”使用。
- 如果怪兽从屏幕左侧出生，代码会在绘制时对该图片进行水平镜像。
- 你后续只需要替换一套怪兽图片，不需要额外准备左方向和右方向两套素材。
