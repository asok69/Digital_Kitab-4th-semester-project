<?php
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] != 'admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Unauthorized - Admin access required"));
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

    // Log received data for debugging
    error_log("Create book received: " . json_encode($data));

    // Validate required fields
    if (empty($data->title) || empty($data->author) || empty($data->isbn) || empty($data->category)) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Missing required fields",
            "required" => ["title", "author", "isbn", "category"]
        ));
        exit();
    }

    // Check if ISBN already exists
    $check_query = "SELECT id FROM books WHERE isbn = :isbn";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":isbn", $data->isbn);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(array("success" => false, "message" => "Book with this ISBN already exists"));
        exit();
    }

    // Insert new book
    $query = "INSERT INTO books (title, author, isbn, category, description, status) 
              VALUES (:title, :author, :isbn, :category, :description, :status)";

    $stmt = $db->prepare($query);

    $status = isset($data->status) ? $data->status : 'active';
    $description = isset($data->description) ? $data->description : '';

    $stmt->bindParam(":title", $data->title);
    $stmt->bindParam(":author", $data->author);
    $stmt->bindParam(":isbn", $data->isbn);
    $stmt->bindParam(":category", $data->category);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":status", $status);

    if ($stmt->execute()) {
        $book_id = $db->lastInsertId();

        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "Book created successfully",
            "book_id" => $book_id
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to create book"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ));
}
?>