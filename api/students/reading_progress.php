<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Unauthorized - Please login"));
    exit();
}

try {
    include_once '../../config/database.php';

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $query = "SELECT 
                rp.id,
                rp.book_id,
                rp.current_chapter,
                rp.total_chapters,
                rp.progress_percentage,
                rp.last_read,
                b.title,
                b.author,
                b.category,
                b.isbn,
                b.status
              FROM reading_progress rp 
              INNER JOIN books b ON rp.book_id = b.id 
              WHERE rp.user_id = :user_id 
              AND rp.progress_percentage < 100
              AND b.status = 'active'
              ORDER BY rp.last_read DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    $stmt->execute();

    $progress = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        array_push($progress, $row);
    }

    http_response_code(200);
    echo json_encode($progress);

} catch (Exception $e) {
    error_log("Reading progress error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Server error", "error" => $e->getMessage()));
}
?>