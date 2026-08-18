import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Comments from "@/components/Comments.astro";
import {
  currentTheme,
  initComments,
  mountGiscus,
  syncTheme,
} from "@/scripts/comments";

const mocks = vi.hoisted(() => ({
  config: {} as { comments?: Record<string, unknown> },
}));

vi.mock("@/config", () => ({
  default: {
    get comments() {
      return mocks.config.comments;
    },
    site: { lang: "ko", url: "https://example.test/" },
  },
}));

const giscus = {
  repo: "owner/blog",
  repoId: "R_test",
  category: "Comments",
  categoryId: "DIC_test",
  mapping: "pathname",
  reactionsEnabled: true,
  lang: "ko",
};

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Comments);
};

beforeEach(() => {
  delete mocks.config.comments;
});

describe("Comments component", () => {
  it("renders nothing when comments are not configured", async () => {
    expect((await render()).trim()).toBe("");
  });

  it("carries the giscus settings on the container as data attributes", async () => {
    mocks.config.comments = giscus;
    const html = await render();

    expect(html).toContain('id="comments"');
    expect(html).toContain('data-repo="owner/blog"');
    expect(html).toContain('data-repo-id="R_test"');
    expect(html).toContain('data-category-id="DIC_test"');
    expect(html).toContain('data-mapping="pathname"');
    expect(html).toContain('data-reactions-enabled="1"');
  });

  it("points the theme attributes at absolute stylesheet URLs", async () => {
    // giscus fetches these server-side, so a site-relative path cannot work.
    mocks.config.comments = giscus;
    const html = await render();

    expect(html).toContain(
      'data-theme-light="https://example.test/giscus/light.css"'
    );
    expect(html).toContain(
      'data-theme-dark="https://example.test/giscus/dark.css"'
    );
  });

  it("ships an empty container so the script owns the giscus element", async () => {
    // The script clears and refills this node on every navigation; a
    // server-rendered <script> child would fight that.
    mocks.config.comments = giscus;

    expect(await render()).toMatch(/<div id="comments"[^>]*>\s*<\/div>/);
  });
});

// --- script -------------------------------------------------------------

type FakeNode = FakeElement | FakeScript;

class FakeElement {
  readonly attributes = new Map<string, string>();
  children: FakeNode[] = [];
  id = "";

  constructor(readonly tagName: string) {}

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
  replaceChildren() {
    this.children = [];
  }
  appendChild(node: FakeNode) {
    this.children.push(node);
    return node;
  }
}

class FakeScript extends FakeElement {
  src = "";
  async = false;
  crossOrigin = "";

  constructor() {
    super("script");
  }
}

/** The fake implements only what mountGiscus touches, so the cast is explicit. */
const asElement = (node: FakeElement) => node as unknown as Element;

const postMessage = vi.fn();
let root: FakeElement;
let container: FakeElement;
let frame: { contentWindow: { postMessage: typeof postMessage } } | null;
let observed: { target: unknown; options: unknown } | null;
const disconnect = vi.fn();

beforeEach(() => {
  postMessage.mockClear();
  disconnect.mockClear();
  root = new FakeElement("html");
  container = new FakeElement("div");
  container.id = "comments";
  container.setAttribute("data-repo", "owner/blog");
  container.setAttribute("data-repo-id", "R_test");
  container.setAttribute("data-mapping", "pathname");
  frame = null;
  observed = null;

  vi.stubGlobal("document", {
    documentElement: root,
    createElement: () => new FakeScript(),
    getElementById: (id: string) => (id === "comments" ? container : null),
    querySelector: () => frame,
  });

  vi.stubGlobal(
    "MutationObserver",
    class {
      constructor(readonly callback: () => void) {
        mutate = () => this.callback();
      }
      observe(target: unknown, options: unknown) {
        observed = { target, options };
      }
      disconnect = disconnect;
    }
  );
});

let mutate: () => void = () => {};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("comments script", () => {
  it("picks the theme stylesheet matching what theme.ts wrote", () => {
    container.setAttribute("data-theme-light", "https://site/giscus/light.css");
    container.setAttribute("data-theme-dark", "https://site/giscus/dark.css");

    expect(currentTheme(asElement(container))).toBe(
      "https://site/giscus/light.css"
    );

    root.setAttribute("data-theme", "dark");
    expect(currentTheme(asElement(container))).toBe(
      "https://site/giscus/dark.css"
    );
  });

  it("falls back to the built-in themes when no stylesheet is supplied", () => {
    // Losing the custom look beats losing the whole widget.
    expect(currentTheme(asElement(container))).toBe("light");

    root.setAttribute("data-theme", "dark");
    expect(currentTheme(asElement(container))).toBe("dark");
  });

  it("does not forward the theme URLs to giscus as settings", () => {
    // They are ours; giscus only understands the resolved data-theme.
    container.setAttribute("data-theme-light", "https://site/giscus/light.css");
    mountGiscus(asElement(container), "https://site/giscus/light.css");
    const script = container.children[0] as FakeScript;

    expect(script.getAttribute("data-theme-light")).toBeNull();
    expect(script.getAttribute("data-theme")).toBe(
      "https://site/giscus/light.css"
    );
  });

  it("forwards the container's settings onto the injected script", () => {
    mountGiscus(asElement(container), "dark");
    const script = container.children[0] as FakeScript;

    expect(script.src).toBe("https://giscus.app/client.js");
    expect(script.async).toBe(true);
    expect(script.crossOrigin).toBe("anonymous");
    expect(script.getAttribute("data-repo")).toBe("owner/blog");
    expect(script.getAttribute("data-repo-id")).toBe("R_test");
    expect(script.getAttribute("data-theme")).toBe("dark");
  });

  it("omits settings the container does not carry", () => {
    // A missing attribute must not become the string "null" in the markup.
    mountGiscus(asElement(container), "light");
    const script = container.children[0] as FakeScript;

    expect(script.getAttribute("data-category-id")).toBeNull();
  });

  it("clears the previous post's comments before mounting", () => {
    // Without this the widget stacks up one copy per navigation.
    mountGiscus(asElement(container), "light");
    mountGiscus(asElement(container), "light");

    expect(container.children).toHaveLength(1);
  });

  it("messages the giscus frame on its own origin when the theme changes", () => {
    frame = { contentWindow: { postMessage } };
    syncTheme("dark");

    expect(postMessage).toHaveBeenCalledWith(
      { giscus: { setConfig: { theme: "dark" } } },
      "https://giscus.app"
    );
  });

  it("stays quiet when the frame has not loaded yet", () => {
    frame = null;
    expect(() => syncTheme("dark")).not.toThrow();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("watches only data-theme and stops watching on cleanup", () => {
    frame = { contentWindow: { postMessage } };
    const cleanup = initComments();

    expect(observed).toEqual({
      target: root,
      options: { attributes: true, attributeFilter: ["data-theme"] },
    });

    root.setAttribute("data-theme", "dark");
    mutate();
    expect(postMessage).toHaveBeenCalledWith(
      { giscus: { setConfig: { theme: "dark" } } },
      "https://giscus.app"
    );

    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });
});
