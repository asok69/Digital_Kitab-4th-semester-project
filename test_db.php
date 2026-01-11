<?php
header("Content-Type: application/json");

try {
    include_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    if ($db) {
        echo json_encode(array("success" => true, "message" => "Database connected!"));
    } else {
        echo json_encode(array("success" => false, "message" => "Database connection failed"));
    }
} catch (Exception $e) {
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
}
?>