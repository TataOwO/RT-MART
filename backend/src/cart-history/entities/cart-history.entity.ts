import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('CartHistory')
@Index(['userId'])
@Index(['createdAt'])
export class CartHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'cart_history_id' })
  cartHistoryId: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: string;

  @Column({ type: 'json', name: 'cart_snapshot' })
  cartSnapshot: object;

  @Column({ type: 'int', name: 'item_count' })
  itemCount: number;

  @Column({ type: 'json', nullable: true, name: 'order_ids' })
  orderIds: string[] | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.cartHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
