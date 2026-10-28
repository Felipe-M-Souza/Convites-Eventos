<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=UTF-8');

function debug_enabled(): bool
{
    return isset($_GET['debug']) && $_GET['debug'] === '1';
}

function env_value(string $key): string
{
    $v = getenv($key);
    if (is_string($v) && $v !== '') return $v;

    static $env = null;
    if ($env === null) {
        $env = [];
        $candidates = [__DIR__ . '/.env', __DIR__ . '/../.env'];
        foreach ($candidates as $path) {
            if (!is_file($path)) continue;
            $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (!is_array($lines)) continue;
            foreach ($lines as $line) {
                $line = trim((string)$line);
                if ($line === '' || str_starts_with($line, '#')) continue;
                $pos = strpos($line, '=');
                if ($pos === false) continue;
                $name = trim(substr($line, 0, $pos));
                $value = trim(substr($line, $pos + 1));
                if ($name === '') continue;
                $env[$name] = trim($value, " \t\n\r\0\x0B\"'");
            }
            if (!empty($env)) {
                break;
            }
        }
    }
    $raw = $env[$key] ?? '';
    return is_string($raw) ? trim($raw, " \t\n\r\0\x0B\"'") : '';
}

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function slug_from_request(): string
{
    $slug = $_GET['slug'] ?? '';
    if (!is_string($slug)) return 'default';
    $slug = strtolower(trim($slug));
    if ($slug === '') return 'default';
    if (!preg_match('/^[a-z0-9-]{2,64}$/', $slug)) return 'default';
    return $slug;
}

function current_origin(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme . '://' . $host;
}

function http_status_from_response_headers(array $headers): int
{
    foreach ($headers as $header) {
        if (!is_string($header)) continue;
        if (preg_match('/\s(\d{3})\s/', $header, $matches) === 1) {
            return (int)$matches[1];
        }
    }
    return 0;
}

function text_snippet(?string $value, int $limit = 280): string
{
    if (!is_string($value) || $value === '') return '';
    $normalized = preg_replace('/\s+/u', ' ', $value) ?? '';
    if ($normalized === '') return '';
    return mb_strlen($normalized, 'UTF-8') > $limit
        ? mb_substr($normalized, 0, $limit, 'UTF-8') . '...'
        : $normalized;
}

function http_get(string $url, array $headers, int $timeout = 5): array
{
    $result = [
        'transport' => 'none',
        'status' => 0,
        'body' => null,
        'error' => '',
    ];

    $headerRaw = implode("\r\n", $headers);
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => $headerRaw,
            'timeout' => $timeout,
            'ignore_errors' => true,
        ],
    ]);

    $result['transport'] = 'file_get_contents';
    $raw = @file_get_contents($url, false, $ctx);
    $responseHeaders = isset($http_response_header) && is_array($http_response_header) ? $http_response_header : [];
    $result['status'] = http_status_from_response_headers($responseHeaders);
    if (is_string($raw)) {
        $result['body'] = $raw;
        return $result;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch !== false) {
            $result['transport'] = 'curl';
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HEADER, false);
            $data = curl_exec($ch);
            $result['status'] = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);
            if (is_string($data)) {
                $result['body'] = $data;
            }
            if ($curlError !== '') {
                $result['error'] = $curlError;
            }
            return $result;
        }
    }

    return $result;
}

function fetch_invite_payload(string $slug, ?array &$debug = null): ?array
{
    $url = env_value('VITE_SUPABASE_URL');
    $anon = env_value('VITE_SUPABASE_ANON_KEY');
    if ($url === '' || $anon === '') return null;

    $endpoint = rtrim($url, '/') . '/rest/v1/invite_config?slug=eq.' . rawurlencode($slug) . '&select=payload&limit=1';
    $headers = [
        'apikey: ' . $anon,
        'Accept: application/json',
    ];
    if (str_starts_with($anon, 'eyJ')) {
        $headers[] = 'Authorization: Bearer ' . $anon;
    }

    $http = http_get($endpoint, $headers, 5);
    $raw = is_string($http['body'] ?? null) ? $http['body'] : '';
    if ($debug !== null) {
        $debug = [
            'endpoint' => $endpoint,
            'transport' => (string) ($http['transport'] ?? 'none'),
            'http_status' => (int) ($http['status'] ?? 0),
            'http_error' => (string) ($http['error'] ?? ''),
            'body_snippet' => text_snippet($raw),
        ];
    }
    if ($raw === '') return null;
    $json = json_decode($raw, true);
    if (!is_array($json) || empty($json[0]['payload']) || !is_array($json[0]['payload'])) return null;
    return $json[0]['payload'];
}

