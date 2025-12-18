import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductType } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
  ) {}

  async create(createDto: CreateProductTypeDto): Promise<ProductType> {
    // Check if typeCode already exists
    const existing = await this.productTypeRepository.findOne({
      where: { typeCode: createDto.typeCode },
    });

    if (existing) {
      throw new ConflictException('Product type code already exists');
    }

    // Verify parent exists if provided
    if (createDto.parentTypeId) {
      const parent = await this.findOne(createDto.parentTypeId);
      if (!parent) {
        throw new NotFoundException('Parent product type not found');
      }
    }

    const productType = this.productTypeRepository.create(createDto);
    return await this.productTypeRepository.save(productType);
  }

  async findAll(queryDto: any): Promise<ProductType[]> {
    const productTypes = await this.productTypeRepository.find({
      order: { typeCode: 'ASC' },
      where: { isActive: true },
    });

    if (queryDto.typeName) {
      return productTypes.filter((pt) =>
        pt.typeName.includes(queryDto.typeName),
      );
    }

    if (queryDto.typeCode) {
      return productTypes.filter((pt) =>
        pt.typeCode.includes(queryDto.typeCode),
      );
    }

    return productTypes;
  }

  async adminFindAll(): Promise<ProductType[]> {
    return await this.productTypeRepository.find({
      order: { typeCode: 'ASC' },
      relations: ['parent', 'children'],
    });
  }

  async adminFindOne(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOne({
      where: { productTypeId: id },
      relations: ['parent', 'children'],
    });

    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }

    return productType;
  }

  /**
   * 取得單一分類，並遞迴取得所有父級分類
   */
  async findOne(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOne({
      where: { productTypeId: id, isActive: true },
      relations: ['parent'],
    });

    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }

    // 遞迴取得父級 (手動實現 findAncestorsTree)
    if (productType.parent) {
      productType.parent = await this.findOne(productType.parent.productTypeId);
    }

    return productType;
  }

  /**
   * 遞迴獲取所有子分類的 ID (包含自己)
   */
  async getDescendantIds(id: string): Promise<string[]> {
    const ids: string[] = [id];
    const children = await this.productTypeRepository.find({
      where: { parentTypeId: id, isActive: true },
      select: ['productTypeId'],
    });

    for (const child of children) {
      const childIds = await this.getDescendantIds(child.productTypeId);
      ids.push(...childIds);
    }

    return ids;
  }

  async findByCode(code: string): Promise<ProductType | null> {
    return await this.productTypeRepository.findOne({
      where: { typeCode: code },
    });
  }

  async findChildren(id: string): Promise<ProductType[]> {
    const productType = await this.adminFindOne(id);
    return await this.productTypeRepository.find({
      where: { parentTypeId: productType.productTypeId, isActive: true },
    });
  }

  async update(
    id: string,
    updateDto: UpdateProductTypeDto,
  ): Promise<ProductType> {
    const productType = await this.findOne(id);

    // Verify parent exists if being updated
    if (updateDto.parentTypeId) {
      const parent = await this.adminFindOne(updateDto.parentTypeId);
      if (!parent) {
        throw new NotFoundException('Parent product type not found');
      }

      // Prevent circular reference
      if (updateDto.parentTypeId === id) {
        throw new ConflictException('Product type cannot be its own parent');
      }
    }

    Object.assign(productType, updateDto);
    return await this.productTypeRepository.save(productType);
  }

  async remove(id: string): Promise<void> {
    const productType = await this.adminFindOne(id);
    await this.productTypeRepository.remove(productType);
  }
}
