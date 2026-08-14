import type { CollectionEntry } from "astro:content";
import config from "@/config";

/**
 * [CUSTOM] 픽스처(테마 검사용 표본 글)를 이 빌드에 포함할지.
 *
 * 목록·페이지네이션·아카이브 검사는 글이 실제로 여러 편 있어야만 성립한다.
 * 그렇다고 그 표본을 공개 사이트에 내보낼 수는 없으므로, 빌드 모드로 가른다.
 *
 * - `astro build`            → 빠진다 (배포되는 빌드)
 * - `astro build --mode fixtures` → 남는다 (`pnpm verify`, CI)
 * - `astro dev`              → 남는다 (로컬에서 테마를 보려면 글이 필요하다)
 */
const includeFixtures =
  import.meta.env.DEV || import.meta.env.MODE === "fixtures";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - Excludes fixtures unless this build asked for them (see above)
 * - In production, excludes scheduled posts until `pubDatetime` minus the configured margin
 * - In dev, always shows non-draft posts to make authoring easier
 */
export function postFilter({ data }: CollectionEntry<"posts">) {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - config.posts.scheduledPostMargin;
  return (
    !data.draft &&
    (includeFixtures || !data.fixture) &&
    (import.meta.env.DEV || isPublishTimePassed)
  );
}
