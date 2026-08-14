import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
// [CUSTOM] 업스트림에 없는 import. 분류 필드와 교차 검증은 전부
// src/taxonomySchema.ts 에 있습니다.
import { taxonomyFields, validateTaxonomy } from "@/taxonomySchema";
import { SERIES_IDS } from "@/series";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        // [CUSTOM] 테마를 검사하기 위한 표본 글. draft와 뜻이 다르다 —
        // draft는 "아직 안 쓴 글", fixture는 "테스트 데이터"다. 프로덕션
        // 빌드에서만 빠지고 개발·검사 빌드에는 남는다. postFilter 참고.
        fixture: z.boolean().optional(),
        tags: z.array(z.string()).default(["others"]),
        // [CUSTOM] category / subcategory / series / seriesOrder 네 필드.
        ...taxonomyFields,
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        canonicalURL: z.string().optional(),
        timezone: z.string().optional(),
      })
      // [CUSTOM] 필드 간 교차 검증. 규칙 본문은 taxonomySchema.ts 참고.
      .superRefine(validateTaxonomy),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

const httpUrl = z
  .url()
  .refine(
    value => /^https?:\/\//i.test(value),
    "HTTP(S) URL만 사용할 수 있습니다."
  );

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  period: z.string().min(1),
  role: z.string().min(1),
  stack: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  repository: httpUrl.optional(),
  website: httpUrl.optional(),
  order: z.number().int().nonnegative(),
  // [CUSTOM] 그 프로젝트를 만든 과정을 적은 연재. 없는 프로젝트가 정상이므로
  // optional이며, 값을 쓰면 SERIES에 있는 id만 통과한다.
  series: z.enum(SERIES_IDS).optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: projectSchema,
});

export const collections = { posts, pages, projects };
