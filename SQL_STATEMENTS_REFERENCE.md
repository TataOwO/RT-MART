# RT-MART Database - SQL Statements Reference

This document provides actual SQL DDL statements extracted from the migration files.

---

## Table Creation Examples

### 1. User Table (Core Authentication)

```sql
CREATE TABLE User (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  login_id VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  role ENUM('buyer', 'seller', 'admin') NOT NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX IDX_user_login_id ON User(login_id);
CREATE UNIQUE INDEX IDX_user_email ON User(email);
```

---

### 2. Product Table (E-commerce Core)

```sql
CREATE TABLE Product (
  product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT NOT NULL,
  product_type_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  sold_count BIGINT DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT FK_product_store
    FOREIGN KEY (store_id)
    REFERENCES Store(store_id)
    ON DELETE RESTRICT,

  CONSTRAINT FK_product_producttype
    FOREIGN KEY (product_type_id)
    REFERENCES ProductType(product_type_id)
    ON DELETE RESTRICT
);

-- Single-column Indexes
CREATE INDEX IDX_product_store_id ON Product(store_id);
CREATE INDEX IDX_product_product_type_id ON Product(product_type_id);
CREATE INDEX IDX_product_product_name ON Product(product_name);

-- Composite Indexes (for performance)
CREATE INDEX IDX_product_store_id_product_type_id
  ON Product(store_id, product_type_id);
CREATE INDEX IDX_product_price_deleted_at
  ON Product(price, deleted_at);
```

---

### 3. Order Table (Transaction Management)

```sql
CREATE TABLE `Order` (
  order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,

  order_status ENUM(
    'pending_payment',
    'payment_failed',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending_payment',

  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 60,
  total_discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  idempotency_key VARCHAR(128) UNIQUE,
  shipping_address_snapshot JSON NOT NULL,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,

  CONSTRAINT FK_order_user
    FOREIGN KEY (user_id)
    REFERENCES User(user_id)
    ON DELETE RESTRICT,

  CONSTRAINT FK_order_store
    FOREIGN KEY (store_id)
    REFERENCES Store(store_id)
    ON DELETE RESTRICT
);

-- Single-column Indexes
CREATE INDEX IDX_order_order_number ON `Order`(order_number);
CREATE INDEX IDX_order_user_id ON `Order`(user_id);
CREATE INDEX IDX_order_store_id ON `Order`(store_id);
CREATE INDEX IDX_order_order_status ON `Order`(order_status);
CREATE INDEX IDX_order_idempotency_key ON `Order`(idempotency_key);
CREATE INDEX IDX_order_created_at ON `Order`(created_at);

-- Composite Indexes (for time-based queries)
CREATE INDEX IDX_order_user_id_created_at
  ON `Order`(user_id, created_at);
CREATE INDEX IDX_order_store_id_created_at
  ON `Order`(store_id, created_at);
```

---

### 4. Inventory Table (Stock Management)

```sql
CREATE TABLE Inventory (
  inventory_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT FK_inventory_product
    FOREIGN KEY (product_id)
    REFERENCES Product(product_id)
    ON DELETE CASCADE
);

CREATE INDEX IDX_inventory_product_id ON Inventory(product_id);
```

**Note**: The `reserved` field is used for inventory reservation during checkout to prevent overselling.

---

### 5. Discount Tables (Supertype-Subtype Pattern)

#### Base Discount Table
```sql
CREATE TABLE Discount (
  discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  discount_code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('seasonal', 'shipping', 'special') NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  min_purchase_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INT NULL,
  usage_count INT DEFAULT 0,
  created_by_type ENUM('system', 'seller') NOT NULL,
  created_by_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_discount_code ON Discount(discount_code);
CREATE INDEX IDX_discount_type ON Discount(discount_type);
CREATE INDEX IDX_discount_active_period
  ON Discount(discount_type, is_active, start_datetime, end_datetime);
CREATE INDEX IDX_discount_creator
  ON Discount(created_by_type, created_by_id);
```

#### Seasonal Discount (Subtype)
```sql
CREATE TABLE SeasonalDiscount (
  seasonal_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  discount_id BIGINT NOT NULL UNIQUE,
  discount_rate DECIMAL(5,4) NOT NULL,
  max_discount_amount DECIMAL(10,2) NULL,

  CONSTRAINT FK_seasonal_discount
    FOREIGN KEY (discount_id)
    REFERENCES Discount(discount_id)
    ON DELETE CASCADE
);
```

