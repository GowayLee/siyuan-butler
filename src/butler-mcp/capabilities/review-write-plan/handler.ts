import { reviewWritePlanCapability } from "../../../application/services/review-service.js";
import type { writePlanSchema } from "../shared/schemas.js";
import type { z } from "zod";

export function handleReviewWritePlan(input: {
  write_plan: z.infer<typeof writePlanSchema>;
}) {
  const review_result = reviewWritePlanCapability(input.write_plan);

  return { review_result };
}
