-- MVP order/Zardas schema additions.
CREATE TYPE "OfferType" AS ENUM ('DESCUENTO_FIJO', 'DESCUENTO_PORCENTAJE', 'PRODUCTO_GRATIS');

CREATE TABLE "ZardasOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "type" "OfferType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "leagueMin" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZardasOffer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order"
    ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "zardasAwarded" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "offerId" TEXT;

ALTER TABLE "ZardasBalance"
    ADD COLUMN "league" TEXT NOT NULL DEFAULT 'Bronce Zarda';

CREATE INDEX "Order_offerId_idx" ON "Order"("offerId");

ALTER TABLE "Order"
    ADD CONSTRAINT "Order_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ZardasOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
