import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import rehypeWrapTables from "./src/utils/rehypeWrapTables";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { horizonDark, horizonLight } from "./src/codeThemes";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

const isLegacyProjectRedirect = (page: string) => {
  const segments = new URL(page).pathname.split("/").filter(Boolean);
  return segments.at(-2) === "categories" && segments.at(-1) === "project";
};

/**
 * 꺼진 기능의 페이지를 sitemap에서 뺀다. 정적 빌드에서 /archives/와 /about/은
 * 404 화면을 담은 채로 생성되므로, 파일이 있다는 이유로 색인에 오르면 안 된다.
 * /projects/는 showAbout이 꺼지면 아예 생성되지 않아 자연히 빠진다.
 */
const isDisabledPage = (page: string) => {
  const { pathname } = new URL(page);

  return (
    (config.features?.showArchives === false &&
      pathname.endsWith("/archives/")) ||
    (config.features?.showAbout === false && pathname.endsWith("/about/"))
  );
};

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page => !isDisabledPage(page) && !isLegacyProjectRedirect(page),
    }),
  ],
  // [CUSTOM] 업스트림은 ["en"] / "en" 입니다. 기본 로케일만 ko로 바꿨고
  // prefixDefaultLocale: false는 그대로라 URL에 로케일 접두어가 붙지 않습니다.
  i18n: {
    locales: ["ko"],
    defaultLocale: "ko",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts, rehypeWrapTables],
    }),
    shikiConfig: {
      themes: { light: horizonLight, dark: horizonDark },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // [CUSTOM] 업스트림은 Google Sans Code 하나만 등록합니다. 그 폰트에 한글
  // 글리프가 없어 아래 둘로 교체했습니다. SUIT는 저장소에 담아 local provider로,
  // JetBrains Mono는 google provider로 받습니다(빌드 시 내려받아 self-host).
  // OG 이미지 생성(satori)이 WOFF2를 못 읽어서 ttf 포맷을 함께 요청합니다.
  fonts: [
    {
      name: "SUIT Variable",
      cssVariable: "--font-suit",
      provider: fontProviders.local(),
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            weight: "400 800",
            style: "normal",
            src: ["./src/assets/fonts/SUIT-Variable.woff2"],
          },
        ],
      },
    },
    {
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 500, 700],
      styles: ["normal", "italic"],
      // [CUSTOM] 한때 "ttf"를 함께 받았습니다. OG 이미지를 satori로 그릴 때
      // 이 폰트를 썼고 satori가 WOFF2를 읽지 못했기 때문입니다. 지금 OG는
      // 본문 폰트(SUIT)로 그리고 그쪽 ttf를 저장소에서 직접 읽으므로
      // (src/utils/ogImage.ts), 여기서는 브라우저용 woff2만 받으면 됩니다.
      formats: ["woff2"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // [CUSTOM] GA4 측정 ID. 비워 두면 측정 스크립트가 아예 렌더되지 않아
      // 로컬 개발과 CI 빌드는 GA로 아무것도 보내지 않는다.
      PUBLIC_GA_MEASUREMENT_ID: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
