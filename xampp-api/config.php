<?php
declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_NAME = 'pagae';
const DB_USER = 'root';
const DB_PASS = '';

function database(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    return is_array($body) ? $body : [];
}

function publicUser(array $user): array
{
    return ['name' => $user['name'], 'email' => $user['email'], 'phone' => $user['phone']];
}

function authorizationHeader(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    return $header;
}

function issueToken(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $query = database()->prepare('INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))');
    $query->execute([$userId, hash('sha256', $token)]);
    return $token;
}

function authenticatedUser(): array
{
    $header = authorizationHeader();
    if (!preg_match('/Bearer\s+(\S+)/i', $header, $matches)) jsonResponse(['message' => 'Não autenticado.'], 401);
    $query = database()->prepare('SELECT u.id, u.name, u.email, u.phone FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ? AND t.expires_at > NOW()');
    $query->execute([hash('sha256', $matches[1])]);
    $user = $query->fetch();
    if (!$user) jsonResponse(['message' => 'Sessão expirada.'], 401);
    return $user;
}
