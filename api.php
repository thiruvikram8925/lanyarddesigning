<?php
/**
 * GOTEK ID - Complete PHP API (mirrors server.js exactly)
 */

// --- CONFIGURATION ---
$db_host = 'localhost';
$db_name = 'u856184323_IDCroppingtool';
$db_user = 'u856184323_CroppingtoolID';
$db_pass = 'Eash@2005';

// --- PHP RUNTIME OVERRIDES ---
@ini_set('upload_max_filesize', '10240M');
@ini_set('post_max_size', '10500M');
@ini_set('max_execution_time', '3600');
@ini_set('max_input_time', '3600');
@ini_set('memory_limit', '512M');

// --- CORS & HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DATABASE CONNECTION ---
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed", "details" => $e->getMessage()]);
    exit();
}

// --- ROUTING ---
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Strip the /api/ prefix - handles both direct and rewritten requests
if (preg_match('#/api/(.*)#', $requestUri, $m)) {
    $path = $m[1];
} elseif (preg_match('#api\.php(.*)#', $requestUri, $m)) {
    $path = ltrim($m[1], '/');
} else {
    $path = $_GET['route'] ?? '';
}

$parts = array_values(array_filter(explode('/', trim($path, '/'))));
$input = json_decode(file_get_contents('php://input'), true);

// Helper to get Authorization header
function getAuthUserId() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer fake-jwt-token-(.+)/', $auth, $m)) return $m[1];
    return null;
}

// Helper to add frontend-expected fields
function decorateUser($user) {
    $user['_id'] = $user['id'];
    $user['isActive'] = true;
    return $user;
}

// --- ROUTE MATCHING ---
$p0 = $parts[0] ?? '';
$p1 = $parts[1] ?? '';
$p2 = $parts[2] ?? '';
$p3 = $parts[3] ?? '';
$p4 = $parts[4] ?? '';
$p5 = $parts[5] ?? '';

// ============ AUTH ROUTES ============
if ($p0 === 'auth' && $p1 === 'login' && $method === 'POST') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user && $user['password'] === $password) {
        unset($user['password']);
        $user['token'] = "fake-jwt-token-" . $user['id'];
        echo json_encode(decorateUser($user));
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid email or password"]);
    }
}
elseif ($p0 === 'auth' && $p1 === 'register' && $method === 'POST') {
    $email = $input['email'] ?? '';
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(["message" => "User already exists"]);
        exit;
    }
    $id = uniqid('', true);
    $pdo->prepare("INSERT INTO users (id, name, email, password, role, organization, trial_end_date, creator_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())")
        ->execute([$id, $input['name'], $email, $input['password'], $input['role'] ?? 'user', $input['organization'] ?? null, $input['trial_end_date'] ?? null, $input['creator_id'] ?? null]);
    $stmt = $pdo->prepare("SELECT id, name, email, role, organization, trial_end_date, creator_id, created_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    $user['token'] = "fake-jwt-token-" . $id;
    echo json_encode(decorateUser($user));
}
elseif ($p0 === 'auth' && $p1 === 'me' && $method === 'GET') {
    $userId = getAuthUserId();
    if (!$userId) { http_response_code(401); echo json_encode(["message" => "No token provided"]); exit; }
    $stmt = $pdo->prepare("SELECT id, name, email, role, organization, trial_end_date, creator_id, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if ($user) { echo json_encode(decorateUser($user)); }
    else { http_response_code(401); echo json_encode(["message" => "User not found"]); }
}
elseif ($p0 === 'auth' && $p1 === 'users' && $p2 && $p3 === 'role' && $method === 'PUT') {
    $pdo->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([$input['role'], $p2]);
    echo json_encode(["success" => true, "message" => "Role updated successfully"]);
}
elseif ($p0 === 'auth' && $p1 === 'users' && $p2 && $p3 === 'password' && $method === 'PUT') {
    $pw = $input['password'] ?? '';
    if (strlen($pw) < 6) { http_response_code(400); echo json_encode(["message" => "Password must be at least 6 characters"]); exit; }
    $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$pw, $p2]);
    echo json_encode(["success" => true, "message" => "Password updated successfully"]);
}
elseif ($p0 === 'auth' && $p1 === 'users' && $p2 && !$p3 && $method === 'PUT') {
    $name = $input['name'] ?? null;
    if ($name) $pdo->prepare("UPDATE users SET name = ? WHERE id = ?")->execute([$name, $p2]);
    echo json_encode(["success" => true, "message" => "Profile updated successfully"]);
}
elseif ($p0 === 'auth' && $p1 === 'users' && $p2 && $p3 === 'trial' && $method === 'PUT') {
    $trialEndDate = $input['trial_end_date'] ?? null;
    $pdo->prepare("UPDATE users SET trial_end_date = ? WHERE id = ? OR creator_id = ? OR creator_id IN (SELECT id FROM (SELECT id FROM users WHERE creator_id = ?) AS tmp)")->execute([$trialEndDate, $p2, $p2, $p2]);
    echo json_encode(["success" => true, "message" => "Trial updated successfully"]);
}
elseif ($p0 === 'auth' && $p1 === 'users' && $p2 && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$p2]);
    echo json_encode(["success" => true]);
}
elseif ($p0 === 'auth' && $p1 === 'users' && !$p2 && $method === 'GET') {
    $stmt = $pdo->query("SELECT id, name, email, role, organization, trial_end_date, creator_id, created_at FROM users");
    echo json_encode($stmt->fetchAll());
}

