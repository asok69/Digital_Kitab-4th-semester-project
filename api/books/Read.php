<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$book_id = isset($_GET['id']) ? $_GET['id'] : null;

if ($book_id) {
    // Get single book
    $query = "SELECT * FROM books WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $book_id);
} else {
    // Get all books
    $query = "SELECT * FROM books ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
}

$stmt->execute();

if ($book_id) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Book not found"));
    }
} else {
    $books = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        array_push($books, $row);
    }
    echo json_encode($books);
}
?>