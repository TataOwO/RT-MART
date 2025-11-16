import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCartTable20251116030011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cart (
        cart_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_cart_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE cart`);
  }
}