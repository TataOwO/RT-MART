import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Discount } from './discount.entity';

@Entity('ShippingDiscount')
export class ShippingDiscount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'shipping_discount_id' })
  shippingDiscountId: string;

  @Column({ type: 'bigint', unique: true, name: 'discount_id' })
  discountId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount' })
  discountAmount: number;

  // Relations
  @OneToOne(() => Discount, (discount) => discount.shippingDiscount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;
}