#### Special Discount (Subtype - Seller-created)
```sql
CREATE TABLE SpecialDiscount (
  special_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  discount_id BIGINT NOT NULL UNIQUE,
  store_id BIGINT NOT NULL,
  product_type_id BIGINT NULL,
  discount_rate DECIMAL(5,4) NULL,
  max_discount_amount DECIMAL(10,2) NULL,

  CONSTRAINT FK_special_discount
    FOREIGN KEY (discount_id)
    REFERENCES Discount(discount_id)
    ON DELETE CASCADE,

  CONSTRAINT FK_special_discount_store
    FOREIGN KEY (store_id)
    REFERENCES Store(store_id)
    ON DELETE CASCADE,

  CONSTRAINT FK_special_discount_product_type
    FOREIGN KEY (product_type_id)
    REFERENCES ProductType(product_type_id)
    ON DELETE RESTRICT
);

CREATE INDEX IDX_special_discount_store ON SpecialDiscount(store_id);
CREATE INDEX IDX_special_discount_product_type ON SpecialDiscount(product_type_id);
CREATE UNIQUE INDEX IDX_special_discount_unique
  ON SpecialDiscount(store_id, product_type_id, discount_id);
```

---

## Complex Query Examples

### Query 1: Product Search with Dynamic Pricing

```sql
-- This query calculates real-time pricing with active discounts
SELECT
    p.product_id,
    p.product_name,
    p.price AS original_price,
    MAX(sd.discount_rate) AS max_discount_rate,
    p.price * (1 - COALESCE(MAX(sd.discount_rate), 0)) AS effective_price,
    s.store_name,
    pt.type_name,
    i.quantity AS stock
FROM Product p
LEFT JOIN SpecialDiscount sd
    ON sd.store_id = p.store_id
    AND (sd.product_type_id IS NULL OR sd.product_type_id = p.product_type_id)
LEFT JOIN Discount d
    ON d.discount_id = sd.discount_id
    AND d.is_active = true
    AND d.start_datetime <= NOW()
    AND d.end_datetime >= NOW()
LEFT JOIN Store s ON p.store_id = s.store_id
LEFT JOIN ProductType pt ON p.product_type_id = pt.product_type_id
LEFT JOIN Inventory i ON p.product_id = i.product_id
WHERE p.is_active = true
GROUP BY p.product_id
ORDER BY effective_price DESC;
```

---

### Query 2: Revenue Report (Monthly Breakdown)

```sql
-- Calculate monthly revenue for the last 12 months
SELECT
    DATE_FORMAT(o.created_at, '%Y-%m') AS month,
    COUNT(*) AS order_count,
    SUM(o.total_amount) AS total_revenue,
    AVG(o.total_amount) AS avg_order_value
FROM `Order` o
WHERE o.order_status = 'completed'
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY month
ORDER BY month ASC;
```

---

### Query 3: Seller Performance Dashboard

```sql
-- Comprehensive seller performance metrics
SELECT
    s.seller_id,
    u.name AS seller_name,
    st.store_name,
    st.average_rating AS store_rating,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(CASE WHEN o.order_status = 'completed' THEN o.total_amount ELSE 0 END) AS total_revenue,
    COUNT(DISTINCT p.product_id) AS total_products,
    AVG(p.average_rating) AS avg_product_rating,
    SUM(p.sold_count) AS total_units_sold
FROM Seller s
INNER JOIN User u ON s.user_id = u.user_id
INNER JOIN Store st ON s.seller_id = st.seller_id
LEFT JOIN `Order` o ON st.store_id = o.store_id
LEFT JOIN Product p ON st.store_id = p.store_id AND p.is_active = true
WHERE s.verified = true
GROUP BY s.seller_id
ORDER BY total_revenue DESC;
```

---

### Query 4: Low Stock Alert

```sql
-- Find products with low stock (< 10 available units)
SELECT
    p.product_id,
    p.product_name,
    s.store_name,
    i.quantity AS current_stock,
    i.reserved AS reserved_stock,
    (i.quantity - i.reserved) AS available_stock,
    p.sold_count
FROM Product p
INNER JOIN Store s ON p.store_id = s.store_id
INNER JOIN Inventory i ON p.product_id = i.product_id
WHERE p.is_active = true
  AND (i.quantity - i.reserved) < 10
ORDER BY available_stock ASC, p.sold_count DESC;
```

