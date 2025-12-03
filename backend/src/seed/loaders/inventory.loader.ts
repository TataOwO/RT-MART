import { BaseLoader } from './base.loader';
import { Inventory } from '../../inventory/entities/inventory.entity';

export class InventoryLoader extends BaseLoader<Inventory> {
  protected entityName = 'Inventory';
  protected jsonFileName = 'ecommerce_inventory_data.json';
  protected entityClass = Inventory;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<Inventory | null> {
    try {
      if (!data.product_id) {
        return Promise.resolve(null);
      }

      // 從 IdMapping 取得實際的 product_id
      const productId = this.idMapping.getMapping(
        'Product',
        typeof data.product_id === 'number'
          ? data.product_id
          : Number(data.product_id),
      );
      if (!productId) {
        return Promise.resolve(null);
      }

      const inventory = new Inventory();
      inventory.productId = productId;
      inventory.quantity =
        typeof data.quantity === 'number'
          ? data.quantity
          : Number(data.quantity) || 0;
      inventory.reserved =
        typeof data.reserved === 'number'
          ? data.reserved
          : Number(data.reserved) || 0;

      return Promise.resolve(inventory);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: Inventory): Promise<boolean> {
    const existing = await this.entityManager.findOne(Inventory, {
      where: { productId: entity.productId },
    });
    return existing !== null;
  }
}
