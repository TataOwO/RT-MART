# RT-MART Database Index Structure Diagrams

This document provides visual representations of index structures in the RT-MART database, following the format of composite index organization.

---

## Diagram 1: Order Table Index Structures

### Primary Scenario: User Order History Query

**Purpose**: Efficiently retrieve orders for a specific user sorted by date

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER TABLE                                    │
│  ┌──────┬──────────┬─────────────┬──────────────────┐          │
│  │user_id│ login_id │    name     │      email       │          │
│  ├──────┼──────────┼─────────────┼──────────────────┤          │
│  │  1   │  john01  │  John Doe   │ john@email.com   │          │
│  │  2   │  mary02  │  Mary Smith │ mary@email.com   │          │
│  │  3   │  bob03   │  Bob Chen   │ bob@email.com    │          │
│  └──────┴──────────┴─────────────┴──────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ FK: user_id
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              ORDER TABLE (with composite index)                  │
│                                                                   │
│  Composite Index: (user_id, created_at)                         │
│  Purpose: Fast user order history retrieval                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ user_id │ created_at          │ order_id │ amount  │        │
│  ├─────────┼─────────────────────┼──────────┼─────────┤        │
│  │    1    │ 2024-12-01 10:00:00 │  ORD101  │  1500  │        │
│  │    1    │ 2024-12-15 14:30:00 │  ORD102  │  2300  │        │
│  │    1    │ 2024-12-28 09:15:00 │  ORD103  │  850   │        │
│  ├─────────┼─────────────────────┼──────────┼─────────┤        │
│  │    2    │ 2024-11-20 11:00:00 │  ORD201  │  3200  │        │
│  │    2    │ 2024-12-10 16:45:00 │  ORD202  │  1750  │        │
│  ├─────────┼─────────────────────┼──────────┼─────────┤        │
│  │    3    │ 2024-12-05 13:20:00 │  ORD301  │  980   │        │
│  └─────────┴─────────────────────┴──────────┴─────────┘        │
│                                                                   │
│  Query: SELECT * FROM Order WHERE user_id = 1                   │
│         ORDER BY created_at DESC                                 │
│  → Index scan returns: ORD103, ORD102, ORD101 (efficiently!)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Diagram 2: Product Search with Store and Type Filtering

### Composite Index: (store_id, product_type_id)

**Purpose**: Fast product filtering by store and category

