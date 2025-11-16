import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscountTable20251116030015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE discount (
        discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        discount_code VARCHAR(50) NOT NULL UNIQUE,
        discount_type ENUM('seasonal', 'shipping', 'special') NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        min_purchase_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        start_datetime TIMESTAMP NOT NULL,
        end_datetime TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        usage_limit INT,
        usage_count INT DEFAULT 0,
        created_by_type ENUM('system', 'seller') NOT NULL,
        created_by_id BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_discount_code ON discount(discount_code)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_discount_type ON discount(discount_type)`,
    );

    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_discount_type_active_period ON discount(discount_type, is_active, start_datetime, end_datetime)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_discount_created_by ON discount(created_by_type, created_by_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_discount_code ON discount`);
    await queryRunner.query(`DROP INDEX IDX_discount_type ON discount`);
    await queryRunner.query(
      `DROP INDEX IDX_discount_type_active_period ON discount`,
    );
    await queryRunner.query(`DROP INDEX IDX_discount_created_by ON discount`);
    await queryRunner.query(`DROP TABLE discount`);
  }
}
