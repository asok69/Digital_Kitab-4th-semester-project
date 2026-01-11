<?php
// Turn off error display, log them instead
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Headers MUST come first before any output
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

// Check if database file exists
$db_path = '../../config/database.php';
if (!file_exists($db_path)) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Database config not found",
        "debug" => "Looking for: " . realpath($db_path)
    ));
    exit();
}

try {
    require_once $db_path;

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // Get POST data
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    // Debug: Log what we received
    error_log("Register received: " . $input);

    // Validate required fields
    if (empty($data->name) || empty($data->email) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "All fields are required",
            "debug" => array(
                "name" => isset($data->name) ? "OK" : "Missing",
                "email" => isset($data->email) ? "OK" : "Missing",
                "password" => isset($data->password) ? "OK" : "Missing"
            )
        ));
        exit();
    }

    // Validate email format
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Invalid email format"));
        exit();
    }

    // Validate password length
    if (strlen($data->password) < 6) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Password must be at least 6 characters"));
        exit();
    }

    // Validate name length
    if (strlen($data->name) < 3) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Name must be at least 3 characters"));
        exit();
    }

    // Check if email already exists
    $check_query = "SELECT id FROM users WHERE email = :email";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":email", $data->email);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(array("success" => false, "message" => "Email already registered"));
        exit();
    }

    // Insert new user
    $query = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)";
    $stmt = $db->prepare($query);

    // Hash the password securely
    $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
    $role = isset($data->role) ? $data->role : 'student';

    // Validate role
    if (!in_array($role, ['student', 'admin'])) {
        $role = 'student';
    }

    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":password", $hashed_password);
    $stmt->bindParam(":role", $role);

    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();

        // Create reading stats for new student
        if ($role == 'student') {
            try {
                $stats_query = "INSERT INTO reading_stats (user_id, books_read, total_reading_time, current_streak, badges_earned) 
                                VALUES (:user_id, 0, 0, 0, 0)";
                $stats_stmt = $db->prepare($stats_query);
                $stats_stmt->bindParam(":user_id", $user_id);
                $stats_stmt->execute();
            } catch (PDOException $e) {
                // Log error but don't fail registration
                error_log("Failed to create reading stats: " . $e->getMessage());
            }
        }

        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "Registration successful",
            "user" => array(
                "id" => $user_id,
                "name" => $data->name,
                "email" => $data->email,
                "role" => $role
            )
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to register. Please try again"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Server error: " . $e->getMessage(),
        "file" => $e->getFile(),
        "line" => $e->getLine()
    ));
}
?>