<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // For development
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once "db.php";

$response = ["success" => false, "message" => ""];

try {
    // Determine the HTTP method
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Get input data based on method
    if ($method === 'GET') {
        // For GET requests (like your browser testing)
        $data = $_GET;
        $action = $data['action'] ?? '';
    } else {
        // For POST/PUT/DELETE requests
        $input = file_get_contents("php://input");
        
        // Log raw input for debugging
        error_log("Raw input received: " . $input);
        
        $data = json_decode($input, true);
        
        // If JSON decoding fails, check for form data
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            $data = $_POST;
        }
        
        $action = $data['action'] ?? '';
    }
    
    // Debug log
    error_log("Action received: " . $action);
    error_log("Data received: " . print_r($data, true));
    
    // Check database connection
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    
    // -------------------- LOAD DATA (for your fetch request) --------------------
    if ($action === "load") {
        $page = $data['page'] ?? 'personal';
        
        // Validate page type
        if (!in_array($page, ['personal', 'business'])) {
            $page = 'personal';
        }
        
        // Get categories for the page
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE type = ? ORDER BY name ASC");
        $stmt->execute([$page]);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all items
        $stmt = $pdo->prepare("SELECT * FROM items ORDER BY name ASC");
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate totals for each category
        foreach ($categories as &$category) {
            $category['total'] = 0;
            foreach ($items as $item) {
                if ($item['category_id'] == $category['id']) {
                    $category['total'] += (float)$item['price'];
                }
            }
        }
        
        $response = [
            "success" => true,
            "categories" => $categories,
            "items" => $items,
            "count" => [
                "categories" => count($categories),
                "items" => count($items)
            ]
        ];
    }
    
    // -------------------- SAVE CATEGORY --------------------
    elseif ($action === "addCategory" || $action === "save_category") {
        $type = $data['page'] ?? $data['type'] ?? '';
        $name = $data['name'] ?? '';
        
        if (empty($name) || empty($type)) {
            throw new Exception("Missing required fields: name and type/page");
        }
        
        $stmt = $pdo->prepare("INSERT INTO categories (type, name) VALUES (?, ?, NOW())");
        $success = $stmt->execute([$type, $name]);
        
        $response = [
            "success" => $success,
            "message" => $success ? "Category added successfully" : "Failed to add category",
            "id" => $success ? $pdo->lastInsertId() : null
        ];
    }
    
    // -------------------- SAVE ITEM ------------------------
    elseif ($action === "addItem" || $action === "save_item") {
        $catId = $data['category'] ?? $data['cat_id'] ?? 0;
        $name = $data['name'] ?? '';
        $price = $data['price'] ?? 0;
        
        if (empty($name) || $catId <= 0) {
            throw new Exception("Missing required fields: name and category");
        }
        
        $stmt = $pdo->prepare("INSERT INTO items (category_id, name, price) VALUES (?, ?, ?, NOW())");
        $success = $stmt->execute([$catId, $name, $price]);
        
        $response = [
            "success" => $success,
            "message" => $success ? "Item added successfully" : "Failed to add item",
            "id" => $success ? $pdo->lastInsertId() : null
        ];
    }
    
    // -------------------- GET ALL DATA ---------------------
    elseif ($action === "get_all") {
        $type = $data['type'] ?? 'personal';
        
        // Get categories
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE type = ? ORDER BY id DESC");
        $stmt->execute([$type]);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get items for each category
        foreach ($categories as &$category) {
            $stmt = $pdo->prepare("SELECT * FROM items WHERE category_id = ? ORDER BY id DESC");
            $stmt->execute([$category['id']]);
            $category['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $response = [
            "success" => true,
            "categories" => $categories,
            "count" => count($categories)
        ];
    }
    
    // -------------------- TOGGLE ITEM ---------------------
    elseif ($action === "toggleItem") {
        $id = $data['id'] ?? 0;
        $done = $data['done'] ?? 0;
        
        if ($id <= 0) {
            throw new Exception("Invalid item ID");
        }
        
        $stmt = $pdo->prepare("UPDATE items SET done = ? WHERE id = ?");
        $success = $stmt->execute([$done, $id]);
        
        $response = [
            "success" => $success,
            "message" => $success ? "Item updated" : "Failed to update item"
        ];
    }
    
    // -------------------- TEST ENDPOINT ---------------------
    elseif ($action === "test" || empty($action)) {
        // This is for browser testing
        $response = [
            "success" => true,
            "message" => "API is working!",
            "available_actions" => [
                "load (GET/POST) - Load categories and items",
                "addCategory/save_category - Add category",
                "addItem/save_item - Add item",
                "toggleItem - Toggle item status",
                "get_all - Get all categories with items"
            ],
            "test_data" => [
                "test_categories" => [
                    ["id" => 1, "name" => "Test Category", "type" => "personal", "total" => 100],
                    ["id" => 2, "name" => "Another Category", "type" => "business", "total" => 200]
                ],
                "test_items" => [
                    ["id" => 1, "category_id" => 1, "name" => "Test Item", "price" => 50, "done" => 0],
                    ["id" => 2, "category_id" => 1, "name" => "Another Item", "price" => 50, "done" => 1]
                ]
            ],
            "debug" => [
                "method" => $method,
                "action_received" => $action,
                "data_received" => $data,
                "timestamp" => date('Y-m-d H:i:s')
            ]
        ];
    }
    
    else {
        $response = [
            "success" => false,
            "error" => "Invalid action specified",
            "received_action" => $action,
            "available_actions" => ["load", "addCategory", "addItem", "toggleItem", "get_all"]
        ];
    }
    
} catch (Exception $e) {
    $response = [
        "success" => false,
        "error" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ];
    
    error_log("API Error: " . $e->getMessage());
}

// Output the response
echo json_encode($response, JSON_PRETTY_PRINT);
?>