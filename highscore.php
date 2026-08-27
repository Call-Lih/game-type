<?php
session_start();
require_once __DIR__ . '/config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo '0';
    exit;
}

$mode = isset($_GET['mode']) ? trim($_GET['mode']) : '';

if ($mode === 'terjemah' || $mode === 'ketik') {
    $stmt = $koneksi->prepare('SELECT MAX(score) AS best FROM scores WHERE user_id = ? AND mode = ?');
    $stmt->bind_param('is', $_SESSION['user_id'], $mode);
} else {
    $stmt = $koneksi->prepare('SELECT MAX(score) AS best FROM scores WHERE user_id = ?');
    $stmt->bind_param('i', $_SESSION['user_id']);
}
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

echo (int)($row['best'] ?? 0);
