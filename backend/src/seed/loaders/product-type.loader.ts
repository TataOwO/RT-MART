import { BaseLoader } from './base.loader';
import { ProductType } from '../../product-types/entities/product-type.entity';

export class ProductTypeLoader extends BaseLoader<ProductType> {
  protected entityName = 'ProductType';
  protected jsonFileName = 'ecommerce_product_type_data.json';
  protected entityClass = ProductType;

  protected validateAndTransform(
    data: Record<string, unknown>,
    useMappedParentId: boolean = false,
    mappedParentId: string | null = null,
  ): Promise<ProductType | null> {
    try {
      if (
        !data.product_type_id ||
        typeof data.type_code !== 'string' ||
        typeof data.type_name !== 'string'
      ) {
        return Promise.resolve(null);
      }

      const productType = new ProductType();
      productType.typeCode = data.type_code;
      productType.typeName = data.type_name;

      // 如果使用映射的 parent_id，則使用映射值；否則暫時設為 null
      if (useMappedParentId) {
        productType.parentTypeId = mappedParentId;
      } else {
        // 暫時設為 null，稍後會更新（用於子類型）
        productType.parentTypeId = null;
      }

      productType.isActive =
        typeof data.is_active === 'boolean' ? data.is_active : true;

      return Promise.resolve(productType);
    } catch {
      return Promise.resolve(null);
    }
  }

