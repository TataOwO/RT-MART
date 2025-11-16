import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { SeasonalDiscount } from './seasonal-discount.entity';
import { ShippingDiscount } from './shipping-discount.entity';
import { SpecialDiscount } from './special-discount.entity';

export enum DiscountType {
  SEASONAL = 'seasonal',
  SHIPPING = 'shipping',
  SPECIAL = 'special',
}

export enum CreatedByType {
  SYSTEM = 'system',
  SELLER = 'seller',
}

@Entity('Discount')
@Index('idx_discount_code', ['discountCode'])
@Index('idx_discount_type', ['discountType'])
@Index('idx_discount_active_period', [
  'discountType',
  'isActive',
  'startDatetime',
  'endDatetime',
])
@Index('idx_created_by', ['createdByType', 'createdById'])
export class Discount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'discount_id' })
  discountId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'discount_code' })
  discountCode: string;

  @Column({ type: 'enum', enum: DiscountType, name: 'discount_type' })
  discountType: DiscountType;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'min_purchase_amount',
  })
  minPurchaseAmount: number;

  @Column({ type: 'timestamp', name: 'start_datetime' })
  startDatetime: Date;

  @Column({ type: 'timestamp', name: 'end_datetime' })
  endDatetime: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', nullable: true, name: 'usage_limit' })
  usageLimit: number | null;

  @Column({ type: 'int', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'enum', enum: CreatedByType, name: 'created_by_type' })
  createdByType: CreatedByType;

  @Column({ type: 'bigint', nullable: true, name: 'created_by_id' })
  createdById: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToOne(() => SeasonalDiscount, (seasonal) => seasonal.discount)
  seasonalDiscount?: SeasonalDiscount;

  @OneToOne(() => ShippingDiscount, (shipping) => shipping.discount)
  shippingDiscount?: ShippingDiscount;

  @OneToOne(() => SpecialDiscount, (special) => special.discount)
  specialDiscount?: SpecialDiscount;
}
