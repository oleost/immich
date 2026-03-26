import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "asset_deleted_hash"
      ADD COLUMN "deviceAssetId" character varying,
      ADD COLUMN "deviceId" character varying,
      ADD COLUMN "acknowledgedByDeviceAt" timestamp with time zone
  `.execute(db);

  await sql`
    CREATE INDEX "IDX_asset_deleted_hash_deviceId_pending"
    ON "asset_deleted_hash" ("ownerId", "deviceId")
    WHERE "deviceId" IS NOT NULL AND "acknowledgedByDeviceAt" IS NULL
  `.execute(db);

  // Re-create the trigger function to also capture deviceAssetId and deviceId
  await sql`
    CREATE OR REPLACE FUNCTION asset_delete_audit()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS $$
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;

      INSERT INTO asset_deleted_hash ("ownerId", "checksum", "deviceAssetId", "deviceId")
      SELECT "ownerId", "checksum", NULLIF("deviceAssetId", ''), NULLIF("deviceId", '')
      FROM OLD
      WHERE "libraryId" IS NULL
      ON CONFLICT ("ownerId", "checksum") DO NOTHING;

      RETURN NULL;
    END
    $$
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "IDX_asset_deleted_hash_deviceId_pending"`.execute(db);

  await sql`
    ALTER TABLE "asset_deleted_hash"
      DROP COLUMN IF EXISTS "deviceAssetId",
      DROP COLUMN IF EXISTS "deviceId",
      DROP COLUMN IF EXISTS "acknowledgedByDeviceAt"
  `.execute(db);

  await sql`
    CREATE OR REPLACE FUNCTION asset_delete_audit()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS $$
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;

      INSERT INTO asset_deleted_hash ("ownerId", "checksum")
      SELECT "ownerId", "checksum"
      FROM OLD
      WHERE "libraryId" IS NULL
      ON CONFLICT ("ownerId", "checksum") DO NOTHING;

      RETURN NULL;
    END
    $$
  `.execute(db);
}
