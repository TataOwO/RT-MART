import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './entities/seller.entity';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { QuerySellerDto } from './dto/query-seller.dto';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductType } from '../product-types/entities/product-type.entity';

export interface DashboardData {
  revenue: number;
  orderCount: number;
  chartData: ChartDataPoint[];
  categoryData: CategoryDataPoint[];
  popularProducts: PopularProduct[];
  recentOrders: RecentOrderData[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface CategoryDataPoint {
  label: string;
  value: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  image: string | null;
  salesCount: number;
  revenue: number;
}

export interface RecentOrderData {
  id: string;
  orderNumber: string;
  buyerName: string;
  itemCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
    private readonly usersService: UsersService,
  ) {}

  async create(createSellerDto: CreateSellerDto): Promise<Seller> {
    if (!createSellerDto.userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.usersService.findOne(createSellerDto.userId);

    if (!user || user.role == UserRole.ADMIN || user.role == UserRole.SELLER) {
      throw new BadRequestException('Only buyers can become sellers');
    }

    const existingSeller = await this.findByUserId(createSellerDto.userId);

    // If existing seller found
    if (existingSeller) {
      // If already verified, can't apply again
      if (existingSeller.verified) {
        throw new ConflictException('您已經是賣家了');
      }

      // If rejected, check if 30 days have passed
      if (existingSeller.rejectedAt) {
        const daysSinceRejection = Math.floor(
          (Date.now() - new Date(existingSeller.rejectedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysSinceRejection < 30) {
          throw new BadRequestException(
            `您的申請已被拒絕，請於 ${30 - daysSinceRejection} 天後重新申請`,
          );
        }

        // Reuse existing record - reset status
        existingSeller.verified = false;
        existingSeller.verifiedAt = null;
        existingSeller.verifiedBy = null;
        existingSeller.rejectedAt = null;
        existingSeller.bankAccountReference =
          createSellerDto.bankAccountReference || null;
        existingSeller.updatedAt = new Date();

        return await this.sellerRepository.save(existingSeller);
      }

      // Already has pending application
      throw new ConflictException('您已經有一個待審核的申請，請等待審核結果');
    }

    // Create new seller
    const seller = this.sellerRepository.create(createSellerDto);
    const savedSeller = await this.sellerRepository.save(seller);

    return savedSeller;
  }

  async findAll(
    queryDto: QuerySellerDto,
  ): Promise<{ data: Seller[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = this.sellerRepository
      .createQueryBuilder('seller')
      .leftJoinAndSelect('seller.user', 'user')
      .orderBy('seller.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (queryDto.loginId) {
      query.andWhere('user.loginId = :loginId', { loginId: queryDto.loginId });
    }

    // Filter by status
    if (queryDto.status) {
      if (queryDto.status === 'pending') {
        query.andWhere('seller.verified = :verified', { verified: false });
        query.andWhere('seller.rejectedAt IS NULL');
      } else if (queryDto.status === 'approved') {
        query.andWhere('seller.verified = :verified', { verified: true });
      } else if (queryDto.status === 'rejected') {
        query.andWhere('seller.rejectedAt IS NOT NULL');
      }
    }

    // Legacy support for verified parameter
    if (queryDto.verified !== undefined) {
      query.andWhere('seller.verified = :verified', {
        verified: queryDto.verified,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(sellerId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { sellerId: sellerId },
      relations: ['user', 'verifier'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return seller;
  }

  async findByUserId(userId: string): Promise<Seller | null> {
    return await this.sellerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(
    sellerId: string,
    updateSellerDto: UpdateSellerDto,
  ): Promise<Seller> {
    const seller = await this.findOne(sellerId);
    Object.assign(seller, updateSellerDto);
    return await this.sellerRepository.save(seller);
  }

  async verify(sellerId: string, verifier: string) {
    const seller = await this.findOne(sellerId);
    const user = await this.usersService.findOne(seller.userId);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    if (seller.rejectedAt) {
      throw new ConflictException('Seller application has been rejected');
    }

    user.role = UserRole.SELLER;
    seller.verified = true;
    seller.verifiedAt = new Date();
    seller.verifiedBy = verifier;
    seller.updatedAt = new Date();

    // 创建默认商店
    const storeName = `${user.name}'s Store`;

    const defaultStore = this.storeRepository.create({
      sellerId: seller.sellerId,
      storeName: storeName,
      storeDescription: 'Default store created upon seller verification',
      storeAddress: null,
      storeEmail: null,
      storePhone: null,
      averageRating: 0,
      totalRatings: 0,
    });

    await this.sellerRepository.save(seller);
    await this.userRepository.save(user);
    return await this.storeRepository.save(defaultStore);
  }

  async reject(sellerId: string): Promise<Seller> {
    const seller = await this.findOne(sellerId);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    if (seller.rejectedAt) {
      throw new ConflictException('Seller is already rejected');
    }

    seller.rejectedAt = new Date();
    seller.updatedAt = new Date();

    // TODO: Send rejection email via NodeMail (future implementation)

    return await this.sellerRepository.save(seller);
  }

  async remove(sellerId: string): Promise<void> {
    const seller = await this.findOne(sellerId);
    if (seller.verified) {
      throw new ConflictException('Seller is already verified'); //already have a store
    }

    await this.sellerRepository.remove(seller);
  }

  // ========== Dashboard Methods ==========

  async getDashboardData(
    userId: string,
    period: 'day' | 'week' | 'month',
  ): Promise<DashboardData> {
    // Get seller's store
    const seller = await this.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const store = await this.storeRepository.findOne({
      where: { sellerId: seller.sellerId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const storeId = store.storeId;

    // Get date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Fetch all dashboard data in parallel
    const [revenue, orderCount, chartData, categoryData, popularProducts, recentOrders] =
      await Promise.all([
        this.getRevenue(storeId, startDate),
        this.getOrderCount(storeId, startDate),
        this.getChartData(storeId, startDate, period),
        this.getCategoryData(storeId, startDate),
        this.getPopularProducts(storeId, startDate),
        this.getRecentOrders(storeId),
      ]);

    return {
      revenue,
      orderCount,
      chartData,
      categoryData,
      popularProducts,
      recentOrders,
    };
  }

  private async getRevenue(storeId: string, startDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getOrderCount(storeId: string, startDate: Date): Promise<number> {
    return await this.orderRepository
      .createQueryBuilder('order')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      })
      .getCount();
  }

  private async getChartData(
    storeId: string,
    startDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<ChartDataPoint[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.createdAt', 'createdAt')
      .addSelect('order.totalAmount', 'totalAmount')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      })
      .getRawMany();

    // Group by time period
    const dataMap = new Map<string, number>();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      let label: string;

      if (period === 'day') {
        label = `${date.getHours()}:00`;
      } else if (period === 'week') {
        const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        label = days[date.getDay()];
      } else {
        label = `${date.getDate()}日`;
      }

      const current = dataMap.get(label) || 0;
      dataMap.set(label, current + parseFloat(order.totalAmount));
    });

    // Generate labels based on period
    let labels: string[] = [];
    if (period === 'day') {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (period === 'week') {
      labels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    } else {
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
    }

    return labels.map((label) => ({
      label,
      value: dataMap.get(label) || 0,
    }));
  }

  private async getCategoryData(
    storeId: string,
    startDate: Date,
  ): Promise<CategoryDataPoint[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.productType', 'productType')
      .select('productType.typeName', 'label')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'value')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      })
      .groupBy('productType.productTypeId')
      .getRawMany();

    return result.map((r) => ({
      label: r.label || '未分類',
      value: parseFloat(r.value || '0'),
    }));
  }

  private async getPopularProducts(
    storeId: string,
    startDate: Date,
  ): Promise<PopularProduct[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .leftJoin('product.images', 'image')
      .select('product.productId', 'id')
      .addSelect('product.productName', 'name')
      .addSelect('MIN(image.imageUrl)', 'image')
      .addSelect('SUM(item.quantity)', 'salesCount')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'revenue')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.orderStatus IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      })
      .groupBy('product.productId')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      name: r.name,
      image: r.image || null,
      salesCount: parseInt(r.salesCount || '0'),
      revenue: parseFloat(r.revenue || '0'),
    }));
  }

  private async getRecentOrders(storeId: string): Promise<RecentOrderData[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.storeId = :storeId', { storeId })
      .orderBy('order.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return orders.map((order) => ({
      id: order.orderId,
      orderNumber: order.orderNumber,
      buyerName: order.user?.name || 'Unknown',
      itemCount: order.items?.length || 0,
      totalAmount: parseFloat(order.totalAmount.toString()),
      status: order.orderStatus,
      createdAt: order.createdAt.toISOString(),
    }));
  }
}
