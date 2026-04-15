import { z } from "zod";

const Schema = z.object({
  RESEND_API_KEY: z.string().min(1),
  RESEND_AUDIENCE_ID: z.string().min(1),
});

export const env = Schema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
});
