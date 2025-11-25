import { BaseLoader } from './base.loader';
import { Cart } from '../../carts/entities/cart.entity';

export class CartLoader extends BaseLoader<Cart> {
  protected entityName = 'Cart';
  protected jsonFileName = 'ecommerce_cart_data.json';
  protected entityClass = Cart;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Cart | null> {
    try {
      if (!data.script_cart_id || !data.user_id) {
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

      const cart = new Cart();
      cart.userId = userId;

      return Promise.resolve(cart);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Cart): Promise<boolean> {
    const existing = await this.entityManager.findOne(Cart, {
      where: { userId: entity.userId },
    });
    return existing !== null;
  }

  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }>;
  }> {
    const result = await super.load(force);

    // 更新 ID 映射
    if (result.success > 0) {
      const jsonData = this.loadJson();
      const carts = await this.entityManager.find(Cart, {
        order: { cartId: 'DESC' },
        take: result.success,
      });

      for (const data of jsonData) {
        if (data.script_cart_id) {
          const userId = this.idMapping.getMapping(
            'User',
            typeof data.user_id === 'number'
              ? data.user_id
              : Number(data.user_id),
          );
          if (userId) {
            const cart = carts.find((c) => c.userId === userId);
            if (cart) {
              this.idMapping.setMapping(
                'Cart',
                typeof data.script_cart_id === 'number'
                  ? data.script_cart_id
                  : Number(data.script_cart_id),
                cart.cartId,
              );
            }
          }
        }
      }
    }

    return result;
  }
}
