/*
 - Order Service - Mock API
 - 訂單服務
 */

import type {
  CreateOrderRequest,
  CreateMultipleOrdersResponse,
  Order,
  OrderListItem,
  GetOrdersParams,
  GetOrdersResponse,
} from "@/types/order";
import type { ApiResponse } from "@/types/user";

// 模擬網絡延遲
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Service 函數
// ============================================

/*
 - 建立訂單（多商店版本）
 - TODO: 替換為 POST /api/v1/orders
 -
 - 後端預期行為：
 - 1. 驗證地址屬於當前用戶
 - 2. 從購物車獲取商品並按 storeId 分組
 - 3. 為每個商店建立獨立訂單
 - 4. 驗證商品庫存
 - 5. 計算各訂單金額
 - 6. 扣減庫存（或標記為 reserved）
 - 7. 返回所有訂單資訊
 -
 - 注意：後端目前僅返回第一個訂單（需要修改）
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateMultipleOrdersResponse> => {
  console.log("[Mock API] Create order:", orderData);
  await delay(800);

  // TODO: 替換為真實 API 調用
  // POST /api/v1/orders
  // Body: { addressId, paymentMethod, note }
  // 後端會自動從購物車獲取商品並按商店分組創建多個訂單

  // Mock: 模擬返回多個訂單（實際應該由後端決定）
  // 這裡假設購物車有 2 個商店的商品
  const timestamp = Date.now();
  const mockOrders = [
    {
      orderId: `ORD${timestamp}-1`,
      storeId: "store-1",
      storeName: "測試商店 A",
      totalAmount: 580,
    },
    {
      orderId: `ORD${timestamp}-2`,
      storeId: "store-2",
      storeName: "測試商店 B",
      totalAmount: 720,
    },
  ];

  return {
    success: true,
    message: `成功建立 ${mockOrders.length} 筆訂單`,
    orders: mockOrders,
    totalAmount: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
  };
};

// ============================================
// User Center 相關服務函數
// ============================================

/**
 * Mock 訂單資料（用於訂單列表和詳情）
 */
const mockOrdersData: Order[] = [
  {
    orderId: 'ord_001',
    orderNumber: 'ORD20250101001',
    userId: 'user_001',
    storeId: 'store_001',
    storeName: '科技3C館',
    status: 'completed',
    items: [
      {
        id: 'item_001',
        productId: 'prod_001',
        productName: 'iPhone 15 Pro',
        productImage: 'https://via.placeholder.com/150',
        quantity: 1,
        price: 35900,
      },
    ],
    shippingAddress: {
      id: 'addr_001',
      recipientName: '王小明',
      phone: '0912345678',
      city: '台北市',
      district: '大安區',
      postalCode: '106',
      detail: '忠孝東路三段 100 號',
      isDefault: true,
    },
    paymentMethod: 'credit_card',
    note: '請在下午送達',
    subtotal: 35900,
    shipping: 0,
    discount: 0,
    totalAmount: 35900,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-05T10:00:00Z',
    paidAt: '2025-01-01T10:05:00Z',
    shippedAt: '2025-01-02T09:00:00Z',
    deliveredAt: '2025-01-03T14:30:00Z',
    completedAt: '2025-01-05T10:00:00Z',
  },
  {
    orderId: 'ord_002',
    orderNumber: 'ORD20250105002',
    userId: 'user_001',
    storeId: 'store_002',
    storeName: '時尚服飾店',
    status: 'shipped',
    items: [
      {
        id: 'item_002',
        productId: 'prod_002',
        productName: '休閒外套',
        productImage: 'https://via.placeholder.com/150',
        quantity: 2,
        price: 1299,
      },
      {
        id: 'item_003',
        productId: 'prod_003',
        productName: '牛仔褲',
        productImage: 'https://via.placeholder.com/150',
        quantity: 1,
        price: 899,
      },
    ],
    shippingAddress: {
      id: 'addr_001',
      recipientName: '王小明',
      phone: '0912345678',
      city: '台北市',
      district: '大安區',
      postalCode: '106',
      detail: '忠孝東路三段 100 號',
      isDefault: true,
    },
    paymentMethod: 'credit_card',
    subtotal: 3497,
    shipping: 60,
    discount: 0,
    totalAmount: 3557,
    createdAt: '2025-01-05T14:20:00Z',
    updatedAt: '2025-01-06T09:00:00Z',
    paidAt: '2025-01-05T14:25:00Z',
    shippedAt: '2025-01-06T09:00:00Z',
  },
  {
    orderId: 'ord_003',
    orderNumber: 'ORD20250108003',
    userId: 'user_001',
    storeId: 'store_003',
    storeName: '居家生活館',
    status: 'pending_payment',
    items: [
      {
        id: 'item_004',
        productId: 'prod_004',
        productName: '北歐風格抱枕',
        productImage: 'https://via.placeholder.com/150',
        quantity: 4,
        price: 299,
      },
    ],
    shippingAddress: {
      id: 'addr_002',
      recipientName: '李小華',
      phone: '0923456789',
      city: '新北市',
      district: '板橋區',
      postalCode: '220',
      detail: '文化路一段 50 號',
      isDefault: false,
    },
    paymentMethod: 'bank_transfer',
    note: '',
    subtotal: 1196,
    shipping: 80,
    discount: 100,
    totalAmount: 1176,
    createdAt: '2025-01-08T16:30:00Z',
    updatedAt: '2025-01-08T16:30:00Z',
  },
];