  protected async checkExists(entity: ProductType): Promise<boolean> {
    const existing = await this.entityManager.findOne(ProductType, {
      where: { typeCode: entity.typeCode },
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
    const startTime = Date.now();
    this.logger.log(`Starting to load ${this.entityName}...`);

    const jsonData = this.loadJson();

    // 分離頂層類型（parent_type_id 為 null）和子類型
    const topLevelTypes = jsonData.filter(
      (data) => !data.parent_type_id || data.parent_type_id === null,
    );
    const childTypes = jsonData.filter(
      (data) => data.parent_type_id && data.parent_type_id !== null,
    );

    const errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }> = [];
    let skipped = 0;

    // ===== 第一階段：插入頂層類型 =====
    const topLevelEntities: ProductType[] = [];
    // 建立資料到實體的映射，用於正確建立 ID 映射
    const topLevelDataToEntityMap = new Map<
      Record<string, unknown>,
      ProductType
    >();

    for (const data of topLevelTypes) {
      try {
        const entity = await this.validateAndTransform(data, false, null);
        if (!entity) {
          errors.push({
            data,
            error: 'Validation failed: entity is null',
          });
          continue;
        }

        if (!force) {
          const exists = await this.checkExists(entity);
          if (exists) {
            skipped++;
            this.logger.warn(
              `Skipping ${this.entityName} (already exists): ${JSON.stringify(data)}`,
            );
            continue;
          }
          // 檢查批次中是否已有相同 typeCode 的實體
          const duplicateInBatch = topLevelEntities.some(
            (e) => e.typeCode === entity.typeCode,
          );
          if (duplicateInBatch) {
            skipped++;
            this.logger.warn(
              `Skipping ${this.entityName} (duplicate typeCode in batch): ${JSON.stringify(data)}`,
            );
            continue;
          }
        }

        topLevelEntities.push(entity);
        topLevelDataToEntityMap.set(data, entity);
      } catch (error) {
        errors.push({
          data,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        this.logger.error(
          `Error transforming ${this.entityName} data: ${JSON.stringify(data)}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // 插入頂層類型
    let topLevelSuccess = 0;
    if (topLevelEntities.length > 0) {
      try {
        const saved = await this.entityManager.save(
          this.entityClass,
          topLevelEntities,
        );
        topLevelSuccess = saved.length;
        this.logger.log(
          `Successfully inserted ${topLevelSuccess} top-level ${this.entityName} records`,
        );

        // 建立 ID 映射（頂層類型）
        // 使用 typeCode 來正確匹配資料和已保存的實體
        for (const data of topLevelDataToEntityMap.keys()) {
          const originalEntity = topLevelDataToEntityMap.get(data);
          if (!originalEntity || !data.product_type_id) {
            continue;
          }

          // 使用 typeCode 找到對應的已保存實體
          const savedEntity = saved.find(
            (e) => e.typeCode === originalEntity.typeCode,
          );

          if (savedEntity) {
            this.idMapping.setMapping(
              'ProductType',
              typeof data.product_type_id === 'number'
                ? data.product_type_id
                : Number(data.product_type_id),
              savedEntity.productTypeId,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to insert top-level ${this.entityName} records`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }

    // ===== 第二階段：插入子類型（使用映射的 parent_type_id） =====
    const childEntities: ProductType[] = [];
    // 建立資料到實體的映射，用於正確建立 ID 映射
    const childDataToEntityMap = new Map<
      Record<string, unknown>,
      ProductType
    >();

    for (const data of childTypes) {
      try {
        // 使用 ID 映射轉換 parent_type_id
        let mappedParentId: string | null = null;
        if (data.parent_type_id) {
          const mappedId = this.idMapping.getMapping(
            'ProductType',
            typeof data.parent_type_id === 'number'
              ? data.parent_type_id
              : Number(data.parent_type_id),
          );

          if (mappedId) {
            mappedParentId = mappedId;
          } else {
            const parentIdStr =
              typeof data.parent_type_id === 'number'
                ? String(data.parent_type_id)
                : typeof data.parent_type_id === 'string'
                  ? data.parent_type_id
                  : 'unknown';
            const typeCodeStr =
              typeof data.type_code === 'string' ? data.type_code : 'unknown';
            this.logger.warn(
              `Parent type ID ${parentIdStr} not found in mapping for ${typeCodeStr}`,
            );
            errors.push({
              data,
              error: `Parent type ID ${parentIdStr} not found in mapping`,
            });
            continue;
          }
        }

        const entity = await this.validateAndTransform(
          data,
          true,
          mappedParentId,
        );
        if (!entity) {
          errors.push({
            data,
            error: 'Validation failed: entity is null',
          });
          continue;
        }

        // 檢查是否與已插入的頂層類型重複（無論是否為 force 模式）
        const duplicateWithTopLevel = topLevelEntities.some(
          (e) => e.typeCode === entity.typeCode,
        );
        if (duplicateWithTopLevel) {
          skipped++;
          this.logger.warn(
            `Skipping ${this.entityName} (duplicate typeCode with top-level): ${JSON.stringify(data)}`,
          );
          continue;
        }
        // 檢查批次中是否已有相同 typeCode 的實體（無論是否為 force 模式）
        const duplicateInBatch = childEntities.some(
          (e) => e.typeCode === entity.typeCode,
        );
        if (duplicateInBatch) {
          skipped++;
          this.logger.warn(
            `Skipping ${this.entityName} (duplicate typeCode in batch): ${JSON.stringify(data)}`,
          );
          continue;
        }

        if (!force) {
          const exists = await this.checkExists(entity);
          if (exists) {
            skipped++;
            this.logger.warn(
              `Skipping ${this.entityName} (already exists): ${JSON.stringify(data)}`,
            );
            continue;
          }
        }

        childEntities.push(entity);
        childDataToEntityMap.set(data, entity);
      } catch (error) {
        errors.push({
          data,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        this.logger.error(
          `Error transforming ${this.entityName} data: ${JSON.stringify(data)}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // 插入子類型
    let childSuccess = 0;
    if (childEntities.length > 0) {
      try {
        const saved = await this.entityManager.save(
          this.entityClass,
          childEntities,
        );
        childSuccess = saved.length;
        this.logger.log(
          `Successfully inserted ${childSuccess} child ${this.entityName} records`,
        );

        // 建立 ID 映射（子類型）
        // 使用 typeCode 來正確匹配資料和已保存的實體
        for (const data of childDataToEntityMap.keys()) {
          const originalEntity = childDataToEntityMap.get(data);
          if (!originalEntity || !data.product_type_id) {
            continue;
          }

          // 使用 typeCode 找到對應的已保存實體
          const savedEntity = saved.find(
            (e) => e.typeCode === originalEntity.typeCode,
          );

          if (savedEntity) {
            this.idMapping.setMapping(
              'ProductType',
              typeof data.product_type_id === 'number'
                ? data.product_type_id
                : Number(data.product_type_id),
              savedEntity.productTypeId,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to insert child ${this.entityName} records`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }

    const totalSuccess = topLevelSuccess + childSuccess;
    const duration = Date.now() - startTime;

    this.logger.log(
      `Completed loading ${this.entityName}: ${totalSuccess} inserted (${topLevelSuccess} top-level, ${childSuccess} child), ${skipped} skipped, ${errors.length} errors (${duration}ms)`,
    );

    return { success: totalSuccess, skipped, errors };
  }
}
