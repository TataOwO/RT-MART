import { BaseLoader } from './base.loader';
import { ShippingAddress } from '../../shipping-addresses/entities/shipping-address.entity';

export class ShippingAddressLoader extends BaseLoader<ShippingAddress> {
  protected entityName = 'ShippingAddress';
  protected jsonFileName = 'ecommerce_shipping_address_data.json';
  protected entityClass = ShippingAddress;

  protected validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<ShippingAddress | null> {
    try {
      if (!data.user_id) {
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

      if (
        typeof data.recipient_name !== 'string' ||
        typeof data.phone !== 'string' ||
        typeof data.city !== 'string' ||
        typeof data.address_line1 !== 'string'
      ) {
        return Promise.resolve(null);
      }

      const address = new ShippingAddress();
      address.userId = userId;
      address.recipientName = data.recipient_name;
      address.phone = data.phone;
      address.city = data.city;
      address.district =
        typeof data.district === 'string' ? data.district : null;
      address.postalCode =
        typeof data.postal_code === 'string' ? data.postal_code : null;
      address.addressLine1 = data.address_line1;
      address.addressLine2 =
        typeof data.address_line2 === 'string' ? data.address_line2 : null;
      address.isDefault =
        typeof data.is_default === 'boolean' ? data.is_default : false;

      return Promise.resolve(address);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: ShippingAddress): Promise<boolean> {
    const existing = await this.entityManager.findOne(ShippingAddress, {
      where: {
        userId: entity.userId,
        recipientName: entity.recipientName,
        addressLine1: entity.addressLine1,
      },
    });
    return existing !== null;
  }
}
