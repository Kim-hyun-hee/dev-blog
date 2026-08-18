import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Analytics from "@/components/Analytics.astro";

// The component reads the resolved config, so the mock exposes a single site
// object the tests mutate between cases.
const mocks = vi.hoisted(() => ({
  site: {} as { gaMeasurementId?: string },
}));

vi.mock("@/config", () => ({ default: { site: mocks.site } }));

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Analytics);
};

beforeEach(() => {
  delete mocks.site.gaMeasurementId;
});

describe("Analytics", () => {
  it("renders nothing when no measurement ID is configured", async () => {
    // Local dev and CI builds leave the ID unset and must not report to GA.
    expect((await render()).trim()).toBe("");
  });

  it("loads gtag.js with the configured measurement ID", async () => {
    mocks.site.gaMeasurementId = "G-TEST12345";

    expect(await render()).toContain(
      "https://www.googletagmanager.com/gtag/js?id=G-TEST12345"
    );
  });

  it("reports page views from astro:page-load rather than gtag's own", async () => {
    // <ClientRouter /> swaps the DOM instead of reloading, so gtag's built-in
    // page_view would only ever fire for the first page of a visit.
    mocks.site.gaMeasurementId = "G-TEST12345";
    const html = await render();

    expect(html).toMatch(/send_page_view:\s*false/);
    expect(html).toContain("astro:page-load");
    expect(html).toContain('"page_view"');
  });

  it("registers the page-view listener only once", async () => {
    // Astro keeps identical head scripts across swaps, but a re-run would
    // double-count every navigation, so the guard is asserted explicitly.
    mocks.site.gaMeasurementId = "G-TEST12345";
    const html = await render();

    expect(html).toContain("__gaPageView");
  });
});
