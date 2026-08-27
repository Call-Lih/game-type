<?php
session_start();
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'not_logged_in']);
    exit;
}

$uid = $_SESSION['user_id'];
$limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;

function modeData($koneksi, $mode, $uid, $limit) {
    // Skor terbaik player ini di mode tsb (1 baris per user per mode)
    $stmt = $koneksi->prepare('SELECT score, level FROM scores WHERE user_id = ? AND mode = ?');
    $stmt->bind_param('is', $uid, $mode);
    $stmt->execute();
    $mine = $stmt->get_result()->fetch_assoc();

    $myScore = $mine ? (int)$mine['score'] : 0;
    $myLevel = $mine ? $mine['level'] : '';
    $myRank  = 0;

    if ($myScore > 0) {
        $stmt = $koneksi->prepare('SELECT COUNT(*) + 1 AS r FROM scores WHERE mode = ? AND score > ?');
        $stmt->bind_param('si', $mode, $myScore);
        $stmt->execute();
        $myRank = (int)$stmt->get_result()->fetch_assoc()['r'];
    }

    // Top list per mode
    $stmt = $koneksi->prepare(
        'SELECT u.id AS uid, u.user, s.score, s.level
         FROM scores s
         JOIN `user` u ON u.id = s.user_id
         WHERE s.mode = ?
         ORDER BY s.score DESC
         LIMIT ?'
    );
    $stmt->bind_param('si', $mode, $limit);
    $stmt->execute();
    $res = $stmt->get_result();

    $top = [];
    $rank = 1;
    while ($row = $res->fetch_assoc()) {
        $top[] = [
            'rank'  => $rank++,
            'user'  => $row['user'],
            'score' => (int)$row['score'],
            'level' => $row['level'],
            'mine'  => (int)$row['uid'] === $uid
        ];
    }

    return [
        'mode' => $mode,
        'mine' => ['score' => $myScore, 'level' => $myLevel, 'rank' => $myRank],
        'top'  => $top
    ];
}

echo json_encode([
    'ketik'    => modeData($koneksi, 'ketik', $uid, $limit),
    'terjemah' => modeData($koneksi, 'terjemah', $uid, $limit)
]);
