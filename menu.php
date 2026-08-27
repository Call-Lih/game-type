<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  header('Location: login.php');
  exit;
}
$username = htmlspecialchars($_SESSION['username']);
?>
<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Game Type - Menu Utama</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html,
    body {
      height: 100%;
    }

    body {
      background-color: #1b2a1b;
      background-image:
        linear-gradient(rgba(77, 107, 77, .45) 1px, transparent 1px),
        linear-gradient(90deg, rgba(77, 107, 77, .45) 1px, transparent 1px);
      background-size: 36px 36px;
      color: #fff;
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      padding: 20px;
    }

    .menu {
      width: 100%;
      max-width: 480px;
      text-align: center;
    }

    .menu h1 {
      font-family: 'Press Start 2P', monospace;
      font-size: 38px;
      color: #ffd700;
      text-shadow: 3px 3px 0 #000;
      margin-bottom: 8px;
      animation: scaling 1.5s infinite ease-in-out alternate;
    }

    @keyframes scaling {
      0% {
        transform: scale(1);
      }

      100% {
        transform: scale(1.1);
      }
    }

    .menu .subtitle {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      line-height: 16px;
      letter-spacing: 1px;
      color: #7db8ff;
      margin-bottom: 22px;
    }

    .subtitle .heart {
      width: 18px;
      height: 18px;
      image-rendering: pixelated;
      vertical-align: middle;
      margin-bottom: 5px;
    }

    .hs {
      background: rgba(0, 0, 0, .45);
      border: 2px solid #ffd700;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 22px;
    }

    .hs-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .hs-mode {
      font-family: 'Press Start 2P', monospace;
      font-size: 11px;
      color: #7db8ff;
    }

    .hs-val {
      font-family: 'Press Start 2P', monospace;
      font-size: 13px;
      color: #ffd700;
    }

    .mode {
      background: #2a2a4a;
      border: 3px solid #ffd700;
      border-radius: 10px;
      color: #7db8ff;
      padding: 14px;
      margin-bottom: 14px;
      display: block;
      text-decoration: none;
      transition: background .15s;
    }

    .mode:hover {
      background: #ffd90070;
      color: #fff;
      transform: scale(1.04);
    }

    .mode .label {
      font-family: 'Press Start 2P', monospace;
      font-size: 14px;
      display: block;
      margin-bottom: 8px;
    }

    .mode .desc {
      font-size: 12px;
      color: #c8d6f0;
    }

    .btn-hs {
      width: 100%;
      padding: 14px;
      border: 3px solid #7dff7d;
      border-radius: 10px;
      background: #14301f;
      color: #7dff7d;
      font-family: 'Press Start 2P', monospace;
      font-size: 13px;
      cursor: pointer;
      transition: all .15s;
    }

    .btn-hs:hover {
      background: #1d4429;
      transform: translateY(2.5px);
    }

    .foot {
      margin-top: 18px;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.7);
    }

    .foot a {
      color: #7db8ff;
      text-decoration: none;
    }

    /* ---------- Sidebar (kiri) ---------- */
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, .55);
      z-index: 250;
      opacity: 0;
      visibility: hidden;
      transition: opacity .25s ease;
    }

    .backdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100%;
      width: 420px;
      background: #14172a;
      border-right: 3px solid #ffd700;
      transform: translateX(-100%);
      transition: transform .25s ease;
      z-index: 300;
      overflow-y: auto;
      padding: 18px;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sb-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .sb-head h3 {
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      color: #ffd700;
    }

    .sb-close {
      background: #2a2a4a;
      color: #fff;
      border: 2px solid #ffd700;
      border-radius: 6px;
      width: 30px;
      height: 30px;
      font-size: 16px;
      cursor: pointer;
    }

    .tabs {
      display: flex;
      margin-bottom: 12px;
    }

    .tabs button {
      flex: 1;
      padding: 9px 0;
      border: 1px solid transparent;
      background: #262a4a;
      color: #aab;
      font-family: 'Press Start 2P', monospace;
      font-size: 11px;
      cursor: pointer;
    }
    .tabs button:hover {
      
      background: #0000009a;
      border: 1px solid #ffd700;
      
    }

    .tabs button.active {
      background: #ffd700;
      color: #111;
    }

    .tabs button:first-child {
      border-radius: 8px 0 0 8px;
    }

    .tabs button:last-child {
      border-radius: 0 8px 8px 0;
    }

    .mine-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, .4);
      border: 1px solid #4d6b4d;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 10px;
      font-size: 12px;
      color: #cde;
      gap: 6px;
      flex-wrap: wrap;
    }

    .mine-line b {
      color: #ffd700;
    }

    .sb-list {
      max-height: calc(100vh - 250px);
      min-height: 120px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .pinned {
      margin-top: 10px;
      border-top: 2px dashed #ffd700;
      padding-top: 8px;
    }

    .empty {
      color: #ffd700;
      font-size: 16px;
      text-align: center;
      padding: 14px 0;
    }

    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      padding: 6px 8px;
      border-radius: 5px;
    }

    .list-row.mine {
      background: #3a5a3a;
    }

    .list-row .pos {
      color: #ffd700;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      min-width: 30px;
    }

    .list-row .un {
      color: #fff;
      flex: 1;
      text-align: left;
      margin-left: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .list-row .sc {
      color: #7dff7d;
      font-weight: bold;
    }



    @media (max-width: 720px) {
      .sidebar {
        width: 100%;
      }
    }
  </style>
</head>

<body>
  <div class="menu">
    <h1>GAME TYPE</h1>
    <p class="subtitle">Game made with <img class="heart" src="assets/image/heart.png" alt=""> by Callih & press.it.then(GWS)</p>

    <div class="hs">
      <div class="hs-row"><span class="hs-mode">NORMAL</span><span class="hs-val" id="hs1">...</span></div>
      <div class="hs-row"><span class="hs-mode">TRANSLATE</span><span class="hs-val" id="hs2">...</span></div>
    </div>

    <a class="mode" href="game.php?mode=1">
      <span class="label">MODE 1 - NORMAL MODE</span>
      <span class="desc">Ketik kata yang muncul di atas musuh</span>
    </a>
    <a class="mode" href="game.php?mode=2&lang=id">
      <span class="label">MODE 2 - INDONESIA</span>
      <span class="desc">Inggris &rarr; Indonesia</span>
    </a>
    <a class="mode" href="game.php?mode=2&lang=es&rev=1">
      <span class="label">MODE 2 - ESPA&Ntilde;OL</span>
      <span class="desc">Espa&ntilde;ol &rarr; English</span>
    </a>

    <button class="btn-hs" id="hsBtn">HIGHSCORE &amp; RANK</button>

    <p class="foot">Halo, <b><?php echo $username; ?></b> &middot; <a href="logout.php">Logout</a></p>
  </div>

  <div class="backdrop" id="backdrop"></div>
  <aside class="sidebar" id="sidebar">
    <div class="sb-head">
      <h3>HIGHSCORE</h3>
      <button class="sb-close" id="sbClose">&times;</button>
    </div>
    <div class="tabs">
      <button type="button" id="tabKetik" class="active" onclick="setMode('ketik')">NORMAL MODE</button>
      <button type="button" id="tabTerjemah" onclick="setMode('terjemah')">TRANSLATOR MODE</button>
    </div>
    <div class="mine-line" id="sbMine">Skormu: -</div>
    <div class="sb-list" id="sbList"></div>
  </aside>

  <script>
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('backdrop');

    function openSidebar() {
      sidebar.classList.add('open');
      backdrop.classList.add('show');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    }

    document.getElementById('hsBtn').onclick = openSidebar;
    document.getElementById('sbClose').onclick = closeSidebar;
    backdrop.onclick = closeSidebar;

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function(c) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        } [c];
      });
    }

    var scoreData = null;
    var currentMode = 'ketik';

    function renderList(rows) {
      if (!rows || !rows.length) return '<div class="empty">Be the first one...</div>';
      var h = '';
      rows.forEach(function(p) {
        h += '<div class="list-row' + (p.mine ? ' mine' : '') + '">' +
          '<span class="pos">#' + p.rank + '</span>' +
          '<span class="un">' + (p.mine ? 'Kamu' : esc(p.user)) + '</span>' +
          '<span class="sc">' + p.score + '</span></div>';
      });
      return h;
    }

    function renderSidebar() {
      if (!scoreData) return;
      var d = scoreData[currentMode];
      var mine = d.mine;
      var lv = mine.level ? esc(mine.level.replace(/^Mode\s+\w+\s*-\s*/, '')) : '';

      document.getElementById('sbMine').innerHTML =
        '<span>SKORMU: <b>' + mine.score + '</b></span>' +
        '<span>RANK: <b>' + (mine.rank > 0 ? '#' + mine.rank : '-') + '</b></span>' +
        (lv ? '<span>' + lv + '</span>' : '');

      var html = renderList(d.top);
      var inTop = d.top.some(function(p) {
        return p.mine;
      });

      // Kalau skor kita nggak masuk 10 besar, tempel di bawah daftar (kayak game biasanya)
      if (!inTop && mine.score > 0) {
        html += '<div class="pinned"><div class="list-row mine">' +
          '<span class="pos">#' + mine.rank + '</span>' +
          '<span class="un">Kamu</span>' +
          '<span class="sc">' + mine.score + '</span></div></div>';
      }
      document.getElementById('sbList').innerHTML = html;
    }

    function setMode(m) {
      currentMode = m;
      document.getElementById('tabKetik').className = m === 'ketik' ? 'active' : '';
      document.getElementById('tabTerjemah').className = m === 'terjemah' ? 'active' : '';
      renderSidebar();
    }

    fetch('scores.php').then(function(r) {
      return r.json();
    }).then(function(d) {
      scoreData = d;
      document.getElementById('hs1').textContent = d.ketik.mine.score;
      document.getElementById('hs2').textContent = d.terjemah.mine.score;
      renderSidebar();
    }).catch(function() {
      document.getElementById('hs1').textContent = '0';
      document.getElementById('hs2').textContent = '0';
      document.getElementById('sbMine').innerHTML = '<span>Gagal memuat skor.</span>';
      document.getElementById('sbList').innerHTML = '<div class="empty">Gagal memuat.</div>';
    });
  </script>
</body>

</html>