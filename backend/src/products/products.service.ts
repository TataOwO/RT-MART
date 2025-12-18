import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StoresService } from '../stores/stores.service';

import { SpecialDiscount } from '../discounts/entities/special-discount.entity';

import { ProductType } from '../product-types/entities/product-type.entity';
import { ProductTypesService } from '../product-types/product-types.service';

export interface EnrichedProduct extends Product {
  originalPrice: number;
  currentPrice: number;
  discountRate: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
    private readonly storesService: StoresService,
    private readonly productTypesService: ProductTypesService,
  ) {}

  async findStorefront(
    queryDto: QueryProductDto,
  ): Promise<{ data: EnrichedProduct[]; total: number }> {
    // console.log(queryDto, '=>', queryDto.productTypeId);
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    // Step 1: Query for IDs and Discount Info with Filtering
    // This query handles filtering, sorting, and pagination
    const subQueryBuilder =
      this.productRepository.createQueryBuilder('product');

    // Only join tables needed for filtering/sorting
    subQueryBuilder
      .leftJoin(
        SpecialDiscount,
        'discount',
        'discount.storeId = product.storeId AND (discount.productTypeId IS NULL OR discount.productTypeId = product.productTypeId)',
      )
      .leftJoin(
        'discount.discount',
        'discountInfo',
        'discountInfo.isActive = true AND discountInfo.startDatetime <= NOW() AND discountInfo.endDatetime >= NOW()',
      );

    // --- Sorting ---
    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder =
      (queryDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    // Select ID and Max Discount Rate and Sort Column
    subQueryBuilder
      .select('product.productId', 'id')
      .addSelect('MAX(discount.discountRate)', 'maxDiscountRate')
      .groupBy('product.productId');

    if (sortBy === 'price') {
      const priceCalc =
        'MAX(product.price) * (1 - COALESCE(MAX(discount.discountRate), 0))';
      subQueryBuilder.addSelect(priceCalc, 'sortPrice');
      subQueryBuilder.addOrderBy('sortPrice', sortOrder);
    } else {
      // For strict mode, we should use an aggregate or include in GROUP BY
      // Since productId is the primary key, product.any_column is functionally dependent on it
      // but some DB modes still complain. Using MAX() is a safe workaround for non-aggregate columns.
      subQueryBuilder.addSelect(`MAX(product.${sortBy})`, 'sortVal');
      subQueryBuilder.addOrderBy('sortVal', sortOrder);
    }

    // --- Filters ---
    if (queryDto.storeId) {
      subQueryBuilder.andWhere('product.storeId = :storeId', {
        storeId: queryDto.storeId,
      });
    }

    if (queryDto.productTypeId) {
      const typeIds = await this.productTypesService.getDescendantIds(
        queryDto.productTypeId,
      );

      subQueryBuilder.andWhere('product.productTypeId IN (:...typeIds)', {
        typeIds,
      });
    }

    const keyword = queryDto.keyword || queryDto.search;
    if (keyword) {
      subQueryBuilder
        .leftJoin('product.productType', 'pt_search')
        .andWhere(
          '(product.productName LIKE :keyword OR pt_search.typeName LIKE :keyword)',
          {
            keyword: `%${keyword}%`,
          },
        );
    }

    if (queryDto.minRating) {
      subQueryBuilder.andWhere('product.averageRating >= :minRating', {
        minRating: parseFloat(queryDto.minRating),
      });
    }

    // --- Price Filtering (HAVING) ---
    const effectivePrice =
      'MAX(product.price) * (1 - COALESCE(MAX(discount.discountRate), 0))';

    if (queryDto.minPrice && queryDto.maxPrice) {
      subQueryBuilder.having(
        `${effectivePrice} >= :minPrice AND ${effectivePrice} <= :maxPrice`,
        {
          minPrice: parseFloat(queryDto.minPrice),
          maxPrice: parseFloat(queryDto.maxPrice),
        },
      );
    } else if (queryDto.minPrice) {
      subQueryBuilder.having(`${effectivePrice} >= :minPrice`, {
        minPrice: parseFloat(queryDto.minPrice),
      });
    } else if (queryDto.maxPrice) {
      subQueryBuilder.having(`${effectivePrice} <= :maxPrice`, {
        maxPrice: parseFloat(queryDto.maxPrice),
      });
    }

    // --- Total Count (Before Pagination) ---
    // We need to count the raw results because of GROUP BY
    const countResult = await subQueryBuilder.getRawMany();
    const total = countResult.length;

    // --- Pagination ---
    subQueryBuilder.limit(limit).offset(skip);
    const paginatedResults = await subQueryBuilder.getRawMany();

    if (paginatedResults.length === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Fetch Full Data for selected IDs
    const productIds = paginatedResults.map((r) => String(r.id));
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.productType', 'productType')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .whereInIds(productIds)
      .getMany();

    // Step 3: Merge Data (Attach Discount info and Sort)
    // The 'products' array from getMany() is NOT guaranteed to be in the same order as 'productIds'
    // So we map based on the paginatedResults which preserves the sort order
    const enrichedProducts = paginatedResults
      .map((rawItem) => {
        const product = products.find(
          (p) => String(p.productId) === String(rawItem.id),
        );
        if (!product) return null; // Should not happen

        const maxDiscountRate = rawItem.maxDiscountRate
          ? parseFloat(rawItem.maxDiscountRate as string)
          : 0;
        const currentPrice = Math.round(product.price * (1 - maxDiscountRate));

        return {
          ...product,
          originalPrice: product.price,
          currentPrice: currentPrice,
          discountRate: maxDiscountRate,
        };
      })
      .filter((p) => p !== null);

    return { data: enrichedProducts, total };
  }

  async findStorefrontDetail(id: string): Promise<EnrichedProduct> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.productType', 'productType')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .where('product.productId = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Get active discount
    const discountResult = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(
        SpecialDiscount,
        'discount',
        'discount.storeId = product.storeId AND (discount.productTypeId IS NULL OR discount.productTypeId = product.productTypeId)',
      )
      .leftJoin(
        'discount.discount',
        'discountInfo',
        'discountInfo.isActive = true AND discountInfo.startDatetime <= NOW() AND discountInfo.endDatetime >= NOW()',
      )
      .select('MAX(discount.discountRate)', 'maxDiscountRate')
      .where('product.productId = :id', { id })
      .getRawOne<{ maxDiscountRate: string }>();

    // Calculate prices
    const maxDiscountRate = discountResult?.maxDiscountRate
      ? parseFloat(discountResult.maxDiscountRate)
      : 0;
    const currentPrice = Math.round(product.price * (1 - maxDiscountRate));

    // Construct response
    return {
      ...product,
      originalPrice: product.price,
      currentPrice: currentPrice,
      discountRate: maxDiscountRate,
    };
  }

  async create(storeId: string, createDto: CreateProductDto): Promise<Product> {
    // Verify store exists and belongs to seller
    await this.storesService.findOne(storeId);

    const product = this.productRepository.create({
      ...createDto,
      storeId,
    });

    const savedProduct = await this.productRepository.save(product);

    // Increment store product count
    await this.storesService.incrementProductCount(storeId);

    // Create images if provided
    if (createDto.images && createDto.images.length > 0) {
      const images = createDto.images.map((img, index) =>
        this.imageRepository.create({
          productId: savedProduct.productId,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder || index + 1,
        }),
      );
      await this.imageRepository.save(images);
    }

    return await this.findOne(savedProduct.productId);
  }

  async findAll(
    queryDto: QueryProductDto,
  ): Promise<{ data: Product[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, string | ReturnType<typeof Like>> = {};

    if (queryDto.storeId) {
      where.storeId = queryDto.storeId;
    }

    if (queryDto.productTypeId) {
      const typeIds = await this.productTypesService.getDescendantIds(
        queryDto.productTypeId,
      );
      (where as any).productTypeId = In(typeIds);
    }

    if (queryDto.search) {
      where.productName = Like(`%${queryDto.search}%`);
    }

    if (queryDto.minPrice || queryDto.maxPrice) {
      const min = parseFloat(queryDto.minPrice || '0');
      const max = parseFloat(queryDto.maxPrice || '999999999');
      where.price = Between(min, max);
    }

    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder: 'ASC' | 'DESC' =
      (queryDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const [data, total] = await this.productRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['store', 'productType', 'images', 'inventory'],
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId: id },
      relations: ['store', 'productType', 'images', 'inventory'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    storeId: string,
    updateDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Verify ownership
    if (product.storeId !== storeId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Handle images update
    if (updateDto.images) {
      // Remove old images
      await this.imageRepository.delete({ productId: id });

      // Add new images
      const images = updateDto.images.map((img, index) =>
        this.imageRepository.create({
          productId: id,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder || index + 1,
        }),
      );
      await this.imageRepository.save(images);
    }

    Object.assign(product, updateDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const product = await this.findOne(id);

    // Verify ownership
    if (product.storeId !== storeId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.softRemove(product);
    // Decrement store product count
    await this.storesService.decrementProductCount(storeId);
  }

  async updateRating(productId: string, newRating: number): Promise<void> {
    const product = await this.findOne(productId);

    const totalReviews = product.totalReviews + 1;
    const averageRating =
      (product.averageRating * product.totalReviews + newRating) / totalReviews;

    product.averageRating = Math.round(averageRating * 10) / 10;
    product.totalReviews = totalReviews;

    await this.productRepository.save(product);
  }
}