```
┌──────────────────────────────────────────────────────────────────┐
│                        STORE TABLE                                │
│  ┌──────────┬─────────────────┬───────────────┐                 │
│  │ store_id │   store_name    │ average_rating│                 │
│  ├──────────┼─────────────────┼───────────────┤                 │
│  │    1     │  Tech Haven     │     4.5       │                 │
│  │    2     │  Fashion Store  │     4.8       │                 │
│  │    3     │  Book World     │     4.2       │                 │
│  └──────────┴─────────────────┴───────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ FK: store_id
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│           PRODUCT TABLE (with composite indexes)                  │
│                                                                    │
│  Composite Index 1: (store_id, product_type_id)                  │
│  Purpose: Filter products by store and category                   │
│                                                                    │
│  ┌────────────┬────────────────┬────────────┬────────┬────────┐ │
│  │ store_id   │ product_type_id│ product_id │  name  │ price  │ │
│  ├────────────┼────────────────┼────────────┼────────┼────────┤ │
│  │     1      │       5        │    101     │ Laptop │ 35000  │ │
│  │     1      │       5        │    102     │ Mouse  │  500   │ │
│  │     1      │       8        │    103     │ Cable  │  150   │ │
│  ├────────────┼────────────────┼────────────┼────────┼────────┤ │
│  │     2      │       3        │    201     │ Shirt  │  890   │ │
│  │     2      │       3        │    202     │ Pants  │  1200  │ │
│  │     2      │       4        │    203     │ Shoes  │  2500  │ │
│  ├────────────┼────────────────┼────────────┼────────┼────────┤ │
│  │     3      │       1        │    301     │ Novel  │  350   │ │
│  │     3      │       1        │    302     │ Comic  │  250   │ │
│  └────────────┴────────────────┴────────────┴────────┴────────┘ │
│                                                                    │
│  Query: SELECT * FROM Product                                     │
│         WHERE store_id = 1 AND product_type_id = 5               │
│  → Index returns: product_id 101, 102 instantly                  │
│                                                                    │
│  ────────────────────────────────────────────────────────────    │
│                                                                    │
│  Composite Index 2: (price, deleted_at)                          │
│  Purpose: Price range queries on active products                  │
│                                                                    │
│  ┌──────────┬─────────────┬────────────┬─────────────────────┐  │
│  │  price   │ deleted_at  │ product_id │   product_name      │  │
│  ├──────────┼─────────────┼────────────┼─────────────────────┤  │
│  │   150    │    NULL     │    103     │ Cable               │  │
│  │   250    │    NULL     │    302     │ Comic               │  │
│  │   350    │    NULL     │    301     │ Novel               │  │
│  │   500    │    NULL     │    102     │ Mouse               │  │
│  │   890    │    NULL     │    201     │ Shirt               │  │
│  │  1200    │    NULL     │    202     │ Pants               │  │
│  │  2500    │    NULL     │    203     │ Shoes               │  │
│  │  35000   │    NULL     │    101     │ Laptop              │  │
│  ├──────────┼─────────────┼────────────┼─────────────────────┤  │
│  │  5000    │  2024-12-01 │    999     │ Old Product (DEL)   │  │
│  └──────────┴─────────────┴────────────┴─────────────────────┘  │
│                                                                    │
│  Query: SELECT * FROM Product                                     │
│         WHERE price BETWEEN 500 AND 2000                         │
│           AND deleted_at IS NULL                                  │
│  → Index scan returns: 102, 201, 202 efficiently                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Diagram 3: Shopping Cart Item Management

### Composite Unique Index: (cart_id, product_id)

**Purpose**: Ensure one product appears only once per cart + fast lookup

```
┌──────────────────────────────────────────────────────────────────┐
│                        CART TABLE                                 │
│  ┌─────────┬─────────┬──────────────────────┐                   │
│  │ cart_id │ user_id │     created_at       │                   │
│  ├─────────┼─────────┼──────────────────────┤                   │
│  │   10    │    1    │ 2024-12-01 10:00:00  │                   │
│  │   20    │    2    │ 2024-12-15 14:30:00  │                   │
│  │   30    │    3    │ 2024-12-20 09:15:00  │                   │
│  └─────────┴─────────┴──────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ FK: cart_id
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│              CART_ITEM TABLE                                      │
│                                                                    │
│  Composite UNIQUE Index: (cart_id, product_id)                   │
│  Purpose: 1) Prevent duplicate products in cart                   │
│           2) Fast lookup for "is product X in cart Y?"           │
│                                                                    │
│  ┌───────────┬────────────┬──────────┬─────────────────────┐    │
│  │  cart_id  │ product_id │ quantity │ cart_item_id        │    │
│  ├───────────┼────────────┼──────────┼─────────────────────┤    │
│  │    10     │    101     │    1     │  CI_1001            │    │
│  │    10     │    102     │    2     │  CI_1002            │    │
│  │    10     │    201     │    1     │  CI_1003            │    │
│  ├───────────┼────────────┼──────────┼─────────────────────┤    │
│  │    20     │    103     │    3     │  CI_2001            │    │
│  │    20     │    301     │    1     │  CI_2002            │    │
│  ├───────────┼────────────┼──────────┼─────────────────────┤    │
│  │    30     │    102     │    1     │  CI_3001            │    │
│  │    30     │    202     │    2     │  CI_3002            │    │
│  │    30     │    203     │    1     │  CI_3003            │    │
│  └───────────┴────────────┴──────────┴─────────────────────┘    │
│                                                                    │
│  Scenario 1 - Check if product exists in cart:                   │
│  Query: SELECT * FROM CartItem                                    │
│         WHERE cart_id = 10 AND product_id = 102                  │
│  → Index returns: CI_1002 instantly                              │
│                                                                    │
│  Scenario 2 - Prevent duplicates (UNIQUE constraint):            │
│  INSERT INTO CartItem (cart_id, product_id, quantity)            │
│  VALUES (10, 102, 1)                                              │
│  → ERROR: Duplicate entry for (10, 102) - prevented by index!   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Diagram 4: Discount System with Multi-column Index

