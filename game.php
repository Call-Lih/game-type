<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Game Type - Main</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background: #1b2a1b;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #game {
    width: 100%;
    height: 100%;
    max-width: 900px;
    max-height: 900px;
    position: relative;
  }
  #game canvas {
    display: block;
  }
</style>
</head>
<body>
  <div id="game"></div>

  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
  <script src="assets/game/words.js"></script>
  <script src="assets/game/game.js"></script>
</body>
</html>
