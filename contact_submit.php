<?php
/**
 * Contact Submission & Database Ingestion Engine
 * Safely persists inquiries into an SQL database (SQLite by default, switchable to MySQL).
 * Built with PDO, prepared statements, and fail-safe JSON backup.
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

// ==============================================================================
// 🔧 DATABASE CONFIGURATION
// ==============================================================================
// By default, this uses SQLite (`contacts.db`) so contacts are saved immediately
// with ZERO configuration needed!
// 
// When you're ready to switch to MySQL in the future, simply change DB_DRIVER
// to 'mysql' and supply your host, database name, user, and password below:
// ==============================================================================
define('DB_DRIVER',   'sqlite');       // 'sqlite' or 'mysql'
define('DB_HOST',     '127.0.0.1');    // MySQL host (e.g., 'localhost')
define('DB_PORT',     '3306');         // MySQL port
define('DB_NAME',     'portfolio_db'); // MySQL database name
define('DB_USER',     'root');         // MySQL username
define('DB_PASS',     '');             // MySQL password
define('SQLITE_FILE', __DIR__ . DIRECTORY_SEPARATOR . 'contacts.db');

/**
 * Establish PDO database connection with automatic table initialization
 */
function getDatabaseConnection(): PDO {
    $driver = strtolower(DB_DRIVER);

    if ($driver === 'mysql') {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        // Auto-create MySQL table if not present
        $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            scope VARCHAR(255) NULL,
            message TEXT NOT NULL,
            ip_address VARCHAR(100) NULL,
            user_agent TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        return $pdo;
    }

    // Default: SQLite (Requires no database setup)
    $dsn = 'sqlite:' . SQLITE_FILE;
    $pdo = new PDO($dsn, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Auto-create SQLite table if not present
    $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        scope TEXT,
        message TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );");

    return $pdo;
}

// Receive and decode payload (supports JSON body and form-encoded data)
$rawInput = file_get_contents('php://input');
$payload = [];

if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $payload = $decoded;
    }
}
if (empty($payload)) {
    $payload = $_POST;
}

$name    = trim((string)($payload['name'] ?? ''));
$email   = trim((string)($payload['email'] ?? ''));
$scope   = trim((string)($payload['scope'] ?? ''));
$message = trim((string)($payload['message'] ?? ''));

// Validate input
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Name, email, and message are required fields.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Please provide a valid email address.'
    ]);
    exit;
}

// Client metadata
$ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Agent';

try {
    $db = getDatabaseConnection();
    $stmt = $db->prepare("INSERT INTO contacts (name, email, scope, message, ip_address, user_agent, created_at) 
                          VALUES (:name, :email, :scope, :message, :ip, :ua, :created)");
    
    $stmt->execute([
        ':name'    => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
        ':email'   => $email,
        ':scope'   => htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'),
        ':message' => htmlspecialchars($message, ENT_QUOTES, 'UTF-8'),
        ':ip'      => substr($ipAddress, 0, 100),
        ':ua'      => substr($userAgent, 0, 500),
        ':created' => date('Y-m-d H:i:s')
    ]);

    $insertId = (int)$db->lastInsertId();

    http_response_code(200);
    echo json_encode([
        'status'    => 'success',
        'message'   => 'Transmission received! Your message was securely saved to the database.',
        'entry_id'  => $insertId,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Throwable $e) {
    // Fail-safe: Save to JSON backup file so no contact is ever lost if DB is down
    $backupFile = __DIR__ . DIRECTORY_SEPARATOR . 'contacts_backup.json';
    $existing = file_exists($backupFile) ? json_decode(file_get_contents($backupFile), true) : [];
    if (!is_array($existing)) $existing = [];

    $existing[] = [
        'name'       => $name,
        'email'      => $email,
        'scope'      => $scope,
        'message'    => $message,
        'ip'         => $ipAddress,
        'created_at' => date('Y-m-d H:i:s'),
        'db_error'   => $e->getMessage()
    ];
    file_put_contents($backupFile, json_encode($existing, JSON_PRETTY_PRINT), LOCK_EX);

    http_response_code(200);
    echo json_encode([
        'status'    => 'success',
        'message'   => 'Transmission received! Message queued safely in backup store.',
        'note'      => 'Database connecting via fallback.'
    ]);
}