### Composite Index: (discount_type, is_active, start_datetime, end_datetime)

**Purpose**: Efficiently find active discounts of a specific type for current time

```
┌──────────────────────────────────────────────────────────────────┐
│                    DISCOUNT TABLE                                 │
│                                                                    │
│  Composite Index: (discount_type, is_active,                     │
│                    start_datetime, end_datetime)                  │
│  Purpose: Find currently active discounts by type                 │
│                                                                    │
│  ┌──────────────┬──────────┬──────────────────┬──────────────────┬─────────────┬──────────┐
│  │discount_type │is_active │  start_datetime  │  end_datetime    │discount_code│discount_id│
│  ├──────────────┼──────────┼──────────────────┼──────────────────┼─────────────┼──────────┤
│  │  seasonal    │   true   │ 2024-11-01 00:00 │ 2024-12-31 23:59 │  WINTER24   │   D001   │
│  │  seasonal    │   true   │ 2024-12-01 00:00 │ 2025-01-15 23:59 │  NEWYEAR25  │   D002   │
│  │  seasonal    │   false  │ 2024-10-01 00:00 │ 2024-10-31 23:59 │  HALLOWEEN  │   D003   │
│  ├──────────────┼──────────┼──────────────────┼──────────────────┼─────────────┼──────────┤
│  │  shipping    │   true   │ 2024-12-01 00:00 │ 2025-01-31 23:59 │  FREESHIP   │   D004   │
│  │  shipping    │   true   │ 2024-12-20 00:00 │ 2024-12-31 23:59 │  XMASSHIP   │   D005   │
│  │  shipping    │   false  │ 2024-09-01 00:00 │ 2024-09-30 23:59 │  SEPTSHIP   │   D006   │
│  ├──────────────┼──────────┼──────────────────┼──────────────────┼─────────────┼──────────┤
│  │  special     │   true   │ 2024-12-15 00:00 │ 2025-01-15 23:59 │  TECH50     │   D007   │
│  │  special     │   true   │ 2024-12-01 00:00 │ 2024-12-31 23:59 │  FASHION30  │   D008   │
│  │  special     │   false  │ 2024-11-01 00:00 │ 2024-11-30 23:59 │  BOOK20     │   D009   │
│  └──────────────┴──────────┴──────────────────┴──────────────────┴─────────────┴──────────┘
│                                                                    │
│  Query Example (Current time: 2024-12-25 12:00:00):              │
│  ──────────────────────────────────────────────────────────────  │
│                                                                    │
│  SELECT * FROM Discount                                           │
│  WHERE discount_type = 'seasonal'                                 │
│    AND is_active = true                                           │
│    AND start_datetime <= '2024-12-25 12:00:00'                   │
│    AND end_datetime >= '2024-12-25 12:00:00'                     │
│                                                                    │
│  Index Scan Process:                                              │
│  Step 1: Filter by discount_type = 'seasonal' → rows 1-3         │
│  Step 2: Filter by is_active = true → rows 1-2                   │
│  Step 3: Range check start_datetime <= NOW() → rows 1-2          │
│  Step 4: Range check end_datetime >= NOW() → rows 1-2            │
│                                                                    │
│  → Returns: D001 (WINTER24), D002 (NEWYEAR25)                    │
│                                                                    │
│  ⚡ Without this composite index:                                 │
│     Full table scan → check all 9 rows → slow!                   │
│  ✅ With composite index:                                         │
│     Index seek → check only 2 rows → fast!                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Diagram 5: Order Status Tracking

### Single-column Index: order_status

**Purpose**: Filter orders by status for admin/seller dashboards

```
┌──────────────────────────────────────────────────────────────────┐
│                    ORDER TABLE                                    │
│                                                                    │
│  Single-column Index: order_status                                │
│  Purpose: Fast filtering by order status                          │
│                                                                    │
│  ┌────────────────────┬──────────────┬──────────┬──────────────┐ │
│  │   order_status     │  order_id    │ user_id  │ total_amount │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  cancelled         │  ORD501      │    5     │    3200      │ │
│  │  cancelled         │  ORD601      │    8     │    1500      │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  completed         │  ORD101      │    1     │    5000      │ │
│  │  completed         │  ORD102      │    2     │    3500      │ │
│  │  completed         │  ORD103      │    3     │    2100      │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  delivered         │  ORD401      │    7     │    2800      │ │
│  │  delivered         │  ORD402      │    9     │    4200      │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  paid              │  ORD301      │    4     │    1800      │ │
│  │  paid              │  ORD302      │    6     │    2500      │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  pending_payment   │  ORD201      │    2     │    3000      │ │
│  │  pending_payment   │  ORD202      │    5     │    1200      │ │
│  │  pending_payment   │  ORD203      │    8     │    5500      │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  processing        │  ORD701      │    1     │    4500      │ │
│  │  processing        │  ORD702      │    3     │    3800      │ │
│  ├────────────────────┼──────────────┼──────────┼──────────────┤ │
│  │  shipped           │  ORD801      │    6     │    2200      │ │
│  │  shipped           │  ORD802      │    9     │    3100      │ │
│  └────────────────────┴──────────────┴──────────┴──────────────┘ │
│                                                                    │
│  Use Case 1 - Admin Dashboard:                                   │
│  Query: SELECT COUNT(*), SUM(total_amount)                       │
│         FROM Order WHERE order_status = 'completed'              │
│  → Index scan: 3 rows, Total: 10,600                             │
│                                                                    │
│  Use Case 2 - Order Anomaly Detection:                           │
│  Query: SELECT * FROM Order                                       │
│         WHERE order_status = 'pending_payment'                   │
│           AND created_at < NOW() - INTERVAL 24 HOUR              │
│  → Index narrows down to pending_payment rows first              │
│                                                                    │
│  Use Case 3 - Revenue Calculation:                               │
│  Query: SELECT SUM(total_amount) FROM Order                      │
│         WHERE order_status = 'completed'                         │
│  → Only scans completed orders (3 rows vs 17 total rows)         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Diagram 6: Inventory Stock Management

