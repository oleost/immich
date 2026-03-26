import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "asset_deleted_hash" (
      "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "ownerId" uuid NOT NULL,
      "checksum" bytea NOT NULL,
      "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT "PK_asset_deleted_hash" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_asset_deleted_hash_owner_checksum" UNIQUE ("ownerId", "checksum"),
      CONSTRAINT "FK_asset_deleted_hash_user" FOREIGN KEY ("ownerId")
        REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `.execute(db);

  await sql`CREATE INDEX "IDX_asset_deleted_hash_deletedAt" ON "asset_deleted_hash" ("deletedAt")`.execute(db);

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

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE OR REPLACE FUNCTION asset_delete_audit()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS $$
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
    $$
  `.execute(db);

  await sql`DROP TABLE IF EXISTS "asset_deleted_hash"`.execute(db);
}
