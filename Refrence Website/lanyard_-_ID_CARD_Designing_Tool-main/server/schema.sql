CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS designs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  text_content TEXT,
  font_family VARCHAR(120),
  font_color VARCHAR(32),
  logo_url TEXT,
  lanyard_color VARCHAR(32),
  width VARCHAR(20),
  clip_type VARCHAR(120),
  accessories JSON,
  id_card_data JSON NOT NULL,
  preview_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_designs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  design_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price_in_inr DECIMAL(12, 2) NOT NULL,
  order_status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE,
  INDEX idx_orders_design (design_id),
  INDEX idx_orders_status (order_status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  orientation VARCHAR(20),
  category VARCHAR(50),
  preview_gradient TEXT,
  front_elements JSON,
  back_elements JSON,
  INDEX idx_templates_orientation (orientation),
  INDEX idx_templates_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;