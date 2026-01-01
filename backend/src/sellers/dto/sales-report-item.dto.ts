export class SalesReportItemDto {
  orderDate: string; // 訂單日期 (YYYY-MM-DD HH:mm)
  orderNumber: string; // 訂單編號
  orderStatus: string; // 訂單狀態
  productName: string; // 商品名稱 (from productSnapshot)
  quantity: number; // 銷售數量
  originalPrice: number; // 商品原價
  unitPrice: number; // 實際單價
  subtotal: number; // 小計
  shippingFee: number; // 運費
  discountCode: string | null; // 使用折扣代碼
  paymentMethod: string; // 付款方式
}
