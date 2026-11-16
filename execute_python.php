<?php
/**
 * Python Execution Backend Gateway
 * Safely handles code analysis payloads and invokes the Python AST engine.
 * Ensures strict shell escaping, payload bounding, and JSON output formatting.
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const MAX_PAYLOAD_SIZE = 65536; // 64 KB limit
const SCRIPT_PATH = __DIR__ . DIRECTORY_SEPARATOR . 'analyzer.py';

/**
 * Locate functional python executable on current host
 */
function resolvePythonBinary(): string {
    $candidates = ['python', 'python3', 'py', 'C:\\Python312\\python.exe', 'C:\\Python311\\python.exe'];
    foreach ($candidates as $bin) {
        $testCmd = (DIRECTORY_SEPARATOR === '\\') 
            ? "where.exe " . escapeshellarg($bin) . " 2>NUL" 
            : "which " . escapeshellarg($bin) . " 2>/dev/null";
        $out = @shell_exec($testCmd);
        if (!empty($out)) {
            return $bin;
        }
    }
    return 'python'; // Fallback to PATH resolution
}

// Receive payload
$rawInput = file_get_contents('php://input');
$code = '';

if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded) && isset($decoded['code'])) {
        $code = (string)$decoded['code'];
    } else {
        $code = $rawInput;
    }
} elseif (isset($_POST['code'])) {
    $code = (string)$_POST['code'];
}

// If no code sent and it's a GET request, use showcase sample
if (empty(trim($code))) {
    $code = <<<'PYTHON'
# Sample Neon Architecture Matrix Parser
import math

class MatrixOptimizer:
    def __init__(self, dimensions: tuple = (128, 128)):
        self.width, self.height = dimensions
        self.density = 0.85
        
    def calculate_entropy(self, weights: list[float]) -> float:
        """Calculates normalized Shannon entropy across tensor vector."""
        if not weights:
            return 0.0
        total = sum(weights)
        if total <= 0:
            return 0.0
            
        entropy = 0.0
        for w in weights:
            if w > 0:
                p = w / total
                entropy -= p * math.log2(p)
        return round(entropy, 4)
PYTHON;
}

// Guard payload size
if (strlen($code) > MAX_PAYLOAD_SIZE) {
    http_response_code(413);
    echo json_encode([
        'success' => false,
        'error_type' => 'PayloadTooLarge',
        'message' => 'Submitted code exceeds maximum limit of 64KB.'
    ]);
    exit;
}

if (!file_exists(SCRIPT_PATH)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error_type' => 'InternalError',
        'message' => 'Python analyzer script was not found on server.'
    ]);
    exit;
}

// Create unique temporary source file for isolated AST parsing
$tmpDir = sys_get_temp_dir();
$tmpFile = $tmpDir . DIRECTORY_SEPARATOR . 'ast_job_' . bin2hex(random_bytes(8)) . '.py';

if (file_put_contents($tmpFile, $code) === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error_type' => 'FileSystemError',
        'message' => 'Unable to write temporary execution payload.'
    ]);
    exit;
}

$startTime = microtime(true);
$pythonBin = resolvePythonBinary();

// Build safe command line
$escapedScript = escapeshellarg(SCRIPT_PATH);
$escapedTarget = escapeshellarg($tmpFile);
$command = "{$pythonBin} {$escapedScript} --file {$escapedTarget} 2>&1";

$outputLines = [];
$returnCode = 0;
exec($command, $outputLines, $returnCode);

$executionTimeMs = round((microtime(true) - $startTime) * 1000, 2);
$rawOutput = implode("\n", $outputLines);

// Clean up temporary payload file immediately
if (file_exists($tmpFile)) {
    @unlink($tmpFile);
}

// Parse returned JSON from Python
$jsonResponse = json_decode($rawOutput, true);

if (json_last_error() === JSON_ERROR_NONE && is_array($jsonResponse)) {
    // Inject PHP gateway telemetry
    $jsonResponse['gateway_meta'] = [
        'php_version' => PHP_VERSION,
        'gateway_time_ms' => $executionTimeMs,
        'status' => 'OK'
    ];
    http_response_code(200);
    echo json_encode($jsonResponse, JSON_PRETTY_PRINT);
} else {
    // Fallback error wrapper if python execution threw unhandled stderr
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'error_type' => 'ExecutionFailure',
        'message' => 'Python subprocess returned non-JSON output or runtime error.',
        'raw_output' => $rawOutput,
        'gateway_meta' => [
            'php_version' => PHP_VERSION,
            'gateway_time_ms' => $executionTimeMs,
            'exit_code' => $returnCode
        ]
    ], JSON_PRETTY_PRINT);
}
