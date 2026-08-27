<?php
session_start();
require_once __DIR__ . '/config/db.php';

if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$error = '';
$formAction = 'login';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $formAction = $_POST['action'] ?? 'login';
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Username dan password wajib diisi.';
    } elseif ($formAction === 'register') {
        $stmt = $koneksi->prepare('SELECT id FROM `user` WHERE `user` = ?');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $error = 'Username sudah dipakai, coba yang lain.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $koneksi->prepare('INSERT INTO `user` (`user`, `password`, `tgl`) VALUES (?, ?, CURDATE())');
            $stmt->bind_param('ss', $username, $hash);
            $stmt->execute();
            $_SESSION['user_id'] = $koneksi->insert_id;
            $_SESSION['username'] = $username;
            header('Location: index.php');
            exit;
        }
    } else {
        $stmt = $koneksi->prepare('SELECT id, password FROM `user` WHERE `user` = ?');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            if (password_verify($password, $row['password'])) {
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['username'] = $username;
                header('Location: index.php');
                exit;
            }
        }
        $error = 'Username atau password salah.';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Game Type - Masuk</title>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background-color: #1b2a1b;
    background-image:
      linear-gradient(rgba(77,107,77,.45) 1px, transparent 1px),
      linear-gradient(90deg, rgba(77,107,77,.45) 1px, transparent 1px);
    background-size: 36px 36px;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }
  .card {
    width: 100%;
    max-width: 400px;
    background: rgba(0,0,0,.45);
    border: 3px solid #ffd700;
    border-radius: 12px;
    padding: 30px 26px;
    text-align: center;
  }
  .card h1 {
    font-family: 'Press Start 2P', monospace;
    font-size: 26px;
    color: #ffd700;
    text-shadow: 3px 3px 0 #000;
    margin-bottom: 8px;
  }
  .card .sub {
    font-family: 'Press Start 2P', monospace;
    font-size: 11px;
    color: #7db8ff;
    margin-bottom: 22px;
  }
  .tabs { display: flex; margin-bottom: 18px; }
  .tabs button {
    flex: 1;
    padding: 10px 0;
    border: 0;
    background: #262a4a;
    color: #aab;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .tabs button.active { background: #ffd700; color: #111; }
  .tabs button:first-child { border-radius: 8px 0 0 8px; }
  .tabs button:last-child { border-radius: 0 8px 8px 0; }
  input {
    width: 100%;
    padding: 12px;
    margin: 8px 0;
    border-radius: 8px;
    border: 2px solid #4d6b4d;
    background: #14172a;
    color: #fff;
    font-size: 14px;
    outline: none;
  }
  input:focus { border-color: #ffd700; }
  .btn {
    width: 100%;
    padding: 13px;
    margin-top: 14px;
    border: 0;
    border-radius: 8px;
    background: #ffd700;
    color: #111;
    font-family: 'Press Start 2P', monospace;
    font-size: 13px;
    cursor: pointer;
  }
  .btn:hover { background: #ffe14d; }
  .err {
    background: rgba(74,26,26,.8);
    border: 2px solid #ff5555;
    color: #ff9a9a;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .note { margin-top: 16px; font-size: 12px; color: #667; }
</style>
</head>
<body>
  <div class="card">
    <h1>GAME TYPE</h1>
    <p class="sub">Top-Down Typing Game</p>

    <?php if ($error !== ''): ?>
      <div class="err"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>

    <div class="tabs">
      <button type="button" id="tabLogin" class="active" onclick="switchTab('login')">Login</button>
      <button type="button" id="tabRegister" onclick="switchTab('register')">Daftar</button>
    </div>

    <form method="post" action="login.php" id="formLogin">
      <input type="hidden" name="action" value="login">
      <input type="text" name="username" placeholder="Username" autocomplete="username" required>
      <input type="password" name="password" placeholder="Password" autocomplete="current-password" required>
      <button class="btn" type="submit">MASUK</button>
    </form>

    <form method="post" action="login.php" id="formRegister" style="display:none;">
      <input type="hidden" name="action" value="register">
      <input type="text" name="username" placeholder="Username" autocomplete="username" required>
      <input type="password" name="password" placeholder="Password" autocomplete="new-password" required>
      <button class="btn" type="submit">DAFTAR</button>
    </form>

    <p class="note">Skor kamu akan disimpan otomatis di database.</p>
  </div>

  <script>
    function switchTab(tab) {
      document.getElementById('tabLogin').className = tab === 'login' ? 'active' : '';
      document.getElementById('tabRegister').className = tab === 'register' ? 'active' : '';
      document.getElementById('formLogin').style.display = tab === 'login' ? '' : 'none';
      document.getElementById('formRegister').style.display = tab === 'register' ? '' : 'none';
    }
  </script>
</body>
</html>