// ============ PROJECTS ============
elseif ($p0 === 'projects' && !$p1 && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM projects ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll());
}
elseif ($p0 === 'projects' && !$p1 && $method === 'POST') {
    $id = $input['id'] ?? uniqid('proj_');
    $pdo->prepare("INSERT INTO projects (id, name, organization, branch, status, template, total_records, valid_records, invalid_records, missing_photos, color, created_by, current_stage, completed_stages, estimated_delivery, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())")
        ->execute([$id, $input['name'] ?? '', $input['organization'] ?? '', $input['branch'] ?? '', $input['status'] ?? 'draft', $input['template'] ?? 'School', $input['total_records'] ?? 0, $input['valid_records'] ?? 0, $input['invalid_records'] ?? 0, $input['missing_photos'] ?? 0, $input['color'] ?? '#3B82F6', $input['created_by'] ?? null, $input['current_stage'] ?? 'data_collected', $input['completed_stages'] ?? '[]', $input['estimated_delivery'] ?? null]);
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?"); $stmt->execute([$id]);
    echo json_encode($stmt->fetch());
}
elseif ($p0 === 'projects' && $p1 && $p2 === 'issues' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM records WHERE project_id = ? AND (photo_url IS NULL OR photo_url = '')");
    $stmt->execute([$p1]);
    $issues = [];
    foreach ($stmt->fetchAll() as $i) {
        $issues[] = ["id" => $i['id'], "recordId" => $i['id'], "record" => $i['name'] ?? 'Unnamed Record', "message" => "Missing photo", "severity" => "warning", "fixable" => true];
    }
    echo json_encode($issues);
}
elseif ($p0 === 'projects' && $p1 && $p2 === 'view-pdf' && $method === 'GET') {
    $token = $_GET['token'] ?? '';
    if (!$token) { http_response_code(401); echo json_encode(["message" => "Authentication token required"]); exit; }
    $userId = str_replace('fake-jwt-token-', '', $token);
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?"); $stmt->execute([$userId]);
    $u = $stmt->fetch();
    if (!$u) { http_response_code(401); echo json_encode(["message" => "Invalid user or token"]); exit; }
    $stmt = $pdo->prepare("SELECT name, pdf_url FROM projects WHERE id = ?"); $stmt->execute([$p1]);
    $proj = $stmt->fetch();
    if (!$proj || !$proj['pdf_url']) { http_response_code(404); echo json_encode(["message" => "Project or PDF not found"]); exit; }
    $filename = basename(parse_url($proj['pdf_url'], PHP_URL_PATH));
    $filePath = __DIR__ . '/uploads/' . $filename;
    if (!file_exists($filePath)) { http_response_code(404); echo json_encode(["message" => "PDF file missing on server"]); exit; }
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . ($proj['name'] ?? 'download') . '.pdf"');
    header('Content-Length: ' . filesize($filePath));
    header('Accept-Ranges: bytes');
    
    // Clear any output buffers to ensure no whitespace is prepended to the PDF
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($filePath);
    exit;
}
elseif ($p0 === 'projects' && $p1 && $p2 === 'photos' && $method === 'GET') {
    $dir = __DIR__ . '/uploads/projects/' . preg_replace('/[^a-zA-Z0-9_\-]/', '', $p1) . '/photos';
    $files = [];
    if (is_dir($dir)) {
        foreach (scandir($dir) as $f) {
            if ($f !== '.' && $f !== '..') {
                $files[] = $f;
            }
        }
    }
    $host = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    $urls = [];
    foreach($files as $f) {
        $urls[] = ["name" => $f, "url" => "$host/uploads/projects/$p1/photos/" . rawurlencode($f)];
    }
    echo json_encode(["success" => true, "photos" => $urls]);
    exit;
}
elseif ($p0 === 'projects' && $p1 && !$p2 && $method === 'PUT') {
    $allowed = ['name','organization','status','template','total_records','valid_records','invalid_records','missing_photos','color','created_by','current_stage','completed_stages','pdf_url','assignedTo','assignedToName','branch','stage_timestamps','completed_at','estimated_delivery','design_state'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $input)) { $sets[] = "`$f` = ?"; $vals[] = $input[$f]; }
    }
    if (empty($sets)) { http_response_code(400); echo json_encode(["error" => "No valid fields to update"]); exit; }
    $vals[] = $p1;
    $pdo->prepare("UPDATE projects SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?"); $stmt->execute([$p1]);
    echo json_encode($stmt->fetch() ?: ["success" => true]);
}
elseif ($p0 === 'projects' && $p1 && !$p2 && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM records WHERE project_id = ?")->execute([$p1]);
    $pdo->prepare("DELETE FROM projects WHERE id = ?")->execute([$p1]);
    echo json_encode(["success" => true]);
}

