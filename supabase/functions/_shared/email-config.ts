// ============================================================================================================
//  EMAIL CONFIG: SENDING IS OFF.
//  Turn on only after the Resend account is set up and sixmonthsoflight.com is verified there:
//    1. Supabase → Edge Functions → Secrets: add RESEND_API_KEY.
//    2. SQL: update private.app_config set value = 'true' where key = 'email_enabled';
//  Until both are done, the site shows "Email is coming soon", no addresses are collected and nothing is sent.
// ============================================================================================================
export const EMAIL = {
  provider: "resend",                                              // https://resend.com (free tier: 3,000 emails/month, 100/day)
  from: "Six Months of Light <hello@sixmonthsoflight.com>",        // pending Resend sign-up and domain verification
  replyTo: "hello@sixmonthsoflight.com",
  // Postal address required in every commercial-style email footer (CAN-SPAM). Approved; used only in emails, never on the site.
  mailingAddress: "Six Months of Light, 3196 N. 1075 W., Pleasant View, UT 84414",
  apiKey: () => Deno.env.get("RESEND_API_KEY") || "",
};
export async function sendEmail(to: string, subject: string, html: string, text: string, headers: Record<string, string> = {}) {
  const key = EMAIL.apiKey(); if (!key) throw new Error("Email sending is not configured (no RESEND_API_KEY).");
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL.from, to: [to], reply_to: EMAIL.replyTo, subject, html, text, headers }) });
  if (!r.ok) throw new Error("Resend " + r.status + " " + (await r.text()).slice(0, 200));
  return true;
}
