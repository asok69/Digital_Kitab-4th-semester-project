<?php
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

try {
    include_once '../../config/database.php';

    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->minutes)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Minutes required"));
        exit();
    }

    $user_id = $_SESSION['user_id'];
    $minutes = intval($data->minutes);

    // Update reading time
    $query = "UPDATE reading_stats 
              SET total_reading_time = total_reading_time + :minutes,
                  last_updated = NOW()
              WHERE user_id = :user_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":minutes", $minutes);
    $stmt->bindParam(":user_id", $user_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Reading time updated",
            "minutes_added" => $minutes
        ));
    } else {
        throw new Exception("Failed to update reading time");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
}
?>