---

### Query 5: Order Anomaly Detection

```sql
-- Find orders pending payment for more than 24 hours
SELECT
    o.order_id,
    o.order_number,
    u.name AS buyer_name,
    u.email AS buyer_email,
    s.store_name,
    o.total_amount,
    o.created_at,
    TIMESTAMPDIFF(HOUR, o.created_at, NOW()) AS hours_pending
FROM `Order` o
INNER JOIN User u ON o.user_id = u.user_id
INNER JOIN Store s ON o.store_id = s.store_id
WHERE o.order_status = 'pending_payment'
  AND o.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY o.created_at ASC;
```

---

### Query 6: Product Type Hierarchy (Recursive CTE)

```sql
-- Get all descendant product types (recursive)
WITH RECURSIVE product_type_tree AS (
    -- Base case: start with the specified type
    SELECT
        product_type_id,
        type_code,
        type_name,
        parent_type_id,
        0 AS depth
    FROM ProductType
    WHERE product_type_id = ? -- parameter

    UNION ALL

    -- Recursive case: find children
    SELECT
        pt.product_type_id,
        pt.type_code,
        pt.type_name,
        pt.parent_type_id,
        ptt.depth + 1
    FROM ProductType pt
    INNER JOIN product_type_tree ptt ON pt.parent_type_id = ptt.product_type_id
    WHERE pt.is_active = true
)
SELECT * FROM product_type_tree
ORDER BY depth, type_name;
```

---

### Query 7: Order Summary with Customer Details

```sql
-- Comprehensive order view for admin
SELECT
    o.order_id,
    o.order_number,
    o.order_status,
    u.name AS buyer_name,
    u.email AS buyer_email,
    u.phone_number AS buyer_phone,
    s.store_name,
    seller_user.name AS seller_name,
    COUNT(oi.order_item_id) AS item_count,
    o.subtotal,
    o.shipping_fee,
    o.total_discount,
    o.total_amount,
    o.payment_method,
    o.created_at,
    o.paid_at,
    o.shipped_at,
    o.completed_at
FROM `Order` o
INNER JOIN User u ON o.user_id = u.user_id
INNER JOIN Store s ON o.store_id = s.store_id
INNER JOIN Seller seller ON s.seller_id = seller.seller_id
INNER JOIN User seller_user ON seller.user_id = seller_user.user_id
LEFT JOIN OrderItem oi ON o.order_id = oi.order_id
GROUP BY o.order_id
ORDER BY o.created_at DESC;
```

---

## View Definitions

### View 1: Active Products with Current Prices

```sql
CREATE VIEW v_active_products AS
SELECT
    p.product_id,
    p.product_name,
    p.price AS original_price,
    COALESCE(MAX(sd.discount_rate), 0) AS discount_rate,
    p.price * (1 - COALESCE(MAX(sd.discount_rate), 0)) AS current_price,
    s.store_id,
    s.store_name,
    pt.type_name AS category,
    i.quantity AS stock,
    i.quantity - i.reserved AS available_stock,
    p.average_rating,
    p.total_reviews,
    p.sold_count
FROM Product p
INNER JOIN Store s ON p.store_id = s.store_id
INNER JOIN ProductType pt ON p.product_type_id = pt.product_type_id
LEFT JOIN Inventory i ON p.product_id = i.product_id
LEFT JOIN SpecialDiscount sd ON sd.store_id = p.store_id
    AND (sd.product_type_id IS NULL OR sd.product_type_id = p.product_type_id)
LEFT JOIN Discount d ON d.discount_id = sd.discount_id
    AND d.is_active = true
    AND d.start_datetime <= NOW()
    AND d.end_datetime >= NOW()
WHERE p.is_active = true
  AND s.deleted_at IS NULL
GROUP BY p.product_id;
```

---

### View 2: Order Status Summary

```sql
CREATE VIEW v_order_status_summary AS
SELECT
    order_status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_value,
    AVG(total_amount) AS avg_order_value,
    MIN(created_at) AS oldest_order,
    MAX(created_at) AS newest_order
FROM `Order`
GROUP BY order_status;
```

---

### View 3: User Activity Summary

