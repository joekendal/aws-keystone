-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT E'',
    "email" TEXT NOT NULL DEFAULT E'',
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT E'',
    "status" TEXT DEFAULT E'draft',
    "content" JSONB NOT NULL DEFAULT E'[{"type":"paragraph","children":[{"text":""}]}]',
    "publishDate" TIMESTAMP(3),
    "author" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT E'',

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Post_tags_Tag_posts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Post_author_idx" ON "Post"("author");

-- CreateIndex
CREATE UNIQUE INDEX "_Post_tags_Tag_posts_AB_unique" ON "_Post_tags_Tag_posts"("A", "B");

-- CreateIndex
CREATE INDEX "_Post_tags_Tag_posts_B_index" ON "_Post_tags_Tag_posts"("B");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Post_tags_Tag_posts" ADD FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Post_tags_Tag_posts" ADD FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
