import { z } from "zod";

import { reviewTokenSchema } from "../shared/schemas.js";

export const executeReviewedWritePlanInputSchema = {
  review_token: reviewTokenSchema,
  confirmation_granted: z.boolean().optional(),
};
