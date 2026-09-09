-- ==============================================================================
-- SCRIPT SQL PROFESSIONNEL ET ENTERPRISE-READY
-- Base de données de Gestion des Inscriptions aux Événements & Formations
-- Organisateur : AEEMCI (Sous-comité de Koumassi)
-- Événement : Formation Pratique Microsoft Word (Formateur : Tall Seydou)
-- Horaire : 20:00 UTC+0 (Abidjan)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `aeemci_formation`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `aeemci_formation`;

-- 1. Table des Organisateurs
CREATE TABLE IF NOT EXISTS `organisateurs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nom` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL,
    `telephone` VARCHAR(30) NULL,
    `logo_url` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `organisateurs` (`nom`, `code`, `email`, `telephone`, `logo_url`) 
VALUES ('AEEMCI — Sous-comité de Koumassi', 'AEEMCI_KOUMASSI', 'contact@aeemci-koumassi.org', '+2250700000000', 'WhatsApp Image 2026-09-09 at 16.32.41.jpeg')
ON DUPLICATE KEY UPDATE `nom` = VALUES(`nom`);

-- 2. Table des Événements (Horaire mis à jour : 20h00)
CREATE TABLE IF NOT EXISTS `evenements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `organisateur_id` INT NOT NULL,
    `code_evenement` VARCHAR(50) NOT NULL UNIQUE,
    `titre` VARCHAR(255) NOT NULL,
    `formateur` VARCHAR(150) NOT NULL,
    `date_debut` DATETIME NOT NULL,
    `date_fin` DATETIME NOT NULL,
    `lieu` VARCHAR(255) NOT NULL DEFAULT 'En ligne (Webinaire)',
    `public_cible` VARCHAR(255) NOT NULL DEFAULT 'Élèves, Étudiants et Professionnels',
    `places_max` INT NOT NULL DEFAULT 150,
    `tarif` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `whatsapp_group_link` VARCHAR(255) NOT NULL,
    `statut_evenement` ENUM('ouvert', 'ferme', 'complet', 'termine') NOT NULL DEFAULT 'ouvert',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`organisateur_id`) REFERENCES `organisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `evenements` (`organisateur_id`, `code_evenement`, `titre`, `formateur`, `date_debut`, `date_fin`, `lieu`, `public_cible`, `places_max`, `tarif`, `whatsapp_group_link`, `statut_evenement`)
VALUES (1, 'WORD-2026', 'Formation Pratique Microsoft Word', 'Tall Seydou', '2026-09-18 20:00:00', '2026-09-20 22:00:00', 'En ligne (Webinaire)', 'Élèves, Étudiants et Professionnels', 150, 0.00, 'https://chat.whatsapp.com/KzKBnGq3ZahFYohN2nm3gN?s=sh&p=a&mlu=4&ilr=4', 'ouvert')
ON DUPLICATE KEY UPDATE `titre` = VALUES(`titre`), `date_debut` = VALUES(`date_debut`), `date_fin` = VALUES(`date_fin`);

-- 3. Table des Inscriptions
CREATE TABLE IF NOT EXISTS `inscriptions_word` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_code` VARCHAR(50) NOT NULL UNIQUE,
    `evenement_id` INT NOT NULL DEFAULT 1,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `statut_pro` ENUM('Élève', 'Étudiant', 'Professionnel', 'Autre') NOT NULL DEFAULT 'Étudiant',
    `niveau_word` ENUM('Débutant', 'Intermédiaire', 'Avancé') NOT NULL DEFAULT 'Débutant',
    `statut_inscription` ENUM('confirme', 'liste_d_attente', 'annule', 'present') NOT NULL DEFAULT 'confirme',
    `adresse_ip` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `date_inscription` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`evenement_id`) REFERENCES `evenements`(`id`) ON DELETE CASCADE,
    INDEX `idx_ticket_code` (`ticket_code`),
    INDEX `idx_email` (`email`),
    INDEX `idx_whatsapp` (`whatsapp`),
    INDEX `idx_statut_inscription` (`statut_inscription`),
    INDEX `idx_date_inscription` (`date_inscription`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table d''Historique & Audit
CREATE TABLE IF NOT EXISTS `logs_inscriptions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inscription_id` INT NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions_word`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Vue Analytique des Statistiques
CREATE OR REPLACE VIEW `v_statistiques_inscriptions` AS
SELECT 
    e.id AS evenement_id,
    e.titre AS evenement_titre,
    e.public_cible,
    e.places_max,
    COUNT(CASE WHEN i.statut_inscription = 'confirme' THEN 1 END) AS total_confirmes,
    COUNT(CASE WHEN i.statut_inscription = 'liste_d_attente' THEN 1 END) AS total_liste_attente,
    COUNT(CASE WHEN i.statut_inscription = 'annule' THEN 1 END) AS total_annules,
    GREATEST(0, e.places_max - COUNT(CASE WHEN i.statut_inscription = 'confirme' THEN 1 END)) AS places_restantes
FROM `evenements` e
LEFT JOIN `inscriptions_word` i ON e.id = i.evenement_id
GROUP BY e.id;
