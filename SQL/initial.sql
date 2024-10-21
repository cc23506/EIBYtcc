show databases;
use railway;

show tables;

CREATE TABLE users (
   `id` int NOT NULL AUTO_INCREMENT,
   `username` varchar(20) NOT NULL,
   `password` varchar(255) NOT NULL,
   `role` varchar(10) DEFAULT 'user',
   PRIMARY KEY (`id`)
);

CREATE TABLE products (
   `id` int NOT NULL AUTO_INCREMENT,
   `name` varchar(100) NOT NULL,
   `description` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`id`)
);

CREATE TABLE zone_image (
   `id` int NOT NULL AUTO_INCREMENT,
   `imagePath` varchar(255) NOT NULL,
   `uploadedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   `user_id` int DEFAULT NULL,
   PRIMARY KEY (`id`),
   KEY `user_id` (`user_id`),
   CONSTRAINT `zone_image_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE zones (
   `id` int NOT NULL AUTO_INCREMENT,
   `name` varchar(255) NOT NULL,
   `x1` int NOT NULL,
   `x2` int NOT NULL,
   `y1` int NOT NULL,
   `y2` int NOT NULL,
   `image_id` int DEFAULT NULL,
   PRIMARY KEY (`id`),
   KEY `image_id` (`image_id`),
   CONSTRAINT `zones_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `zone_image` (`id`) ON DELETE SET NULL
);

CREATE TABLE product_zone (
   `product_id` int NOT NULL,
   `zone_id` int NOT NULL,
   PRIMARY KEY (`product_id`,`zone_id`),
   KEY `zone_id` (`zone_id`),
   CONSTRAINT `product_zone_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
   CONSTRAINT `product_zone_ibfk_2` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE CASCADE
);

INSERT INTO users (username, password, role) VALUES
('adm', 'adm', 'admin'),
('user', '123', 'user');

INSERT INTO products (name, description) VALUES
('Product A', 'Description of Product A'),
('Product B', 'Description of Product B'),
('Product C', 'Description of Product C');

INSERT INTO zones (name, x1, x2, y1, y2, image_id) VALUES
('Zone 1', 10, 20, 30, 40, 1),
('Zone 2', 50, 60, 70, 80, 1),
('Zone 3', 15, 25, 35, 45, 1);

INSERT INTO product_zone (product_id, zone_id) VALUES
(1, 2),
(2, 1),
(3, 2);