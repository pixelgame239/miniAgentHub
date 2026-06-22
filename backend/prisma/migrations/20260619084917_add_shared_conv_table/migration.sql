-- CreateTable
CREATE TABLE "SharedConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snapShotData" JSONB NOT NULL,

    CONSTRAINT "SharedConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedConversation_id_idx" ON "SharedConversation"("id");
