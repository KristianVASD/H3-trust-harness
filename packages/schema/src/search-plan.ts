import { z } from "zod";

/** Layer in the shared search plan — maps 1:1 to Source.scope. */
export const SearchPlanLayerSchema = z.enum(["national", "regional", "local"]);
export type SearchPlanLayer = z.infer<typeof SearchPlanLayerSchema>;

export const SearchPlanEntrySchema = z.object({
  layer: SearchPlanLayerSchema,
  /** Must match a Source.category value. */
  category: z.string().min(1),
  /** Human-editable guidance for judging a source in this category × layer. */
  nuance_rule: z.string().optional(),
});
export type SearchPlanEntry = z.infer<typeof SearchPlanEntrySchema>;

export const SearchPlanSchema = z.object({
  version: z.string().min(1),
  label: z.string().optional(),
  entries: z.array(SearchPlanEntrySchema).min(1),
});
export type SearchPlan = z.infer<typeof SearchPlanSchema>;

/** Filename stem without .json — e.g. "default.v1". */
export const DEFAULT_SEARCH_PLAN_VERSION = "default.v1";
