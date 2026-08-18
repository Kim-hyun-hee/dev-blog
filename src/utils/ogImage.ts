/**
 * [CUSTOM] 업스트림에 없는 모듈입니다.
 *
 * 링크 미리보기(OG) 이미지를 그린다. 사이트용과 글용이 같은 카드를 쓰므로
 * 배치와 폰트를 여기 한 곳에 둔다.
 *
 * ── 폰트를 저장소에서 직접 읽는 이유 ────────────────────────────────
 * 업스트림은 Astro 폰트 파이프라인에서 받아 왔지만, 그 경로로는 본문 폰트를
 * 쓸 수 없다. satori는 woff2를 읽지 못하는데 SUIT는 woff2로만 등록돼 있다.
 * 그래서 ttf를 따로 두고 빌드 시점에 파일로 읽는다. 이 파일들은 빌드 결과물에
 * 들어가지 않으므로 방문자가 내려받지 않는다.
 *
 * 가변 폰트(SUIT-Variable.ttf) 대신 굵기별 정적 파일을 쓴다. satori는 가변
 * 폰트를 기본 굵기로만 그리는 경우가 있어 제목이 굵어지지 않는다.
 *
 * 한글이 없는 폰트를 쓰면 제목이 통째로 두부(□)가 된다. 화면 어디에도 드러나지
 * 않고 링크를 공유할 때만 보이므로, 폰트를 바꾸려면 실제로 생성해서 눈으로
 * 확인해야 한다.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

/* src/styles/theme.css 의 라이트 값. 미리보기는 어느 앱에서 열리든 같은 판이라
   한쪽 모드로 고정한다. */
const BACKGROUND = "#ffffff";
const FOREGROUND = "#262626";
const MUTED_FOREGROUND = "#666666";
const BORDER = "#e5e5e5";

/* 사이드바 프로필 사진의 링과 같은 그라데이션(global.css 의 profile-ring).
   --sky 를 단독으로 쓰지 않고 --accent 와 짝지어 쓰는, theme.css 가 허용하는
   유일한 용법이다. */
const ACCENT_GRADIENT = "linear-gradient(100deg, #8387d3, #8fb4dd)";

type FontData = { regular: Buffer; bold: Buffer };
let cachedFonts: Promise<FontData> | undefined;

function loadFonts(): Promise<FontData> {
  // 라우트마다 다시 읽지 않는다. 글이 100편이면 100번 읽게 된다.
  cachedFonts ??= (async () => {
    const dir = path.join(process.cwd(), "src", "assets", "fonts");
    try {
      const [regular, bold] = await Promise.all([
        readFile(path.join(dir, "SUIT-Regular.ttf")),
        readFile(path.join(dir, "SUIT-Bold.ttf")),
      ]);
      return { regular, bold };
    } catch (cause) {
      throw new Error(
        `OG 이미지용 폰트를 읽지 못했습니다: ${dir}. ` +
          `SUIT-Regular.ttf 와 SUIT-Bold.ttf 가 있어야 합니다.`,
        { cause }
      );
    }
  })();

  return cachedFonts;
}

export type OgImageContent = {
  /** 큰 글씨. 사이트 이름이나 글 제목. */
  title: string;
  /** 제목 아래 한 줄. 사이트 설명이나 글 설명. */
  subtitle?: string;
  /** 하단 왼쪽. 글쓴이 등. */
  footerStart?: string;
  /** 하단 오른쪽. 보통 도메인. */
  footerEnd?: string;
};

export async function renderOgImage(content: OgImageContent): Promise<Buffer> {
  const { regular, bold } = await loadFonts();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BACKGROUND,
          border: `1px solid ${BORDER}`,
          fontFamily: "SUIT",
        },
        children: [
          // 위쪽 그라데이션 띠. 미리보기를 사이트와 잇는 유일한 장식이다.
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                width: "100%",
                height: "14px",
                background: ACCENT_GRADIENT,
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                padding: "72px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      // 하단 줄은 바닥에 붙이고 본문만 남는 높이의 가운데에
                      // 둔다. 사이트 카드는 두 줄뿐이라 위로 붙이면 아래가
                      // 통째로 빈다.
                      flexGrow: 1,
                      justifyContent: "center",
                      overflow: "hidden",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            fontSize: 64,
                            fontWeight: 700,
                            color: FOREGROUND,
                            lineHeight: 1.3,
                            // 긴 제목이 하단 줄을 밀어내지 않도록 자른다.
                            maxHeight: "270px",
                            overflow: "hidden",
                          },
                          children: content.title,
                        },
                      },
                      ...(content.subtitle
                        ? [
                            {
                              type: "div",
                              props: {
                                style: {
                                  display: "flex",
                                  marginTop: "24px",
                                  fontSize: 30,
                                  color: MUTED_FOREGROUND,
                                  lineHeight: 1.5,
                                  maxHeight: "90px",
                                  overflow: "hidden",
                                },
                                children: content.subtitle,
                              },
                            },
                          ]
                        : []),
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      paddingTop: "24px",
                      borderTop: `1px solid ${BORDER}`,
                      fontSize: 26,
                      color: MUTED_FOREGROUND,
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", overflow: "hidden" },
                          children: content.footerStart ?? "",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", overflow: "hidden" },
                          children: content.footerEnd ?? "",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      embedFont: true,
      fonts: [
        { name: "SUIT", data: regular, weight: 400, style: "normal" },
        { name: "SUIT", data: bold, weight: 700, style: "normal" },
      ],
    }
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
