-- Pastikan tabel-tabel dihapus jika sudah ada agar script bisa dijalankan berulang kali
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `request`;
DROP TABLE IF EXISTS `useraccounts`;
DROP TABLE IF EXISTS `libur_nasional`;

SET FOREIGN_KEY_CHECKS = 1;
-- ===============================
-- Table: libur_nasional
-- ===============================
CREATE TABLE `libur_nasional` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tanggal` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data awal libur nasional (contoh)
INSERT INTO `libur_nasional` (`tanggal`) VALUES
('2025-01-01'), ('2025-01-27'), ('2025-01-28'), ('2025-01-29'),
('2025-03-28'), ('2025-03-29'), ('2025-03-31'), ('2025-04-01'),
('2025-12-25'), ('2025-12-26');

-- ===============================
-- Table: useraccounts
-- ===============================
CREATE TABLE `useraccounts` (
  `nip` INT(11) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `jenis_kelamin` ENUM('L','P') NOT NULL,
  `lokasi` VARCHAR(5) DEFAULT NULL,
  `code` VARCHAR(10) DEFAULT NULL,
  -- Password pakai varchar(255) agar cukup untuk hash bcrypt
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`nip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data awal useraccounts
INSERT INTO `useraccounts` (`nip`, `nama`, `jenis_kelamin`, `lokasi`, `code`, `password`) VALUES
(400087, 'MOCHAMAD AKBAR FIRDAUS', 'L', 'B', 'B23', '123'),
(400090, 'REZA APRIANA', 'L', 'B', 'B27', '123'),
(400091, 'UDIN', 'L', 'B', 'B26', '123'),
(400092, 'BUDI', 'L', 'B', 'B29', '123'),
(400093, 'ASEP', 'L', 'B', 'B30', '123');

-- ===============================
-- Table: request
-- ===============================
CREATE TABLE `request` (
  `id_request` INT(11) NOT NULL AUTO_INCREMENT,
  `timestamp` DATETIME NOT NULL,
  `nip` INT(11) NOT NULL,
  `jenis_pengajuan` VARCHAR(50) NOT NULL,
  `status_pengajuan` VARCHAR(100) NOT NULL,
  `tanggal` DATE NOT NULL,
  `tanggal_lama` DATE DEFAULT NULL,
  PRIMARY KEY (`id_request`),
  KEY `nip` (`nip`),
  CONSTRAINT `request_ibfk_1` FOREIGN KEY (`nip`) REFERENCES `useraccounts` (`nip`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Contoh data request
INSERT INTO `request` (`timestamp`, `nip`, `jenis_pengajuan`, `status_pengajuan`, `tanggal`, `tanggal_lama`)
VALUES 
(NOW(), 400087, 'Cuti Lainnya', 'Pengajuan Pertama', '2025-09-10', NULL),
(NOW(), 400090, 'Libur', 'Pengajuan Pertama', '2025-09-11', NULL),
(NOW(), 400092, 'Libur', 'Pengajuan Pertama', '2025-09-11',NULL),
(NOW(), 400093, 'Libur', 'Pengajuan Pertama', '2025-09-11',NULL),
(NOW(), 400087, 'Cuti', 'Pengajuan Pertama', '2025-09-12',NULL),
(NOW(), 400090, 'Libur', 'Pengajuan Pertama', '2025-09-12',NULL),
(NOW(), 400091, 'Libur', 'Pengajuan Pertama', '2025-09-12',NULL),
(NOW(), 400092, 'Libur', 'Pengajuan Pertama', '2025-09-12',NULL),
(NOW(), 400087, 'Cuti', 'Pengajuan Pertama', '2025-09-13',NULL);
