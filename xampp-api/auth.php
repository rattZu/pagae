<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, bypass-tunnel-reminder');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['message' => 'Método não permitido.'], 405);

try {
    $action = $_GET['action'] ?? '';
    $body = requestBody();
    $pdo = database();

    if ($action === 'register') {
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $phone = trim((string)($body['phone'] ?? ''));
        $password = (string)($body['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) jsonResponse(['message' => 'Informe nome, e-mail válido e senha com pelo menos 6 caracteres.'], 422);
        try {
            $query = $pdo->prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)');
            $query->execute([$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT)]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') jsonResponse(['message' => 'Este e-mail já está cadastrado.'], 409);
            throw $error;
        }
        $id = (int)$pdo->lastInsertId();
        $user = ['id' => $id, 'name' => $name, 'email' => $email, 'phone' => $phone];
        jsonResponse(['user' => publicUser($user), 'token' => issueToken($id)], 201);
    }

    if ($action === 'login' || $action === 'demo') {
        $email = $action === 'demo' ? 'demo@empresta.app' : strtolower(trim((string)($body['email'] ?? '')));
        $password = $action === 'demo' ? '123456' : (string)($body['password'] ?? '');
        if ($action === 'demo') {
            $demo = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $demo->execute([$email]);
            if (!$demo->fetch()) {
                $create = $pdo->prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)');
                $create->execute(['Usuário demonstração', $email, '(11) 90000-0000', password_hash($password, PASSWORD_DEFAULT)]);
            }
        }
        $query = $pdo->prepare('SELECT id, name, email, phone, password_hash FROM users WHERE email = ? LIMIT 1');
        $query->execute([$email]);
        $user = $query->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) jsonResponse(['message' => 'E-mail ou senha incorretos.'], 401);
        jsonResponse(['user' => publicUser($user), 'token' => issueToken((int)$user['id'])]);
    }

    if ($action === 'update') {
        $current = authenticatedUser();
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $phone = trim((string)($body['phone'] ?? ''));
        $password = (string)($body['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['message' => 'Informe nome e e-mail válido.'], 422);
        if ($password !== '' && strlen($password) < 6) jsonResponse(['message' => 'A senha precisa ter pelo menos 6 caracteres.'], 422);
        $sql = 'UPDATE users SET name = ?, email = ?, phone = ?' . ($password !== '' ? ', password_hash = ?' : '') . ' WHERE id = ?';
        $values = [$name, $email, $phone];
        if ($password !== '') $values[] = password_hash($password, PASSWORD_DEFAULT);
        $values[] = $current['id'];
        try { $pdo->prepare($sql)->execute($values); } catch (PDOException $error) {
            if ($error->getCode() === '23000') jsonResponse(['message' => 'Este e-mail já está cadastrado.'], 409);
            throw $error;
        }
        jsonResponse(['user' => publicUser(['name' => $name, 'email' => $email, 'phone' => $phone])]);
    }

    if ($action === 'logout') {
        $header = authorizationHeader();
        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) $pdo->prepare('DELETE FROM auth_tokens WHERE token_hash = ?')->execute([hash('sha256', $matches[1])]);
        jsonResponse(['success' => true]);
    }

    if ($action === 'loans') {
        $current = authenticatedUser();
        $query = $pdo->prepare('SELECT id, person_name, person_phone, amount, description, due_date, late_interest_rate, created_at FROM loans WHERE user_id = ? ORDER BY created_at DESC');
        $query->execute([$current['id']]);
        $loans = $query->fetchAll();
        $paymentQuery = $pdo->prepare('SELECT id, amount, payment_date FROM loan_payments WHERE loan_id = ? ORDER BY payment_date ASC');
        foreach ($loans as &$loan) {
            $paymentQuery->execute([$loan['id']]);
            $loan['payments'] = array_map(static fn (array $payment): array => [
                'id' => $payment['id'],
                'amount' => (float)$payment['amount'],
                'date' => date(DATE_ATOM, strtotime($payment['payment_date']))
            ], $paymentQuery->fetchAll());
            $loan = [
                'id' => $loan['id'],
                'personName' => $loan['person_name'],
                'personPhone' => $loan['person_phone'],
                'amount' => (float)$loan['amount'],
                'description' => $loan['description'],
                'dueDate' => $loan['due_date'],
                'lateInterestRate' => $loan['late_interest_rate'] === null ? null : (float)$loan['late_interest_rate'],
                'createdAt' => date(DATE_ATOM, strtotime($loan['created_at'])),
                'payments' => $loan['payments']
            ];
        }
        unset($loan);
        jsonResponse(['loans' => $loans]);
    }

    if ($action === 'create-loan') {
        $current = authenticatedUser();
        $id = trim((string)($body['id'] ?? ''));
        $personName = trim((string)($body['personName'] ?? ''));
        $personPhone = trim((string)($body['personPhone'] ?? ''));
        $amount = (float)($body['amount'] ?? 0);
        $description = trim((string)($body['description'] ?? ''));
        $dueDate = trim((string)($body['dueDate'] ?? ''));
        $lateInterestRate = $body['lateInterestRate'] ?? null;
        if (!preg_match('/^[a-f0-9-]{20,}$/i', $id) || $personName === '' || $amount <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) {
            jsonResponse(['message' => 'Dados do empréstimo inválidos.'], 422);
        }
        $query = $pdo->prepare('INSERT INTO loans (id, user_id, person_name, person_phone, amount, description, due_date, late_interest_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        $query->execute([$id, $current['id'], $personName, $personPhone, $amount, $description, $dueDate, $lateInterestRate === null ? null : (float)$lateInterestRate]);
        jsonResponse(['success' => true], 201);
    }

    if ($action === 'create-payment') {
        $current = authenticatedUser();
        $id = trim((string)($body['id'] ?? ''));
        $loanId = trim((string)($body['loanId'] ?? ''));
        $amount = (float)($body['amount'] ?? 0);
        if (!preg_match('/^[a-f0-9-]{20,}$/i', $id) || !preg_match('/^[a-f0-9-]{20,}$/i', $loanId) || $amount <= 0) {
            jsonResponse(['message' => 'Dados do pagamento inválidos.'], 422);
        }
        $ownedLoan = $pdo->prepare('SELECT id FROM loans WHERE id = ? AND user_id = ?');
        $ownedLoan->execute([$loanId, $current['id']]);
        if (!$ownedLoan->fetch()) jsonResponse(['message' => 'Empréstimo não encontrado.'], 404);
        $query = $pdo->prepare('INSERT INTO loan_payments (id, loan_id, amount, payment_date) VALUES (?, ?, ?, NOW())');
        $query->execute([$id, $loanId, $amount]);
        jsonResponse(['success' => true], 201);
    }

    if ($action === 'delete-loan') {
        $current = authenticatedUser();
        $loanId = trim((string)($body['loanId'] ?? ''));
        if (!preg_match('/^[a-f0-9-]{20,}$/i', $loanId)) {
            jsonResponse(['message' => 'Empréstimo inválido.'], 422);
        }
        $query = $pdo->prepare('DELETE FROM loans WHERE id = ? AND user_id = ?');
        $query->execute([$loanId, $current['id']]);
        if ($query->rowCount() === 0) jsonResponse(['message' => 'Empréstimo não encontrado.'], 404);
        jsonResponse(['success' => true]);
    }
    jsonResponse(['message' => 'Ação inválida.'], 400);
} catch (Throwable $error) {
    error_log($error->getMessage());
    jsonResponse(['message' => 'Erro interno do servidor.'], 500);
}
