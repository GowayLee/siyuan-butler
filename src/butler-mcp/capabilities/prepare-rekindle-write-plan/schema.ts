import { z } from "zod";

import { rekindleProposalSchema } from "../shared/schemas.js";

export const prepareRekindleWritePlanInputSchema = {
  plan_id: z.string().optional(),
  journal_date: z.string().optional(),
  scope_note: z.string().optional(),
  proposal: rekindleProposalSchema,
};