// ============ RECORDS ============
elseif ($p0 === 'records' && $p1 === 'bulk' && $method === 'POST') {
    $projectId = $input['projectId'];
    foreach ($input['records'] as $r) {
        $id = $r['id'] ?? uniqid('rec_');
        $jsonData = is_array($r['data'] ?? null) ? json_encode($r['data']) : ($r['data'] ?? json_encode($r));
        $pdo->prepare("INSERT INTO records (id, project_id, name, photo_url, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())")
            ->execute([$id, $projectId, $r['name'] ?? null, $r['photo_url'] ?? null, $jsonData]);
    }
    echo json_encode(["success" => true, "count" => count($input['records'])]);
}
elseif ($p0 === 'records' && !$p1 && $method === 'GET') {
    $projectId = $_GET['projectId'] ?? null;
    if ($projectId) {
        $stmt = $pdo->prepare("SELECT * FROM records WHERE project_id = ?"); $stmt->execute([$projectId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM records");
    }
    echo json_encode($stmt->fetchAll());
}
elseif ($p0 === 'records' && $p1 && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?"); $stmt->execute([$p1]);
    echo json_encode($stmt->fetch());
}
elseif ($p0 === 'records' && !$p1 && $method === 'POST') {
    if (isset($input['records'])) {
        foreach ($input['records'] as $r) {
            $id = $r['id'] ?? uniqid('rec_');
            $pdo->prepare("INSERT INTO records (id, project_id, name, photo_url, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())")
                ->execute([$id, $input['projectId'], $r['name'] ?? null, $r['photoUrl'] ?? null, json_encode($r)]);
        }
        echo json_encode(["status" => "bulk_success"]);
    } else {
        $id = $input['id'] ?? uniqid('rec_');
        $pdo->prepare("INSERT INTO records (id, project_id, name, photo_url, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())")
            ->execute([$id, $input['project_id'] ?? $input['projectId'], $input['name'] ?? null, $input['photoUrl'] ?? $input['photo_url'] ?? null, json_encode($input)]);
        echo json_encode(["id" => $id, "success" => true]);
    }
}
elseif ($p0 === 'records' && $p1 && $method === 'PUT') {
    $pdo->prepare("UPDATE records SET name = ?, photo_url = ?, data = ? WHERE id = ?")
        ->execute([$input['name'] ?? null, $input['photo_url'] ?? $input['photoUrl'] ?? null, json_encode($input), $p1]);
    echo json_encode(["success" => true]);
}
elseif ($p0 === 'records' && $p1 && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM records WHERE id = ?")->execute([$p1]);
    echo json_encode(["success" => true]);
}

// ============ ORDERS ============
elseif ($p0 === 'orders' && $p1 && $p2 === 'status' && $method === 'PUT') {
    $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$input['status'], $p1]);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?"); $stmt->execute([$p1]);
    echo json_encode($stmt->fetch());
}
elseif ($p0 === 'orders' && $p1 && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?"); $stmt->execute([$p1]);
    $order = $stmt->fetch();
    echo json_encode($order ?: ["id" => $p1, "projectId" => str_replace('order-', '', $p1), "status" => "draft", "totalCards" => 0]);
}
elseif ($p0 === 'orders' && !$p1 && $method === 'GET') {
    echo json_encode($pdo->query("SELECT * FROM orders ORDER BY created_at DESC")->fetchAll());
}
elseif ($p0 === 'orders' && !$p1 && $method === 'POST') {
    $id = $input['id'] ?? 'order-' . uniqid();
    $pdo->prepare("INSERT INTO orders (id, projectId, status, created_at) VALUES (?, ?, ?, NOW())")
        ->execute([$id, $input['projectId'], $input['status'] ?? 'pending']);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?"); $stmt->execute([$id]);
    echo json_encode($stmt->fetch());
}

