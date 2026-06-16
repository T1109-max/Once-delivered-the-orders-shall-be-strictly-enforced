/**
 * 中文语音交互 2D 横版打怪小游戏 V2
 * 新增内容：
 * 1. 所有角色/怪兽/背景/技能图标素材统一从 assets 文件夹读取。
 * 2. 增加开始界面视频，点击「进入游戏」后进入主程序。
 * 3. 固定五关，每关两种不同怪兽随机出现。
 * 4. 第三关开始怪物速度比前两关快 5%。
 * 5. 第五关怪物远程攻击，护盾可化解，命中扣 2 生命值。
 * 6. 治愈第三关解锁，重拳第四关解锁，并提高重拳、寒冰伤害。
 * 7. 吹风技能已改名为吹风；火焰范围提升 10%；每个技能拥有更明显区分的独立音效。
 * 7. 五关通关后播放成功结算视频；中途死亡播放失败视频。
 */

/* ============================================================
   一、统一配置区：修改难度、血量、伤害都集中在这里
============================================================ */
const CONFIG = {
  totalLevels: 5,
  player: {
    maxHp: 100,
    radius: 28,
    touchDamage: 12,
    remoteDamage: 2,
    hurtInvincibleMs: 650,
    remoteInvincibleMs: 220,
  },
  monster: {
    baseHp: 40,
    strongHp: 74,
    baseSpeed: 34,
    strongSpeed: 44,
    scoreA: 12,
    scoreB: 18,
    spawnGapMs: 700,
    level3SpeedBonus: 1.05,
  },
  wave: {
    // 每关需要击败的怪物数量，休闲模式不要太难
    killGoalByLevel: [8, 10, 12, 14, 16],
    maxAlive: 8,
    nextLevelDelayMs: 1400,
  },
  skill: {
    globalCdMs: 100,  // V6：进一步降低公共冷却，减少技能释放卡顿感
    fireDamage: 34,
    fireBurnDamage: 8,
    fireRangeScale: 1.10,  // 火焰技能范围增大 10%
    iceDamage: 48,       // 已提高寒冰伤害
    thunderDamage: 42,
    windDamage: 28,
    healAmount: 24,      // 第三关才出现
    punchDamage: 88,     // 已提高重拳伤害，第四关才出现
    punchKnockback: 140,
  },
  remote: {
    level5ShootGapMs: 2600,
    projectileSpeed: 170,
  },
};

/* 所有素材路径统一写在这里 */
const ASSETS = {
  player: "assets/player.png",
  playerForms: {
    idle: "assets/player_forms/player_idle.png",
    fire: "assets/player_forms/player_fire.png",
    ice: "assets/player_forms/player_ice.png",
    thunder: "assets/player_forms/player_thunder.png",
    wind: "assets/player_forms/player_wind.png",
    shield: "assets/player_forms/player_shield.png",
    heal: "assets/player_forms/player_heal.png",
    punch: "assets/player_forms/player_punch.png",
  },
  bg: [1,2,3,4,5].map(n => `assets/bg_level_${n}.png`),
  monsters: {
    1: ["assets/monster_l1_1.png", "assets/monster_l1_2.png"],
    2: ["assets/monster_l2_1.png", "assets/monster_l2_2.png"],
    3: ["assets/monster_l3_1.png", "assets/monster_l3_2.png"],
    4: ["assets/monster_l4_1.png", "assets/monster_l4_2.png"],
    5: ["assets/monster_l5_1.png", "assets/monster_l5_2.png"],
  },
  icons: {
    fire: "assets/skill_fire.png",
    ice: "assets/skill_ice.png",
    thunder: "assets/skill_thunder.png",
    wind: "assets/skill_wind.png",
    shield: "assets/skill_shield.png",
    heal: "assets/skill_heal.png",
    punch: "assets/skill_punch.png",
  },
  effects: {
    fire: "assets/effects/effect_fire.png",
    ice: "assets/effects/effect_ice.png",
    thunder: "assets/effects/effect_thunder.png",
    wind: "assets/effects/effect_wind.png",
    shield: "assets/effects/effect_shield.png",
    heal: "assets/effects/effect_heal.png",
    punch: "assets/effects/effect_punch.png",
  },
  audio: {
    bgm: "assets/audio/bgm_loop.wav",
    fire: "assets/audio/skill_fire.wav",
    ice: "assets/audio/skill_ice.wav",
    thunder: "assets/audio/skill_thunder.wav",
    wind: "assets/audio/skill_wind.wav",
    shield: "assets/audio/skill_shield.wav",
    heal: "assets/audio/skill_heal.wav",
    punch: "assets/audio/skill_punch.wav",
    kill: "assets/audio/monster_kill.wav",
    hurt: "assets/audio/player_hurt.wav",
    shieldBreak: "assets/audio/shield_break.wav",
  },
  videos: {
    start: "assets/start_intro.mp4",
    win: "assets/win_ending.mp4",
    fail: "assets/fail_ending.mp4",
  }
};

/* 技能表：unlockLevel 控制技能出现关卡 */
const SKILL_DEFS = [
  { key: "火焰", type: "fire", unlockLevel: 1, color: "#F2A65A" },
  { key: "寒冰", type: "ice", unlockLevel: 1, color: "#74B7D9" },
  { key: "雷电", type: "thunder", unlockLevel: 1, color: "#A98BD8" },
  { key: "吹风", type: "wind", unlockLevel: 1, color: "#67C7B4" },
  { key: "护盾", type: "shield", unlockLevel: 1, color: "#FFFFFF" },
  { key: "治愈", type: "heal", unlockLevel: 3, color: "#F7FFF9" },
  { key: "重拳", type: "punch", unlockLevel: 4, color: "#D9A47E" },
];

/* ============================================================
   二、通用工具和素材加载模块
============================================================ */
const Utils = {
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  rand(min, max) { return Math.random() * (max - min) + min; },
  dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
  now() { return performance.now(); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
};

class AssetLoader {
  constructor() {
    this.images = {};
  }

  loadImage(key, src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this.images[key] = img; resolve(); };
      img.onerror = () => { console.warn("素材加载失败：", src); resolve(); };
      img.src = src;
    });
  }

  async loadAll() {
    const list = [];
    list.push(["player", ASSETS.player]);
    Object.entries(ASSETS.playerForms).forEach(([k, src]) => list.push([`player_${k}`, src]));
    ASSETS.bg.forEach((src, i) => list.push([`bg${i+1}`, src]));
    for (let level = 1; level <= 5; level++) {
      ASSETS.monsters[level].forEach((src, i) => list.push([`monster${level}_${i+1}`, src]));
    }
    Object.entries(ASSETS.icons).forEach(([k, src]) => list.push([`icon_${k}`, src]));
    Object.entries(ASSETS.effects).forEach(([k, src]) => list.push([`effect_${k}`, src]));
    await Promise.all(list.map(([k, src]) => this.loadImage(k, src)));
  }

  get(key) {
    return this.images[key];
  }
}

/* ============================================================
   三、音频模块：WebAudio 合成音效和简易背景音乐
============================================================ */
class AudioManager {
  constructor() {
    // 音效与背景音乐都从 assets/audio 文件夹读取，方便后续直接替换
    this.sounds = {};
    this.bgm = null;
    this.musicOn = false;
    this.ctx = null; // 保留兜底合成音，防止音频文件加载失败
    this.masterGain = null;
    this.loadAssetAudio();
  }

