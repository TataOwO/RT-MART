import api from './api';
import {
  DashboardData,
  SalesPeriod,
  StoreInfo,
  SellerProduct,
  ProductFormData,
  ProductStatus,
  RecentOrder,
  Discount,
  DiscountFormData
} from '@/types/seller';

/**
 * 賣家服務層
 * 提供所有賣家相關的 API 調用
 */

// ========== Dashboard ==========

/**
 * 獲取 Dashboard 數據
 */
export const getDashboardData = async (period: SalesPeriod): Promise<DashboardData> => {
  // TODO: 替換為真實 API
  // return api.get(`/seller/dashboard?period=${period}`);

  // Mock 數據
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        revenue: period === 'day' ? 15000 : period === 'week' ? 50000 : 180000,
        orderCount: period === 'day' ? 20 : period === 'week' ? 120 : 450,
        chartData: generateMockChartData(period),
        popularProducts: MOCK_POPULAR_PRODUCTS,
        recentOrders: MOCK_RECENT_ORDERS
      });
    }, 500);
  });
};

// ========== Store Settings ==========

/**
 * 獲取商店資訊
 */
export const getStoreInfo = async (): Promise<StoreInfo> => {
  // TODO: return api.get('/seller/store');
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_STORE_INFO), 300);
  });
};

/**
 * 更新商店資訊
 */
export const updateStoreInfo = async (data: StoreInfo): Promise<void> => {
  // TODO: return api.put('/seller/store', data);
  console.log('Updating store info:', data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

// ========== Products ==========

/**
 * 獲取商品列表
 */
export const getProducts = async (): Promise<SellerProduct[]> => {
  // TODO: return api.get('/seller/products');
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PRODUCTS), 500);
  });
};

/**
 * 獲取單個商品
 */
export const getProduct = async (id: string): Promise<SellerProduct> => {
  // TODO: return api.get(`/seller/products/${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      if (!product) {
        reject(new Error('Product not found'));
      } else {
        resolve(product);
      }
    }, 300);
  });
};

/**
 * 創建商品
 */
export const createProduct = async (data: ProductFormData): Promise<void> => {
  // TODO: return api.post('/seller/products', data);
  console.log('Creating product:', data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 更新商品
 */
export const updateProduct = async (id: string, data: ProductFormData): Promise<void> => {
  // TODO: return api.put(`/seller/products/${id}`, data);
  console.log('Updating product:', id, data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 刪除商品
 */
export const deleteProduct = async (id: string): Promise<void> => {
  // TODO: return api.delete(`/seller/products/${id}`);
  console.log('Deleting product:', id);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 更新商品狀態（上架/下架）
 */
export const updateProductStatus = async (id: string, status: ProductStatus): Promise<void> => {
  // TODO: return api.patch(`/seller/products/${id}/status`, { status });
  console.log('Updating product status:', id, status);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ========== Orders ==========

/**
 * 獲取訂單列表
 */
export const getOrders = async (status?: string): Promise<RecentOrder[]> => {
  // TODO: return api.get('/seller/orders', { params: { status } });
  return new Promise((resolve) => {
    setTimeout(() => {
      if (status && status !== 'all') {
        resolve(MOCK_RECENT_ORDERS.filter(order => order.status === status));
      } else {
        resolve(MOCK_RECENT_ORDERS);
      }
    }, 500);
  });
};

/**
 * 獲取訂單詳情
 */
export const getOrderDetail = async (id: string): Promise<any> => {
  // TODO: return api.get(`/seller/orders/${id}`);
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id,
      orderNumber: 'ORD20250101001',
      // ... 其他訂單詳情
    }), 300);
  });
};

/**
 * 更新訂單狀態
 */
export const updateOrderStatus = async (id: string, status: string, note?: string): Promise<void> => {
  // TODO: return api.patch(`/seller/orders/${id}/status`, { status, note });
  console.log('Updating order status:', id, status, note);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 回覆買家評價
 */
export const replyToReview = async (orderId: string, reviewId: string, reply: string): Promise<void> => {
  // TODO: return api.post(`/seller/orders/${orderId}/reviews/${reviewId}/reply`, { reply });
  console.log('Replying to review:', orderId, reviewId, reply);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ========== Discounts ==========

/**
 * 獲取折扣列表
 */
export const getDiscounts = async (): Promise<Discount[]> => {
  // TODO: return api.get('/seller/discounts');
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DISCOUNTS), 500);
  });
};

/**
 * 創建折扣
 */
