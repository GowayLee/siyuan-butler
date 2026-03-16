import { z } from "zod";

import { sectionKindSchema } from "../shared/schemas.js";

export const readJournalContextInputSchema = {
  journal_date: z.string(),
  section_kind: sectionKindSchema.optional(),
};
