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
$limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 10;

// Peringkat skor terbaik tiap player (gabungan semua mode)
// Jika mau per mode, tambahkan: AND s.mode = 'ketik' (atau 'terjemah')
$sql = 'SELECT u.user, MAX(s.score) AS best
        FROM scores s
        JOIN `user` u ON u.id = s.user_id
        GROUP BY s.user_id
        ORDER BY best DESC
        LIMIT ?';
$stmt = $koneksi->prepare($sql);
$stmt->bind_param('i', $limit);
$stmt->execute();
$res = $stmt->get_result();

$top = [];
$rank = 1;
while ($row = $res->fetch_assoc()) {
    $top[] = [
        'rank'   => $rank,
        'user'   => $row['user'],
        'score'  => (int)$row['best'],
        'mine'   => false
    ];
    $rank++;
}

// Posisi player saat ini
$stmt = $koneksi->prepare('SELECT MAX(score) AS best FROM scores WHERE user_id = ?');
$stmt->bind_param('i', $uid);
$stmt->execute();
$myBest = (int)$stmt->get_result()->fetch_assoc()['best'];

$myRank = 1;
if ($myBest > 0) {
    $stmt = $koneksi->prepare('SELECT COUNT(*) + 1 AS r
        FROM (
            SELECT user_id, MAX(score) AS best FROM scores GROUP BY user_id
        ) t
        WHERE t.best > ?');
    $stmt->bind_param('i', $myBest);
    $stmt->execute();
    $myRank = (int)$stmt->get_result()->fetch_assoc()['r'];
}

// Tandai baris milik player ini
foreach ($top as $k => $entry) {
    if ($entry['score'] === $myBest) {
        $top[$k]['mine'] = true;
        break;
    }
}

echo json_encode([
    'top'  => $top,
    'mine' => [
        'rank'  => $myRank,
        'score' => $myBest
    ]
]);
