<?php
// Entry point. Menu utama ada di menu.php supaya mudah diedit terpisah.
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
header('Location: menu.php');
exit;