### Composite Index: (product_id, quantity)

**Purpose**: Fast stock availability checks during checkout

```
┌──────────────────────────────────────────────────────────────────┐
│                    PRODUCT TABLE                                  │
│  ┌────────────┬──────────────────┬─────────┐                    │
│  │ product_id │   product_name   │  price  │                    │
│  ├────────────┼──────────────────┼─────────┤                    │
│  │    101     │ Laptop           │ 35000   │                    │
│  │    102     │ Mouse            │   500   │                    │
│  │    103     │ Keyboard         │  1200   │                    │
│  │    201     │ T-Shirt          │   890   │                    │
│  │    202     │ Jeans            │  2500   │                    │
│  └────────────┴──────────────────┴─────────┘                    │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ 1:1 relationship
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                    INVENTORY TABLE                                │
│                                                                    │
│  Primary Index: product_id (UNIQUE)                              │
│  Secondary Index: (product_id, quantity)                         │
│  Purpose: Fast stock checking and low-stock alerts                │
│                                                                    │
│  ┌────────────┬──────────┬──────────┬─────────────────────────┐ │
│  │ product_id │ quantity │ reserved │  available (calculated) │ │
│  ├────────────┼──────────┼──────────┼─────────────────────────┤ │
│  │    101     │    25    │    5     │    20                   │ │
│  │    102     │   150    │   10     │   140                   │ │
│  │    103     │    80    │   15     │    65                   │ │
│  │    201     │     8    │    2     │     6    ⚠️ LOW STOCK   │ │
│  │    202     │     3    │    0     │     3    ⚠️ LOW STOCK   │ │
│  └────────────┴──────────┴──────────┴─────────────────────────┘ │
│                                                                    │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                    │
│  CHECKOUT FLOW - Inventory Check:                                │
│  ────────────────────────────────────────────────────────────    │
│                                                                    │
│  User wants to buy: product_id=102, requested_qty=20             │
│                                                                    │
│  Query: SELECT quantity, reserved FROM Inventory                 │
│         WHERE product_id = 102                                    │
│                                                                    │
│  → Index lookup on product_id: returns (150, 10)                 │
│  → Calculate available: 150 - 10 = 140                           │
│  → Check: 140 >= 20? YES ✅                                      │
│  → Reserve inventory: UPDATE Inventory                            │
│                       SET quantity = quantity - 20,               │
│                           reserved = reserved + 20                │
│                       WHERE product_id = 102                      │
│                                                                    │
│  After reservation:                                               │
│  ┌────────────┬──────────┬──────────┬──────────────────────────┐│
│  │ product_id │ quantity │ reserved │  available               ││
│  │    102     │   130    │    30    │    100                   ││
│  └────────────┴──────────┴──────────┴──────────────────────────┘│
│                                                                    │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                    │
│  LOW STOCK ALERT QUERY:                                          │
│  ────────────────────────────────────────────────────────────    │
│                                                                    │
│  SELECT p.product_id, p.product_name, i.quantity, i.reserved     │
│  FROM Inventory i                                                 │
│  JOIN Product p ON i.product_id = p.product_id                   │
│  WHERE (i.quantity - i.reserved) < 10                            │
│                                                                    │
│  → Index helps filter by quantity threshold                      │
│  → Returns: product_id 201, 202 (low stock items)               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Index Performance Comparison Table

| Table | Index Type | Columns | Use Case | Performance Impact |
|-------|-----------|---------|----------|-------------------|
| **Order** | Composite | (user_id, created_at) | User order history | ⚡⚡⚡ Critical - Frequent queries |
| **Order** | Composite | (store_id, created_at) | Seller order management | ⚡⚡⚡ Critical - Frequent queries |
| **Product** | Composite | (store_id, product_type_id) | Product filtering | ⚡⚡⚡ Critical - Homepage/search |
| **Product** | Composite | (price, deleted_at) | Price range search | ⚡⚡ High - Search filters |
| **CartItem** | Composite UNIQUE | (cart_id, product_id) | Prevent duplicates + lookup | ⚡⚡⚡ Critical - Every add-to-cart |
| **Discount** | Composite | (type, active, start, end) | Active discount lookup | ⚡⚡ High - Every checkout |
| **Order** | Single | order_status | Status filtering | ⚡⚡ High - Dashboard queries |
| **Inventory** | Unique | product_id | Stock lookup | ⚡⚡⚡ Critical - Every checkout |

---

## Index Maintenance Recommendations

### 1. Monitor Index Usage
```sql
-- Check which indexes are actually used
SELECT
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'rt_mart_db'
ORDER BY TABLE_NAME, SEQ_IN_INDEX;
```

### 2. Analyze Query Performance
```sql
-- Enable slow query log to identify missing indexes
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

