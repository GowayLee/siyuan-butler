import { z } from "zod";

import { sparkleDraftSchema } from "../shared/schemas.js";

export const prepareCaptureWritePlanInputSchema = {
  plan_id: z.string().optional(),
  journal_date: z.string(),
  section_label: z.string().optional(),
  scope_note: z.string().optional(),
  draft: sparkleDraftSchema,
};
