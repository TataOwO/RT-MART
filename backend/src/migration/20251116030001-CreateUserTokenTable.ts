import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTokenTable20251116030001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_token (
        token_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_usertoken_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_usertoken_user_id ON user_token(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_usertoken_token_hash ON user_token(token_hash)`,
    );

    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_usertoken_user_id_is_revoked_expires_at ON user_token(user_id, is_revoked, expires_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_usertoken_user_id ON user_token`);
    await queryRunner.query(
      `DROP INDEX IDX_usertoken_token_hash ON user_token`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_usertoken_user_id_is_revoked_expires_at ON user_token`,
    );
    await queryRunner.query(`DROP TABLE user_token`);
  }
}