export const createDiscount = async (data: DiscountFormData): Promise<void> => {
  // TODO: return api.post('/seller/discounts', data);
  console.log('Creating discount:', data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 更新折扣
 */
export const updateDiscount = async (id: string, data: DiscountFormData): Promise<void> => {
  // TODO: return api.put(`/seller/discounts/${id}`, data);
  console.log('Updating discount:', id, data);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * 刪除折扣
 */
export const deleteDiscount = async (id: string): Promise<void> => {
  // TODO: return api.delete(`/seller/discounts/${id}`);
  console.log('Deleting discount:', id);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * 更新折扣狀態
 */
export const updateDiscountStatus = async (id: string, active: boolean): Promise<void> => {
  // TODO: return api.patch(`/seller/discounts/${id}/status`, { active });
  console.log('Updating discount status:', id, active);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ========== Mock Data ==========

const MOCK_STORE_INFO: StoreInfo = {
  storeName: '優質商店',
  storeDescription: '提供高品質商品，誠信經營',
  contactPhone: '0912345678',
  email: 'store@example.com',
  address: '台北市大安區忠孝東路三段100號',
  bankAccount: '1234567890123456'
};

const MOCK_PRODUCTS: SellerProduct[] = [
  {
    id: '1',
    name: '無線藍牙耳機',
    description: '高音質無線藍牙耳機，支援主動降噪功能',
    price: 1299,
    stock: 50,
    categoryId: '1',
    status: 'active',
    images: ['https://picsum.photos/400/400?random=1'],
    createdAt: '2025-01-01'
  },
  {
    id: '2',
    name: '運動水壺',
    description: '大容量運動水壺，保溫保冷',
    price: 299,
    stock: 0,
    categoryId: '5',
    status: 'inactive',
    images: ['https://picsum.photos/400/400?random=2'],
    createdAt: '2025-01-02'
  },
  {
    id: '3',
    name: '智能手環',
    description: '多功能智能手環，心率監測、睡眠追蹤',
    price: 899,
    stock: 120,
    categoryId: '1',
    status: 'active',
    images: ['https://picsum.photos/400/400?random=3'],
    createdAt: '2025-01-05'
  },
  {
    id: '4',
    name: '瑜珈墊',
    description: '加厚防滑瑜珈墊，環保材質',
    price: 599,
    stock: 35,
    categoryId: '5',
    status: 'active',
    images: ['https://picsum.photos/400/400?random=4'],
    createdAt: '2025-01-08'
  }
];

const MOCK_POPULAR_PRODUCTS = [
  { id: '1', name: '無線藍牙耳機', image: 'https://picsum.photos/100/100?random=1', salesCount: 50, revenue: 64950 },
  { id: '3', name: '智能手環', image: 'https://picsum.photos/100/100?random=3', salesCount: 42, revenue: 37758 },
  { id: '4', name: '瑜珈墊', image: 'https://picsum.photos/100/100?random=4', salesCount: 35, revenue: 20965 },
  { id: '2', name: '運動水壺', image: 'https://picsum.photos/100/100?random=2', salesCount: 28, revenue: 8372 }
];

const MOCK_RECENT_ORDERS: RecentOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD20250115001',
    buyerName: '王小明',
    itemCount: 2,
    totalAmount: 1598,
    status: 'paid',
    createdAt: '2025-01-15 14:30'
  },
  {
    id: '2',
    orderNumber: 'ORD20250115002',
    buyerName: '李小華',
    itemCount: 1,
    totalAmount: 899,
    status: 'processing',
    createdAt: '2025-01-15 13:20'
  },
  {
    id: '3',
    orderNumber: 'ORD20250115003',
    buyerName: '張大明',
    itemCount: 3,
    totalAmount: 2197,
    status: 'shipped',
    createdAt: '2025-01-15 11:45'
  },
  {
    id: '4',
    orderNumber: 'ORD20250114001',
    buyerName: '陳小美',
    itemCount: 1,
    totalAmount: 599,
    status: 'delivered',
    createdAt: '2025-01-14 16:10'
  },
  {
    id: '5',
    orderNumber: 'ORD20250114002',
    buyerName: '林志明',
    itemCount: 2,
    totalAmount: 1798,
    status: 'completed',
    createdAt: '2025-01-14 10:30'
  }
];

const MOCK_DISCOUNTS: Discount[] = [
  {
    id: '1',
    name: '新年特惠',
    type: 'special',
    description: '新年限時優惠，全館商品享折扣',
    categoryId: 'all',
    discountRate: 15,
    maxDiscount: 500,
    minPurchase: 1000,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    usageLimit: 100,
    usedCount: 50,
    isActive: true
  },
  {
    id: '2',
    name: '電子產品折扣',
    type: 'special',
    description: '電子產品類別專屬折扣',
    categoryId: '1',
    discountRate: 10,
    maxDiscount: 300,
    minPurchase: 500,
    startDate: '2025-01-10',
    endDate: '2025-01-25',
    usageLimit: 50,
    usedCount: 12,
    isActive: true
  },
  {
    id: '3',
    name: '運動用品優惠',
    type: 'special',
    description: '運動休閒類商品限時優惠',
    categoryId: '5',
    discountRate: 20,
    maxDiscount: 200,
    minPurchase: 300,
    startDate: '2024-12-20',
    endDate: '2025-01-10',
    usageLimit: 30,
    usedCount: 30,
    isActive: false
  }
];

/**
 * 生成圖表數據的輔助函數
 */
function generateMockChartData(period: SalesPeriod) {
  const labels = period === 'day' ?
    Array.from({length: 24}, (_, i) => `${i}:00`) :
    period === 'week' ?
    ['週一', '週二', '週三', '週四', '週五', '週六', '週日'] :
    Array.from({length: 30}, (_, i) => `${i+1}日`);

  return labels.map(label => ({
    label,
    value: Math.floor(Math.random() * 10000) + 5000
  }));
}

export default {
  getDashboardData,
  getStoreInfo,
  updateStoreInfo,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  replyToReview,
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  updateDiscountStatus
};
