import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Discount } from './discount.entity';
import { Store } from '../../stores/entities/store.entity';
import { ProductType } from '../../product-types/entities/product-type.entity';

@Entity('SpecialDiscount')
@Index('idx_store_id', ['storeId'])
@Index('idx_product_type_id', ['productTypeId'])
@Index(
  'idx_store_product_discount',
  ['storeId', 'productTypeId', 'discountId'],
  {
    unique: true,
  },
)
export class SpecialDiscount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'special_discount_id' })
  specialDiscountId: string;

  @Column({ type: 'bigint', unique: true, name: 'discount_id' })
  discountId: string;

  @Column({ type: 'bigint', name: 'store_id' })
  storeId: string;

  @Column({ type: 'bigint', nullable: true, name: 'product_type_id' })
  productTypeId: string | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    name: 'discount_rate',
  })
  discountRate: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'max_discount_amount',
  })
  maxDiscountAmount: number | null;

  // Relations
  @OneToOne(() => Discount, (discount) => discount.specialDiscount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => ProductType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_type_id' })
  productType?: ProductType;
}