/**
 * 獲取訂單列表
 * TODO: 替換為 GET /api/v1/orders
 */
export const getOrders = async (params?: GetOrdersParams): Promise<GetOrdersResponse> => {
  console.log('[Mock API] Get orders:', params);
  await delay(400);

  // 模擬篩選
  let filteredOrders = [...mockOrdersData];

  if (params?.status) {
    filteredOrders = mockOrdersData.filter((o) => o.status === params.status);
  }

  // 模擬分頁
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedOrders = filteredOrders.slice(start, end);

  // 轉換為列表項目格式
  const orderListItems: OrderListItem[] = paginatedOrders.map((order) => ({
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
  }));

  return {
    orders: orderListItems,
    total: filteredOrders.length,
    page,
    limit,
    totalPages: Math.ceil(filteredOrders.length / limit),
  };
};

/**
 * 獲取訂單詳情
 * TODO: 替換為 GET /api/v1/orders/:orderId
 */
export const getOrderDetail = async (orderId: string): Promise<Order> => {
  console.log('[Mock API] Get order detail:', orderId);
  await delay(400);

  // Mock 實作：從 mock 資料中查找
  const order = mockOrdersData.find((o) => o.orderId === orderId);

  if (!order) {
    throw new Error('訂單不存在');
  }

  return order;
};

/**
 * 取消訂單
 * TODO: 替換為 PUT /api/v1/orders/:orderId/cancel
 */
export const cancelOrder = async (orderId: string): Promise<ApiResponse> => {
  console.log('[Mock API] Cancel order:', orderId);
  await delay(400);

  // Mock 實作：找到訂單並更新狀態
  const order = mockOrdersData.find((o) => o.orderId === orderId);

  if (!order) {
    throw new Error('訂單不存在');
  }

  // 檢查訂單狀態是否可以取消
  if (!['pending_payment', 'paid', 'processing'].includes(order.status)) {
    throw new Error('此訂單狀態無法取消');
  }

  // 更新訂單狀態
  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  return {
    success: true,
    message: '訂單已取消',
  };
};

/**
 * 確認收貨
 * TODO: 替換為 PUT /api/v1/orders/:orderId/confirm
 */
export const confirmDelivery = async (orderId: string): Promise<ApiResponse> => {
  console.log('[Mock API] Confirm delivery:', orderId);
  await delay(400);

  // Mock 實作：找到訂單並更新狀態
  const order = mockOrdersData.find((o) => o.orderId === orderId);

  if (!order) {
    throw new Error('訂單不存在');
  }

  // 檢查訂單狀態是否可以確認收貨
  if (!['shipped', 'delivered'].includes(order.status)) {
    throw new Error('此訂單狀態無法確認收貨');
  }

  // 更新訂單狀態
  order.status = 'completed';
  order.completedAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  return {
    success: true,
    message: '已確認收貨',
  };
};
