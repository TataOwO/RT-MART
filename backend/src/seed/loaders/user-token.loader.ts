import { EntityManager, IsNull } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserToken } from '../../auth/entities/user-token.entity';
import { User } from '../../users/entities/user.entity';

export class UserTokenLoader {
  private jwtService: JwtService;

  constructor(
    private entityManager: EntityManager,
    private logger: Logger,
  ) {
    // 初始化 JWT Service（用於生成 token）
    // 在 seed 環境中，我們需要手動初始化 ConfigService 和 JwtService
    const configService = new ConfigService();
    const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ||
      '24h') as string & number;
    this.jwtService = new JwtService({
      secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      signOptions: { expiresIn },
    });
  }

  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{ error: string; stack?: string }>;
  }> {
    const startTime = Date.now();
    this.logger.log('Starting to load UserToken...');

    const errors: Array<{ error: string; stack?: string }> = [];
    let success = 0;
    let skipped = 0;

    try {
      // 取得所有用戶
      const users = await this.entityManager.find(User, {
        where: { deletedAt: IsNull() },
      });

      if (users.length === 0) {
        this.logger.warn('No users found, skipping UserToken generation');
        return { success: 0, skipped: 0, errors: [] };
      }

      // 如果 force 模式，先清空現有 token
      if (force) {
        await this.entityManager.query(`DELETE FROM \`UserToken\``);
        this.logger.log('Cleared all existing UserToken records');
      }

      const tokens: UserToken[] = [];

      // 為每個用戶生成一個 token
      for (const user of users) {
        try {
          // 檢查是否已存在有效的 token（除非是 force 模式）
          if (!force) {
            const existing = await this.entityManager.findOne(UserToken, {
              where: { userId: user.userId, isRevoked: false },
            });
            if (existing) {
              skipped++;
              continue;
            }
          }

          // 生成 JWT token
          const payload = {
            sub: user.userId,
            loginId: user.loginId,
            role: user.role,
          };
          const accessToken = this.jwtService.sign(payload);

          // Hash token
          const tokenHash = await bcrypt.hash(accessToken, 10);

          // 設定過期時間（24 小時後）
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          // 建立 UserToken 實體
          const userToken = this.entityManager.create(UserToken, {
            userId: user.userId,
            tokenHash,
            expiresAt,
            isRevoked: false,
          });

          tokens.push(userToken);
        } catch (error) {
          errors.push({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          this.logger.error(
            `Error generating token for user ${user.userId}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }

      // 批次插入
      if (tokens.length > 0) {
        await this.entityManager.save(UserToken, tokens);
        success = tokens.length;
        this.logger.log(`Successfully inserted ${success} UserToken records`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Completed loading UserToken: ${success} inserted, ${skipped} skipped, ${errors.length} errors (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to load UserToken',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    return { success, skipped, errors };
  }
}