```sql
CREATE VIEW v_user_activity AS
SELECT
    u.user_id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(CASE WHEN o.order_status = 'completed' THEN o.total_amount ELSE 0 END) AS total_spent,
    MAX(o.created_at) AS last_order_date,
    COUNT(DISTINCT ci.cart_item_id) AS cart_items,
    u.created_at AS member_since
FROM User u
LEFT JOIN `Order` o ON u.user_id = o.user_id
LEFT JOIN Cart c ON u.user_id = c.user_id
LEFT JOIN CartItem ci ON c.cart_id = ci.cart_id
WHERE u.deleted_at IS NULL
GROUP BY u.user_id;
```

---

## Stored Procedure Examples

### Procedure 1: Complete Order Checkout

```sql
DELIMITER //

CREATE PROCEDURE sp_create_order(
    IN p_user_id BIGINT,
    IN p_shipping_address_id BIGINT,
    IN p_payment_method VARCHAR(50),
    OUT p_order_id BIGINT
)
BEGIN
    DECLARE v_order_number VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Generate order number
    SET v_order_number = CONCAT('ORD', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));

    -- Create order (simplified - actual implementation groups by store)
    INSERT INTO `Order` (
        order_number, user_id, store_id, order_status,
        subtotal, shipping_fee, total_amount,
        payment_method, shipping_address_snapshot
    )
    SELECT
        v_order_number,
        p_user_id,
        p.store_id,
        'pending_payment',
        SUM(p.price * ci.quantity),
        60, -- shipping fee
        SUM(p.price * ci.quantity) + 60,
        p_payment_method,
        JSON_OBJECT(
            'address_id', sa.address_id,
            'recipient', sa.recipient_name,
            'phone', sa.phone,
            'address', CONCAT(sa.city, ' ', sa.district, ' ', sa.address_line1)
        )
    FROM CartItem ci
    INNER JOIN Cart c ON ci.cart_id = c.cart_id
    INNER JOIN Product p ON ci.product_id = p.product_id
    INNER JOIN ShippingAddress sa ON sa.address_id = p_shipping_address_id
    WHERE c.user_id = p_user_id
    GROUP BY p.store_id;

    SET p_order_id = LAST_INSERT_ID();

    COMMIT;
END //

DELIMITER ;
```

---

## Trigger Examples

### Trigger 1: Update Product Rating

```sql
DELIMITER //

CREATE TRIGGER trg_update_product_rating
AFTER INSERT ON Review
FOR EACH ROW
BEGIN
    UPDATE Product
    SET
        average_rating = (
            (average_rating * total_reviews + NEW.rating) / (total_reviews + 1)
        ),
        total_reviews = total_reviews + 1
    WHERE product_id = NEW.product_id;
END //

DELIMITER ;
```

---

### Trigger 2: Inventory Reserve on Order Creation

```sql
DELIMITER //

CREATE TRIGGER trg_reserve_inventory
AFTER INSERT ON OrderItem
FOR EACH ROW
BEGIN
    UPDATE Inventory
    SET
        quantity = quantity - NEW.quantity,
        reserved = reserved + NEW.quantity
    WHERE product_id = NEW.product_id;
END //

DELIMITER ;
```

---

## Index Performance Analysis

### Current Indexes Summary

```sql
-- Show all indexes in the database
SELECT
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
    INDEX_TYPE,
    NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'rt_mart_db'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
```

---

### Analyze Index Usage

```sql
-- Check unused indexes (requires performance_schema)
SELECT
    object_schema,
    object_name,
    index_name
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND index_name != 'PRIMARY'
  AND count_star = 0
  AND object_schema = 'rt_mart_db';
```

---

## Database Maintenance Scripts

### Script 1: Archive Old Audit Logs

```sql
-- Move audit logs older than 1 year to archive table
INSERT INTO AuditLog_Archive
SELECT * FROM AuditLog
WHERE event_timestamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);

DELETE FROM AuditLog
WHERE event_timestamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

---

### Script 2: Clean Expired Tokens

```sql
-- Delete expired and revoked tokens
DELETE FROM UserToken
WHERE (expires_at < NOW() OR is_revoked = true)
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## Connection and Configuration

### Database Connection String
```
mysql://rt_mart_user:rt_mart_and_the_user_password_yeah_very_cool123*@localhost:3306/rt_mart_db
```

### Recommended MariaDB Configuration

```ini
[mysqld]
# Performance tuning
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
query_cache_type = 1

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Logging
slow_query_log = 1
long_query_time = 1
log_queries_not_using_indexes = 1
```

---

**Note**: All SQL statements are compatible with MariaDB 11.2 and MySQL 8.0+.
