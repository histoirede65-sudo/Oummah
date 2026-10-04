import { Redirect, useLocalSearchParams } from "expo-router";

import { chapterById } from "../../../features/fiqh/fiqhData";

/** Chapters are now read inside their book's table of contents. */
export default function FiqhChapterRedirect() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const chapter = chapterById.get(chapterId);
  if (!chapter) return <Redirect href="/fiqh" />;
  return <Redirect href={{ pathname: "/fiqh/[categoryId]", params: { categoryId: chapter.categoryId, chapter: chapter.id } }} />;
}
