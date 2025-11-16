import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSpecialDiscountTable20251116030018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE special_discount (
        special_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        discount_id BIGINT NOT NULL UNIQUE,
        store_id BIGINT NOT NULL,
        product_type_id BIGINT,
        discount_rate DECIMAL(5,4),
        max_discount_amount DECIMAL(10,2),
        CONSTRAINT FK_specialdiscount_discount FOREIGN KEY (discount_id) REFERENCES discount(discount_id) ON DELETE CASCADE,
        CONSTRAINT FK_specialdiscount_store FOREIGN KEY (store_id) REFERENCES store(store_id) ON DELETE CASCADE,
        CONSTRAINT FK_specialdiscount_producttype FOREIGN KEY (product_type_id) REFERENCES product_type(product_type_id) ON DELETE RESTRICT
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(`CREATE INDEX IDX_specialdiscount_store_id ON special_discount(store_id)`);
    await queryRunner.query(`CREATE INDEX IDX_specialdiscount_product_type_id ON special_discount(product_type_id)`);

    // -- 複合索引 (唯一約束)
    await queryRunner.query(`CREATE UNIQUE INDEX UQ_specialdiscount_store_producttype_discount ON special_discount(store_id, product_type_id, discount_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_specialdiscount_store_id ON special_discount`);
    await queryRunner.query(`DROP INDEX IDX_specialdiscount_product_type_id ON special_discount`);
    await queryRunner.query(`DROP INDEX UQ_specialdiscount_store_producttype_discount ON special_discount`);
    await queryRunner.query(`DROP TABLE special_discount`);
  }
}