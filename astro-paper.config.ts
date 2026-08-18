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
});