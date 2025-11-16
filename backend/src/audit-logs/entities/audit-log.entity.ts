import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';

@Entity('AuditLog')
@Index(['eventId'])
@Index(['tableName', 'recordId'])
@Index(['userId'])
@Index(['eventTimestamp'])
@Index(['requestId'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'audit_id' })
  auditId: string;

  @Column({ type: 'char', length: 36, unique: true, name: 'event_id' })
  eventId: string;

  @Column({
    type: 'timestamp',
    name: 'event_timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  eventTimestamp: Date;

  @Column({ type: 'varchar', length: 100, name: 'table_name' })
  tableName: string;

  @Column({ type: 'bigint', name: 'record_id' })
  recordId: string;

  @Column({ type: 'varchar', length: 20 })
  action: string;

  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  userId: string | null;

  // Request tracking
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    name: 'request_id',
    comment: 'API request ID',
  })
  requestId: string | null;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'ip_address',
    comment: 'IP address (IPv4 or IPv6)',
  })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'service_name',
  })
  serviceName: string | null;

  // Data changes
  @Column({ type: 'json', nullable: true, name: 'old_data' })
  oldData: object | null;

  @Column({ type: 'json', nullable: true, name: 'new_data' })
  newData: object | null;

  @Column({
    type: 'json',
    nullable: true,
    name: 'changes',
    comment: '計算出的變更差異',
  })
  changes: object | null;

  // Tamper protection
  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    name: 'checksum',
    comment: 'SHA-256 of concatenated fields',
  })
  checksum: string | null;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // Auto-generate event_id and checksum before insert
  @BeforeInsert()
  generateEventIdAndChecksum() {
    // Generate UUID if not provided
    if (!this.eventId) {
      this.eventId = crypto.randomUUID();
    }

    // Set event timestamp if not provided
    if (!this.eventTimestamp) {
      this.eventTimestamp = new Date();
    }

    // Calculate changes if both old and new data exist
    if (this.oldData && this.newData) {
      this.changes = this.calculateChanges(
        this.oldData as Record<string, unknown>,
        this.newData as Record<string, unknown>,
      );
    }

    // Generate checksum
    this.checksum = this.generateChecksum();
  }

  private calculateChanges(
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ): object {
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    });

    return changes;
  }

  private generateChecksum(): string {
    // Include ALL fields that should be protected from tampering
    const data = [
      this.eventId,
      this.eventTimestamp?.toISOString(),
      this.tableName,
      this.recordId,
      this.action,
      this.userId ?? '',
      this.requestId ?? '',
      this.ipAddress ?? '',
      this.userAgent ?? '',
      this.serviceName ?? '',
      JSON.stringify(this.oldData ?? {}),
      JSON.stringify(this.newData ?? {}),
      JSON.stringify(this.changes ?? {}),
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Verify checksum integrity
  verifyChecksum(): boolean {
    const currentChecksum = this.checksum;
    const calculatedChecksum = this.generateChecksum();
    return currentChecksum === calculatedChecksum;
  }
}
