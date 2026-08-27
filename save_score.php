<?php
session_start();
require_once __DIR__ . '/config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo 'not_logged_in';
    exit;
}

$score = (int)($_POST['score'] ?? 0);
$level = trim($_POST['level'] ?? '');
$mode  = ($_POST['mode'] ?? 'ketik') === 'terjemah' ? 'terjemah' : 'ketik';

if ($score < 0 || $level === '') {
    http_response_code(400);
    echo 'bad_request';
    exit;
}

$uid = $_SESSION['user_id'];
$levelName = ($mode === 'terjemah' ? 'Mode Terjemah' : 'Mode Ketik') . ' - ' . $level;

// Cek apakah player sudah punya skor untuk mode ini
$stmt = $koneksi->prepare('SELECT score FROM scores WHERE user_id = ? AND mode = ?');
$stmt->bind_param('is', $uid, $mode);
$stmt->execute();
$existing = $stmt->get_result()->fetch_assoc();

if ($existing) {
    // Sudah ada: update HANYA kalau skor baru lebih tinggi (simpan skor terbaik)
    if ($score > (int)$existing['score']) {
        $stmt = $koneksi->prepare('UPDATE scores SET score = ?, level = ?, tgl = NOW() WHERE user_id = ? AND mode = ?');
        $stmt->bind_param('isis', $score, $levelName, $uid, $mode);
        $stmt->execute();
    }
} else {
    // Belum ada: insert baris baru
    $stmt = $koneksi->prepare('INSERT INTO scores (user_id, score, mode, level, tgl) VALUES (?, ?, ?, ?, NOW())');
    $stmt->bind_param('iiss', $uid, $score, $mode, $levelName);
    $stmt->execute();
}

echo 'ok';
