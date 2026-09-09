<?php
/**
 * API RESTful d'Inscription & Gestion des Billets (PHP Enterprise)
 * Organisateur : AEEMCI Sous-comité de Koumassi
 * Formation Pratique Microsoft Word
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config.php';

$linkWhatsApp = "https://chat.whatsapp.com/KzKBnGq3ZahFYohN2nm3gN?s=sh&p=a&mlu=4&ilr=4";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée. Seules les requêtes POST sont autorisées.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Extraction du payload
$inputData = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true) ?? [];
} else {
    $inputData = $_POST;
}

$nom       = isset($inputData['nom']) ? trim(htmlspecialchars($inputData['nom'], ENT_QUOTES, 'UTF-8')) : '';
$email     = isset($inputData['email']) ? trim(filter_var($inputData['email'], FILTER_SANITIZE_EMAIL)) : '';
$whatsapp  = isset($inputData['whatsapp']) ? trim(htmlspecialchars($inputData['whatsapp'], ENT_QUOTES, 'UTF-8')) : '';
$statutPro = isset($inputData['statut']) ? trim(htmlspecialchars($inputData['statut'], ENT_QUOTES, 'UTF-8')) : 'Étudiant';
$niveau    = isset($inputData['niveau']) ? trim(htmlspecialchars($inputData['niveau'], ENT_QUOTES, 'UTF-8')) : 'Débutant';

// Validation des données
if (empty($nom) || empty($email) || empty($whatsapp)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Veuillez remplir tous les champs obligatoires du formulaire.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'L\'adresse email saisie est invalide.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cleanWhatsapp = preg_replace('/[^\d+]/', '', $whatsapp);
if (strlen($cleanWhatsapp) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Le numéro WhatsApp renseigné est invalide.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$db = getDBConnection();

// Mode dégradé si MySQL n'est pas configuré localement
if (!$db) {
    $ticketCode = generateTicketCode();
    echo json_encode([
        'success' => true,
        'ticket_code' => $ticketCode,
        'statut_inscription' => 'confirme',
        'message' => 'Billet réservé avec succès ! Redirection vers le groupe WhatsApp...',
        'redirect_url' => $linkWhatsApp
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // 1. Vérification des doublons (par email ou par numéro WhatsApp)
    $checkStmt = $db->prepare("SELECT id, ticket_code, statut_inscription FROM inscriptions_word WHERE email = :email OR whatsapp = :whatsapp LIMIT 1");
    $checkStmt->execute([':email' => $email, ':whatsapp' => $cleanWhatsapp]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        echo json_encode([
            'success' => true,
            'ticket_code' => $existing['ticket_code'],
            'statut_inscription' => $existing['statut_inscription'],
            'message' => 'Vous êtes déjà inscrit ! Voici votre billet et la redirection WhatsApp.',
            'redirect_url' => $linkWhatsApp
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Vérification de la capacité des places (150 places max)
    $countStmt = $db->query("SELECT COUNT(*) AS total FROM inscriptions_word WHERE statut_inscription = 'confirme'");
    $totalConfirmes = (int)$countStmt->fetchColumn();

    $statutInscription = ($totalConfirmes >= 150) ? 'liste_d_attente' : 'confirme';
    $ticketCode = generateTicketCode();

    // 3. Insertion du participant
    $sql = "INSERT INTO inscriptions_word 
            (ticket_code, evenement_id, nom, prenom, email, whatsapp, statut_pro, niveau_word, statut_inscription, adresse_ip, user_agent, date_inscription) 
            VALUES (:ticket, 1, :nom, :prenom, :email, :whatsapp, :statut_pro, :niveau, :statut_inscription, :ip, :ua, NOW())";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':ticket'             => $ticketCode,
        ':nom'                => $nom,
        ':prenom'             => $nom,
        ':email'              => $email,
        ':whatsapp'           => $cleanWhatsapp,
        ':statut_pro'         => in_array($statutPro, ['Élève', 'Étudiant', 'Professionnel', 'Autre']) ? $statutPro : 'Autre',
        ':niveau'             => in_array($niveau, ['Débutant', 'Intermédiaire', 'Avancé']) ? $niveau : 'Débutant',
        ':statut_inscription' => $statutInscription,
        ':ip'                 => $_SERVER['REMOTE_ADDR'] ?? '',
        ':ua'                 => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250)
    ]);

    $inscriptionId = $db->lastInsertId();

    // 4. Log d'activité
    $logStmt = $db->prepare("INSERT INTO logs_inscriptions (inscription_id, action, description) VALUES (:id, :action, :desc)");
    $logStmt->execute([
        ':id'     => $inscriptionId,
        ':action' => 'CREATION_BILLET',
        ':desc'   => "Billet $ticketCode créé avec statut $statutInscription"
    ]);

    $msg = ($statutInscription === 'confirme')
        ? 'Inscription confirmée ! Votre billet a été émis.'
        : 'Session complète. Vous avez été ajouté(e) à la liste d\'attente prioritaire.';

    echo json_encode([
        'success' => true,
        'ticket_code' => $ticketCode,
        'statut_inscription' => $statutInscription,
        'message' => $msg,
        'redirect_url' => $linkWhatsApp
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("Erreur SQL inscription : " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Une erreur est survenue lors du traitement de votre billet. Veuillez réessayer.'
    ], JSON_UNESCAPED_UNICODE);
}
