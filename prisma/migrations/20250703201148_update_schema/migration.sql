-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "frame" TEXT NOT NULL,
    "glass" TEXT NOT NULL,
    "grid" TEXT,
    "p_o" TEXT NOT NULL,
    "invoices_num" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "barcode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
