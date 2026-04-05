import { format } from "morgan";
import { z } from "zod";

/**
 * @description Zod schema used to convert input objects to validated strongly-typed objects;
 * used in the context of bulk imports. We want to guarantee the structure of imported
 * records prior to executing further processing
 * @returns {Object} a value object representing data about a single wine
 */
const WineZodSchema = z.object({
  id: z.string().uuid().optional(),

  created_at: z.string().optional(), // keep as string; DB can cast to timestamptz

  name: z.string().min(1).transform(s => s.trim()),

  color: z.string()
    .min(1)
    .transform(s => s.trim().toLowerCase()),

  sparkling: z.coerce.boolean(),

  minerality: z.coerce.number(),

  description: z.string()
    .min(1)
    .transform(s => s.trim()),

  acidity: z.coerce.number(),

  body: z.string()
    .min(1)
    .transform(s => s.trim().toLowerCase()),

  tags: z.string()
    .optional()
    .transform(s => {
      if (!s || s.trim() === "") return null;
      return s.trim();
    }),

  vintage: z.string()
    .min(1)
    .transform(s => s.trim()),

  tasting_notes: z.string()
    .optional()
    .transform(s => {
      if (!s || s.trim() === "") return null;
      return s.trim();
    }),

  producer_id: z.string().uuid(),

  price: z.coerce.number(),

  sweetness: z.coerce.number(),

  kosher: z.coerce.boolean().optional(),

  name_tsv: z.string().optional().nullable(),
});


/**
 * Factory for generating Wine value objects
 */
export const Wine = (() => ({
    from(input) {
        return WineZodSchema.parse(input)
    }
}))();


