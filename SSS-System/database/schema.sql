-- Mevcut tabloları sil (önce bağımlı olanları)
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS pending_questions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;

-- 1. Kategoriler tablosu
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Örnek kategoriler
INSERT INTO categories (name) VALUES
('academic'), ('registration'), ('campus'), ('other');

-- 2. Kullanıcılar tablosu
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt şifre
    user_type ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. Bekleyen sorular tablosu
CREATE TABLE pending_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    detail TEXT NOT NULL,
    email VARCHAR(255),
    category_id INT,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. SSS tablosu (onaylanmış ve admin tarafından eklenmiş sorular)
CREATE TABLE faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    category_id INT,
    approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
INSERT INTO users (name, email, password_hash, user_type)
VALUES ('Admin', 'admin@example.com', '$2b$10$rY91IZIj/qHOyErF/kxwaOzCaLIi/vMKHJHbw4c3TWX3sXAbkQ22G', 'admin');
