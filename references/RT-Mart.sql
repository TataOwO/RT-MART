CREATE TABLE `User` (
  `user_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `login_id` varchar(50) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) UNIQUE NOT NULL,
  `phone_number` varchar(20),
  `role` enum(buyer,seller,admin) NOT NULL,
  `deleted_at` timestamptz,
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Seller` (
  `seller_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint UNIQUE NOT NULL,
  `bank_account_reference` varchar(255),
  `verified` boolean DEFAULT false,
  `verified_at` timestamptz,
  `verified_by` bigint
);

CREATE TABLE `ShippingAddress` (
  `address_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `city` varchar(50) NOT NULL,
  `district` varchar(50),
  `postal_code` varchar(10),
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255),
  `is_default` boolean DEFAULT false
);

CREATE TABLE `UserToken` (
  `token_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token_hash` varchar(255) UNIQUE NOT NULL,
  `expires_at` timestamptz NOT NULL,
  `is_revoked` boolean DEFAULT false,
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Store` (
  `store_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `seller_id` bigint NOT NULL,
  `store_name` varchar(200) NOT NULL,
  `store_description` text,
  `store_address` text,
  `store_email` varchar(100),
  `store_phone` varchar(20),
  `average_rating` decimal(2,1) DEFAULT 0,
  `total_ratings` int DEFAULT 0,
  `deleted_at` timestamptz,
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `ProductType` (
  `product_type_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `type_code` varchar(50) UNIQUE NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `parent_type_id` bigint,
  `is_active` boolean DEFAULT true
);

CREATE TABLE `Product` (
  `product_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `store_id` bigint NOT NULL,
  `product_type_id` bigint NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `view_count` bigint DEFAULT 0,
  `average_rating` decimal(2,1) DEFAULT 0,
  `total_reviews` int DEFAULT 0,
  `deleted_at` timestamptz,
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `ProductImage` (
  `image_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `display_order` int NOT NULL DEFAULT 1
);

CREATE TABLE `Inventory` (
  `inventory_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `product_id` bigint UNIQUE NOT NULL,
  `quantity` int NOT NULL DEFAULT 0 COMMENT '可用庫存',
  `reserved` int NOT NULL DEFAULT 0 COMMENT '已預留但未提交',
  `last_updated` timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Cart` (
  `cart_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint UNIQUE NOT NULL,
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `CartItem` (
  `cart_item_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `cart_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  `added_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `CartHistory` (
  `cart_history_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `cart_snapshot` jsonb NOT NULL COMMENT '完整的購物車 JSON 資料（包含商品、數量、價格、選項等）',
  `item_count` int NOT NULL COMMENT '購物車內的商品總數（方便快速查詢）',
  `order_ids` bigint[] COMMENT '若購物車成功轉換為訂單，記錄對應的訂單ID清單',
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Order` (
  `order_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `order_number` varchar(50) UNIQUE NOT NULL COMMENT '對外顯示的訂單號',
  `user_id` bigint NOT NULL,
  `store_id` bigint NOT NULL,
  `order_status` enum(pending_payment,payment_failed,paid,processing,shipped,delivered,completed,cancelled) NOT NULL DEFAULT 'pending_payment',
  `subtotal` decimal(10,2) NOT NULL,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 60,
  `total_discount` decimal(10,2) DEFAULT 0,
  `total_amount` decimal(10,2) NOT NULL COMMENT '總',
  `payment_method` varchar(50),
  `payment_reference` varchar(255) COMMENT '金流商訂單號',
  `idempotency_key` varchar(128) UNIQUE COMMENT '冪等性鍵-防止重複下單的鍵（可移除）',
  `shipping_address_snapshot` jsonb NOT NULL COMMENT '配送地址快照',
  `notes` text,
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamptz DEFAULT (CURRENT_TIMESTAMP),
  `paid_at` timestamptz,
  `shipped_at` timestamptz,
  `delivered_at` timestamptz,
  `completed_at` timestamptz,
  `cancelled_at` timestamptz
);

CREATE TABLE `OrderItem` (
  `order_item_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `product_id` bigint,
  `product_snapshot` jsonb NOT NULL COMMENT '保存「當下商品狀態」--> 因爲商家後續可能會更改商品資訊',
  `quantity` int NOT NULL,
  `original_price` decimal(10,2) NOT NULL COMMENT '商品原價',
  `item_discount` decimal(10,2) DEFAULT 0 COMMENT '商品本身的折扣 = original_price - unit_price',
  `unit_price` decimal(10,2) NOT NULL COMMENT '實際單價（可能是特價）',
  `subtotal` decimal(10,2) NOT NULL COMMENT 'unit_price × quantity'
);

CREATE TABLE `Discount` (
  `discount_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `discount_code` varchar(50) UNIQUE NOT NULL,
  `discount_type` enum(seasonal,shipping,special) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `min_purchase_amount` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '最低消費',
  `start_datetime` timestamptz NOT NULL,
  `end_datetime` timestamptz NOT NULL,
  `is_active` boolean DEFAULT true,
  `usage_limit` int,
  `usage_count` int DEFAULT 0,
  `created_by_type` enum(system,seller) NOT NULL,
  `created_by_id` bigint COMMENT 'NULL: admin(system), seller_id:seller',
  `created_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `SeasonalDiscount` (
  `seasonal_discount_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `discount_id` bigint UNIQUE NOT NULL,
  `discount_rate` decimal(5,4) NOT NULL,
  `max_discount_amount` decimal(10,2) COMMENT '最高折扣上限'
);

CREATE TABLE `ShippingDiscount` (
  `shipping_discount_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `discount_id` bigint UNIQUE NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL
);

CREATE TABLE `SpecialDiscount` (
  `special_discount_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `discount_id` bigint UNIQUE NOT NULL,
  `store_id` bigint NOT NULL,
  `product_type_id` bigint,
  `discount_rate` decimal(5,4),
  `max_discount_amount` decimal(10,2) COMMENT '最高折扣上限'
);

CREATE TABLE `OrderDiscount` (
  `order_discount_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `discount_id` bigint NOT NULL,
  `discount_type` enum(seasonal,shipping,special) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_at` timestamptz DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `AuditLog` (
  `audit_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `event_id` uuid UNIQUE NOT NULL COMMENT 'Unique event identifier',
  `event_timestamp` timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `table_name` varchar(100) NOT NULL,
  `record_id` bigint NOT NULL,
  `action` varchar(20) NOT NULL,
  `user_id` bigint,
  `request_id` varchar(128) COMMENT 'API request ID',
  `ip_address` inet,
  `user_agent` text,
  `service_name` varchar(50),
  `old_data` jsonb,
  `new_data` jsonb,
  `changes` jsonb COMMENT '計算出的變更差異',
  `checksum` varchar(64) COMMENT 'SHA-256 of concatenated fields'
);

CREATE INDEX `ShippingAddress_index_0` ON `ShippingAddress` (`user_id`);

CREATE INDEX `ShippingAddress_index_1` ON `ShippingAddress` (`user_id`, `is_default`);

CREATE INDEX `UserToken_index_2` ON `UserToken` (`user_id`);

CREATE INDEX `UserToken_index_3` ON `UserToken` (`token_hash`);

CREATE INDEX `UserToken_index_4` ON `UserToken` (`user_id`, `is_revoked`, `expires_at`);

CREATE INDEX `Store_index_5` ON `Store` (`seller_id`);

CREATE INDEX `Store_index_6` ON `Store` (`store_name`) USING BTREE;

CREATE INDEX `Store_index_7` ON `Store` (`deleted_at`, `average_rating`);

CREATE INDEX `ProductType_index_8` ON `ProductType` (`type_code`);

CREATE INDEX `ProductType_index_9` ON `ProductType` (`parent_type_id`);

CREATE INDEX `Product_index_10` ON `Product` (`store_id`);

CREATE INDEX `Product_index_11` ON `Product` (`product_type_id`);

CREATE INDEX `Product_index_12` ON `Product` (`product_name`) USING BTREE;

CREATE INDEX `Product_index_13` ON `Product` (`store_id`, `product_type_id`);

CREATE INDEX `Product_index_14` ON `Product` (`price`, `deleted_at`);

CREATE INDEX `ProductImage_index_15` ON `ProductImage` (`product_id`);

CREATE INDEX `ProductImage_index_16` ON `ProductImage` (`product_id`, `display_order`);

CREATE INDEX `Inventory_index_17` ON `Inventory` (`product_id`);

CREATE INDEX `CartItem_index_18` ON `CartItem` (`cart_id`);

CREATE UNIQUE INDEX `CartItem_index_19` ON `CartItem` (`cart_id`, `product_id`);

CREATE INDEX `CartHistory_index_20` ON `CartHistory` (`user_id`);

CREATE INDEX `CartHistory_index_21` ON `CartHistory` (`created_at`);

CREATE INDEX `Order_index_22` ON `Order` (`order_number`);

CREATE INDEX `Order_index_23` ON `Order` (`user_id`);

CREATE INDEX `Order_index_24` ON `Order` (`store_id`);

CREATE INDEX `Order_index_25` ON `Order` (`order_status`);

CREATE INDEX `Order_index_26` ON `Order` (`idempotency_key`);

CREATE INDEX `Order_index_27` ON `Order` (`created_at`);

CREATE INDEX `Order_index_28` ON `Order` (`user_id`, `created_at`);

CREATE INDEX `Order_index_29` ON `Order` (`store_id`, `created_at`);

CREATE INDEX `OrderItem_index_30` ON `OrderItem` (`order_id`);

CREATE INDEX `OrderItem_index_31` ON `OrderItem` (`product_id`);

CREATE INDEX `Discount_index_32` ON `Discount` (`discount_code`);

CREATE INDEX `Discount_index_33` ON `Discount` (`discount_type`);

CREATE INDEX `Discount_index_34` ON `Discount` (`discount_type`, `is_active`, `start_datetime`, `end_datetime`);

CREATE INDEX `Discount_index_35` ON `Discount` (`created_by_type`, `created_by_id`);

CREATE INDEX `SpecialDiscount_index_36` ON `SpecialDiscount` (`store_id`);

CREATE INDEX `SpecialDiscount_index_37` ON `SpecialDiscount` (`product_type_id`);

CREATE UNIQUE INDEX `SpecialDiscount_index_38` ON `SpecialDiscount` (`store_id`, `product_type_id`, `discount_id`);

CREATE INDEX `OrderDiscount_index_39` ON `OrderDiscount` (`order_id`);

CREATE INDEX `OrderDiscount_index_40` ON `OrderDiscount` (`discount_id`);

CREATE UNIQUE INDEX `OrderDiscount_index_41` ON `OrderDiscount` (`order_id`, `discount_type`);

CREATE INDEX `AuditLog_index_42` ON `AuditLog` (`event_id`);

CREATE INDEX `AuditLog_index_43` ON `AuditLog` (`table_name`, `record_id`);

CREATE INDEX `AuditLog_index_44` ON `AuditLog` (`user_id`);

CREATE INDEX `AuditLog_index_45` ON `AuditLog` (`event_timestamp`);

CREATE INDEX `AuditLog_index_46` ON `AuditLog` (`request_id`);

ALTER TABLE `ShippingAddress` COMMENT = '一個 User 可以有多個 ShippingAddress';

ALTER TABLE `UserToken` COMMENT = '可以定期清理過期的token';

ALTER TABLE `Store` COMMENT = '商店資料';

ALTER TABLE `ProductType` COMMENT = '商品類型';

ALTER TABLE `Product` COMMENT = '商品資料：支援軟刪除=不會真正地刪除';

ALTER TABLE `ProductImage` COMMENT = '商品圖片（支援多張圖片）';

ALTER TABLE `Inventory` COMMENT = '即時庫存表（關鍵表）
  quantity = 實際可售數量
  reserved = 已預留但未完成付款的數量';

ALTER TABLE `Cart` COMMENT = '購物車（一個買家一個購物車）';

ALTER TABLE `CartItem` COMMENT = '購物車項目';

ALTER TABLE `CartHistory` COMMENT = '購物車歷史記錄-用於恢復購物車
    用途：
    - 每次使用者結帳、清空購物車、或主動儲存購物車時，
      系統會將當前購物車完整內容以快照（cart_snapshot）形式保存，
      以便日後可恢復購物車或查詢當時購物內容。

    應用場景：
    1. 查詢使用者當時結帳或放棄購物時的商品明細，方便加回購物車
    2. 協助追蹤轉單行為（cart → order）。

    刪除行為：
    - 若使用者被刪除，對應的購物車歷史資料一併刪除（on delete cascade）。
  ';

ALTER TABLE `Order` COMMENT = '訂單主表';

ALTER TABLE `OrderItem` COMMENT = '訂單項目
  範例：iPhone 原價 $35000，特價 $30000，買 2 個
  - original_price = 35000
  - unit_price = 30000
  - item_discount = 5000
  - subtotal = 30000 × 2 = 60000
  
  訂單層級的折扣（coupon）記錄在 OrderDiscount 表';

ALTER TABLE `Discount` COMMENT = '折扣基本資料（所有折扣共通屬性）';

ALTER TABLE `SeasonalDiscount` COMMENT = '季節折扣（admin 設置，百分比制）';

ALTER TABLE `ShippingDiscount` COMMENT = '運費折扣（admin 設置，固定金額制）';

ALTER TABLE `SpecialDiscount` COMMENT = '商家活動折扣（商家設置，百分比制）';

ALTER TABLE `OrderDiscount` COMMENT = '訂單套用的折扣記錄';

ALTER TABLE `AuditLog` COMMENT = '審計日誌表（關鍵安全表）
  - 必須設定為 APPEND ONLY（只允許 INSERT）
  - 定期歸檔到冷存儲';

ALTER TABLE `User` ADD FOREIGN KEY (`user_id`) REFERENCES `Seller` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Seller` ADD FOREIGN KEY (`verified_by`) REFERENCES `User` (`user_id`) ON DELETE SET NULL;

ALTER TABLE `ShippingAddress` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `UserToken` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Seller` ADD FOREIGN KEY (`seller_id`) REFERENCES `Store` (`seller_id`) ON DELETE RESTRICT;

ALTER TABLE `ProductType` ADD FOREIGN KEY (`parent_type_id`) REFERENCES `ProductType` (`product_type_id`) ON DELETE CASCADE;

ALTER TABLE `Product` ADD FOREIGN KEY (`store_id`) REFERENCES `Store` (`store_id`) ON DELETE RESTRICT;

ALTER TABLE `Product` ADD FOREIGN KEY (`product_type_id`) REFERENCES `ProductType` (`product_type_id`) ON DELETE RESTRICT;

ALTER TABLE `ProductImage` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `Product` ADD FOREIGN KEY (`product_id`) REFERENCES `Inventory` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `User` ADD FOREIGN KEY (`user_id`) REFERENCES `Cart` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `CartItem` ADD FOREIGN KEY (`cart_id`) REFERENCES `Cart` (`cart_id`) ON DELETE CASCADE;

ALTER TABLE `CartItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`product_id`) ON DELETE RESTRICT;

ALTER TABLE `CartHistory` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Order` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE RESTRICT;

ALTER TABLE `Order` ADD FOREIGN KEY (`store_id`) REFERENCES `Store` (`store_id`) ON DELETE RESTRICT;

ALTER TABLE `OrderItem` ADD FOREIGN KEY (`order_id`) REFERENCES `Order` (`order_id`) ON DELETE CASCADE;

ALTER TABLE `OrderItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`product_id`) ON DELETE SET NULL;

ALTER TABLE `Discount` ADD FOREIGN KEY (`discount_id`) REFERENCES `SeasonalDiscount` (`discount_id`) ON DELETE CASCADE;

ALTER TABLE `Discount` ADD FOREIGN KEY (`discount_id`) REFERENCES `ShippingDiscount` (`discount_id`) ON DELETE CASCADE;

ALTER TABLE `Discount` ADD FOREIGN KEY (`discount_id`) REFERENCES `SpecialDiscount` (`discount_id`) ON DELETE CASCADE;

ALTER TABLE `SpecialDiscount` ADD FOREIGN KEY (`store_id`) REFERENCES `Store` (`store_id`) ON DELETE CASCADE;

ALTER TABLE `SpecialDiscount` ADD FOREIGN KEY (`product_type_id`) REFERENCES `ProductType` (`product_type_id`) ON DELETE RESTRICT;

ALTER TABLE `OrderDiscount` ADD FOREIGN KEY (`order_id`) REFERENCES `Order` (`order_id`) ON DELETE CASCADE;

ALTER TABLE `OrderDiscount` ADD FOREIGN KEY (`discount_id`) REFERENCES `Discount` (`discount_id`) ON DELETE RESTRICT;

ALTER TABLE `AuditLog` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE SET NULL;
