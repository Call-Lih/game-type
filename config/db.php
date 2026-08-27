<?php
$db_host = "sql107.infinityfree.com";
$db_user = "if0_42477084";
$db_pass = "2Y6aWrbAchRQ";
$db_name   = "if0_42477084_gtype";
// $db_host = "localhost";
// $db_user = "root";
// $db_pass = "";
// $db_name = "gtype";

$koneksi = mysqli_connect($db_host, $db_user, $db_pass, $db_name);

if (!$koneksi) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}
mysqli_set_charset($koneksi, "utf8mb4");
