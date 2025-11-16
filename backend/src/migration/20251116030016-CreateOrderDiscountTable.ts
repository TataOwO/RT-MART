import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderDiscountTable20251116030016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE order_discount (
        order_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        discount_id BIGINT NOT NULL,
        discount_type ENUM('seasonal', 'shipping', 'special') NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_orderdiscount_order FOREIGN KEY (order_id) REFERENCES \`order\`(order_id) ON DELETE CASCADE,
        CONSTRAINT FK_orderdiscount_discount FOREIGN KEY (discount_id) REFERENCES discount(discount_id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX IDX_orderdiscount_order_id ON order_discount(order_id)`);
    await queryRunner.query(`CREATE INDEX IDX_orderdiscount_discount_id ON order_discount(discount_id)`);

    // -- 複合索引 (唯一約束)
    await queryRunner.query(`CREATE UNIQUE INDEX UQ_orderdiscount_order_id_type ON order_discount(order_id, discount_type)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_orderdiscount_order_id ON order_discount`);
    await queryRunner.query(`DROP INDEX IDX_orderdiscount_discount_id ON order_discount`);
    await queryRunner.query(`DROP INDEX UQ_orderdiscount_order_id_type ON order_discount`);
    await queryRunner.query(`DROP TABLE order_discount`);
  }
}