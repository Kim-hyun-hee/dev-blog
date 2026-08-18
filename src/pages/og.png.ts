import type { APIRoute } from "astro";
import { renderOgImage } from "@/utils/ogImage";
import config from "@/config";

/**
 * 사이트 링크 미리보기 이미지.
 *
 * public/{site.ogImage} 가 없을 때만 쓰인다(resolveDefaultOgImagePath 참고).
 * 직접 만든 이미지를 그 자리에 두면 이 경로 대신 그 파일이 쓰인다.
 *
 * [CUSTOM] 업스트림은 이 파일 안에서 satori를 직접 부르고 크림색·검정 테두리
 * 카드를 그렸습니다. 배치는 src/utils/ogImage.ts 로 옮겼고(글용과 같은 카드를
 * 씁니다), 색과 폰트를 사이트의 것으로 바꿨습니다.
 */
export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: config.site.title,
    subtitle: config.site.description,
    footerEnd: new URL(config.site.url).hostname,
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
