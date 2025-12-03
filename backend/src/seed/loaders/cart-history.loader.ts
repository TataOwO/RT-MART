import { BaseLoader } from './base.loader';
import { CartHistory } from '../../cart-history/entities/cart-history.entity';
import { DataMapper } from '../utils/data-mapper';

export class CartHistoryLoader extends BaseLoader<CartHistory> {
  protected entityName = 'CartHistory';
  protected jsonFileName = 'ecommerce_cart_history_data.json';
  protected entityClass = CartHistory;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<CartHistory | null> {
    try {
      if (!data.user_id || !data.cart_snapshot) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 user_id
      const userId = this.idMapping.getMapping(
        'User',
        typeof data.user_id === 'number' ? data.user_id : Number(data.user_id),
      );
      if (!userId) {
        return Promise.resolve(null);
      }

      // 解析 cart_snapshot（應該是 JSON 物件）
      let cartSnapshot: object;
      if (typeof data.cart_snapshot === 'string') {
        const parsed: unknown = DataMapper.parseJson(data.cart_snapshot);
        if (!parsed || typeof parsed !== 'object' || parsed === null) {
          return Promise.resolve(null);
        }
        cartSnapshot = parsed;
      } else if (
        typeof data.cart_snapshot === 'object' &&
        data.cart_snapshot !== null
      ) {
        cartSnapshot = data.cart_snapshot;
      } else {
        return Promise.resolve(null);
      }

      const cartHistory = new CartHistory();
      cartHistory.userId = userId;
      cartHistory.cartSnapshot = cartSnapshot;
      cartHistory.itemCount =
        typeof data.item_count === 'number'
          ? data.item_count
          : Number(data.item_count) || 0;
      cartHistory.orderIds = Array.isArray(data.order_ids)
        ? (data.order_ids as string[])
        : null;

      return Promise.resolve(cartHistory);
    } catch {
      return Promise.resolve(null);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async checkExists(entity: CartHistory): Promise<boolean> {
    // 使用 user_id + created_at 組合檢查（但 created_at 是自動生成的，所以只檢查 user_id）
    // 實際上 CartHistory 沒有唯一約束，所以這裡只做簡單檢查
    // 由於沒有唯一約束，這裡返回 false 允許插入
    // _entity 參數是基類要求的，但在這個實現中不需要使用
    return Promise.resolve(false);
  }
}
