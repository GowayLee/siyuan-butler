import { executeReviewedWritePlanCapability } from "../../../application/services/controlled-write-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import type { reviewResultSchema } from "../shared/schemas.js";
import type { z } from "zod";

export async function handleExecuteReviewedWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    review_result: z.infer<typeof reviewResultSchema>;
    confirmation_granted?: boolean;
  },
) {
  const receipt = await executeReviewedWritePlanCapability(context.adapter, input);

  return { receipt };
}
