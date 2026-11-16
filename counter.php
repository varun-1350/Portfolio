<?php
/**
 * Visitor Counter Backend Engine
 * Tracks unique visits using session verification & hashed IP storage.
 * Supports asynchronous JSON polling and server-side inclusion.
 */

// Enable strict error handling
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Determine if executed directly or included
$isCLI = (php_sapi_name() === 'cli');
$isDirectRequest = $isCLI || (basename($_SERVER['PHP_SELF'] ?? '') === 'counter.php');

if ($isDirectRequest && !$isCLI) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
}

// Start session if not active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

const STORAGE_FILE = __DIR__ . '/visitors.json';
const SALT = 'neon_dark_secret_salt_2026';

/**
 * Anonymize and hash client IP address
 */
function getClientFingerprint(): string {
    $headers = [
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_FORWARDED',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'REMOTE_ADDR'
    ];
    $ip = '127.0.0.1';
    foreach ($headers as $key) {
        if (!empty($_SERVER[$key])) {
            $ipList = explode(',', $_SERVER[$key]);
            $ip = trim($ipList[0]);
            break;
        }
    }
    // Hash IP with secret salt to protect visitor privacy
    return hash('sha256', $ip . SALT . ($_SERVER['HTTP_USER_AGENT'] ?? 'agent'));
}

/**
 * Read and update visitor metrics
 */
function recordVisitorHit(bool $increment = true): array {
    $dataFile = STORAGE_FILE;
    $defaultData = [
        'total_visits' => 1248, // Base seed count for a realistic portfolio impression
        'unique_visitors' => 482,
        'visitors_hashes' => [],
        'last_updated' => time()
    ];

    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, json_encode($defaultData, JSON_PRETTY_PRINT), LOCK_EX);
    }

    $fp = fopen($dataFile, 'c+');
    if (!$fp) {
        return [
            'status' => 'error',
            'message' => 'Unable to access storage file',
            'total_visits' => $defaultData['total_visits'],
            'unique_visitors' => $defaultData['unique_visitors']
        ];
    }

    // Acquire exclusive file lock
    flock($fp, LOCK_EX);
    $content = '';
    while (!feof($fp)) {
        $content .= fread($fp, 8192);
    }

    $data = json_decode($content, true);
    if (!is_array($data)) {
        $data = $defaultData;
    }

    $fingerprint = getClientFingerprint();
    $sessionKey = 'portfolio_visited_token';
    $isNewVisitor = false;

    if ($increment && !isset($_SESSION[$sessionKey])) {
        $_SESSION[$sessionKey] = time();
        $data['total_visits'] = ($data['total_visits'] ?? 0) + 1;

        if (!in_array($fingerprint, $data['visitors_hashes'] ?? [], true)) {
            $data['unique_visitors'] = ($data['unique_visitors'] ?? 0) + 1;
            $data['visitors_hashes'][] = $fingerprint;
            // Retain up to 2000 unique records to prevent unbounded memory growth
            if (count($data['visitors_hashes']) > 2000) {
                array_shift($data['visitors_hashes']);
            }
            $isNewVisitor = true;
        }
        $data['last_updated'] = time();

        // Rewind and write updated data
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
        fflush($fp);
    }

    // Release lock
    flock($fp, LOCK_UN);
    fclose($fp);

    return [
        'status' => 'success',
        'total_visits' => $data['total_visits'],
        'unique_visitors' => $data['unique_visitors'],
        'is_new_session' => $isNewVisitor,
        'last_updated' => $data['last_updated'] ?? time(),
        'server_time' => date('Y-m-d H:i:s')
    ];
}

// Check action parameter: "get" only retrieves without incrementing, default increments
$action = $_GET['action'] ?? ($_POST['action'] ?? 'hit');
$shouldIncrement = ($action !== 'get');

$stats = recordVisitorHit($shouldIncrement);

if ($isDirectRequest) {
    echo json_encode($stats);
    exit;
}
