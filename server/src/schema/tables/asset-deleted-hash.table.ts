import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Index, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table('asset_deleted_hash')
@Index({ columns: ['ownerId', 'checksum'], unique: true })
@Index({ columns: ['ownerId', 'deviceId'], where: '"deviceId" IS NOT NULL AND "acknowledgedByDeviceAt" IS NULL' })
export class AssetDeletedHashTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ type: 'bytea' })
  checksum!: Buffer;

  @Column({ type: 'character varying', nullable: true })
  deviceAssetId!: string | null;

  @Column({ type: 'character varying', nullable: true })
  deviceId!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acknowledgedByDeviceAt!: Timestamp | null;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