// ============ DASHBOARD ============
elseif ($p0 === 'dashboard' && $p1 === 'stats') {
    $projects = $pdo->query("SELECT COUNT(*) as c FROM projects")->fetch()['c'];
    $superAdmins = $pdo->query("SELECT COUNT(*) as c FROM users WHERE role='super-admin'")->fetch()['c'];
    $admins = $pdo->query("SELECT COUNT(*) as c FROM users WHERE role='admin'")->fetch()['c'];
    $users = $pdo->query("SELECT COUNT(*) as c FROM users WHERE role='user'")->fetch()['c'];
    echo json_encode(["totalProjects" => (int)$projects, "totalSuperAdmins" => (int)$superAdmins, "totalAdmins" => (int)$admins, "totalUsers" => (int)$users]);
}

// ============ UPLOADS ============
elseif ($p0 === 'upload') {
    $subType = $p1; // photo, excel, zip, chunked, or empty
    if ($subType === 'chunked') {
        $action = $p2; // init, or uploadId
        if ($action === 'init' && $method === 'POST') {
            echo json_encode(["uploadId" => uniqid('up_'), "message" => "Chunked upload session created"]);
        } elseif ($p3 === 'chunk') {
            $uploadId = $p2; $chunkIndex = $p4 ?? ($_POST['chunkIndex'] ?? 0);
            $tempDir = __DIR__ . '/uploads/_chunks/' . preg_replace('/[^a-zA-Z0-9_\-]/', '', $uploadId);
            if (!is_dir($tempDir)) mkdir($tempDir, 0777, true);
            $f = $_FILES['chunk'] ?? $_FILES['file'] ?? null;
            if ($f) { move_uploaded_file($f['tmp_name'], $tempDir . '/chunk_' . (int)$chunkIndex); }
            echo json_encode(["received" => true, "chunkIndex" => (int)$chunkIndex]);
        } elseif ($p3 === 'finalize') {
            $uploadId = $p2;
            $fileName = $input['fileName'] ?? 'upload.pdf';
            $totalChunks = (int)($input['totalChunks'] ?? 0);
            $tempDir = __DIR__ . '/uploads/_chunks/' . preg_replace('/[^a-zA-Z0-9_\-]/', '', $uploadId);
            $ext = pathinfo($fileName, PATHINFO_EXTENSION);
            $newName = time() . '-' . substr(uniqid(), 0, 8) . '.' . $ext;
            $target = __DIR__ . '/uploads/' . $newName;
            $out = fopen($target, 'wb');
            for ($i = 0; $i < $totalChunks; $i++) {
                $cp = $tempDir . '/chunk_' . $i;
                if (file_exists($cp)) { $in = fopen($cp, 'rb'); while ($b = fread($in, 1048576)) fwrite($out, $b); fclose($in); unlink($cp); }
            }
            fclose($out); @rmdir($tempDir);
            
            $host = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
            
            // Extract ZIP if requested
            $extractPath = $input['extractPath'] ?? null;
            if ($extractPath && strtolower($ext) === 'zip') {
                $zip = new ZipArchive;
                if ($zip->open($target) === TRUE) {
                    $extractDir = __DIR__ . '/uploads/' . preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $extractPath);
                    if (!is_dir($extractDir)) mkdir($extractDir, 0777, true);
                    $zip->extractTo($extractDir);
                    $zip->close();
                    @unlink($target);
                    echo json_encode(["url" => "$host/uploads/$extractPath", "path" => "uploads/$extractPath", "extracted" => true]);
                    exit;
                }
            }
            
            echo json_encode(["url" => "$host/uploads/$newName", "path" => "uploads/$newName"]);
        }
    } else {
        // Standard upload (photo, excel, zip, or generic)
        $f = $_FILES['file'] ?? null;
        if (!$f) { http_response_code(400); echo json_encode(["error" => "No file uploaded"]); exit; }
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($f['name'], PATHINFO_EXTENSION);
        $newName = time() . '-' . substr(uniqid(), 0, 8) . '.' . $ext;
        if (move_uploaded_file($f['tmp_name'], $uploadDir . $newName)) {
            $host = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
            
            // Extract ZIP if requested
            $extractPath = $_POST['extractPath'] ?? null;
            if ($extractPath && strtolower($ext) === 'zip') {
                $target = $uploadDir . $newName;
                $zip = new ZipArchive;
                if ($zip->open($target) === TRUE) {
                    $extractDir = __DIR__ . '/uploads/' . preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $extractPath);
                    if (!is_dir($extractDir)) mkdir($extractDir, 0777, true);
                    $zip->extractTo($extractDir);
                    $zip->close();
                    @unlink($target);
                    echo json_encode(["url" => "$host/uploads/$extractPath", "path" => "uploads/$extractPath", "extracted" => true]);
                    exit;
                }
            }

            echo json_encode(["url" => "$host/uploads/$newName", "path" => "uploads/$newName"]);
        } else {
            http_response_code(500); echo json_encode(["error" => "Failed to save file"]);
        }
    }
}

