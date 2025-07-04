-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "frame" TEXT NOT NULL,
    "glass" TEXT NOT NULL,
    "grid" TEXT,
    "p_o" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "barcode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("barcode", "batch_no", "createdAt", "customer", "frame", "glass", "grid", "id", "p_o", "product_id", "size", "style", "updatedAt") SELECT "barcode", "batch_no", "createdAt", "customer", "frame", "glass", "grid", "id", "p_o", "product_id", "size", "style", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
