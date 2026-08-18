import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "@/utils/ogImage";
import { getPostSlug } from "@/utils/getPostPaths";
import { postFilter } from "@/utils/postFilter";
import config from "@/config";

/**
 * 글별 링크 미리보기 이미지.
 *
 * [CUSTOM] 업스트림은 이 파일 안에서 satori를 직접 부르고 크림색·검정 테두리
 * 카드를 그렸습니다. 배치는 src/utils/ogImage.ts 로 옮겼고(사이트용과 같은
 * 카드를 씁니다), 색과 폰트를 사이트의 것으로 바꿨습니다. 폰트를 바꾼 것이
 * 중요합니다 — 이전 폰트에는 한글 글리프가 없어 제목이 두부로 그려졌습니다.
 */
export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) {
    return [];
  }

  // [CUSTOM] 업스트림은 !data.draft 만 봅니다. 그러면 예약 발행한 글의 OG
  // 이미지가 글 페이지보다 먼저 생성되어, 공개 전 제목이 그려진 PNG가
  // 예측 가능한 주소에 올라갑니다. 목록·상세·RSS와 같은 postFilter 를 씁니다.
  const posts = await getCollection("posts").then(p =>
    p.filter(post => postFilter(post) && !post.data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  const png = await renderOgImage({
    title: props.data.title,
    subtitle: props.data.description,
    footerStart: props.data.author,
    footerEnd: new URL(config.site.url).hostname,
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
