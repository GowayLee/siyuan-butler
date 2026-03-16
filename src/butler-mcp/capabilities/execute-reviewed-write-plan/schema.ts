import { z } from "zod";

import { reviewResultSchema } from "../shared/schemas.js";

export const executeReviewedWritePlanInputSchema = {
  review_result: reviewResultSchema,
  confirmation_granted: z.boolean().optional(),
};