$slug = slug_from_request();
$origin = current_origin();
$inviteUrl = $origin . '/c/' . rawurlencode($slug);

$title = 'Convite digital';
$description = 'Você recebeu um convite especial.';
$image = $origin . '/images/hero-couple.jpg';

$debugInfo = [];
$payload = fetch_invite_payload($slug, $debugInfo);
$inviteEnabled = !is_array($payload) || !array_key_exists('inviteEnabled', $payload) || $payload['inviteEnabled'] !== false;
if (is_array($payload) && !$inviteEnabled) {
    $title = 'Este convite ainda não está liberado';
    $description = 'Assim que o pagamento for aprovado, ele fica disponível para os convidados. A visualização é vitalícia.';
} elseif (is_array($payload)) {
    $couple = trim((string)($payload['coupleNames'] ?? ''));
    $message = trim(preg_replace('/\s+/u', ' ', (string)($payload['message'] ?? '')) ?? '');
    $cover = trim((string)($payload['coverImageUrl'] ?? ''));

    if ($couple !== '') $title = $couple . ' | Convite digital';
    if ($message !== '') $description = mb_substr($message, 0, 170, 'UTF-8');
    if ($cover !== '') $image = $cover;
}

if (debug_enabled()) {
    header('Content-Type: text/plain; charset=UTF-8');
    $hasUrl = env_value('VITE_SUPABASE_URL') !== '';
    $hasAnon = env_value('VITE_SUPABASE_ANON_KEY') !== '';
    echo "debug=1\n";
    echo "slug={$slug}\n";
    echo "has_supabase_url=" . ($hasUrl ? 'yes' : 'no') . "\n";
    echo "has_supabase_anon=" . ($hasAnon ? 'yes' : 'no') . "\n";
    echo "payload_found=" . (is_array($payload) ? 'yes' : 'no') . "\n";
    if (!empty($debugInfo)) {
        echo "endpoint=" . (string) ($debugInfo['endpoint'] ?? '') . "\n";
        echo "transport=" . (string) ($debugInfo['transport'] ?? '') . "\n";
        echo "http_status=" . (string) ($debugInfo['http_status'] ?? '') . "\n";
        echo "http_error=" . (string) ($debugInfo['http_error'] ?? '') . "\n";
        echo "body_snippet=" . (string) ($debugInfo['body_snippet'] ?? '') . "\n";
    }
    if (is_array($payload)) {
        echo "coupleNames=" . (string)($payload['coupleNames'] ?? '') . "\n";
    }
    exit;
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= esc($title) ?></title>
  <meta name="description" content="<?= esc($description) ?>" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="<?= esc($title) ?>" />
  <meta property="og:description" content="<?= esc($description) ?>" />
  <meta property="og:image" content="<?= esc($image) ?>" />
  <meta property="og:url" content="<?= esc($inviteUrl) ?>" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="<?= esc($title) ?>" />
  <meta name="twitter:description" content="<?= esc($description) ?>" />
  <meta name="twitter:image" content="<?= esc($image) ?>" />
  <meta http-equiv="refresh" content="0; url=<?= esc($inviteUrl) ?>" />
  <link rel="canonical" href="<?= esc($inviteUrl) ?>" />
  <meta name="robots" content="noindex, nofollow" />
  <script>window.location.replace(<?= json_encode($inviteUrl, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>);</script>
</head>
<body>
  <p>A abrir convite… <a href="<?= esc($inviteUrl) ?>">Clique aqui se não redirecionar.</a></p>
</body>
</html>
