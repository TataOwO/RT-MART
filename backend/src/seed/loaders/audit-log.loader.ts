import { EntityManager, IsNull } from 'typeorm';
import { Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';
import { User, UserRole } from '../../users/entities/user.entity';

export class AuditLogLoader {
  constructor(
    private entityManager: EntityManager,
    private logger: Logger,
  ) {}

  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{ error: string; stack?: string }>;
  }> {
    const startTime = Date.now();
    this.logger.log('Starting to load AuditLog...');

    const errors: Array<{ error: string; stack?: string }> = [];
    let success = 0;
    const skipped = 0; // AuditLog loader 不使用 skipped，但保留以符合介面

    try {
      // 如果 force 模式，先清空現有 audit log
      if (force) {
        await this.entityManager.query(`DELETE FROM \`AuditLog\``);
        this.logger.log('Cleared all existing AuditLog records');
      }

      // 取得所有用戶（用於生成 audit log）
      const users = await this.entityManager.find(User, {
        where: { deletedAt: IsNull() },
        take: 50, // 為前 50 個用戶生成示例 audit log
      });

      if (users.length === 0) {
        this.logger.warn('No users found, skipping AuditLog generation');
        return { success: 0, skipped: 0, errors: [] };
      }

      const auditLogs: AuditLog[] = [];

      // 為每個用戶生成一些示例 audit log
      for (const user of users) {
        try {
          // 生成示例 audit log：記錄用戶創建
          // 使用明確類型變數來避免 ESLint 類型檢查問題
          const ipAddress: string = String(faker.internet.ip());
          const userAgent: string = String(faker.internet.userAgent());

          const createLog = this.entityManager.create(AuditLog, {
            userId: user.userId,
            action: 'CREATE',
            tableName: 'User',
            recordId: user.userId,
            oldData: null,
            newData: {
              userId: user.userId,
              loginId: user.loginId,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            serviceName: 'SeedService',
            requestId: `seed-${Date.now()}-${user.userId}`,
            ipAddress,
            userAgent,
          });

          auditLogs.push(createLog);

          // 如果用戶有 seller 關聯，也記錄 seller 創建
          if (user.role === UserRole.SELLER) {
            const seller = await this.entityManager.query<
              Array<{ seller_id: string }>
            >(`SELECT seller_id FROM Seller WHERE user_id = ?`, [user.userId]);
            if (seller.length > 0 && seller[0]?.seller_id) {
              const sellerId = seller[0].seller_id;
              // 使用明確類型變數來避免 ESLint 類型檢查問題
              const sellerIpAddress: string = String(faker.internet.ip());
              const sellerUserAgent: string = String(
                faker.internet.userAgent(),
              );

              const sellerLog = this.entityManager.create(AuditLog, {
                userId: user.userId,
                action: 'CREATE',
                tableName: 'Seller',
                recordId: sellerId,
                oldData: null,
                newData: {
                  sellerId: sellerId,
                  userId: user.userId,
                },
                serviceName: 'SeedService',
                requestId: `seed-${Date.now()}-seller-${sellerId}`,
                ipAddress: sellerIpAddress,
                userAgent: sellerUserAgent,
              });
              auditLogs.push(sellerLog);
            }
          }
        } catch (error) {
          errors.push({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          this.logger.error(
            `Error generating audit log for user ${user.userId}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }

      // 批次插入
      if (auditLogs.length > 0) {
        await this.entityManager.save(AuditLog, auditLogs);
        success = auditLogs.length;
        this.logger.log(`Successfully inserted ${success} AuditLog records`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Completed loading AuditLog: ${success} inserted, ${skipped} skipped, ${errors.length} errors (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to load AuditLog',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    return { success, skipped, errors };
  }
}
