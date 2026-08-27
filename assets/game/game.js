(function () {
  'use strict';

  var FONT = "'Press Start 2P', 'Courier New', monospace";
  var MONO = "'Courier New', monospace";

  // Skala font global (desain 480px lebar sebagai patokan)
  var FS = 1;
  function fz(px) { return Math.round(px * FS); }

  var urlMode = parseInt(new URLSearchParams(window.location.search).get('mode'), 10);
  var GAME_MODE = (urlMode === 2) ? 2 : 1;

  // Bahasa target untuk mode translator, dari URL: game.php?mode=2&lang=es
  var GET_LANG = new URLSearchParams(window.location.search).get('lang') || 'id';

  // Arah terjemahan: rev=1 artinya DIBALIK (tampil kata bahasa asing, ketik Bahasa Inggris).
  // Contoh: game.php?mode=2&lang=es&rev=1 = tampil kata Spanyol, jawabannya Bahasa Inggris.
  var GET_REV = new URLSearchParams(window.location.search).get('rev') === '1';

  // Tombol aksen di keyboard on-screen per bahasa.
  // Mau tambah bahasa lain? Tambah baris di sini, contoh: de: ['ä','ö','ü','ß']
  var ACCENTS = { es: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'] };

  function beep(freq, dur, type, vol) {
    try {
      if (!beep.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        beep.ctx = new AC();
      }
      var o = beep.ctx.createOscillator();
      var g = beep.ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(beep.ctx.destination);
      var t = beep.ctx.currentTime;
      g.gain.setValueAtTime(vol || 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.1));
      o.start(t);
      o.stop(t + (dur || 0.1));
    } catch (e) {}
  }
  function okSound() {
    beep(660, .08); setTimeout(function () { beep(880, .09); }, 70); setTimeout(function () { beep(1180, .12); }, 150);
  }
  function badSound() { beep(170, .18, 'sawtooth', .05); }
  function hitSound() { beep(120, .3, 'sawtooth', .06); beep(90, .25, 'square', .05); }
  function levelSound() {
    [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, .12); }, i * 90); });
  }

  function maskOf(target, typed) {
    var s = '';
    for (var i = 0; i < target.length; i++) s += (i < typed.length ? target[i] : '_');
    return s;
  }

  function maskOfMulti(target, typed) {
    var s = '';
    for (var i = 0; i < target.length; i++) {
      s += (i < typed.length && target[i] === typed[i]) ? target[i] : '_';
    }
    return s;
  }

  // Jawaban bisa lebih dari satu: id: "ayah||bapak||ramah"
  function splitAnswers(s) {
    return String(s || '').split('||').map(function (x) { return x.trim().toLowerCase(); }).filter(function (x) { return x; });
  }

  function diffOf(target) {
    if (target.length >= 8) return 'hard';
    if (target.length >= 5) return 'medium';
    return 'easy';
  }
  var DIFF_COLOR = { easy: '#7dff7d', medium: '#ffd700', hard: '#ff7777' };
  var DIFF_MULT = { easy: 1, medium: 1.5, hard: 2 };

  // Kecepatan musuh (satuan desain 480x800). Kecepatan nyata dikali skala layar.
  function enemySpeed(level, diff) {
    if (level > 4) {
      var mult = diff === 'easy' ? 1.15 : (diff === 'medium' ? 1.0 : 0.85);
      var s = (48 + level * 7) * mult;
      s = Math.max(s, 72);
      return Math.round(s + Phaser.Math.Between(0, 10));
    }
    return 62 + level * 7 + Phaser.Math.Between(0, 12);
  }

  // ================= KEYBOARD ON-SCREEN (HP) =================
  function buildOnScreenKeyboard() {
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return null;

    var style = document.createElement('style');
    style.textContent =
      '#game-kb{position:fixed;left:0;right:0;bottom:0;z-index:600;background:#14172a;' +
      'border-top:3px solid #ffd700;padding:6px 4px calc(6px + env(safe-area-inset-bottom));' +
      'user-select:none;-webkit-user-select:none;}' +
      '#game-kb .kb-row{display:flex;gap:4px;margin-bottom:4px;}' +
      '#game-kb .kb-key{flex:1;height:clamp(42px,7.5vh,58px);border:2px solid #4d6b4d;' +
      'border-radius:8px;background:#222a44;color:#fff;' +
      "font-family:'Press Start 2P',monospace;font-size:clamp(12px,2.6vh,19px);" +
      'cursor:pointer;touch-action:manipulation;}' +
      '#game-kb .kb-key:active{background:#ffd700;color:#111;}' +
      '#game-kb .kb-key.wide{flex:1.7;}';
    document.head.appendChild(style);

    function tapKey(value) {
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
      var s = window.__GAME && window.__GAME.scene.getScene('GameScene');
      if (s && s.sys.isActive() && s.onKey) s.onKey({ key: value });
    }
    function makeKey(value, label, wide) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kb-key' + (wide ? ' wide' : '');
      b.textContent = label;
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        tapKey(value);
      });
      return b;
    }

    var kb = document.createElement('div');
    kb.id = 'game-kb';
    var rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    rows.forEach(function (r, ri) {
      var row = document.createElement('div');
      row.className = 'kb-row';
      r.split('').forEach(function (ch) {
        row.appendChild(makeKey(ch, ch.toUpperCase()));
      });
      if (ri === rows.length - 1) {
        row.appendChild(makeKey('Backspace', 'BACK', true));
      }
      kb.appendChild(row);
    });

    // Baris aksen sesuai bahasa (misal España: á é í ó ú ü ñ).
    // Cuma muncul kalau jawabannya memang bahasa itu (mode 2 normal, bukan rev).
    // Kalau bahasa baru mau ditambah, isi ACCENTS di atas.
    var accentKeys = (urlMode === 2 && !GET_REV) ? (ACCENTS[GET_LANG] || null) : null;
    if (accentKeys && accentKeys.length) {
      var arow = document.createElement('div');
      arow.className = 'kb-row';
      accentKeys.forEach(function (ch) {
        arow.appendChild(makeKey(ch, ch));
      });
      kb.appendChild(arow);
    }

    document.body.appendChild(kb);

    // Keyboard menimpa bagian bawah layar. Game menyisakan ruang keyboard
    // lewat window.__KB_H supaya input & karakter tetap kelihatan di atasnya.
    function relayout() {
      var kbH = kb.offsetHeight || 0;
      window.__KB_H = Math.max(kbH, 190); // tinggi min kebor 190px
      if (window.__GAME && window.__GAME.isBooted) {
        try {
          var s = window.__GAME.scene.getScene('GameScene');
          if (s && s.sys.isActive() && s.layout) s.layout();
        } catch (e) {}
      }
    }
    window.addEventListener('resize', relayout);
    window.__relayout = relayout;
    relayout();

    return kb;
  }

  function setKeyboardVisible(v) {
    var kb = document.getElementById('game-kb');
    if (kb) kb.style.display = v ? '' : 'none';
    if (window.__relayout) window.__relayout();
  }

  // ================= GAME =================
  class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) { this.mode = (data && data.mode) || GAME_MODE;  this.lang = GET_LANG;  this.rev = GET_REV; }

    preload() {
      this.load.image('normal', 'assets/image/normal.png');
      this.load.image('blink', 'assets/image/blink.png');
      this.load.image('alien', 'assets/image/alien.png');
      this.load.image('swing1', 'assets/image/swing1.png');
      this.load.image('swing2', 'assets/image/swing2.png');
      this.load.image('swing3', 'assets/image/swing3.png');
    }

    create() {
      this.isOver = false;
      this.paused = false;
      this.score = 0;
      this.combo = 0;
      this.lives = 3;
      this.level = 1;
      this.kills = 0;
      this.typed = '';
      this.maxEnemies = 1;
      this.playerY = 0;
      this.inputY = 0;
      this.stopRadius = 50;

      FS = Math.max(0.5, Math.min(3, this.scale.width / 480));

      if (!this.anims.exists('attack')) {
        this.anims.create({
          key: 'attack',
          frames: [{ key: 'swing1' }, { key: 'swing2' }, { key: 'swing3' }],
          frameRate: 6,
          repeat: -1
        });
      }

      this.enemies = this.add.group();
      this.player = this.add.image(0, 0, 'normal').setOrigin(0.5);
      this.buildHud();
      this.inputLine = this.add.text(0, 0, '', {
        fontFamily: FONT, fontSize: 28, color: '#ffffff',
        backgroundColor: '#11172e', padding: { x: 14, y: 6 }, stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(50);

      var lbl = this.mode === 1 ? 'MODE: KETIK'
        : (this.rev ? 'MODE: ' + GET_LANG.toUpperCase() + '->EN' : 'MODE: EN->' + GET_LANG.toUpperCase());
      this.modeLabel = this.add.text(0, 0, lbl, {
        fontFamily: 'Arial', fontSize: 20, color: '#ffb14d', stroke: '#000', strokeThickness: 2
      }).setDepth(50);

      this.buildPauseOverlay();
      this.buildPauseButton();
      this.layout();

      this.spawnTimer = this.time.addEvent({ delay: 900, loop: true, callback: this.trySpawn, callbackScope: this });
      this.spawnEnemy(true);

      this.input.keyboard.on('keydown', this.onKey, this);
      this.input.keyboard.on('keydown-ESC', this.togglePause, this);

      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

      setKeyboardVisible(true);
      this.updateInputLine();
      this.updateHud();
    }

    // Susun ulang posisi sesuai ukuran layar saat ini (RESIZE)
    layout() {
      var w = this.scale.width, h = this.scale.height;
      var mfs = Math.min(1, FS);
      // Karakter di bawah tapi selalu di atas keyboard, pakai ukuran keyboard kalau terukur.
      var kbH = window.__KB_H || 0;
      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      var bottom;
      if (kbH > 0) {
        bottom = h - kbH;
      } else if (isTouch) {
        bottom = Math.round(h * 0.62);
      } else {
        bottom = h - 20;
      }
      this.inputY = bottom - 30;
      this.playerY = bottom - 105;
      this.stopRadius = Math.max(45, Math.round(55 * Math.min(1.4, FS)));

      if (this.player) {
        if (this.idleTween) { this.idleTween.stop(); this.idleTween.remove(); }
        this.player.setPosition(w / 2, this.playerY).setScale(0.85 * Math.min(1.4, FS));
        this.idleTween = this.tweens.add({ targets: this.player, y: this.playerY + 5, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      if (this.inputLine) this.inputLine.setPosition(w / 2, this.inputY);
      if (this.scoreText) this.scoreText.setPosition(12 * mfs, 75 * mfs);
      if (this.comboText) this.comboText.setPosition(w / 2, 12 * mfs).setOrigin(0.3, 0);
      if (this.levelText) this.levelText.setPosition(w - 12 * mfs, 65 * mfs).setOrigin(1, 0); //lv w,h
      if (this.heartText) this.heartText.setPosition(12 * mfs, 30 * mfs);
      if (this.modeLabel) this.modeLabel.setPosition(12 * mfs, 111 * mfs);
      if (this.pauseBtn) this.pauseBtn.setPosition(w - 40 * mfs, 32 * mfs); //tombol pause w,h
      if (this.pauseBtnTxt) this.pauseBtnTxt.setPosition(w - 40 * mfs, 32 * mfs);

      if (this.pauseOverlay && this.pauseTitle) {
        var cx = w / 2, cy = h / 2;
        var sc = Math.min(1, Math.min(w / 520, h / 860));
        this.pauseDim.setSize(w, h).setPosition(cx, cy);
        this.pauseTitle.setPosition(cx, cy - Math.round(90 * sc));
        this.pauseInfo.setPosition(cx, cy - Math.round(40 * sc));
        this.pauseResumeBox.setPosition(cx, cy + Math.round(30 * sc)); this.pauseResumeTxt.setPosition(cx, cy + Math.round(30 * sc));
        this.pauseRetryBox.setPosition(cx, cy + Math.round(95 * sc)); this.pauseRetryTxt.setPosition(cx, cy + Math.round(95 * sc));
        this.pauseQuitBox.setPosition(cx, cy + Math.round(160 * sc)); this.pauseQuitTxt.setPosition(cx, cy + Math.round(160 * sc));
      }

      this.drawBg();
    }

    drawBg() {
      var w = this.scale.width, h = this.scale.height;
      if (this.bg) this.bg.destroy();
      var g = this.add.graphics();
      g.fillStyle(0x1b2a1b, 1);
      g.fillRect(0, 0, w, h);
      // WARNA GARIS GRID: ubah warna di sini (format 0xRRGGBB), contoh 0x4d6b4d (hijau gelap) / 0x5a8f5a (lebih terang)
      g.lineStyle(2, 0x5a8f5a, 1);
      var step = Math.max(24, Math.round(36 * Math.min(1, FS)));
      for (var x = 0; x <= w; x += step) g.lineBetween(x, 0, x, h);
      for (var y = 0; y <= h; y += step) g.lineBetween(0, y, w, y);
      g.setDepth(-10);
      this.bg = g;
    }

    doBlink() {
      if (this.isOver || this.paused || !this.player) return;
      this.player.setTexture('blink');
      this.time.delayedCall(160, function () { if (this.player && !this.isOver && !this.paused) this.player.setTexture('normal'); }, [], this);
    }

    pickWord() {
      var scene = this;
      var pool = WORD_LIST.filter(function (w) {
        // Mode terjemah: kalau kata ini nggak punya versi bahasa yang dipilih, JANGAN muncul
        if (scene.mode === 2 && !w[scene.lang]) return false;
        // Jawaban: normal = ketik bahasa asing, rev = ketik Bahasa Inggris
        var raw = scene.mode === 2 ? (scene.rev ? w.en : w[scene.lang]) : w.en;
        var primary = splitAnswers(raw)[0] || raw;
        var d = diffOf(primary);
        if (scene.level < 3 && d === 'hard') return false;
        return !scene.enemies.getChildren().some(function (en) { return en.active && en.word === w; });
      });
      if (!pool.length) pool = WORD_LIST.slice();
      return pool[Phaser.Math.Between(0, pool.length - 1)];
    }

    spawnEnemy(first) {
      if (this.isOver || this.paused) return;
      var word = this.pickWord();
      // shown = kata yang tampil di atas musuh, raw = jawaban yang harus diketik
      var shown = this.mode === 2 ? (this.rev ? word[this.lang] : word.en) : word.en;
      var raw = this.mode === 2 ? (this.rev ? word.en : word[this.lang]) : word.en;
      var answers = splitAnswers(raw);
      var primary = answers[0] || raw;
      var diff = diffOf(primary);

      var w = this.scale.width, h = this.scale.height;
      var x, y;
      var side = Phaser.Math.Between(0, 2);
      if (side === 0) { x = Phaser.Math.Between(60, w - 60); y = -40; }
      else if (side === 1) { x = -40; y = Phaser.Math.Between(h * 0.15, h * 0.6); }
      else { x = w + 40; y = Phaser.Math.Between(h * 0.15, h * 0.6); }

      var sc = 0.85 * Math.min(1.4, FS);
      var alien = this.add.sprite(0, 0, 'alien').setScale(sc).setOrigin(0.5);
      var fist = this.add.sprite(0, 6, 'swing1').setScale(0.55 * Math.min(1.4, FS)).setOrigin(0.5).setVisible(false);
      // JARAK TULISAN KE MUSUH: angka minus = posisi di ATAS musuh.
      // Semakin besar angka math.round(misal 74 -> 90), semakin JAUH tulisan dari musuh.
      var wordTxt = this.add.text(0, -Math.round(80 * sc), shown, {
        fontFamily: 'Arial', fontSize: 28, color: DIFF_COLOR[diff], stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5);
      var maskTxt = this.add.text(0, -Math.round(52 * sc), maskOfMulti(primary, ''), {
        fontFamily: MONO, fontSize: 18, color: '#7dff7d', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);

      var cont = this.add.container(x, y, [alien, fist, wordTxt, maskTxt]);
      cont.setSize(110, 150);
      this.enemies.add(cont);
      cont.word = word;
      cont.answers = answers;
      cont.target = primary;
      cont.diff = diff;
      cont.speed = enemySpeed(this.level, diff) * Math.max(0.5, Math.min(1.5, FS));
      
      cont.stopRadius = this.stopRadius;
      cont.d = { sprite: alien, fist: fist, wordTxt: wordTxt, maskTxt: maskTxt };
      cont.sway = this.tweens.add({ targets: alien, angle: { from: -8, to: 8 }, duration: 520, yoyo: true, repeat: -1 });
      return cont;
    }

    trySpawn() {
      if (this.isOver || this.paused) return;
      var active = this.enemies.getChildren().filter(function (e) { return e.active; }).length;
      if (active < this.maxEnemies) this.spawnEnemy();
    }

    refreshMasks() {
      var scene = this;
      this.enemies.getChildren().forEach(function (en) {
        if (!en.active) return;
        en.d.maskTxt.setText(maskOfMulti(en.target, scene.typed));
      });
    }

    onKey(e) {
      if (this.isOver || this.paused) return;

      if (e.key === 'Backspace' || e.keyCode === 8) {
        if (e.preventDefault) e.preventDefault();
        if (this.typed.length > 0) {
          this.typed = this.typed.slice(0, -1);
          this.refreshMasks();
          this.updateInputLine();
        }
        return;
      }
      if (!e.key || !/^[a-zA-ZÀ-ÿ]$/.test(e.key)) return;
      var ch = e.key.toLowerCase();
      var test = this.typed + ch;

      var matched = false;
      this.enemies.getChildren().forEach(function (en) {
        if (en.active && en.answers.some(function (a) { return a.startsWith(test); })) matched = true;
      });

      if (!matched) {
        this.wrongLetter(ch);
        return;
      }

      this.typed = test;
      this.refreshMasks();
      this.updateInputLine();

      var scene = this;
      var killTarget = null;
      this.enemies.getChildren().forEach(function (en) {
        if (en.active && en.answers.indexOf(scene.typed) >= 0) killTarget = en;
      });
      if (killTarget) {
        this.wordDone(killTarget);
        this.typed = '';
        this.refreshMasks();
        this.updateInputLine();
      }
    }

    wordDone(enemy) {
      if (!enemy.active) return;
      this.combo++;
      this.kills++;
      var base = 10 + this.combo * 2 + (this.level - 1) * 5;
      var gained = Math.round(base * (DIFF_MULT[enemy.diff] || 1));
      this.score += gained;
      var col = DIFF_COLOR[enemy.diff] || '#ffd700';
      this.popup(enemy.x, enemy.y, '+' + gained, col);
      okSound();

      var burst = this.add.circle(enemy.x, enemy.y, 5, 0xffd700, 1);
      this.tweens.add({ targets: burst, scale: 5, alpha: 0, duration: 350, onComplete: function () { burst.destroy(); } });

      if (enemy.sway) enemy.sway.stop();
      if (enemy.swingTimer) enemy.swingTimer.remove(false);
      enemy.typed = enemy.target;
      enemy.d.maskTxt.setText(maskOf(enemy.target, enemy.target));
      this.updateHud();
      this.doBlink();

      this.time.delayedCall(140, function () {
        this.tweens.add({
          targets: enemy, scale: 0.1, alpha: 0, y: enemy.y - 40, duration: 200,
          onComplete: function () { enemy.destroy(); }
        });
      }, [], this);

      this.time.delayedCall(240, function () { this.trySpawn(); }, [], this);

      if (this.kills % 8 === 0) this.levelUp();
    }

    levelUp() {
      this.level++;
      if (this.level % 2 === 0) this.maxEnemies = Math.min(3, this.maxEnemies + 1);
      levelSound();
      var t = this.add.text(this.scale.width / 2, this.scale.height * 0.45, 'LEVEL ' + this.level + '!', {
        fontFamily: FONT, fontSize: fz(32) + 'px', color: '#ffd700', stroke: '#000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(100);
      this.tweens.add({ targets: t, y: this.scale.height * 0.45 - 50, alpha: 0, duration: 1200, onComplete: function () { t.destroy(); } });
      this.updateHud();
    }

    wrongLetter(ch) {
      this.combo = 0;
      badSound();
      this.cameras.main.shake(80, 0.004);

      this.inputLine.setColor('#ff5555');
      this.inputLine.setScale(1.05);
      this.inputLine.setText('> ' + this.typed + ' ' + ch);
      this.tweens.add({ targets: this.inputLine, scale: 1, duration: 150, delay: 120 });

      var scene = this;
      this.time.delayedCall(260, function () {
        if (scene.inputLine) {
          scene.inputLine.setText('> ' + scene.typed);
          scene.inputLine.setColor('#ffffff');
        }
      }, [], this);

      this.updateHud();
    }

    hitPlayer(enemy) {
      if (this.isOver || this.paused) return;
      this.lives--;
      hitSound();
      this.cameras.main.shake(180, 0.01);
      this.cameras.main.flash(120, 255, 60, 60);

      var player = this.player;
      var burst = this.add.circle(player.x, player.y, 7, 0xff5555, 1);
      this.tweens.add({ targets: burst, scale: 5, alpha: 0, duration: 300, onComplete: function () { burst.destroy(); } });
      this.tweens.add({ targets: player, x: player.x + 7, duration: 60, yoyo: true, repeat: 1 });

      this.combo = 0;
      this.updateHud();
      this.doBlink();

      if (this.lives <= 0) {
        this.endGame();
      }
    }

    endGame() {
      if (this.isOver) return;
      this.isOver = true;
      this.cameras.main.flash(400, 255, 40, 40);
      this.cameras.main.shake(250, 0.012);
      this.tweens.add({
        targets: this.player,
        angle: { from: -5, to: 90 },
        alpha: 0.2,
        scale: 0.4,
        y: this.playerY + 15,
        duration: 500,
        ease: 'Bounce.easeOut'
      });
      this.time.delayedCall(900, function () {
        this.scene.start('GameOverScene', { score: this.score, level: this.level, kills: this.kills, mode: this.mode });
      }, [], this);
    }

    update(time, delta) {
      if (this.isOver || this.paused) return;
      var dt = Math.min(delta, 100) / 1000;

      var scene = this;
      var px = scene.player.x;
      var py = scene.playerY;
      this.enemies.getChildren().forEach(function (en) {
        if (!en.active) return;
        if (!en.attacking) {
          en.d.sprite.setFlipX(px < en.x);
          var dx = px - en.x;
          var dy = py - en.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > en.stopRadius) {
            var nx = dx / dist;   // arah X ke karakter (dihitung tiap frame → nggak bablas)
            var ny = dy / dist;   // arah Y ke karakter
            en.x += nx * en.speed * dt;
            en.y += ny * en.speed * dt;
          } else {
            en.attacking = true;
            en.d.fist.setFlipX(px < en.x);
            en.d.fist.setX(px < en.x ? -26 : 26);
            en.d.fist.setVisible(true);
            en.d.fist.play('attack');
            en.swingTimer = scene.time.addEvent({
              delay: 1500,
              loop: true,
              callback: function () {
                if (en.active) scene.hitPlayer(en);
              }
            });
          }
        }
      });
    }

    buildHud() {
      this.scoreText = this.add.text(12, 12, 'SKOR 0', { fontFamily: FONT, fontSize: 24,color:'#ffb14d', stroke: '#000', strokeThickness: 2 }).setDepth(50);
      this.comboText = this.add.text(0, 12, 'KOMBO x1', { fontFamily: FONT, fontSize: 30, color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(50);
      this.levelText = this.add.text(0, 12, 'LV 1', { fontFamily: FONT, fontSize: 24, color: '#7db8ff' }).setOrigin(1, 0).setDepth(50);
      this.heartText = this.add.text(12, 44, '', { fontFamily: FONT, fontSize: 40, color: '#ff5555' }).setDepth(50);
    }

    updateHud() {
      if (!this.scoreText) return;
      this.scoreText.setText('SKOR ' + this.score);
      this.comboText.setText('KOMBO x' + Math.max(1, this.combo));
      this.levelText.setText('LV ' + this.level);
      var h = '';
      for (var i = 0; i < 3; i++) h += (i < this.lives ? '\u2665' : '\u2661');
      this.heartText.setText(h);
    }

    updateInputLine() {
      if (!this.inputLine) return;
      this.inputLine.setText('> ' + this.typed);
    }

    popup(x, y, txt, color) {
      var t = this.add.text(x, y, txt, { fontFamily: FONT, fontSize: fz(15) + 'px', color: color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, onComplete: function () { t.destroy(); } });
    }

    // ---------------- PAUSE ----------------
    buildPauseButton() {
      // vh, vh, width, height
      this.pauseBtn = this.add.rectangle(0, 0, Math.round(45 * Math.min(1, FS)), Math.round(35 * Math.min(1, FS)), 0x222a44, 100).setStrokeStyle(2.5, 0xffd700).setInteractive({ useHandCursor: true }).setDepth(50);
      this.pauseBtnTxt = this.add.text(0, 0, '||', { fontFamily: FONT, fontSize: 16, color: '#ffffff' }).setOrigin(0.5).setDepth(50);
      this.pauseBtn.on('pointerdown', function () { this.togglePause(); }, this);
    }

    buildPauseOverlay() {
      this.pauseOverlay = this.add.container(0, 0);
      this.pauseDim = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.72).setOrigin(0.5);
      this.pauseTitle = this.add.text(0, 0, 'PAUSED', { fontFamily: FONT, fontSize: 56, color: '#ffd700', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);
      this.pauseInfo = this.add.text(0, 0, 'SKOR: 0', { fontFamily: FONT, fontSize: 30, color: '#ffffff' }).setOrigin(0.5);

      this.pauseResumeBox = this.add.rectangle(0, 0, Math.round(220 * Math.min(1, FS)), Math.round(42 * Math.min(1, FS)), 0x2a2a4a, 1).setStrokeStyle(3, 0x7dff7d).setInteractive({ useHandCursor: true });
      this.pauseResumeTxt = this.add.text(0, 0, 'LANJUT', { fontFamily: FONT, fontSize: 28, color: '#7dff7d' }).setOrigin(0.5);
      this.pauseRetryBox = this.add.rectangle(0, 0, Math.round(220 * Math.min(1, FS)), Math.round(42 * Math.min(1, FS)), 0x2a2a4a, 1).setStrokeStyle(3, 0x7db8ff).setInteractive({ useHandCursor: true });
      this.pauseRetryTxt = this.add.text(0, 0, 'ULANG', { fontFamily: FONT, fontSize: 28, color: '#7db8ff' }).setOrigin(0.5);
      this.pauseQuitBox = this.add.rectangle(0, 0, Math.round(220 * Math.min(1, FS)), Math.round(42 * Math.min(1, FS)), 0x2a2a4a, 1).setStrokeStyle(3, 0xff7777).setInteractive({ useHandCursor: true });
      this.pauseQuitTxt = this.add.text(0, 0, 'KELUAR', { fontFamily: FONT, fontSize: 28, color: '#ff7777' }).setOrigin(0.5);

      this.pauseOverlay.add([this.pauseDim, this.pauseTitle, this.pauseInfo,
        this.pauseResumeBox, this.pauseResumeTxt,
        this.pauseRetryBox, this.pauseRetryTxt,
        this.pauseQuitBox, this.pauseQuitTxt]);
      this.pauseOverlay.setDepth(100);
      this.pauseOverlay.setVisible(false);

      this.pauseResumeBox.on('pointerdown', function () { this.togglePause(); }, this);
      this.pauseRetryBox.on('pointerdown', function () { this.scene.restart({ mode: this.mode }); }, this);
      this.pauseQuitBox.on('pointerdown', function () { window.location.href = 'menu.php'; }, this);
    }

    togglePause() {
      if (this.isOver) return;
      this.paused = !this.paused;
      if (this.paused) {
        this.pauseInfo.setText('SKOR: ' + this.score);
        this.pauseOverlay.setVisible(true);
        setKeyboardVisible(false);
      } else {
        this.pauseOverlay.setVisible(false);
        setKeyboardVisible(true);
      }
    }
  }

  // ================= GAME OVER =================
  class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) { this.data = data;}

    makeBtn(x, y, label, cssColor, fn) {
      var num = parseInt(cssColor.replace('#', ''), 16);
      var box = this.add.rectangle(x, y, Math.round(260 * this.gsc), Math.round(46 * this.gsc), 0x2a2a4a, 1).setStrokeStyle(3, num).setInteractive({ useHandCursor: true });
      var txt = this.add.text(x, y, label, { fontFamily: FONT, fontSize: fz(14) + 'px', color: cssColor }).setOrigin(0.5);
      box.on('pointerover', function () { box.setFillStyle(0x3a3a6a); });
      box.on('pointerout', function () { box.setFillStyle(0x2a2a4a); });
      box.on('pointerdown', fn, this);
      return box;
    }

    create() {
      var self = this;
      var w = this.scale.width, h = this.scale.height;
      FS = Math.max(0.5, Math.min(3, w / 480));
      // Skala biar panel & tombol selalu muat di layar (lebar & tinggi)
      this.gsc = Math.min(1, Math.min(w / 520, h / 860));
      var sc = this.gsc;
      var cx = w / 2, cy = h / 2;
      setKeyboardVisible(false);

      this.add.rectangle(cx, cy, w, h, 0x000000, 0.78).setOrigin(0.5);

      var panelW = Math.round(440 * sc), panelH = Math.round(740 * sc);
      this.add.rectangle(cx, cy, panelW, panelH, 0x14172a, 1).setStrokeStyle(3, 0xffd700).setOrigin(0.5);

      this.add.image(cx, cy - Math.round(195 * sc), 'normal').setScale(0.7 * sc).setOrigin(0.5).setAngle(90).setAlpha(0.9);
      this.add.text(cx, cy - Math.round(130 * sc), 'GAME OVER', { fontFamily: FONT, fontSize: 52, color: '#ff5555', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);

      this.add.text(cx, cy - Math.round(65 * sc), 'SKOR', { fontFamily: FONT, fontSize: 28, color: '#99aacc' }).setOrigin(0.5);
      this.add.text(cx, cy - Math.round(20 * sc), '' + this.data.score, { fontFamily: FONT, fontSize: 32, color: '#ffd700', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

      this.add.text(cx, cy + Math.round(40 * sc), 'LEVEL ' + this.data.level + '   |   KATA ' + this.data.kills, { fontFamily: FONT, fontSize: 26, color: '#ffffff' }).setOrigin(0.5);

      var hsText = this.add.text(cx, cy + Math.round(115 * sc), 'HIGHSCORE: ...', { fontFamily: FONT, fontSize: 24, color: '#ffd700' }).setOrigin(0.5);
      var saving = this.add.text(cx, cy + Math.round(80 * sc), 'Menyimpan skor...', { fontFamily: 'Arial', fontSize: 18, color: '#99aacc' }).setOrigin(0.5);
      var recordText = this.add.text(cx, cy + Math.round(150 * sc), 'REKOR BARU!', { fontFamily: FONT, fontSize: 28, color: '#7dff7d' }).setOrigin(0.5).setVisible(false);

      var body = 'score=' + encodeURIComponent(this.data.score) +
        '&level=' + encodeURIComponent('Level ' + this.data.level) +
        '&mode=' + encodeURIComponent(this.data.mode === 2 ? 'terjemah' : 'ketik');
      fetch('save_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function (r) { return r.text(); }).then(function () {
        saving.setText('Skor tersimpan!');
        var qMode = self.data.mode === 2 ? 'terjemah' : 'ketik';
        return fetch('highscore.php?mode=' + qMode);
      }).then(function (r) { return r.text(); }).then(function (txt) {
        var best = parseInt(txt, 10) || 0;
        var cur = self.data.score;
        hsText.setText('HIGHSCORE: ' + Math.max(best, cur));
        if (cur > 0 && cur >= best) recordText.setVisible(true);
      }).catch(function () {
        saving.setText('Gagal menyimpan skor.');
      });

      this.makeBtn(cx, cy + Math.round(215 * sc), 'MAIN LAGI', '#7dff7d', function () {
        self.scene.start('GameScene', { mode: self.data.mode });
      });
      this.makeBtn(cx, cy + Math.round(280 * sc), 'KEMBALI KE MENU', '#7db8ff', function () {
        window.location.href = 'menu.php';
      });

      this.input.keyboard.once('keydown-ENTER', function () {
        self.scene.start('GameScene', { mode: self.data.mode });
      }, this);
    }
  }

  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#1b2a1b',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [GameScene, GameOverScene]
  };

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  });

  buildOnScreenKeyboard();
  window.__GAME = new Phaser.Game(config);
})();
