import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('Seller')
export class Seller {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'bigint', unique: true, name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'bank_account_reference',
  })
  bankAccountReference: string | null;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date | null;

  @Column({ type: 'bigint', nullable: true, name: 'verified_by' })
  verifiedBy: string | null;

  // Relations
  @OneToOne(() => User, (user) => user.seller, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User;

  @OneToMany(() => Store, (store) => store.seller)
  stores?: Store[];
}
