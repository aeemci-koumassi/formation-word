<?php
/**
 * Configuration & Helper PDO Enterprise
 * Organisateur : AEEMCI Sous-comité de Koumassi
 * Formation Pratique Microsoft Word
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'aeemci_formation');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Connexion PDO sécurisée
 * 
 * @return PDO|null
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Erreur de connexion MySQL : " . $e->getMessage());
            return null;
        }
    }

    return $pdo;
}

/**
 * Génère un code de billet unique professionnel (ex: TKT-WORD-9A4B7)
 * 
 * @return string
 */
function generateTicketCode() {
    return 'TKT-WORD-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
}
