interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Blog title shown in header and meta tags */
  title: string;
  /** Short description used in SEO meta and RSS feed */
  description: string;
  /** Default post author name */
  author: string;
  /** Author's role or job title, e.g. "Software Engineer" */
  role?: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Fallback OG image filename in /public, e.g. "og.jpg" */
  ogImage?: string;
  /** HTML lang attribute, defaults to "en" */
  lang?: string;
  /** IANA timezone for post dates, e.g. "Asia/Bangkok" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
  /**
   * Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX". Public by design —
   * it ships in the HTML. Collection only: the site never displays the numbers,
   * which would require the GA4 Data API and therefore a server.
   *
   * Leave unset to disable GA entirely.
   */
  gaMeasurementId?: string;
}

interface PostsConfig {
  /** Posts per page on paginated listing pages */
  perPage?: number;
  /** Posts shown on the index/home page */
  perIndex?: number;
  /**
   * Scheduled posts within this window (ms) of their pubDatetime
   * are shown as published. Defaults to 15 minutes.
   */
  scheduledPostMargin?: number;
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /**
   * Generate dynamic OG images per post and provide `/og.png` when the static
   * `public/{site.ogImage}` file is absent. When false, that file is required
   * for the default layout OG image (build fails if missing).
   */
  dynamicOgImage?: boolean;
  /** Show the /archives page and link it in nav. Defaults to true. */
  showArchives?: boolean;
  /**
   * Show the /about page and link it in nav. Defaults to true.
   *
   * The project detail pages under /projects/ are reachable only from About,
   * so turning this off drops them from the build too — otherwise they would
   * stay published with nothing linking to them.
   */
  showAbout?: boolean;
  /** Show back button on post detail pages. Defaults to true. */
  showBackButton?: boolean;
  /**
   * Search provider. "pagefind" ships in the base template.
   * Set to false to disable search entirely.
   */
  search?: "pagefind" | false;
}

interface SocialLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

/**
 * giscus comments on post pages. Every value here is public — it ships in the
 * page HTML — so it belongs in the config file rather than an env var. Get the
 * IDs from giscus.app after enabling Discussions on the repository.
 *
 * Omit the whole block to turn comments off.
 */
interface CommentsConfig {
  /** "owner/name" of the public repo holding the discussions */
  repo: string;
  /** Repository node ID, e.g. "R_kgDO..." */
  repoId: string;
  /** Discussion category name, e.g. "Comments" */
  category: string;
  /** Category node ID, e.g. "DIC_kwDO..." */
  categoryId: string;
  /**
   * How a page is matched to its discussion. "pathname" survives title edits;
   * changing a post's URL is what orphans its comments.
   */
  mapping?: "pathname" | "url" | "title" | "og:title";
  /** Show the reaction bar above the comment box. Defaults to true. */
  reactionsEnabled?: boolean;
  /** giscus UI language. Defaults to the site language. */
  lang?: string;
}

interface AstroPaperConfig {
  site: SiteConfig;
  posts?: PostsConfig;
  features?: FeaturesConfig;
  /** Social profile links shown in header/footer */
  socials?: SocialLink[];
  /** giscus comments. Omit to disable. */
  comments?: CommentsConfig;
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<
    SiteConfig,
    "role" | "profile" | "googleVerification" | "gaMeasurementId"
  >;

type ResolvedCommentsConfig = Required<CommentsConfig>;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  posts: Required<PostsConfig>;
  features: Required<FeaturesConfig>;
  socials: SocialLink[];
  /** Undefined when comments are turned off. */
  comments?: ResolvedCommentsConfig;
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides full IntelliSense without any runtime overhead.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  return config;
}
