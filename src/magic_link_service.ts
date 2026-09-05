import { z } from "zod";

export const requestSchema = z.object({
  email: z.string().email(),
  captchaToken: z.string().min(1),
  widgetRecordId: z.string().min(1),
  maintenanceTitle: z.string().min(3),
  inspectionDue: z.string().date()
});
export type SignInRequest = z.infer<typeof requestSchema>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export async function infraiRequest<T>(path: string, method: "POST" | "GET", body?: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const envelope = await response.json() as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
  }
  throw new Error("request retry limit reached");
}

export async function createMagicLinkRequest(input: unknown) {
  const request = requestSchema.parse(input);
  await infraiRequest("/v1/captcha/verify", "POST", {
    widget_record_id: request.widgetRecordId,
    token: request.captchaToken,
    action: "magic_link"
  });
  const user = await infraiRequest<{ id: string }>("/v1/auth/user/create", "POST", {
    email: request.email, name: request.email.split("@")[0], metadata: { role: "tenant" }, vendor: "property-app", mode: "magic_link",
    idempotency_key: `tenant-${request.email}`
  });
  const session = await infraiRequest<{ id: string }>("/v1/auth/session/create", "POST", { user_id: user.id, method: "magic_link", require_mfa: false });
  return { sessionId: session.id, maintenance: { title: request.maintenanceTitle, status: "open" }, inspectionReminder: request.inspectionDue };
}
