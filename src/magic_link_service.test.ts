import assert from "node:assert/strict";
import { requestSchema } from "./magic_link_service.js";

const parsed = requestSchema.safeParse({ email: "tenant@example.com", captchaToken: "token", widgetRecordId: "widget-record", maintenanceTitle: "Leaking sink", inspectionDue: "2026-10-15" });
assert.equal(parsed.success, true);
assert.equal(requestSchema.safeParse({ email: "bad", captchaToken: "token", widgetRecordId: "widget-record", maintenanceTitle: "x", inspectionDue: "2026-10-15" }).success, false);
console.log("request boundary checks passed");
