import { z } from "zod";

import { sectionKindSchema } from "../shared/schemas.js";

export const resolveDailyJournalTargetInputSchema = {
  journal_date: z.string(),
  section_kind: sectionKindSchema,
  section_label: z.string().optional(),
};
