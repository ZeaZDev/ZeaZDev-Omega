-- AlterTable
ALTER TABLE "WhiteLabelConfig" ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Plugin" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plugin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginInstallation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluginInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plugin_developerId_idx" ON "Plugin"("developerId");

-- CreateIndex
CREATE INDEX "Plugin_category_idx" ON "Plugin"("category");

-- CreateIndex
CREATE INDEX "Plugin_active_idx" ON "Plugin"("active");

-- CreateIndex
CREATE INDEX "PluginInstallation_orgId_idx" ON "PluginInstallation"("orgId");

-- CreateIndex
CREATE INDEX "PluginInstallation_pluginId_idx" ON "PluginInstallation"("pluginId");

-- CreateIndex
CREATE INDEX "PluginInstallation_active_idx" ON "PluginInstallation"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PluginInstallation_orgId_pluginId_key" ON "PluginInstallation"("orgId", "pluginId");

-- AddForeignKey
ALTER TABLE "PluginInstallation" ADD CONSTRAINT "PluginInstallation_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
