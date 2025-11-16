import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Discount } from './discount.entity';

@Entity('SeasonalDiscount')
export class SeasonalDiscount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'seasonal_discount_id' })
  seasonalDiscountId: string;

  @Column({ type: 'bigint', unique: true, name: 'discount_id' })
  discountId: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, name: 'discount_rate' })
  discountRate: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'max_discount_amount',
  })
  maxDiscountAmount: number | null;

  // Relations
  @OneToOne(() => Discount, (discount) => discount.seasonalDiscount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;
}