// ============ GENERIC TABLES (schools, templates, advertisements) ============
elseif (in_array($p0, ['schools', 'templates', 'advertisements'])) {
    $table = $p0;
    // Check table exists
    try { $pdo->query("SELECT 1 FROM `$table` LIMIT 1"); } catch (Exception $e) {
        echo json_encode([]); exit;
    }
    if ($method === 'GET' && $p1) {
        if ($p2 === 'verify' && $table === 'schools') {
            $pdo->prepare("UPDATE schools SET is_verified = 1 - COALESCE(is_verified, 0) WHERE id = ?")->execute([$p1]);
            echo json_encode(["success" => true]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = ?"); $stmt->execute([$p1]);
            echo json_encode($stmt->fetch() ?: null);
        }
    } elseif ($method === 'GET') {
        echo json_encode($pdo->query("SELECT * FROM `$table` ORDER BY created_at DESC")->fetchAll());
    } elseif ($method === 'POST') {
        if (!isset($input['id'])) $input['id'] = uniqid($table . '_');
        $cols = array_keys($input); $vals = array_values($input);
        $ph = implode(',', array_fill(0, count($vals), '?'));
        $pdo->prepare("INSERT INTO `$table` (`" . implode('`,`', $cols) . "`) VALUES ($ph)")->execute($vals);
        echo json_encode(["success" => true, "id" => $input['id']]);
    } elseif ($method === 'PUT' && $p1) {
        if ($p2 === 'verify' && $table === 'schools') {
            $pdo->prepare("UPDATE schools SET is_verified = 1 - COALESCE(is_verified, 0) WHERE id = ?")->execute([$p1]);
        } else {
            $sets = []; $vals = [];
            foreach ($input as $k => $v) { if ($k !== 'id') { $sets[] = "`$k` = ?"; $vals[] = $v; } }
            $vals[] = $p1;
            $pdo->prepare("UPDATE `$table` SET " . implode(',', $sets) . " WHERE id = ?")->execute($vals);
        }
        echo json_encode(["success" => true]);
    } elseif ($method === 'DELETE' && $p1) {
        $pdo->prepare("DELETE FROM `$table` WHERE id = ?")->execute([$p1]);
        echo json_encode(["success" => true]);
    }
}

// ============ 404 ============
else {
    http_response_code(404);
    echo json_encode(["error" => "Endpoint not found", "path" => $path, "method" => $method, "parts" => $parts]);
}