  loadAssetAudio() {
    const make = (src, loop = false, volume = 0.45) => {
      const a = new Audio(src);
      a.preload = "auto";
      a.loop = loop;
      a.volume = volume;
      return a;
    };
    this.sounds.fire = make(ASSETS.audio.fire, false, 0.12);
this.sounds.ice = make(ASSETS.audio.ice, false, 0.12);
this.sounds.thunder = make(ASSETS.audio.thunder, false, 0.12);
this.sounds.wind = make(ASSETS.audio.wind, false, 0.12);
this.sounds.shield = make(ASSETS.audio.shield, false, 0.10);
this.sounds.heal = make(ASSETS.audio.heal, false, 0.10);
this.sounds.punch = make(ASSETS.audio.punch, false, 0.12);
this.sounds.kill = make(ASSETS.audio.kill, false, 0.08);
this.sounds.hurt = make(ASSETS.audio.hurt, false, 0.04);
this.sounds.shieldBreak = make(ASSETS.audio.shieldBreak, false, 0.04);
    this.bgm = make(ASSETS.audio.bgm, true, 0.25);
  }

  ensure() {
    // 解锁浏览器音频播放权限，并预热音频
    for (const a of Object.values(this.sounds)) {
      try {
        a.load();
      } catch (e) {}
    }
    if (this.bgm) {
      try { this.bgm.load(); } catch (e) {}
    }

    // 兜底 WebAudio：如果音频文件播放失败，仍然有简易音效
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.18;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  playAsset(name) {
    const src = this.sounds[name];
    if (!src) return false;
    try {
      const a = src.cloneNode(true);
      a.volume = src.volume;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  }

  tone(freq = 440, duration = 0.08, type = "sine", volume = 0.20) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type === "saw" ? "sawtooth" : type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  fallbackSkill(type) {
    const map = {
      fire: [260, "sawtooth"],
      ice: [740, "triangle"],
      thunder: [150, "square"],
      wind: [430, "sine"],
      shield: [640, "sine"],
      heal: [880, "triangle"],
      punch: [95, "square"],
    };
    const [f, wave] = map[type] || [440, "sine"];
    this.tone(f, 0.09, wave, 0.20);
    setTimeout(() => this.tone(f * 1.35, 0.08, "sine", 0.12), 65);
  }

  skill(type) {
    // 优先播放 assets/audio/skill_xxx.wav，方便你直接替换音效
    if (!this.playAsset(type)) this.fallbackSkill(type);
  }

  kill() {
    if (!this.playAsset("kill")) this.tone(760, 0.08, "triangle", 0.18);
  }

  hurt() {
    if (!this.playAsset("hurt")) this.tone(110, 0.12, "square", 0.24);
  }

  shieldBreak() {
    if (!this.playAsset("shieldBreak")) this.tone(300, 0.12, "triangle", 0.18);
  }

  toggleMusic() {
    this.ensure();
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.startMusic();
    else this.stopMusic();
    return this.musicOn;
  }

  startMusic() {
    if (!this.bgm) return;
    try {
      this.bgm.currentTime = 0;
      const p = this.bgm.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  stopMusic() {
    if (!this.bgm) return;
    try {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    } catch (e) {}
  }
}

/* ============================================================
   四、玩家模块
============================================================ */
class Player {
  constructor(game) {
    this.game = game;
    this.reset();
  }
  reset() {
    this.hp = CONFIG.player.maxHp;
    this.shield = false;
    this.shieldPulse = 0;
    this.castingMs = 0;
    this.hurtMs = 0;
    this.touchInvincibleMs = 0;
    this.remoteInvincibleMs = 0;

    // V5：主人公形态。释放技能时会临时切换到对应形态图片。
    this.currentForm = "idle";
    this.formTimerMs = 0;
  }
  get x() { return this.game.w / 2; }
  get y() { return this.game.h * 0.70; }

  cast(type = "idle") {
    this.castingMs = 260;
    this.currentForm = type;
    this.formTimerMs = 520;
  }

  addShield() { this.shield = true; this.shieldPulse = 0; }
  heal() { this.hp = Utils.clamp(this.hp + CONFIG.skill.healAmount, 0, CONFIG.player.maxHp); }

  takeDamage(amount, invType = "touch") {
    if (this.shield) {
      this.shield = false;
      this.game.audio.shieldBreak();
      this.game.spawnParticles(this.x, this.y - 10, "#FFFFFF", 24);
      return false;
    }
    if (invType === "touch") {
      if (this.touchInvincibleMs > 0) return false;
      this.touchInvincibleMs = CONFIG.player.hurtInvincibleMs;
    } else {
      if (this.remoteInvincibleMs > 0) return false;
      this.remoteInvincibleMs = CONFIG.player.remoteInvincibleMs;
    }
    this.hurtMs = 260;
    this.hp = Utils.clamp(this.hp - amount, 0, CONFIG.player.maxHp);
    this.game.audio.hurt();
    if (this.hp <= 0) this.game.endGame(false);
    return true;
  }

  update(dt) {
    this.castingMs = Math.max(0, this.castingMs - dt * 1000);
    this.hurtMs = Math.max(0, this.hurtMs - dt * 1000);
    this.touchInvincibleMs = Math.max(0, this.touchInvincibleMs - dt * 1000);
    this.remoteInvincibleMs = Math.max(0, this.remoteInvincibleMs - dt * 1000);

    this.formTimerMs = Math.max(0, this.formTimerMs - dt * 1000);
    if (this.formTimerMs <= 0) this.currentForm = "idle";

    this.shieldPulse += dt * 4.2;
  }

  draw(ctx) {
    const img = this.game.assets.get(`player_${this.currentForm}`) || this.game.assets.get("player");
    const t = this.game.time;
    const floatY = Math.sin(t * 3.2) * 5;
    const castOffset = this.castingMs > 0 ? Math.sin(t * 34) * 4 : 0;
    const shake = this.hurtMs > 0 ? Math.sin(t * 90) * 5 : 0;
    const x = this.x + shake;
    const y = this.y + floatY + castOffset;

    if (this.shield) {
      const r = 54 + Math.sin(this.shieldPulse) * 3;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y - 8, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    if (img) {
      ctx.save();
      ctx.translate(x, y);
      if (this.castingMs > 0) ctx.rotate(Math.sin(t * 24) * 0.04);
      ctx.drawImage(img, -100, -176, 200, 200);
      ctx.restore();
    } else {
      ctx.fillStyle = "#8AA899";
      ctx.beginPath();
      ctx.arc(x, y - 36, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ============================================================
   五、怪物模块：每关两种不同图片随机出现
============================================================ */
class Monster {
  constructor(game, kind = 1) {
    this.game = game;
    this.level = game.level;
    this.kind = kind;
    this.r = kind === 2 ? 30 : 24;
    this.maxHp = kind === 2 ? CONFIG.monster.strongHp : CONFIG.monster.baseHp;
    this.hp = this.maxHp;
    let speed = kind === 2 ? CONFIG.monster.strongSpeed : CONFIG.monster.baseSpeed;
    if (this.level >= 3) speed *= CONFIG.monster.level3SpeedBonus; // 第三关起速度 +5%
    speed *= 1 + (this.level - 1) * 0.025; // 轻微关卡成长，难度慢慢提升
    this.speed = speed;
    this.frozenMs = 0;
    this.burnMs = 0;
    this.hitFlashMs = 0;
    this.remoteTimer = Utils.rand(900, CONFIG.remote.level5ShootGapMs);

    const fromLeft = Math.random() < 0.5;
    // V7：记录怪兽出生方向。左侧出生的怪兽绘制时会基于右侧怪兽图进行水平镜像。
    this.fromLeft = fromLeft;
    this.x = fromLeft ? -this.r - 12 : game.w + this.r + 12;
    this.y = Utils.rand(game.h * 0.52, game.h * 0.78);
    this.wobble = Utils.rand(0, 9);
  }
  get imgKey() { return `monster${this.level}_${this.kind}`; }
  damage(amount, extra = {}) {
    this.hp -= amount;
    this.hitFlashMs = 130;
    if (extra.freeze) this.frozenMs = Math.max(this.frozenMs, 1000);
    if (extra.burn) this.burnMs = Math.max(this.burnMs, 1200);
    if (extra.knockback) {
      const dir = this.x < this.game.player.x ? -1 : 1;
      this.x += dir * extra.knockback;
    }
    if (this.hp <= 0) this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true;
    this.game.levelKills++;
    this.game.totalKills++;
    this.game.score += this.kind === 2 ? CONFIG.monster.scoreB : CONFIG.monster.scoreA;
    this.game.unlockAchievement(this.level, this.kind);
    this.game.audio.kill();
    this.game.spawnParticles(this.x, this.y, this.kind === 2 ? "#D7B5EA" : "#B8D8BA", 20);
  }
  update(dt) {
    if (this.dead) return;
    this.hitFlashMs = Math.max(0, this.hitFlashMs - dt * 1000);
    this.frozenMs = Math.max(0, this.frozenMs - dt * 1000);
    this.burnMs = Math.max(0, this.burnMs - dt * 1000);

    if (this.burnMs > 0) {
      this._burnTick = (this._burnTick || 0) + dt;
      if (this._burnTick >= 0.4) {
        this._burnTick = 0;
        this.hp -= CONFIG.skill.fireBurnDamage;
        this.game.spawnParticles(this.x, this.y, "#F2A65A", 2);
        if (this.hp <= 0) this.die();
      }
    }

    const p = this.game.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const slow = this.frozenMs > 0 ? 0.16 : 1;

    this.x += (dx / len) * this.speed * slow * dt;
    this.y += (dy / len) * this.speed * slow * dt;

    // 第五关：怪物会远程攻击，护盾可化解，命中扣 2 血
    if (this.level === 5) {
      this.remoteTimer -= dt * 1000;
      if (this.remoteTimer <= 0) {
        this.remoteTimer = CONFIG.remote.level5ShootGapMs + Utils.rand(-450, 450);
        this.game.enemyProjectiles.push(new EnemyProjectile(this.game, this.x, this.y - 8));
      }
    }

    // 近身触碰攻击
    if (Utils.dist(this, p) < this.r + CONFIG.player.radius) {
      const blockedOrHurt = p.takeDamage(CONFIG.player.touchDamage, "touch");
      const dir = this.x < p.x ? -1 : 1;
      this.x += dir * (p.shield ? 85 : 65);
    }
  }
  draw(ctx) {
    if (this.dead) return;
    const img = this.game.assets.get(this.imgKey);
    const t = this.game.time + this.wobble;
    const bob = Math.sin(t * 4) * 3;
    const size = this.kind === 2 ? 88 : 72;

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    if (this.frozenMs > 0) ctx.globalAlpha = 0.78;
    if (this.hitFlashMs > 0) {
      ctx.filter = "brightness(1.35)";
    }
    if (img) {
      // V7：素材默认按“右侧来的怪兽”方向绘制。
      // 如果怪兽从左侧出生，就在原图基础上水平镜像，避免左右两边朝向不一致。
      ctx.save();
      if (this.fromLeft) ctx.scale(-1, 1);
      ctx.drawImage(img, -size/2, -size/2 - 8, size, size);
      ctx.restore();
    } else {
      ctx.fillStyle = this.kind === 2 ? "#B59BCF" : "#A8C7A1";
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = "none";

    // 血条
    const barW = size * 0.78;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    roundRect(ctx, -barW / 2, -size/2 - 20, barW, 6, 3);
    ctx.fill();
    ctx.fillStyle = this.kind === 2 ? "#8D6DB1" : "#79A770";
    roundRect(ctx, -barW / 2, -size/2 - 20, barW * Utils.clamp(this.hp / this.maxHp, 0, 1), 6, 3);
    ctx.fill();

    if (this.frozenMs > 0) {
      ctx.strokeStyle = "#7EC8E3";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* 第五关怪物远程弹幕 */
class EnemyProjectile {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    const p = game.player;
    const dx = p.x - x;
    const dy = (p.y - 12) - y;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = dx / len * CONFIG.remote.projectileSpeed;
    this.vy = dy / len * CONFIG.remote.projectileSpeed;
    this.r = 8;
    this.dead = false;
    this.life = 4;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Utils.dist(this, this.game.player) < this.r + CONFIG.player.radius) {
      this.dead = true;
      this.game.player.takeDamage(CONFIG.player.remoteDamage, "remote");
      this.game.spawnParticles(this.x, this.y, "#FFFFFF", 8);
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#D9C8A8";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ============================================================
   六、技能模块
============================================================ */
class SkillManager {
  constructor(game) {
    this.game = game;
    this.lastCastAt = -9999;
    this.cdMap = {};
    for (const s of SKILL_DEFS) this.cdMap[s.type] = 0;
  }

  update(dt) {
    for (const key in this.cdMap) {
      this.cdMap[key] = Math.max(0, this.cdMap[key] - dt * 1000);
    }
  }

  isUnlocked(type) {
    const def = SKILL_DEFS.find(s => s.type === type);
    return def && this.game.level >= def.unlockLevel;
  }

  normalizeSkillText(text, confidence = 1) {
  /*
   * 稳定版语音识别：
   * 1. 不用单字触发，避免识别错技能。
   * 2. 不依赖 confidence，因为中文语音识别的 confidence 很不稳定。
   * 3. 只识别明确口令，减少乱放技能。
   */

  const clean = (text || "")
    .replace(/\s/g, "")
    .replace(/[，。！？、,.!?]/g, "");

  if (!clean) return null;

  const commandMap = [
    {
      type: "fire",
      words: ["火焰", "火炎", "喷火", "烈火"]
    },
    {
      type: "ice",
      words: ["寒冰", "冰冻", "结冰", "冰封"]
    },
    {
      type: "thunder",
      words: ["雷电", "闪电", "放电", "打雷"]
    },
    {
      type: "wind",
      words: ["吹风", "大风", "风刃", "狂风"]
    },
    {
      type: "shield",
      words: ["护盾", "开盾", "防御", "保护"]
    },
    {
      type: "heal",
      words: ["治愈", "治疗", "回血", "加血"]
    },
    {
      type: "punch",
      words: ["重拳", "出拳", "打拳", "拳击"]
    }
  ];

  for (const item of commandMap) {
    if (item.words.some(w => clean.includes(w))) {
      return SKILL_DEFS.find(s => s.type === item.type);
    }
  }

  return null;
}

  pickBestSkillFromResult(result) {
  /*
   * 稳定版：
   * 不再复杂打分。
   * 从第一个候选开始，只要发现明确口令，立刻返回。
   */

  for (let j = 0; j < result.length; j++) {
    const transcript = (result[j].transcript || "").replace(/\s/g, "");
    const skill = this.normalizeSkillText(transcript, 1);

    if (skill) {
      return {
        skill,
        text: transcript,
        confidence: 1,
        score: 1
      };
    }
  }

  return null;
}
  tryCastByText(text, confidence = 1) {
    if (!text || this.game.state !== "playing") return false;

    const hit = this.normalizeSkillText(text, confidence);
    if (!hit) return false;

    if (!this.isUnlocked(hit.type)) {
      this.game.showTip(`${hit.key} 技能第 ${hit.unlockLevel} 关解锁`, 800);
      return false;
    }

    const now = Utils.now();
    if (now - this.lastCastAt < CONFIG.skill.globalCdMs) return false;

    this.lastCastAt = now;
    this.cdMap[hit.type] = CONFIG.skill.globalCdMs;
    this.cast(hit.type);
    this.game.showRecognizedSkill(hit.key);
    return true;
  }
castDirectlyFromVoice(skill) {
  // 语音识别专用：识别到明确技能后直接释放
  if (!skill || this.game.state !== "playing") return false;

  if (!this.isUnlocked(skill.type)) {
    this.game.showTip(`${skill.key} 技能第 ${skill.unlockLevel} 关解锁`, 800);
    return false;
  }

  const now = Utils.now();

  if (now - this.lastCastAt < CONFIG.skill.globalCdMs) {
    return false;
  }

  this.lastCastAt = now;
  this.cdMap[skill.type] = CONFIG.skill.globalCdMs;

  this.cast(skill.type);
  this.game.showRecognizedSkill(skill.key);

  return true;
}
  cast(type) {
    const g = this.game, p = g.player;
    p.cast(type);
    g.audio.skill(type);
    g.recordSkillUse(type);

    if (type === "fire") this.fire();
    if (type === "ice") this.ice();
    if (type === "thunder") this.thunder();
    if (type === "wind") this.wind();
    if (type === "shield") this.shield();
    if (type === "heal") this.heal();
    if (type === "punch") this.punch();
  }

  fire() {
    const g = this.game, p = g.player;
    g.effects.push(new ImageEffect(g, "fire", p.x, p.y - 12, 280 * CONFIG.skill.fireRangeScale, 0.36, { scaleStart: 0.65, scaleGrow: 0.45 }));
    for (const m of g.monsters) {
      if (!m.dead && Utils.dist(m, p) < 255 * CONFIG.skill.fireRangeScale && Math.abs(m.y - p.y) < 170 * CONFIG.skill.fireRangeScale) {
        m.damage(CONFIG.skill.fireDamage, { burn: true });
      }
    }
  }

  ice() {
    const g = this.game, p = g.player;
    g.projectiles.push(new Projectile(g, p.x, p.y - 30, -1, "ice"));
    g.projectiles.push(new Projectile(g, p.x, p.y - 30, 1, "ice"));
  }

  thunder() {
    const g = this.game, p = g.player;
    const targets = g.monsters
      .filter(m => !m.dead && Utils.dist(m, p) < 370)
      .sort((a,b) => Utils.dist(a,p) - Utils.dist(b,p))
      .slice(0, 5);

    if (!targets.length) {
      g.effects.push(new ImageEffect(g, "thunder", p.x, p.y - 20, 110, 0.35, { rotate: 0.6 }));
      return;
    }

    for (const m of targets) {
      m.damage(CONFIG.skill.thunderDamage);
      g.effects.push(new LightningLineEffect(g, p.x, p.y - 35, m.x, m.y, "#A98BD8"));
    }
  }

  wind() {
    const g = this.game, p = g.player;
    g.projectiles.push(new Projectile(g, p.x, p.y - 22, -1, "wind"));
    g.projectiles.push(new Projectile(g, p.x, p.y - 22, 1, "wind"));
  }

  shield() {
    const g = this.game, p = g.player;
    p.addShield();
    g.effects.push(new ImageEffect(g, "shield", p.x, p.y - 8, 120, 0.48, { scaleStart: 0.72, scaleGrow: 0.35 }));
    g.spawnParticles(p.x, p.y - 8, "#FFFFFF", 18);
  }

  heal() {
    const g = this.game, p = g.player;
    p.heal();
    g.effects.push(new ImageEffect(g, "heal", p.x, p.y - 20, 130, 0.65, { scaleStart: 0.55, scaleGrow: 0.55 }));
    g.spawnParticles(p.x, p.y - 22, "#F7FFF9", 24);
  }

  punch() {
    const g = this.game, p = g.player;
    g.effects.push(new ImageEffect(g, "punch", p.x, p.y - 18, 170, 0.24, { scaleStart: 0.65, scaleGrow: 0.45 }));
    for (const m of g.monsters) {
      if (!m.dead && Utils.dist(m, p) < 145) {
        m.damage(CONFIG.skill.punchDamage, { knockback: CONFIG.skill.punchKnockback });
      }
    }
  }
}

/* ============================================================
   七、弹道与特效
============================================================ */
class Projectile {
  constructor(game, x, y, dir, type) {
    this.game = game; this.x = x; this.y = y; this.dir = dir; this.type = type;
    this.dead = false; this.life = 1.8; this.hitSet = new Set();
    this.speed = type === "ice" ? 435 : 510;
    this.r = type === "ice" ? 10 : 13;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    this.x += this.dir * this.speed * dt;
    if (this.x < -60 || this.x > this.game.w + 60) this.dead = true;
    for (const m of this.game.monsters) {
      if (m.dead || this.hitSet.has(m)) continue;
      if (Utils.dist(this, m) < this.r + m.r) {
        this.hitSet.add(m);
        if (this.type === "ice") {
          m.damage(CONFIG.skill.iceDamage, { freeze: true });
          this.game.effects.push(new ImageEffect(this.game, "ice", m.x, m.y, 58, 0.35));
          this.dead = true;
        } else {
          m.damage(CONFIG.skill.windDamage);
          this.game.effects.push(new ImageEffect(this.game, "wind", m.x, m.y, 54, 0.32));
        }
      }
    }
  }
  draw(ctx) {
    const img = this.game.assets.get(`effect_${this.type}`);
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.dir < 0) ctx.scale(-1, 1);
    if (img) {
      const size = this.type === "ice" ? 54 : 64;
      ctx.drawImage(img, -size/2, -size/2, size, size);
    } else {
      ctx.fillStyle = this.type === "ice" ? "#74B7D9" : "#67C7B4";
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class ImageEffect {
  constructor(game, type, x, y, size = 120, life = 0.45, options = {}) {
    this.game = game;
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.options = options;
  }
  update(dt) { this.life -= dt; }
  draw(ctx) {
    const img = this.game.assets.get(`effect_${this.type}`);
    const k = 1 - this.life / this.maxLife;
    const scale = (this.options.scaleStart || 0.72) + k * (this.options.scaleGrow || 0.48);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.translate(this.x, this.y);
    if (this.options.rotate) ctx.rotate(this.game.time * this.options.rotate);
    if (this.options.flipX) ctx.scale(-1, 1);
    if (img) {
      const s = this.size * scale;
      ctx.drawImage(img, -s/2, -s/2, s, s);
    } else {
      ctx.fillStyle = this.options.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class LightningLineEffect {
  constructor(game, x1, y1, x2, y2, color) {
    this.game = game;
    this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2; this.color = color;
    this.life = 0.22; this.maxLife = 0.22;
  }
  update(dt){ this.life -= dt; }
  draw(ctx){
    const img = this.game.assets.get("effect_thunder");
    const mx = (this.x1 + this.x2) / 2;
    const my = (this.y1 + this.y2) / 2;
    const len = Math.hypot(this.x2 - this.x1, this.y2 - this.y1);
    const angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
    ctx.save();
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.translate(mx, my);
    ctx.rotate(angle);
    if (img) {
      ctx.drawImage(img, -len/2, -34, len, 68);
    } else {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-len/2, 0);
      ctx.lineTo(len/2, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x=x; this.y=y; this.vx=Utils.rand(-90,90); this.vy=Utils.rand(-120,35);
    this.life=Utils.rand(0.35,0.9); this.maxLife=this.life; this.r=Utils.rand(2,5); this.color=color;
  }
  update(dt) { this.life-=dt; this.x+=this.vx*dt; this.y+=this.vy*dt; this.vy+=85*dt; }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha=Utils.clamp(this.life/this.maxLife,0,1);
    ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}





/* ============================================================
   八、语音识别模块
============================================================ */
/* ============================================================
   八、语音识别模块：低延迟稳定版
============================================================ */
class VoiceRecognizer {
  constructor(game) {
    this.game = game;
    this.recognition = null;
    this.shouldRun = false;
    this.supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    this.statusEl = document.getElementById("voiceStatus");

    this.lastSkillType = "";
    this.lastSkillAt = 0;
    this.restartTimer = null;
    this.isStarting = false;
  }

  createRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();

    recognition.lang = "zh-CN";
    recognition.continuous = true;

    // 临时结果打开，能更快收到半句话
    recognition.interimResults = true;

    // 不要太多候选，候选太多反而卡、反而容易错
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      this.isStarting = false;
      this.setStatus("语音：监听中");
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        this.setStatus("语音：无权限");
        this.game.showTip("请允许麦克风权限", 3000);
        this.shouldRun = false;
        return;
      }

      this.setStatus("语音：重连中");
    };

    recognition.onend = () => {
      this.isStarting = false;

      if (this.shouldRun && this.game.state === "playing") {
        clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          this.safeStart();
        }, 160);
      }
    };

    recognition.onresult = (event) => {
      this.handleResult(event);
    };

    return recognition;
  }

  start() {
    if (!this.supported) {
      this.setStatus("语音：浏览器不支持");
      this.game.showTip("请使用 Chrome 或 Edge 浏览器", 4000);
      return;
    }

    this.shouldRun = true;

    if (!this.recognition) {
      this.recognition = this.createRecognition();
    }

    this.safeStart();
  }

  safeStart() {
    if (!this.shouldRun) return;
    if (this.game.state !== "playing") return;
    if (this.isStarting) return;

    this.isStarting = true;

    try {
      this.recognition.start();
    } catch (e) {
      this.isStarting = false;

      clearTimeout(this.restartTimer);
      this.restartTimer = setTimeout(() => {
        if (this.shouldRun && this.game.state === "playing") {
          try {
            this.recognition.start();
            this.isStarting = true;
          } catch (err) {}
        }
      }, 220);
    }
  }

  stop() {
    this.shouldRun = false;
    this.isStarting = false;
    clearTimeout(this.restartTimer);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    this.setStatus("语音：已停止");
  }

  handleResult(event) {
  if (this.game.state !== "playing") return;

  const result = event.results[event.results.length - 1];
  if (!result) return;

  let heardText = "";

  // 把浏览器给出的几个候选都检查一遍
  // 这样第一个候选没识别准，第二个、第三个候选也有机会触发技能
  for (let i = 0; i < result.length; i++) {
    const text = (result[i].transcript || "").replace(/\s/g, "");
    if (!text) continue;

    heardText += text + " ";

    const skill = this.matchSkill(text);
    if (!skill) continue;

    const now = Utils.now();

    // 同一个技能短时间内不要重复触发
    if (skill.type === this.lastSkillType && now - this.lastSkillAt < 120) {
      return;
    }

    const ok = this.game.skill.castDirectlyFromVoice(skill);

    if (ok) {
      this.lastSkillType = skill.type;
      this.lastSkillAt = now;
      this.setStatus("识别成功：" + skill.key);
      return;
    }
  }

  // 显示浏览器听到了什么，方便你判断它到底有没有听见
  if (heardText.trim()) {
    this.setStatus("听到：" + heardText.trim());
  }
}

  matchSkill(text) {
  const clean = (text || "")
    .replace(/\s/g, "")
    .replace(/[，。！？、,.!?]/g, "");

  if (!clean) return null;

  const commands = [
    {
      type: "fire",
      key: "火焰",
      words: [
        "火焰", "火炎", "喷火", "烈火",
        "火球", "火攻", "放火", "火"
      ]
    },
    {
      type: "ice",
      key: "寒冰",
      words: [
        "寒冰", "冰冻", "结冰", "冰封",
        "冰", "冰块", "冷冻"
      ]
    },
    {
      type: "thunder",
      key: "雷电",
      words: [
        "雷电", "闪电", "放电", "打雷",
        "雷", "电击", "雷击"
      ]
    },
    {
      type: "wind",
      key: "吹风",
      words: [
        "吹风", "大风", "风刃", "狂风",
        "风", "刮风", "吹"
      ]
    },
    {
      type: "shield",
      key: "护盾",
      words: [
        "护盾", "开盾", "防御", "保护",
        "盾", "挡住", "防守"
      ]
    },
    {
      type: "heal",
      key: "治愈",
      words: [
        "治愈", "治疗", "回血", "加血",
        "恢复", "补血", "救命"
      ]
    },
    {
      type: "punch",
      key: "重拳",
      words: [
        "重拳", "出拳", "打拳", "拳击",
        "拳", "攻击", "打他"
      ]
    }
  ];

  for (const item of commands) {
    if (item.words.some(word => clean.includes(word))) {
      const def = SKILL_DEFS.find(s => s.type === item.type);
      return def || item;
    }
  }

  return null;
}

  setStatus(text) {
    if (this.statusEl) {
      this.statusEl.textContent = text;
    }
  }
}

/* ============================================================
   九、主游戏类
============================================================ */
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.centerTip = document.getElementById("centerTip");
    this.startScreen = document.getElementById("startScreen");
    this.endingScreen = document.getElementById("endingScreen");
    this.endingVideo = document.getElementById("endingVideo");
    this.endingTitle = document.getElementById("endingTitle");
    this.endingScore = document.getElementById("endingScore");
    this.enterBtn = document.getElementById("enterBtn");
    this.endingRestartBtn = document.getElementById("endingRestartBtn");
    this.musicBtn = document.getElementById("musicBtn");
    this.levelReviewPanel = document.getElementById("levelReviewPanel");
this.levelReviewTitle = document.getElementById("levelReviewTitle");
this.levelReviewText = document.getElementById("levelReviewText");
this.levelReviewBtn = document.getElementById("levelReviewBtn");

    this.achievementBtn = document.getElementById("achievementBtn");
this.achievementPanel = document.getElementById("achievementPanel");
this.achievementCloseBtn = document.getElementById("achievementCloseBtn");
this.achievementCards = document.getElementById("achievementCards");
this.achievements = [];

    this.assets = new AssetLoader();
    this.audio = new AudioManager();
    this.player = new Player(this);
    this.skill = new SkillManager(this);
    this.voice = new VoiceRecognizer(this);

    this.monsters = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.effects = [];
    this.particles = [];

    this.resize();
    this.state = "start";
    this.resetCore();

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => setTimeout(() => this.resize(), 200));
    window.addEventListener("pointerdown", () => this.audio.ensure(), { once: true });

    this.enterBtn.addEventListener("click", async () => {
  // 进入游戏主页面后，停止开始界面视频和它的原声音
  const startVideo = document.querySelector("#startScreen .screen-video");
  if (startVideo) {
    startVideo.pause();
    startVideo.currentTime = 0;
    startVideo.muted = true;
  }

  this.audio.ensure();
  await this.assets.loadAll();
  this.startGame();
});
    this.musicBtn.addEventListener("click", () => {
      const on = this.audio.toggleMusic();
      this.musicBtn.textContent = on ? "音乐：开" : "音乐：关";
    });
    // 结算界面的“重新开始”按钮：返回准备页面
this.endingRestartBtn.addEventListener("click", () => {
  this.returnToStartScreen();
});
    // 每关评价确认按钮：点击后进入下一关
this.levelReviewBtn.addEventListener("click", () => {
  this.continueAfterLevelReview();
});
    // 成就按钮：打开怪兽成就面板
this.achievementBtn.addEventListener("click", () => {
  this.renderAchievements();
  this.achievementPanel.classList.toggle("hidden");
});

// 成就面板关闭按钮
this.achievementCloseBtn.addEventListener("click", () => {
  this.achievementPanel.classList.add("hidden");
});
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resetCore() {
    this.score = 0;
    this.level = 1;
    this.levelKills = 0;
    this.totalKills = 0;
    // 本关统计数据：用于生成每关结束评价
this.levelSkillUse = {};
this.levelStartHp = CONFIG.player.maxHp;
this.levelStartTime = Utils.now();
this.levelReviewPanel.classList.add("hidden");
    // 成就数据不会因为重新开始而清空，会保存在浏览器本地
this.achievements = [];
    this.spawnTimer = 0;
    this.levelDelay = 0;
    this.time = 0;
    this.lastTs = 0;
    this.player.reset();
    this.monsters.length = 0;
    this.projectiles.length = 0;
    this.enemyProjectiles.length = 0;
    this.effects.length = 0;
    this.particles.length = 0;
  }
  startGame() {
    this.resetCore();
    // 每一大局开始时清空怪物图鉴，不保留上一局数据
this.achievements = [];

// 清除浏览器本地旧存档，防止以前保存的数据继续出现
localStorage.removeItem("voiceGameAchievements");

// 重新渲染图鉴，让所有怪物恢复成未发现剪影
this.renderAchievements();
    this.achievements = [];
this.renderAchievements();
    this.state = "playing";
    this.startScreen.classList.add("hidden");
    this.endingScreen.classList.add("hidden");
    this.achievementBtn.classList.remove("hidden");
this.achievementPanel.classList.add("hidden");
    this.showTip("开口说话释放技能，语音操控打怪", 2200);
    this.showTip(`第 ${this.level} 关`, 1200);
    this.voice.start();
  }
 showEnding(win) {
  this.state = win ? "win" : "fail";
  this.voice.stop();
  this.stopReviewVoice();
this.achievementPanel.classList.add("hidden");

  // 进入结算界面后，停止游戏主界面的背景音乐
  this.audio.stopMusic();
  this.audio.musicOn = false;
  this.musicBtn.textContent = "音乐：关";

  this.endingVideo.src = win ? ASSETS.videos.win : ASSETS.videos.fail;

  // 让结束动画播放原声音
  this.endingVideo.muted = false;
  this.endingVideo.volume = 1.0;

  this.endingTitle.textContent = win ? "五关全部通关！" : "游戏结束";
  this.endingScore.textContent = `最终得分：${this.score}`;
  this.endingScreen.classList.remove("hidden");
  try { this.endingVideo.play(); } catch(e) {}
}
  endGame(win) {
    this.showEnding(win);
  }
  returnToStartScreen() {
  // 停止语音识别，避免回到首页后还在听
  if (this.voice) {
    this.voice.stop();
  }

  // 停止 AI 评价朗读
  this.stopReviewVoice();

  // 停止结算视频
  if (this.endingVideo) {
    try {
      this.endingVideo.pause();
      this.endingVideo.currentTime = 0;
    } catch (e) {}
  }

  // 停止游戏背景音乐
  this.audio.stopMusic();
  this.audio.musicOn = false;
  this.musicBtn.textContent = "音乐：关";

  // 重置游戏核心数据
  this.resetCore();

  // 每一局独立，清空本局怪物图鉴
  this.achievements = [];
  localStorage.removeItem("voiceGameAchievements");
  this.renderAchievements();

  // 状态改回开始准备界面
  this.state = "start";

  // 隐藏结算界面
  this.endingScreen.classList.add("hidden");

  // 隐藏每关评价弹窗
  this.levelReviewPanel.classList.add("hidden");

  // 隐藏成就面板，但保留右上角成就按钮
  this.achievementPanel.classList.add("hidden");
  this.achievementBtn.classList.remove("hidden");

  // 显示开始准备页面
  this.startScreen.classList.remove("hidden");

  // 重新播放开始界面视频
  const startVideo = document.querySelector("#startScreen .screen-video");
  if (startVideo) {
    try {
      startVideo.currentTime = 0;
      startVideo.muted = true;
      startVideo.play();
    } catch (e) {}
  }
}
  recordSkillUse(type) {
  // 记录本关每种技能使用次数
  if (!this.levelSkillUse) {
    this.levelSkillUse = {};
  }

  if (!this.levelSkillUse[type]) {
    this.levelSkillUse[type] = 0;
  }

  this.levelSkillUse[type]++;
}

getSkillChineseName(type) {
  // 把技能英文类型转换成中文名字
  const names = {
    fire: "火焰",
    ice: "寒冰",
    thunder: "雷电",
    wind: "吹风",
    shield: "护盾",
    heal: "治愈",
    punch: "重拳"
  };

  return names[type] || "未知技能";
}

getMostUsedSkillName() {
  // 找出本关使用次数最多的技能
  let bestType = null;
  let bestCount = 0;

  for (const type in this.levelSkillUse) {
    if (this.levelSkillUse[type] > bestCount) {
      bestType = type;
      bestCount = this.levelSkillUse[type];
    }
  }

  if (!bestType) {
    return "没有明显偏好的技能";
  }

  return this.getSkillChineseName(bestType);
}

generateLevelReview() {
  /**
   * 这里是“AI 风格评价生成”位置。
   * 当前版本先用本地规则生成评价，避免你配置 API 太复杂。
   * 如果之后要真正连接生成式 AI，只需要把这个函数换成 API 请求即可。
   */

  const usedSkill = this.getMostUsedSkillName();
  const hpLost = Math.max(0, this.levelStartHp - this.player.hp);
  const hpLeft = Math.ceil(this.player.hp);
  const levelTime = Math.max(1, Math.floor((Utils.now() - this.levelStartTime) / 1000));

  let styleComment = "";

  if (hpLost <= 5) {
    styleComment = "你几乎没有受到伤害，操作非常稳定，像是在冷静地掌控整个战场。";
  } else if (hpLost <= 20) {
    styleComment = "你承受了一些攻击，但整体节奏保持得不错，说明你已经开始熟悉语音释放技能的时机。";
  } else {
    styleComment = "这一关你受到了不少压力，怪兽靠近时可以更多使用护盾、寒冰或重拳来保护自己。";
  }

  let skillComment = "";

  if (usedSkill === "火焰") {
    skillComment = "你偏爱火焰，打法直接而有压制力，适合清理成群靠近的怪兽。";
  } else if (usedSkill === "寒冰") {
    skillComment = "你偏爱寒冰，说明你更重视控制节奏，让敌人慢下来再逐个击破。";
  } else if (usedSkill === "雷电") {
    skillComment = "你偏爱雷电，攻击选择很聪明，适合同时处理多个目标。";
  } else if (usedSkill === "吹风") {
    skillComment = "你偏爱吹风，说明你喜欢用远距离穿透攻击保持安全距离。";
  } else if (usedSkill === "护盾") {
    skillComment = "你经常使用护盾，说明你的防守意识很强，懂得先保护自己再反击。";
  } else if (usedSkill === "治愈") {
    skillComment = "你使用了治愈，说明你很会在危险时调整状态，让自己继续坚持下去。";
  } else if (usedSkill === "重拳") {
    skillComment = "你偏爱重拳，打法非常果断，适合在怪兽靠近时打出强力反击。";
  } else {
    skillComment = "这一关你的技能使用比较平均，可以尝试形成更明确的战斗风格。";
  }

  return `第 ${this.level} 关结束。

本关你击败了 ${this.levelKills} 只怪兽，用时约 ${levelTime} 秒，剩余生命值为 ${hpLeft}。

${styleComment}

${skillComment}

本关称号：${this.generateLevelTitle(usedSkill, hpLost)}`;
}

generateLevelTitle(skillName, hpLost) {
  // 根据表现生成一个称号
  if (hpLost <= 5) {
    return "无伤守护者";
  }

  if (skillName === "火焰") return "小小火焰术士";
  if (skillName === "寒冰") return "冷静冰霜使者";
  if (skillName === "雷电") return "雷鸣指挥官";
  if (skillName === "吹风") return "风语冒险家";
  if (skillName === "护盾") return "坚韧防御者";
  if (skillName === "治愈") return "温柔治愈师";
  if (skillName === "重拳") return "近战小勇士";

  return "语音冒险者";
}
speakReview(text) {
  // 如果浏览器不支持语音合成，就直接跳过
  if (!window.speechSynthesis) {
    console.warn("当前浏览器不支持语音朗读");
    return;
  }

  // 先停止上一段朗读，避免多段声音重叠
  window.speechSynthesis.cancel();

  // 创建一段要朗读的文本
  const utterance = new SpeechSynthesisUtterance(text);

  // 设置中文朗读
  utterance.lang = "zh-CN";

  // 音量：0 到 1
  utterance.volume = 1;

  // 语速：数值越小越慢，0.85 会更温柔
  utterance.rate = 0.95;

  // 音调：稍微高一点，会比默认更柔和
  utterance.pitch = 1.18;

  // 尝试选择更温柔的中文声音
  const voices = window.speechSynthesis.getVoices();

  const preferredVoice = voices.find(voice =>
    voice.lang.includes("zh") &&
    (
      voice.name.includes("Xiaoxiao") ||
      voice.name.includes("Xiaoyi") ||
      voice.name.includes("Yaoyao") ||
      voice.name.includes("Tingting") ||
      voice.name.includes("Mei") ||
      voice.name.includes("Female") ||
      voice.name.includes("女")
    )
  ) || voices.find(voice =>
    voice.lang.includes("zh")
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // 开始朗读
  window.speechSynthesis.speak(utterance);
}

stopReviewVoice() {
  // 停止评价朗读
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
showLevelReview() {
  // 暂停游戏，显示每关结束评价
  this.state = "levelReview";
  if (this.voice) {
  this.voice.stop();
}

  const reviewText = this.generateLevelReview();

  this.levelReviewTitle.textContent = `第 ${this.level} 关评价`;
  this.levelReviewText.textContent = reviewText;
  this.levelReviewBtn.textContent = `确认，进入第 ${this.level + 1} 关`;

  this.levelReviewPanel.classList.remove("hidden");
  this.speakReview(reviewText);
}

continueAfterLevelReview() {
  // 玩家确认评价后，正式进入下一关
  this.stopReviewVoice();
  this.levelReviewPanel.classList.add("hidden");

  this.level++;
  this.levelKills = 0;
  this.enemyProjectiles.length = 0;
  this.levelDelay = 0;

  // 重置下一关统计数据
  this.levelSkillUse = {};
  this.levelStartHp = this.player.hp;
  this.levelStartTime = Utils.now();

  this.state = "playing";
setTimeout(() => {
  if (this.voice && this.state === "playing") {
    this.voice.start();
  }
}, 400);
  this.showTip(`第 ${this.level} 关`, 1400);

  if (this.level === 3) {
    this.showTip("治愈技能已解锁，怪物速度提升 5%", 2000);
  }

  if (this.level === 4) {
    this.showTip("重拳技能已解锁", 1700);
  }

  if (this.level === 5) {
    this.showTip("第五关：怪物会远程攻击", 2000);
  }
}
  loadAchievements() {
  // 从浏览器本地读取已经解锁的怪兽成就
  const saved = localStorage.getItem("voiceGameAchievements");
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
}

saveAchievements() {
  // 把成就保存到浏览器本地，下次打开游戏仍然存在
  localStorage.setItem("voiceGameAchievements", JSON.stringify(this.achievements));
}

unlockAchievement(level, kind) {
  // 每只怪兽的成就编号，例如 monster_3_2 表示第3关第2种怪兽
  const id = `monster_${level}_${kind}`;

  // 已经解锁过就不重复添加
  if (this.achievements.includes(id)) return;

  this.achievements.push(id);


  // 如果成就面板正打开，立即刷新卡片
  if (!this.achievementPanel.classList.contains("hidden")) {
    this.renderAchievements();
  }
}
getMonsterName(level, kind) {
  const monsterNames = {
    "1_1": "草团小怪",
    "1_2": "花角精灵",

    "2_1": "蓝泡泡",
    "2_2": "橘壳兽",

    "3_1": "紫雾球",
    "3_2": "青叶怪",

    "4_1": "沙沙兽",
    "4_2": "粉刺刺",

    "5_1": "远星怪",
    "5_2": "梦境守卫"
  };

  const id = `${level}_${kind}`;
  return monsterNames[id] || `未知怪兽`;
}
renderAchievements() {
  // 清空当前图鉴面板里的所有卡片
  this.achievementCards.innerHTML = "";

  // 游戏一共 5 关，每关 2 种怪兽
  // 所以这里固定生成 10 张怪物图鉴卡片
  for (let level = 1; level <= 5; level++) {
    for (let kind = 1; kind <= 2; kind++) {
      // 每只怪物的编号
      // 例如：monster_1_1 表示第 1 关第 1 种怪物
      const id = `monster_${level}_${kind}`;

      // 判断这只怪物这一局有没有被击败过
      const unlocked = this.achievements.includes(id);

      // 这里是图鉴卡片图片路径
      // 你文件夹里的图片必须叫 card_l1_1.png、card_l1_2.png 这种名字
      const imgSrc = `assets/achievement_cards/card_l${level}_${kind}.png`;

      // 获取怪物名字
      // 如果你已经加了 getMonsterName()，就用你自己起的名字
      // 如果没有，就用默认名字
      const name = this.getMonsterName
        ? this.getMonsterName(level, kind)
        : `第 ${level} 关怪兽 ${kind}`;

      // 创建一张卡片
      const card = document.createElement("div");

      // 如果已经击败过，就显示正常卡片
      // 如果还没击败过，就显示 locked，后面 CSS 会把图片变成黑色剪影
      if (unlocked) {
        card.className = "achievement-card unlocked";
      } else {
        card.className = "achievement-card locked";
      }

      // 卡片里面放图片和文字
      // 击败过：显示怪物名字
      // 没击败过：显示“未发现”
      card.innerHTML = `
        <img src="${imgSrc}" alt="${name}">
        <span>${unlocked ? name : "未发现"}</span>
      `;

      // 把这张卡片加入成就面板
      this.achievementCards.appendChild(card);
    }
  }
}
  showRecognizedSkill(skillName) {
    // V6：短暂显示识别到的技能名，方便检查是否识别错。
    this.centerTip.textContent = `识别：${skillName}`;
    this.centerTip.style.opacity = "1";
    this.centerTip.classList.remove("hidden");
    clearTimeout(this.recognizedTipTimer);
    this.recognizedTipTimer = setTimeout(() => {
      this.centerTip.style.opacity = "0";
      setTimeout(() => this.centerTip.classList.add("hidden"), 220);
    }, 360);
  }

  showTip(text, ms = 1400) {
    this.centerTip.textContent = text;
    this.centerTip.style.opacity = "1";
    this.centerTip.classList.remove("hidden");
    clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => {
      this.centerTip.style.opacity = "0";
      setTimeout(() => this.centerTip.classList.add("hidden"), 480);
    }, ms);
  }
  loop(ts) {
    const dt = Math.min((ts - (this.lastTs || ts)) / 1000, 0.033);
    this.lastTs = ts;
    if (this.state === "playing") this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
  update(dt) {
    this.time += dt;
    this.player.update(dt);
    this.skill.update(dt);

    const goal = CONFIG.wave.killGoalByLevel[this.level - 1];
    const alive = this.monsters.filter(m => !m.dead).length;

    // 本关未达到击杀目标时继续刷新
    if (this.levelKills < goal && alive < CONFIG.wave.maxAlive) {
      this.spawnTimer -= dt * 1000;
      if (this.spawnTimer <= 0) {
        this.spawnMonster();
        this.spawnTimer = CONFIG.monster.spawnGapMs;
      }
    }

    for (const m of this.monsters) m.update(dt);
    for (const p of this.projectiles) p.update(dt);
    for (const p of this.enemyProjectiles) p.update(dt);
    for (const e of this.effects) e.update(dt);
    for (const p of this.particles) p.update(dt);

    this.monsters = this.monsters.filter(m => !m.dead);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.dead);
    this.effects = this.effects.filter(e => e.life > 0);
    this.particles = this.particles.filter(p => p.life > 0);

    // 当前关击杀目标完成，且场上清空，进入下一关或胜利结算
    if (this.levelKills >= goal && this.monsters.length === 0) {
  this.levelDelay += dt * 1000;

  if (this.levelDelay >= CONFIG.wave.nextLevelDelayMs) {
    if (this.level >= CONFIG.totalLevels) {
      this.endGame(true);
    } else {
      this.showLevelReview();
    }
  }
} else {
  this.levelDelay = 0;
}
  }
  spawnMonster() {
    const kind = Math.random() < 0.5 ? 1 : 2; // 每关两种怪兽随机出现
    this.monsters.push(new Monster(this, kind));
  }
  spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color));
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    this.drawBackground(ctx);

    for (const p of this.projectiles) p.draw(ctx);
    for (const p of this.enemyProjectiles) p.draw(ctx);
    for (const e of this.effects) e.draw(ctx);
    for (const m of this.monsters) m.draw(ctx);
    this.player.draw(ctx);
    for (const p of this.particles) p.draw(ctx);

    if (this.state === "playing") this.drawUI(ctx);
  }
  drawBackground(ctx) {
    const bg = this.assets.get(`bg${this.level}`);
    if (bg) {
      ctx.drawImage(bg, 0, 0, this.w, this.h);
    } else {
      ctx.fillStyle = "#EEF7F2";
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = "#D8E8DC";
      roundRect(ctx, -20, this.h * 0.78, this.w + 40, this.h * 0.24, 26);
      ctx.fill();
    }
  }
  drawUI(ctx) {
    // 血量条
    const x = 18, y = 18, w = Math.min(220, this.w * 0.42), h = 18;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(255,255,255,0.66)";
    roundRect(ctx, x, y, w, h, 9); ctx.fill();
    ctx.fillStyle = "#E68787";
    roundRect(ctx, x, y, w * (this.player.hp / CONFIG.player.maxHp), h, 9); ctx.fill();
    ctx.fillStyle = "#4B5751";
    ctx.font = "13px Microsoft YaHei, Arial";
    ctx.fillText(`血量 ${Math.ceil(this.player.hp)}/${CONFIG.player.maxHp}`, x, y + 34);

    // 右上角分数/关卡/进度
    const goal = CONFIG.wave.killGoalByLevel[this.level - 1];
    ctx.textAlign = "right";
    ctx.font = "bold 20px Microsoft YaHei, Arial";
    ctx.fillStyle = "#3E4A44";
    ctx.fillText(`分数 ${this.score}`, this.w - 18, 30);
    ctx.font = "15px Microsoft YaHei, Arial";
    ctx.fillText(`第 ${this.level}/5 关  击杀 ${this.levelKills}/${goal}`, this.w - 18, 54);

    this.drawCooldowns(ctx);
    ctx.restore();
  }
  drawCooldowns(ctx) {
    const gap = 8;
    const itemW = Utils.clamp((this.w - 36 - gap * (SKILL_DEFS.length - 1)) / SKILL_DEFS.length, 44, 86);
    const itemH = 46;
    const totalW = itemW * SKILL_DEFS.length + gap * (SKILL_DEFS.length - 1);
    let startX = (this.w - totalW) / 2;
    const y = this.h - itemH - 62;

    ctx.textAlign = "center";
    ctx.font = "12px Microsoft YaHei, Arial";

    SKILL_DEFS.forEach((s, i) => {
      const x = startX + i * (itemW + gap);
      const unlocked = this.level >= s.unlockLevel;
      ctx.fillStyle = unlocked ? "rgba(255,255,255,0.58)" : "rgba(80,80,80,0.20)";
      roundRect(ctx, x, y, itemW, itemH, 12); ctx.fill();

      const icon = this.assets.get(`icon_${s.type}`);
      if (icon) {
        ctx.save();
        ctx.globalAlpha = unlocked ? 1 : 0.28;
        ctx.drawImage(icon, x + itemW / 2 - 14, y + 4, 28, 28);
        ctx.restore();
      } else {
        ctx.fillStyle = s.color;
        roundRect(ctx, x + 5, y + 5, itemW - 10, 8, 5); ctx.fill();
      }

      const cd = this.skill.cdMap[s.type] || 0;
      if (cd > 0 && unlocked) {
        const ratio = cd / CONFIG.skill.globalCdMs;
        ctx.fillStyle = "rgba(60,70,70,0.28)";
        roundRect(ctx, x, y, itemW, itemH * ratio, 12); ctx.fill();
      }

      ctx.fillStyle = unlocked ? "#405048" : "#6F7772";
      ctx.fillText(unlocked ? s.key : `${s.unlockLevel}关`, x + itemW / 2, y + 41);
    });
  }
}

/* Canvas 圆角矩形 */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* 启动 */
window.addEventListener("load", () => {
  const game = new Game();
  requestAnimationFrame(t => game.loop(t));
});
