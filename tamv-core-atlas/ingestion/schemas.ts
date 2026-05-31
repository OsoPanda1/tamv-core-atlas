import { z } from "zod";

export const RepoInputSchema = z.object({
  name: z.string().min(1).max(120).regex(/^[A-Za-z0-9._-]+$/),
  url: z.string().url(),
  defaultBranch: z.string().min(1).max(120).optional(),
  sha: z.string().min(4).max(64).optional(),
  archived: z.boolean().optional().default(false),
  fork: z.boolean().optional().default(false),
  pushedAt: z.string().datetime().optional(),
});

export const StackSchema = z.object({
  languages: z.array(z.string().min(1).max(40)).max(20).default([]),
  frameworks: z.array(z.string().min(1).max(40)).max(20).default([]),
  tools: z.array(z.string().min(1).max(40)).max(30).default([]),
});

export const ClassificationSchema = z.object({
  category: z.string().min(1).max(60),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string().max(200)).max(20).default([]),
});

export const RelationSchema = z.object({
  type: z.string().min(1).max(50),
  target: z.string().min(1).max(120),
  weight: z.number().min(0).max(100).default(1),
});

export const RepoMetaSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  url: z.string().url(),
  defaultBranch: z.string().max(120).optional(),
  sha: z.string().max(64).optional(),
  category: z.string().min(1).max(60).default("experiment"),
  classification: ClassificationSchema.optional(),
  tags: z.array(z.string().min(1).max(40)).max(50).default([]),
  purpose: z.string().max(5000).default(""),
  stack: StackSchema.default({ languages: [], frameworks: [], tools: [] }),
  entrypoints: z.array(z.string().max(200)).max(20).default([]),
  commands: z.record(z.string().max(200)).default({}),
  relations: z.array(RelationSchema).default([]),
  collectedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type RepoInput = z.infer<typeof RepoInputSchema>;
export type RepoMeta = z.infer<typeof RepoMetaSchema>;
export type Stack = z.infer<typeof StackSchema>;
export type Relation = z.infer<typeof RelationSchema>;