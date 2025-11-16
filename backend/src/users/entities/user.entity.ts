import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Seller } from '../../sellers/entities/seller.entity';
import { ShippingAddress } from '../../shipping-addresses/entities/shipping-address.entity';
import { UserToken } from '../../auth/entities/user-token.entity';
import { Cart } from '../../carts/entities/cart.entity';
import { Order } from '../../orders/entities/order.entity';
import { CartHistory } from '../../cart-history/entities/cart-history.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity('User')
@Index(['loginId']) // Already unique, but explicit index for faster lookups
@Index(['email']) // Already unique, but explicit index for faster lookups
@Index(['role']) // For filtering by role
@Index(['deletedAt']) // For soft delete queries
@Index(['role', 'deletedAt']) // Composite index for active users by role
@Index(['createdAt']) // For sorting by registration date
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'login_id' })
  loginId: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Seller, (seller) => seller.user, { cascade: true })
  seller?: Seller;

  @OneToMany(() => ShippingAddress, (address) => address.user)
  shippingAddresses?: ShippingAddress[];

  @OneToMany(() => UserToken, (token) => token.user)
  tokens?: UserToken[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart?: Cart;

  @OneToMany(() => Order, (order) => order.user)
  orders?: Order[];

  @OneToMany(() => CartHistory, (history) => history.user)
  cartHistories?: CartHistory[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs?: AuditLog[];
}
