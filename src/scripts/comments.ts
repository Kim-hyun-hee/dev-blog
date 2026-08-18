/**
 * [CUSTOM] 업스트림에 없는 모듈입니다.
 *
 * giscus 댓글 주입과 테마 동기화.
 *
 * giscus 공식 스니펫은 <script src=".../client.js">를 본문에 그대로 두는
 * 방식이다. 그러나 ClientRouter는 문서를 새로 읽지 않고 DOM만 갈아끼우므로,
 * 그 스크립트가 이동할 때마다 다시 실행되는지는 Astro의 내부 동작에 달려
 * 있다. 실행되지 않으면 다음 글에 앞 글의 댓글창이 그대로 남는다. 그래서
 * 스크립트를 템플릿에 두지 않고 이동마다 여기서 직접 심는다.
 *
 * 테마도 여기서 맞춘다. giscus는 iframe이라 사이트 CSS가 닿지 않아, 테마
 * 버튼을 눌러도 댓글창만 밝은 채로 남는다. <html>의 data-theme 변화를 보고
 * iframe에 메시지를 보낸다. 이 방향이면 theme.ts를 건드릴 필요가 없다.
 */

const GISCUS_ORIGIN = "https://giscus.app";

/**
 * 컨테이너에 실려 온 giscus 설정을 그대로 스크립트로 옮긴다. 항목마다 코드를
 * 두지 않아, 설정이 늘어도 이 배열과 Comments.astro만 맞추면 된다.
 */
const FORWARDED_ATTRIBUTES = [
  "data-repo",
  "data-repo-id",
  "data-category",
  "data-category-id",
  "data-mapping",
  "data-strict",
  "data-reactions-enabled",
  "data-emit-metadata",
  "data-input-position",
  "data-lang",
];

/**
 * theme.ts가 <html>에 써 둔 값을 읽어, 그에 해당하는 giscus 테마를 고른다.
 *
 * giscus는 프리셋 이름과 CSS 파일 URL을 모두 받는다. 컨테이너가 URL을 실어
 * 오면 그걸 쓰고, 없으면 프리셋 이름으로 떨어진다 — 테마 파일이 아직 배포되지
 * 않았거나 설정이 빠졌을 때 댓글창이 통째로 사라지는 것보다 낫다.
 */
export function currentTheme(container: Element): string {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const url = container.getAttribute(
    dark ? "data-theme-dark" : "data-theme-light"
  );
  return url ?? (dark ? "dark" : "light");
}

export function mountGiscus(container: Element, theme: string): void {
  // 앞 글에서 심어둔 스크립트와 iframe을 먼저 걷어낸다. 이걸 빠뜨리면 글을
  // 넘길 때마다 댓글창이 하나씩 늘어난다.
  container.replaceChildren();

  const script = document.createElement("script");
  script.src = `${GISCUS_ORIGIN}/client.js`;
  script.async = true;
  script.crossOrigin = "anonymous";

  for (const name of FORWARDED_ATTRIBUTES) {
    const value = container.getAttribute(name);
    if (value !== null) script.setAttribute(name, value);
  }
  script.setAttribute("data-theme", theme);

  container.appendChild(script);
}

export function syncTheme(theme: string): void {
  const frame = document.querySelector<HTMLIFrameElement>(
    "iframe.giscus-frame"
  );
  // 아직 iframe이 뜨지 않았으면 보낼 곳이 없다. 그 경우 다음 mountGiscus가
  // 올바른 테마로 심으므로 그냥 넘어간다.
  frame?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme } } },
    GISCUS_ORIGIN
  );
}

/** 댓글이 꺼져 있거나 컨테이너가 없는 페이지에서는 아무 일도 하지 않는다. */
export function initComments(): () => void {
  const container = document.getElementById("comments");
  if (!container) return () => {};

  mountGiscus(container, currentTheme(container));

  const observer = new MutationObserver(() =>
    syncTheme(currentTheme(container))
  );
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}
