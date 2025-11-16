import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ShippingAddress')
@Index(['userId'])
@Index(['userId', 'isDefault'])
export class ShippingAddress {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'address_id' })
  addressId: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100, name: 'recipient_name' })
  recipientName: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'postal_code' })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 255, name: 'address_line1' })
  addressLine1: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'address_line2',
  })
  addressLine2: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  // Relations
  @ManyToOne(() => User, (user) => user.shippingAddresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
