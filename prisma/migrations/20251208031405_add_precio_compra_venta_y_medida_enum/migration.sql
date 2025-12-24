/*
  Warnings:

  - You are about to drop the column `precio` on the `productos` table. All the data in the column will be lost.
  - The `medida` column on the `productos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `precioVenta` to the `productos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('L', 'KG', 'PZ', 'MTR');

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "precio",
ADD COLUMN     "precioCompra" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "precioVenta" DECIMAL(10,2) NOT NULL,
DROP COLUMN "medida",
ADD COLUMN     "medida" "UnidadMedida";
