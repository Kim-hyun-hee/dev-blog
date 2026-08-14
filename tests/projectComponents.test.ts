import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import FeaturedProject from "@/components/about/FeaturedProject.astro";
import ProjectRow from "@/components/about/ProjectRow.astro";

const project = (
  overrides: Partial<CollectionEntry<"projects">["data"]> = {}
) =>
  ({
    id: "test-project",
    collection: "projects",
    data: {
      title: "Controlled Project",
      summary: "A controlled project summary.",
      period: "2025–2026",
      role: "Architecture and implementation",
      stack: ["Astro", "TypeScript", "CSS"],
      featured: true,
      order: 7,
      ...overrides,
    },
  }) as CollectionEntry<"projects">;

const render = async (
  Component: typeof FeaturedProject | typeof ProjectRow,
  entry = project(),
  seriesPostCount = 0
) => {
  const container = await AstroContainer.create();

  return container.renderToString(Component, {
    props: { project: entry, seriesPostCount },
  });
};

/**
 * 제목에 걸린 카드 전체 덮개 링크를 뺀 나머지 링크.
 * 덮개는 카드마다 항상 있으므로 "URL이 있을 때만 생기는 링크"와 섞이면
 * 검증이 무뎌진다.
 */
const actionLinks = (html: string) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter(
    ([, attributes]) => !attributes.includes("project-cover")
  );

const expectProjectContent = (html: string) => {
  for (const value of [
    "Controlled Project",
    "A controlled project summary.",
    "2025–2026",
    "Architecture and implementation",
    "Astro",
    "TypeScript",
    "CSS",
  ]) {
    expect(html).toContain(value);
  }
};

describe.each([
  ["featured project", FeaturedProject],
  ["compact project row", ProjectRow],
] as const)("%s", (_, Component) => {
  it("renders every project field from the collection entry", async () => {
    const html = await render(Component);

    expectProjectContent(html);
  });

  it("turns the heading into the card-wide link to the detail page", async () => {
    const html = await render(Component);
    const heading = html.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? "";

    expect(heading).toContain('href="/projects/test-project/"');
    expect(heading).toContain("Controlled Project");
    // 덮개는 정확히 하나여야 한다 — 둘이면 카드 안에서 목적지가 갈린다.
    // (컨테이너의 :has(a.project-cover:hover) 호버 클래스가 아니라 <a>만 센다)
    expect(
      html.match(/<a\b[^>]*\bclass="[^"]*\bproject-cover\b[^"]*"/g)
    ).toHaveLength(1);
  });

  it("renders safe generic actions only for supplied optional URLs", async () => {
    const html = await render(
      Component,
      project({
        repository: "https://code.example.com/team/project",
        website: "https://project.example.com",
      })
    );
    const links = actionLinks(html);

    expect(links.map(([, , label]) => label.trim())).toEqual([
      "Repository",
      "Website",
    ]);
    for (const [, attributes] of links) {
      expect(attributes).toContain('target="_blank"');
      expect(attributes).toContain('rel="noopener noreferrer"');
    }
    expect(links[0][1]).toContain(
      'aria-label="Controlled Project 저장소 보기"'
    );
    expect(links[1][1]).toContain(
      'aria-label="Controlled Project 웹사이트 보기"'
    );
  });

  it("omits project actions when optional URLs are absent", async () => {
    expect(actionLinks(await render(Component))).toHaveLength(0);
  });

  it("links to the series only when the project has one with posts", async () => {
    const entry = project({ series: "building-this-blog" });
    const html = await render(Component, entry, 7);

    expect(html).toContain("data-project-series-link");
    expect(html).toContain('href="/series/building-this-blog/"');
    expect(html).toContain("관련 글 7편 보러가기");

    // 연재가 없거나 글이 아직 없으면 링크를 그리지 않는다.
    expect(await render(Component)).not.toContain("data-project-series-link");
    expect(await render(Component, entry, 0)).not.toContain(
      "data-project-series-link"
    );
  });
});
