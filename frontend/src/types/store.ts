// Store related types
export interface Store {
  id: string;
  name: string;
  avatar: string;
  productCount: number;
  rating: number;
  totalRatings: number;
  address: string;
  email: string;
  phone: string;
  description: string;
  joinDate: string;
}

/**
 * 取得商店詳情的 API 回應
 */
export interface GetStoreResponse {
  success: boolean;
  message?: string;
  store: Store;
}

/**
 * 後端 API 原始回應格式 (未來整合時使用)
 * 對應 GET /api/stores/:id
 */
export interface StoreApiResponse {
  storeId: string;
  storeName: string;
  storeDescription: string;
  storeAddress: string;
  storeEmail: string;
  storePhone: string;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  storeAvatar?: string;
  productCount?: number;
}
