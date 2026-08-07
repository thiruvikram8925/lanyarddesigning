/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: u841409365_croppingtool
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `advertisements`
--

DROP TABLE IF EXISTS `advertisements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `advertisements` (
  `id` varchar(100) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `advertisements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `advertisements` WRITE;
/*!40000 ALTER TABLE `advertisements` DISABLE KEYS */;
/*!40000 ALTER TABLE `advertisements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(100) NOT NULL,
  `projectId` varchar(100) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` varchar(100) DEFAULT NULL,
  `updated_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `template` varchar(100) DEFAULT 'School',
  `total_records` int(11) DEFAULT 0,
  `valid_records` int(11) DEFAULT 0,
  `invalid_records` int(11) DEFAULT 0,
  `missing_photos` int(11) DEFAULT 0,
  `color` varchar(20) DEFAULT '#3B82F6',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL,
  `current_stage` varchar(50) DEFAULT 'data_collected',
  `completed_stages` longtext DEFAULT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  `assignedTo` varchar(100) DEFAULT NULL,
  `assignedToName` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES
('27feca5a-85f7-4c30-8b73-447fcab0fc0f','ID Card','IDFC First Bharat Bank','draft','School',0,0,0,0,'#3B82F6','admin1@gmail.com','2026-04-21 15:23:36','validation','[\"data_collected\",\"processing\",\"id_card_generated\",\"validation\",\"printing\",\"completed\"]','https://test-croppingtool.test-tsdevelopment.org/uploads/1778855710-6a072f1e.pdf','69d602c23fe66f52321c75e5','sample2',''),
('69d61ee465b486ff25820c2e','id card','AVRS ','draft','School',0,0,0,0,'#3B82F6',NULL,'2026-04-08T09:24:52.293Z','completed','[\"data_collected\",\"processing\",\"id_card_generated\",\"validation\",\"printing\",\"completed\"]','https://test-croppingtool.test-tsdevelopment.org/uploads/1778782701-6a0611ed.pdf','69d602c23fe66f52321c75e5','sample2',NULL);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `records`
--

DROP TABLE IF EXISTS `records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `records` (
  `id` varchar(100) NOT NULL,
  `project_id` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `status` varchar(50) DEFAULT 'valid',
  `created_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `records`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `records` WRITE;
/*!40000 ALTER TABLE `records` DISABLE KEYS */;
/*!40000 ALTER TABLE `records` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `principal` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `seal_url` varchar(500) DEFAULT NULL,
  `signature_url` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schools`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `schools` WRITE;
/*!40000 ALTER TABLE `schools` DISABLE KEYS */;
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `preview_url` varchar(500) DEFAULT NULL,
  `layout` longtext DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `organization` varchar(255) DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('1','Technosprint Info Solutions','itsupport@technosprint.net','Poland@01','ultra-super-admin','Technosprint Info Solutions','2026-04-08T07:42:35.836Z'),
('69d602723fe66f52321c75e4','sample1','admin1@gmail.com','admin123','super-admin','GOTEK','2026-04-08T07:23:30.964Z'),
('69d602c23fe66f52321c75e5','sample2','sub1@gmail.com','sub11234','admin','GOTEK','2026-04-08T07:24:50.001Z'),
('69d6083e7451798af0524827','Sam','user1@gmail.com','user123','user','GOTEK','2026-04-08T07:48:14.096Z'),
('69d61f2f65b486ff25820c2f','Sam John','user2@gmail.com','user123','user','AVRS','2026-04-08T09:26:07.429Z'),
('6a070943d81a69.18715317','Shailendhirah','shailendhirah@gmail.com','Shailu@17','super-admin','Gotek','2026-05-15 11:53:39'),
('6a0709a62c2895.84473139','Devasri','devasri@gmail.com','devasri123','admin','Gotek','2026-05-15 11:55:18'),
('6a070d1a435728.64421047','Rakshanadevi','rakshana@gmail.com','rd123','admin','Gotek','2026-05-15 12:10:02'),
('6a070d73556c32.78560277','Varshini','varshini@gmail.com','varshini123','admin','Gotek','2026-05-15 12:11:31'),
('6a070dabe72119.88646130','Arul Jothi','arul@gmail.com','arul123','admin','Gotek','2026-05-15 12:12:27'),
('9a9ff277-88f2-47c1-975a-45054ed501d3','sam1','sam2@gmail.com','bank@123','user','IDFC First Bharat Bank','2026-04-21 23:10:35'),
('dd055e0a-6941-4ab5-a30e-e148438cfdcf','Super Admin','admin@gotek.com','admin123','super-admin','GOTEK',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-26 17:10:59
