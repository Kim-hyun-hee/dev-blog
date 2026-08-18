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
    site: { lang: "ko" },
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
  it("reads the theme theme.ts wrote on the document element", () => {
    expect(currentTheme()).toBe("light");

    root.setAttribute("data-theme", "dark");
    expect(currentTheme()).toBe("dark");
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
