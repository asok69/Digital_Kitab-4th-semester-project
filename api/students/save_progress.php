<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->book_id) || !isset($data->current_chapter)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Missing required fields"));
        exit();
    }

    $user_id = $_SESSION['user_id'];
    $book_id = $data->book_id;
    $current_chapter = $data->current_chapter;
    $total_chapters = isset($data->total_chapters) ? $data->total_chapters : 12;
    $progress_percentage = round(($current_chapter / $total_chapters) * 100);

    // Check if progress record exists
    $check_query = "SELECT id FROM reading_progress WHERE user_id = :user_id AND book_id = :book_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":user_id", $user_id);
    $check_stmt->bindParam(":book_id", $book_id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        // Update existing progress
        $update_query = "UPDATE reading_progress SET 
                        current_chapter = :current_chapter,
                        total_chapters = :total_chapters,
                        progress_percentage = :progress_percentage,
                        last_read = NOW()
                        WHERE user_id = :user_id AND book_id = :book_id";

        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(":current_chapter", $current_chapter);
        $update_stmt->bindParam(":total_chapters", $total_chapters);
        $update_stmt->bindParam(":progress_percentage", $progress_percentage);
        $update_stmt->bindParam(":user_id", $user_id);
        $update_stmt->bindParam(":book_id", $book_id);

        if ($update_stmt->execute()) {
            // Update reading stats
            updateReadingStats($db, $user_id, $total_chapters, $current_chapter);

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Progress updated",
                "progress" => array(
                    "chapter" => $current_chapter,
                    "total" => $total_chapters,
                    "percentage" => $progress_percentage
                )
            ));
        } else {
            throw new Exception("Failed to update progress");
        }
    } else {
        // Insert new progress
        $insert_query = "INSERT INTO reading_progress 
                        (user_id, book_id, current_chapter, total_chapters, progress_percentage, last_read) 
                        VALUES (:user_id, :book_id, :current_chapter, :total_chapters, :progress_percentage, NOW())";

        $insert_stmt = $db->prepare($insert_query);
        $insert_stmt->bindParam(":user_id", $user_id);
        $insert_stmt->bindParam(":book_id", $book_id);
        $insert_stmt->bindParam(":current_chapter", $current_chapter);
        $insert_stmt->bindParam(":total_chapters", $total_chapters);
        $insert_stmt->bindParam(":progress_percentage", $progress_percentage);

        if ($insert_stmt->execute()) {
            // Update reading stats
            updateReadingStats($db, $user_id, $total_chapters, $current_chapter);

            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Progress saved",
                "progress" => array(
                    "chapter" => $current_chapter,
                    "total" => $total_chapters,
                    "percentage" => $progress_percentage
                )
            ));
        } else {
            throw new Exception("Failed to save progress");
        }
    }
} catch (Exception $e) {
    error_log("Save progress error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ));
}

// Function to update reading stats
function updateReadingStats($db, $user_id, $total_chapters, $current_chapter)
{
    try {
        // Check if book is completed
        $is_completed = ($current_chapter >= $total_chapters);

        if ($is_completed) {
            // Increment books read count
            $stats_query = "UPDATE reading_stats 
                           SET books_read = books_read + 1 
                           WHERE user_id = :user_id 
                           AND NOT EXISTS (
                               SELECT 1 FROM reading_progress 
                               WHERE user_id = :user_id 
                               AND progress_percentage = 100
                               AND last_read < NOW() - INTERVAL 1 DAY
                           )";
            $stats_stmt = $db->prepare($stats_query);
            $stats_stmt->bindParam(":user_id", $user_id);
            $stats_stmt->execute();
        }

        // Update streak (simplified version)
        $streak_query = "UPDATE reading_stats 
                        SET current_streak = DATEDIFF(NOW(), last_updated) <= 1 ? current_streak + 1 : 1,
                            last_updated = NOW()
                        WHERE user_id = :user_id";
        $streak_stmt = $db->prepare($streak_query);
        $streak_stmt->bindParam(":user_id", $user_id);
        $streak_stmt->execute();

    } catch (Exception $e) {
        error_log("Error updating stats: " . $e->getMessage());
    }
}
?>