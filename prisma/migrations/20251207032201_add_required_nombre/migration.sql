/*
  Warnings:

  - Made the column `nombre` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "nombre" SET NOT NULL;
