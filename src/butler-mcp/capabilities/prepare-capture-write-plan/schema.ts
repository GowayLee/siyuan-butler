import { z } from "zod";

import { sparkleDraftSchema } from "../shared/schemas.js";

export const prepareCaptureWritePlanInputSchema = {
  journal_date: z.string(),
  section_label: z.string().optional(),
  scope_note: z.string().optional(),
  draft: sparkleDraftSchema,
};
