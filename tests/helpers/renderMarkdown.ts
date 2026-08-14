import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import rehypeWrapTables from "../../src/utils/rehypeWrapTables";
import { transformerFileName } from "../../src/utils/transformers/fileName";
import { horizonDark, horizonLight } from "../../src/codeThemes";

/**
 * astro.config.ts의 markdown 설정과 같은 파이프라인으로 문자열을 렌더한다.
 *
 * 렌더링 검사가 특정 글의 빌드 산출물을 슬러그로 열어 보던 것을 대신한다.
 * 그 방식은 글 하나를 지우거나 이름만 바꿔도 테스트가 무너졌고, 발행 글이
 * 없는 빌드에서는 아예 돌지 않았다. 마크업은 여기서 직접 렌더해 확인하고,
 * CSS는 전역 스타일시트라 빌드 산출물에서 그대로 읽으면 된다.
 *
 * 설정을 바꾸면 astro.config.ts와 함께 고쳐야 한다.
 */
let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | undefined;

export async function renderMarkdown(source: string): Promise<string> {
  processor ??= await createMarkdownProcessor({
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    rehypePlugins: [rehypeCallouts, rehypeWrapTables],
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
  });

  const { code } = await processor.render(source);
  return code;
}

/** 검사에 쓰는 마크다운 조각. 프로덕션 콘텐츠와 무관하게 여기서만 관리한다. */
export const specimens = {
  /** 제목·링크·인용·표를 한 번에 담은 산문 표본. */
  prose: `## Heading with an id

An [external link](https://example.com/docs) inside a paragraph.

> A quoted line.

| Option | Default |
| ------ | ------- |
| \`one\` | true    |
`,

  /** 이름이 붙은 코드 블록과 이름이 없는 코드 블록. */
  code: `\`\`\`ts file="src/content.config.ts"
const value = foo(a, b).bar;
\`\`\`

\`\`\`bash
echo "hello"
\`\`\`
`,

  /** 접이식이 아닌 콜아웃과 접이식 콜아웃. */
  callouts: `> [!NOTE]
> A plain note.

> [!WARNING]- Collapsed by default
> Hidden until opened.
`,
} as const;
