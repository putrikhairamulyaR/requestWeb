-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 21, 2025 at 08:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `web`
--

-- --------------------------------------------------------

--
-- Table structure for table `libur_nasional`
--

CREATE TABLE `libur_nasional` (
  `id` int(11) NOT NULL,
  `tanggal` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `libur_nasional`
--

INSERT INTO `libur_nasional` (`id`, `tanggal`) VALUES
(1, '2025-01-01'),
(2, '2025-01-27'),
(3, '2025-01-28'),
(4, '2025-01-29'),
(5, '2025-03-28'),
(6, '2025-03-29'),
(7, '2025-03-31'),
(8, '2025-04-01'),
(9, '2025-04-02'),
(10, '2025-04-03'),
(11, '2025-04-04'),
(12, '2025-04-07'),
(13, '2025-04-18'),
(14, '2025-04-20'),
(15, '2025-05-01'),
(16, '2025-05-12'),
(17, '2025-05-13'),
(18, '2025-05-29'),
(19, '2025-05-30'),
(20, '2025-06-01'),
(21, '2025-06-06'),
(22, '2025-06-09'),
(23, '2025-06-27'),
(24, '2025-08-17'),
(25, '2025-08-18'),
(26, '2025-09-05'),
(27, '2025-12-25'),
(28, '2025-12-26');

-- --------------------------------------------------------

--
-- Table structure for table `request`
--

CREATE TABLE `request` (
  `id_request` int(11) NOT NULL,
  `timestamp` datetime NOT NULL,
  `nip` int(11) NOT NULL,
  `jenis_pengajuan` varchar(50) NOT NULL,
  `status_pengajuan` varchar(100) NOT NULL,
  `tanggal` date NOT NULL,
  `tanggal_lama` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `request`
--

INSERT INTO `request` (`id_request`, `timestamp`, `nip`, `jenis_pengajuan`, `status_pengajuan`, `tanggal`, `tanggal_lama`) VALUES
(221, '2025-08-20 21:00:06', 400204, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(222, '2025-08-20 21:00:07', 400091, 'Libur', 'Pengajuan Pertama', '2025-09-29', NULL),
(223, '2025-08-20 21:00:09', 400204, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(224, '2025-08-20 21:00:10', 400211, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(225, '2025-08-20 21:00:12', 400204, 'Libur', 'Pengajuan Pertama', '2025-09-06', NULL),
(226, '2025-08-20 21:00:13', 400211, 'Libur', 'Pengajuan Pertama', '2025-09-22', NULL),
(227, '2025-08-20 21:00:16', 400091, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(228, '2025-08-20 21:00:17', 400211, 'Cuti', 'Pengajuan Pertama', '2025-09-29', NULL),
(229, '2025-08-20 21:00:19', 400213, 'Libur', 'Pengajuan Pertama', '2025-09-07', NULL),
(230, '2025-08-20 21:00:21', 400193, 'Libur', 'Pengajuan Pertama', '2025-09-14', NULL),
(231, '2025-08-20 21:00:28', 400193, 'Cuti', 'Pengajuan Pertama', '2025-09-15', NULL),
(232, '2025-08-20 21:00:30', 400193, 'Cuti', 'Pengajuan Pertama', '2025-09-12', NULL),
(233, '2025-08-20 21:01:09', 400211, 'Cuti', 'Update Pengajuan', '2025-09-19', NULL),
(234, '2025-08-20 21:00:35', 401136, 'Libur', 'Pengajuan Pertama', '2025-09-07', NULL),
(235, '2025-08-20 21:00:37', 401136, 'Cuti', 'Pengajuan Pertama', '2025-09-12', NULL),
(236, '2025-08-20 21:00:39', 400193, 'Libur', 'Pengajuan Pertama', '2025-09-13', NULL),
(237, '2025-08-20 21:00:41', 400092, 'Libur', 'Pengajuan Pertama', '2025-09-22', NULL),
(238, '2025-08-20 21:00:43', 400092, 'Libur', 'Pengajuan Pertama', '2025-09-29', NULL),
(239, '2025-08-20 21:00:47', 400201, 'Libur', 'Pengajuan Pertama', '2025-09-17', NULL),
(240, '2025-08-20 21:00:50', 400201, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(241, '2025-08-20 21:00:53', 401145, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(242, '2025-08-20 21:00:54', 400201, 'Libur', 'Pengajuan Pertama', '2025-09-24', NULL),
(243, '2025-08-20 21:00:55', 401145, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(244, '2025-08-20 21:01:00', 401145, 'Libur', 'Pengajuan Pertama', '2025-09-03', NULL),
(245, '2025-08-20 21:01:07', 400211, 'Libur', 'Pengajuan Pertama', '2025-09-08', NULL),
(246, '2025-08-20 21:01:10', 400209, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(247, '2025-08-20 21:01:12', 400209, 'Cuti', 'Pengajuan Pertama', '2025-09-08', NULL),
(248, '2025-08-20 21:01:13', 400209, 'Libur', 'Pengajuan Pertama', '2025-09-06', NULL),
(249, '2025-08-20 21:01:15', 400192, 'Libur', 'Pengajuan Pertama', '2025-09-08', NULL),
(250, '2025-08-20 21:01:16', 400192, 'Libur', 'Pengajuan Pertama', '2025-09-22', NULL),
(251, '2025-08-20 21:01:17', 400192, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(252, '2025-08-20 21:01:19', 400209, 'Cuti', 'Pengajuan Pertama', '2025-09-09', NULL),
(253, '2025-08-20 21:01:22', 400216, 'Libur', 'Pengajuan Pertama', '2025-09-29', NULL),
(254, '2025-08-20 21:01:23', 400216, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(255, '2025-08-20 21:01:25', 400216, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(256, '2025-08-20 21:01:26', 400216, 'Cuti Lainnya', 'Pengajuan Pertama', '2025-09-20', NULL),
(257, '2025-08-20 21:01:27', 400209, 'Libur', 'Pengajuan Pertama', '2025-09-07', NULL),
(258, '2025-08-20 21:01:29', 400217, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(259, '2025-08-20 21:01:31', 400217, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(260, '2025-08-20 21:01:32', 400217, 'Libur', 'Pengajuan Pertama', '2025-09-29', NULL),
(261, '2025-08-20 21:01:33', 400217, 'Cuti', 'Pengajuan Pertama', '2025-09-30', NULL),
(262, '2025-08-20 21:01:35', 400190, 'Libur', 'Pengajuan Pertama', '2025-09-22', NULL),
(263, '2025-08-20 21:01:42', 400190, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(264, '2025-08-20 21:01:45', 400190, 'Libur', 'Pengajuan Pertama', '2025-09-20', NULL),
(265, '2025-08-20 21:01:46', 400217, 'Cuti', 'Pengajuan Pertama', '2025-09-03', NULL),
(266, '2025-08-20 21:01:51', 401136, 'Libur', 'Pengajuan Pertama', '2025-09-21', NULL),
(267, '2025-08-20 21:01:54', 401136, 'Libur', 'Pengajuan Pertama', '2025-09-23', NULL),
(268, '2025-08-20 21:01:56', 400202, 'Libur', 'Pengajuan Pertama', '2025-09-12', NULL),
(269, '2025-08-20 21:01:58', 400087, 'Libur', 'Pengajuan Pertama', '2025-09-02', NULL),
(270, '2025-08-20 21:02:02', 400087, 'Cuti', 'Pengajuan Pertama', '2025-09-03', NULL),
(271, '2025-08-20 21:02:07', 400087, 'Libur', 'Pengajuan Pertama', '2025-09-01', NULL),
(272, '2025-08-20 21:02:10', 400087, 'Libur', 'Pengajuan Pertama', '2025-09-14', NULL),
(273, '2025-08-20 21:02:18', 400202, 'Cuti', 'Pengajuan Pertama', '2025-09-19', NULL),
(274, '2025-08-20 21:02:27', 400202, 'Libur', 'Pengajuan Pertama', '2025-09-26', NULL),
(275, '2025-08-20 21:02:36', 400092, 'Libur', 'Pengajuan Pertama', '2025-09-13', NULL),
(276, '2025-08-20 21:03:21', 400090, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(277, '2025-08-20 21:03:23', 400090, 'Cuti', 'Pengajuan Pertama', '2025-09-03', NULL),
(278, '2025-08-20 21:03:25', 400090, 'Libur', 'Pengajuan Pertama', '2025-09-13', NULL),
(279, '2025-08-20 21:03:27', 400090, 'Cuti', 'Pengajuan Pertama', '2025-09-26', NULL),
(280, '2025-08-20 21:03:28', 400090, 'Libur', 'Pengajuan Pertama', '2025-09-20', NULL),
(281, '2025-08-20 21:03:51', 400299, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(282, '2025-08-20 21:03:57', 400299, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(283, '2025-08-20 21:03:59', 400213, 'Libur', 'Pengajuan Pertama', '2025-09-26', NULL),
(284, '2025-08-20 21:04:04', 400210, 'Cuti', 'Pengajuan Pertama', '2025-09-25', NULL),
(285, '2025-08-20 21:04:05', 400210, 'Libur', 'Pengajuan Pertama', '2025-09-18', NULL),
(286, '2025-08-20 21:04:07', 400210, 'Libur', 'Pengajuan Pertama', '2025-09-19', NULL),
(287, '2025-08-20 21:04:08', 400210, 'Cuti', 'Pengajuan Pertama', '2025-09-24', NULL),
(288, '2025-08-20 21:04:10', 400210, 'Libur', 'Pengajuan Pertama', '2025-09-09', NULL),
(289, '2025-08-20 21:04:13', 400210, 'Cuti', 'Pengajuan Pertama', '2025-09-26', NULL),
(290, '2025-08-20 21:04:14', 400210, 'Cuti Lainnya', 'Pengajuan Pertama', '2025-09-21', NULL),
(291, '2025-08-20 21:04:15', 400210, 'Cuti Lainnya', 'Pengajuan Pertama', '2025-09-23', NULL),
(292, '2025-08-20 21:04:18', 400210, 'Cuti Lainnya', 'Pengajuan Pertama', '2025-09-22', NULL),
(293, '2025-08-20 21:04:19', 400198, 'Libur', 'Pengajuan Pertama', '2025-09-06', NULL),
(294, '2025-08-20 21:04:21', 400198, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(295, '2025-08-20 21:04:23', 400198, 'Libur', 'Pengajuan Pertama', '2025-09-07', NULL),
(296, '2025-08-20 21:04:36', 401524, 'Cuti', 'Pengajuan Pertama', '2025-09-09', NULL),
(297, '2025-08-20 21:04:39', 401524, 'Libur', 'Pengajuan Pertama', '2025-09-20', NULL),
(298, '2025-08-20 21:04:40', 401524, 'Libur', 'Pengajuan Pertama', '2025-09-07', NULL),
(299, '2025-08-20 21:04:42', 401524, 'Libur', 'Pengajuan Pertama', '2025-09-06', NULL),
(300, '2025-08-20 21:04:44', 401524, 'Cuti', 'Pengajuan Pertama', '2025-09-08', NULL),
(301, '2025-08-20 21:04:46', 401524, 'Cuti', 'Pengajuan Pertama', '2025-09-22', NULL),
(302, '2025-08-20 21:05:27', 400203, 'Libur', 'Pengajuan Pertama', '2025-09-23', NULL),
(303, '2025-08-20 21:05:28', 400203, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(304, '2025-08-20 21:05:30', 400203, 'Cuti', 'Pengajuan Pertama', '2025-09-26', NULL),
(305, '2025-08-20 21:05:31', 400203, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(306, '2025-08-20 21:05:34', 400203, 'Cuti', 'Pengajuan Pertama', '2025-09-24', NULL),
(307, '2025-08-20 21:05:35', 400203, 'Cuti', 'Pengajuan Pertama', '2025-09-25', NULL),
(308, '2025-08-20 21:06:10', 400212, 'Libur', 'Pengajuan Pertama', '2025-09-20', NULL),
(309, '2025-08-20 21:06:12', 400212, 'Cuti', 'Pengajuan Pertama', '2025-09-12', NULL),
(310, '2025-08-20 21:06:14', 400212, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(311, '2025-08-20 21:06:18', 400212, 'Libur', 'Pengajuan Pertama', '2025-09-30', NULL),
(312, '2025-08-20 21:06:20', 400212, 'Cuti', 'Pengajuan Pertama', '2025-09-11', NULL),
(313, '2025-08-20 21:07:07', 401144, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(314, '2025-08-20 21:07:11', 401144, 'Libur', 'Pengajuan Pertama', '2025-09-20', NULL),
(315, '2025-08-20 21:10:38', 400189, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(316, '2025-08-20 21:10:39', 400189, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(317, '2025-08-20 21:10:41', 400189, 'Libur', 'Pengajuan Pertama', '2025-09-13', NULL),
(318, '2025-08-20 21:11:25', 400093, 'Libur', 'Pengajuan Pertama', '2025-09-28', NULL),
(319, '2025-08-20 21:11:28', 400093, 'Cuti', 'Pengajuan Pertama', '2025-09-12', NULL),
(320, '2025-08-20 21:11:30', 400093, 'Cuti', 'Pengajuan Pertama', '2025-09-26', NULL),
(321, '2025-08-20 21:11:33', 400093, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(322, '2025-08-20 21:11:35', 400093, 'Libur', 'Pengajuan Pertama', '2025-09-13', NULL),
(323, '2025-08-20 23:17:34', 400196, 'Libur', 'Pengajuan Pertama', '2025-09-07', NULL),
(324, '2025-08-20 23:17:35', 400196, 'Libur', 'Pengajuan Pertama', '2025-09-06', NULL),
(325, '2025-08-20 23:17:41', 400196, 'Libur', 'Pengajuan Pertama', '2025-09-27', NULL),
(326, '2025-08-21 07:41:29', 401108, 'Cuti', 'Pengajuan Pertama', '2025-09-15', NULL),
(327, '2025-08-21 07:41:30', 401108, 'Libur', 'Pengajuan Pertama', '2025-09-13', NULL),
(328, '2025-08-21 07:41:33', 401108, 'Libur', 'Pengajuan Pertama', '2025-09-03', NULL),
(329, '2025-08-21 07:41:35', 401108, 'Cuti', 'Pengajuan Pertama', '2025-09-12', NULL),
(330, '2025-08-21 07:41:36', 401108, 'Libur', 'Pengajuan Pertama', '2025-09-14', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `useraccounts`
--

CREATE TABLE `useraccounts` (
  `nip` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `lokasi` varchar(5) DEFAULT NULL,
  `code` varchar(10) DEFAULT NULL,
  `password` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `useraccounts`
--

INSERT INTO `useraccounts` (`nip`, `nama`, `jenis_kelamin`, `lokasi`, `code`, `password`) VALUES
(400087, 'MOCHAMAD AKBAR FIRDAUS', 'L', 'B', 'B23', '123'),
(400090, 'REZA APRIANA', 'L', 'B', 'B27', '123'),
(400091, 'AI ROHAYATI', 'P', 'B', 'B2', '123'),
(400092, 'INDAH NURUL AFIFAH ABDULLAH', 'P', 'B', 'B7', '123'),
(400093, 'ZAENALDI', 'L', 'B', 'B24', '123'),
(400189, 'ANGGA APIPUTRA', 'L', 'B', 'B28', '123'),
(400190, 'SHIFA NURAMALIAH', 'P', 'J', 'J3', '123'),
(400192, 'EVA LATHIFAH DESTIANA', 'P', 'B', 'B1', '123'),
(400193, 'TRI ARIE', 'P', 'B', 'B3', '123'),
(400196, 'ACHMAD BAGDJA PARJAMAN', 'L', 'B', 'B21', '123'),
(400198, 'RIDWAN SETIAWAN', 'L', 'B', 'B20', '123'),
(400199, 'Restu', 'P', 'B', 'ADM', '123123'),
(400201, 'ANDHIKA ANGGA KUSUMA', 'L', 'J', 'B30', '123'),
(400202, 'SHARAH ISTIQOMAH', 'P', 'B', 'B9', '123'),
(400203, 'REYNALDO KUSUMA PUTRA', 'L', 'J', 'J2', '123'),
(400204, 'DEWI IRAWATI', 'P', 'B', 'B5', '123'),
(400206, 'CECEP RIAN ARIANTO', 'L', 'B', 'B18', '123'),
(400209, 'DIAN KURNIAWAN', 'L', 'B', 'B25', '123'),
(400210, 'RIA IRWANTY', 'P', 'B', 'B4', '123'),
(400211, 'NIRA SEPTISARI TANJUNG', 'P', 'B', 'B6', '123'),
(400212, 'TRIHADI KUSUMAH', 'L', 'J', 'J1', '123'),
(400213, 'DYAN PUTRI ARYANI', 'P', 'B', 'B11', '123'),
(400216, 'ALMA WAHYUNI', 'P', 'B', 'B10', '123'),
(400217, 'PURI AGI PRATOMO', 'L', 'B', 'B22', '123'),
(400218, 'TAUFIQ AKBAR TANJUNG', 'L', 'B', 'B17', '123'),
(400299, 'RUCHIMAT', 'L', 'B', 'B14', '123'),
(401107, 'MEGGY PRIMADANA FORESTER', 'L', 'B', 'B29', '123'),
(401108, 'WILDA MAULANA RIDHO', 'L', 'B', 'B15', '123'),
(401133, 'FEBRI INDRA WIJAYA', 'L', 'B', 'B26', '123'),
(401136, 'VINNI ALFIANA', 'P', 'B', 'B8', '123'),
(401138, 'DANI KURNIA', 'L', 'B', 'B16', '123'),
(401144, 'MOCH. LUKMAN SYAEFUL HASAN', 'L', 'B', 'B12', '123'),
(401145, 'VIRNANDO ARY CAHYO', 'L', 'B', 'B13', '123'),
(401524, 'FAKHRIZAL MAULANA', 'L', 'B', 'B19', '123');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `libur_nasional`
--
ALTER TABLE `libur_nasional`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`id_request`),
  ADD KEY `nip` (`nip`);

--
-- Indexes for table `useraccounts`
--
ALTER TABLE `useraccounts`
  ADD PRIMARY KEY (`nip`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `libur_nasional`
--
ALTER TABLE `libur_nasional`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `request`
--
ALTER TABLE `request`
  MODIFY `id_request` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=331;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `request`
--
ALTER TABLE `request`
  ADD CONSTRAINT `request_ibfk_1` FOREIGN KEY (`nip`) REFERENCES `useraccounts` (`nip`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