### 3. Index Rebuilding
```sql
-- Rebuild indexes to optimize performance (do during low-traffic hours)
OPTIMIZE TABLE Product;
OPTIMIZE TABLE `Order`;
OPTIMIZE TABLE CartItem;
```

### 4. Cardinality Check
- High cardinality columns (many unique values) → Good for indexing
- Low cardinality columns (few unique values) → Less effective

**Examples in RT-MART:**
- ✅ High cardinality: product_id, order_id, user_id, email, order_number
- ⚠️ Medium cardinality: price, created_at, product_type_id
- ❌ Low cardinality: order_status (8 values), is_active (2 values), role (3 values)

**Best Practice:** Use low-cardinality columns as the **first column** in composite indexes only when combined with high-cardinality columns.

---

## Visual Notation Guide

```
┌─────┐  Table/Entity
│     │
└─────┘

  │      Foreign Key Relationship
  ↓      (One-to-Many or One-to-One)

═════    Section Separator

⚡⚡⚡    Critical Performance Impact
⚡⚡      High Performance Impact
⚡       Medium Performance Impact

✅       Validation Passed / Recommended
⚠️       Warning / Low Stock
❌       Error / Not Recommended
```

---

## Summary

The RT-MART database uses a **well-optimized index strategy** with:
- **40+ indexes** across 20+ tables
- **Composite indexes** for complex queries (user history, product filtering)
- **Unique constraints** preventing data duplicates (cart items, discount codes)
- **Strategic single-column indexes** for status filtering and lookups

**Key Performance Patterns:**
1. **Time-based queries**: Composite indexes with created_at as second column
2. **Multi-criteria filtering**: Composite indexes matching WHERE clause column order
3. **Uniqueness enforcement**: Composite unique indexes for business rules
4. **Stock management**: Optimized for high-concurrency checkout operations

