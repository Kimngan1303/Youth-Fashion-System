-- =======================================================
-- Database Schema for Youth Fashion - Theo chuẩn ERD
-- =======================================================

CREATE DATABASE IF NOT EXISTS `youthfashion_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `youthfashion_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. ROLE
DROP TABLE IF EXISTS `ROLE`;
CREATE TABLE `ROLE` (
  `role_id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USER
DROP TABLE IF EXISTS `USER`;
CREATE TABLE `USER` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) NULL,
  `last_name` VARCHAR(50) NULL,
  `phone` VARCHAR(20) NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `ROLE`(`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORY
DROP TABLE IF EXISTS `CATEGORY`;
CREATE TABLE `CATEGORY` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `status` VARCHAR(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BRAND
DROP TABLE IF EXISTS `BRAND`;
CREATE TABLE `BRAND` (
  `brand_id` INT AUTO_INCREMENT PRIMARY KEY,
  `brand_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `status` VARCHAR(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PRODUCT
DROP TABLE IF EXISTS `PRODUCT`;
CREATE TABLE `PRODUCT` (
  `product_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `brand_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `base_price` DECIMAL(12, 2) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `CATEGORY`(`category_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) REFERENCES `BRAND`(`brand_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PRODUCT_IMAGE
DROP TABLE IF EXISTS `PRODUCT_IMAGE`;
CREATE TABLE `PRODUCT_IMAGE` (
  `image_id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  CONSTRAINT `fk_product_image_product` FOREIGN KEY (`product_id`) REFERENCES `PRODUCT`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PRODUCT_VARIANT
DROP TABLE IF EXISTS `PRODUCT_VARIANT`;
CREATE TABLE `PRODUCT_VARIANT` (
  `variant_id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `color` VARCHAR(50) NOT NULL,
  `size` VARCHAR(20) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'active',
  CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `PRODUCT`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CART
DROP TABLE IF EXISTS `CART`;
CREATE TABLE `CART` (
  `cart_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CART_ITEM
DROP TABLE IF EXISTS `CART_ITEM`;
CREATE TABLE `CART_ITEM` (
  `cart_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id` INT NOT NULL,
  `variant_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_cart_item_cart` FOREIGN KEY (`cart_id`) REFERENCES `CART`(`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_item_variant` FOREIGN KEY (`variant_id`) REFERENCES `PRODUCT_VARIANT`(`variant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. ORDERS
DROP TABLE IF EXISTS `ORDERS`;
CREATE TABLE `ORDERS` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `order_code` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `shipping_address` TEXT NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `order_status` VARCHAR(50) DEFAULT 'PENDING',
  `payment_deadline` DATETIME NULL,
  `paid_at` DATETIME NULL,
  `cancelled_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `USER`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ORDER_ITEM
DROP TABLE IF EXISTS `ORDER_ITEM`;
CREATE TABLE `ORDER_ITEM` (
  `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `variant_id` INT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(50) NULL,
  `size` VARCHAR(20) NULL,
  `unit_price` DECIMAL(12, 2) NOT NULL,
  `quantity` INT NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `ORDERS`(`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_item_variant` FOREIGN KEY (`variant_id`) REFERENCES `PRODUCT_VARIANT`(`variant_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. PAYMENT
DROP TABLE IF EXISTS `PAYMENT`;
CREATE TABLE `PAYMENT` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `transaction_code` VARCHAR(100) NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_status` VARCHAR(50) DEFAULT 'PENDING',
  `paid_at` DATETIME NULL,
  `expired_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `ORDERS`(`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. AI_SEARCH_CONFIG
DROP TABLE IF EXISTS `AI_SEARCH_CONFIG`;
CREATE TABLE `AI_SEARCH_CONFIG` (
  `config_id` INT AUTO_INCREMENT PRIMARY KEY,
  `is_enabled` BOOLEAN DEFAULT TRUE,
  `top_k` INT DEFAULT 10,
  `similarity_threshold` DECIMAL(5, 4) DEFAULT 0.7000,
  `image_weight` DECIMAL(4, 2) DEFAULT 0.60,
  `text_weight` DECIMAL(4, 2) DEFAULT 0.40,
  `updated_by` INT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ai_config_user` FOREIGN KEY (`updated_by`) REFERENCES `USER`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================
-- SEED DATA MẪU BAN ĐẦU
-- =======================================================

-- Role
INSERT INTO `ROLE` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Customer'),
(4, 'Guest')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- Brand
INSERT INTO `BRAND` (`brand_id`, `brand_name`, `description`, `status`) VALUES
(1, 'Youth Street', 'Thương hiệu thời trang đường phố trẻ trung, phá cách', 'active'),
(2, 'Urban Vibe', 'Phong cách tối giản, hiện đại và năng động', 'active'),
(3, 'GenZ Club', 'Thiết kế theo xu hướng Y2K, hoạ tiết nghệ thuật bắt trend', 'active')
ON DUPLICATE KEY UPDATE `brand_name` = VALUES(`brand_name`);

-- Category
INSERT INTO `CATEGORY` (`category_id`, `category_name`, `description`, `status`) VALUES
(1, 'Áo Thun & Polo', 'Áo thun cotton form rộng unisex', 'active'),
(2, 'Áo Khoác & Hoodie', 'Áo hoodie nỉ bông, jacket dạ, bomber', 'active'),
(3, 'Quần Jeans & Cargo', 'Quần ống suông rộng wide-leg, quần túi hộp', 'active'),
(4, 'Chân Váy & Đầm', 'Chân váy tennis, đầm phong cách trẻ', 'active'),
(5, 'Phụ Kiện', 'Túi tote, mũ lưỡi trai, balo', 'active')
ON DUPLICATE KEY UPDATE `category_name` = VALUES(`category_name`);
