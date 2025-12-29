import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CartItemsService } from '../carts-item/cart-items.service';
import { ShippingAddressesService } from '../shipping-addresses/shipping-addresses.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly cartsService: CartItemsService,
    private readonly shippingAddressesService: ShippingAddressesService,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}
    async createFromSnapshot(
      userId: string,
      cartSnapshot: any,
      createDto: CreateOrderDto,
    ): Promise<Order[]> {
      // Expect cartSnapshot.items with product (snapshot) and quantity
      const items = cartSnapshot.items || [];
      if (items.length === 0) {
        throw new BadRequestException('No items in snapshot');
      }

      // Group by storeId (try to read from product.storeId or product.store?.storeId)
      const itemsByStore = new Map<string, any[]>();
      for (const it of items) {
        const storeId = String(it.product?.storeId || it.product?.store?.storeId || '0');
        if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
        itemsByStore.get(storeId)!.push(it);
      }

      const createdOrders: Order[] = [];

      return await this.dataSource.transaction(async (manager) => {
        for (const [storeId, storeItems] of itemsByStore.entries()) {
          let subtotal = 0;
          for (const item of storeItems) {
            subtotal += Number(item.product?.price || 0) * Number(item.quantity || 1);
          }

          const shippingFee = 60;
          const totalAmount = subtotal + shippingFee;

          const orderNumber = this.generateOrderNumber();

          const order = manager.create(Order, {
            orderNumber,
            userId,
            storeId,
            subtotal,
            shippingFee,
            totalDiscount: 0,
            totalAmount,
            paymentMethod: createDto?.paymentMethod,
            shippingAddressSnapshot: createDto?.shippingAddressSnapshot,
            notes: createDto?.notes,
            orderStatus: OrderStatus.PENDING_PAYMENT,
          });

          const savedOrder = await manager.save(Order, order);

          for (const item of storeItems) {
            const orderItem = manager.create(OrderItem, {
              orderId: savedOrder.orderId,
              productId: item.productId,
              productSnapshot: item.product,
              quantity: item.quantity,
              originalPrice: item.product?.price || 0,
              itemDiscount: 0,
              unitPrice: item.product?.price || 0,
              subtotal: Number(item.product?.price || 0) * Number(item.quantity || 1),
            });

            await manager.save(OrderItem, orderItem);
          }

          createdOrders.push(savedOrder);
        }

        // Optionally clear selected items in cart
        try {
          await this.cartsService.removeSelectedItems(userId);
        } catch (err) {
          // ignore
        }

        return createdOrders;
      });
    }

  async findAll(
    userId: string,
    queryDto: QueryOrderDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (queryDto.status) {
      where.orderStatus = queryDto.status;
    }

    if (queryDto.storeId) {
      where.storeId = queryDto.storeId;
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['store', 'items', 'items.product'],
    });

    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id, userId },
      relations: ['store', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(
    id: string,
    userId: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Validate status transition
    this.validateStatusTransition(order.orderStatus, updateDto.status);

    // Use transaction for status update with inventory changes
    return await this.dataSource.transaction(async (manager) => {
      order.orderStatus = updateDto.status;

      // Update timestamps based on status
      switch (updateDto.status) {
        case OrderStatus.PAID:
          order.paidAt = new Date();
          // Commit reserved inventory
          for (const item of order.items || []) {
            if (item.productId) {
              // commit reserved inventory if implemented
            }
          }
          break;
        case OrderStatus.SHIPPED:
          order.shippedAt = new Date();
          break;
        case OrderStatus.DELIVERED:
          order.deliveredAt = new Date();
          break;
        case OrderStatus.COMPLETED:
          order.completedAt = new Date();
          break;
        case OrderStatus.CANCELLED:
          order.cancelledAt = new Date();
          // Release reserved inventory if implemented
          break;
      }

      return await manager.save(Order, order);
    });
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    return await this.updateStatus(id, userId, {
      status: OrderStatus.CANCELLED,
    });
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.PAID,
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
