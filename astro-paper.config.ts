import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://h1-groot.vercel.app/",
    title: "Dev groot",
    description: "Unity 그래픽스·DOD",
    // 사이트 전역에 노출되는 이름이라 브랜드명을 쓴다.
    // <meta name="author">, 글의 JSON-LD, 자동 생성 OG 이미지가 모두 이 값을
    // 읽는다. 실명은 About 페이지에만 둔다.
    author: "Dev groot",
    role: "Software Engineer",
    profile: "https://github.com/Kim-hyun-hee",
    // 이 이름의 파일은 지금 public/ 에 없다. 없으면 /og.png 가 생성되어
    // 쓰이므로(resolveDefaultOgImagePath 참고) 링크 미리보기는 사이트 설정을
    // 그린 카드가 된다. 직접 만든 이미지를 쓰고 싶으면 이 이름으로 public/ 에
    // 넣으면 그쪽이 우선한다.
    ogImage: "default-og.jpg",
    lang: "ko",
    timezone: "Asia/Seoul",
    dir: "ltr",
    // 측정 ID는 HTML에 그대로 실려 나가는 공개 값이라 여기 둔다. 숨겨야 하는
    // 것은 숫자를 되읽는 쪽의 서비스 계정 키인데, 그건 이 저장소에 없다.
    gaMeasurementId: "G-62Q2SHFLE8",
  },
  posts: {
    perPage: 8,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showAbout: false,
    showBackButton: true,
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/Kim-hyun-hee" },
  ],
  // 댓글은 블로그 저장소(dev-blog)의 Discussions에 쌓인다. 아래 값은 모두
  // 페이지 HTML에 실려 나가는 공개 값이라 감출 이유가 없다.
  comments: {
    repo: "Kim-hyun-hee/dev-blog",
    repoId: "R_kgDOTy_HQQ",
    category: "Comments",
    categoryId: "DIC_kwDOTy_HQc4DDnCa",
  },
});