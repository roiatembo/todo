<?php
$host = "localhost";
$db = "dithetoc_todoapp";
$user = "dithetoc_roia";
$pass = "rolanga4";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(["success"=>false, "error"=>"DB failed"]);
    exit;
}

