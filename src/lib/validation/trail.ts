import { z } from "zod";
export const preferencesSchema = z
  .object({
    cityId: z.string().min(1).max(50),
    neighborhood: z.string().max(100).default(""),
    preferredStyles: z.array(z.string().max(40)).max(18).default([]),
    excludedStyles: z.array(z.string().max(40)).max(18).default([]),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (s) =>
          !Number.isNaN(Date.parse(s)) &&
          new Date(s).toISOString().slice(0, 10) === s,
      ),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    availableMinutes: z.number().int().min(60).max(720),
    maximumStops: z.number().int().min(1).max(8),
    mode: z.enum(["walking", "cycling", "driving", "transit"]),
    visitMinutes: z.number().int().min(15).max(180).default(60),
    food: z.boolean().default(false),
    outdoor: z.boolean().default(false),
  })
  .strict();
export const saveTrailSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    preferences: preferencesSchema,
    locationIds: z
      .array(z.string().min(1).max(100))
      .min(1)
      .max(8)
      .refine(
        (x) => new Set(x).size === x.length,
        "Duplicate stops are not allowed",
      ),
  })
  .strict();
export type Preferences = z.infer<typeof preferencesSchema>;
