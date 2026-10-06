// Email templates for "Get a talk". Plain, readable on phones, images optional (alt text set), links back to the site.
import { EMAIL } from "./email-config.ts";
import type { Item } from "./content.ts";
const h = (s: string) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const shell = (pre: string, inner: string, footer: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;background:#f4efe6;font-family:Georgia,'Times New Roman',serif;color:#1f2433">
<div style="display:none;max-height:0;overflow:hidden">${h(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border-radius:14px;overflow:hidden;border:1px solid #e8dfcf">
<tr><td style="background:#0d1326;padding:18px 24px;color:#f1d79a;font-size:15px;letter-spacing:.08em;text-transform:uppercase">Six Months of Light</td></tr>
<tr><td style="padding:24px">${inner}</td></tr></table>
<p style="max-width:560px;font:12px/1.5 Arial,sans-serif;color:#6b6457;margin:16px auto 0">${footer}</p>
</td></tr></table></body></html>`;
const btn = (href: string, label: string, gold = true) => `<a href="${h(href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:11px 18px;border-radius:999px;font:600 15px Arial,sans-serif;text-decoration:none;${gold ? "background:#d9b25f;color:#1b1608" : "background:#eef1f7;color:#1f2433"}">${h(label)}</a>`;
const foot = (unsub: string, manage: string) => `You're receiving this because you signed up at sixmonthsoflight.com. <a href="${h(unsub)}" style="color:#6b6457">Unsubscribe</a> (one click) · <a href="${h(manage)}" style="color:#6b6457">Change what you get</a><br>
Six Months of Light is not an official website of The Church of Jesus Christ of Latter-day Saints. Quotes are short excerpts from the official talk text; read the full talks at ChurchofJesusChrist.org.<br>${h(EMAIL.mailingAddress)}`;

export function deliveryEmail(it: Item, unsub: string, manage: string) {
  const subject = it.kind === "quote" ? `Quote card · ${it.text.split(" · ")[0]}` : `${it.label}: ${it.title}`.slice(0, 120);
  const body = it.kind === "quote" && !it.title.endsWith("…”") ? it.lines.slice(1) : it.lines;
  const lines = body.map(l => `<p style="font-size:17px;line-height:1.55;margin:0 0 12px">${h(l)}</p>`).join("");
  const img = it.image ? `<a href="${h(it.card || it.url)}"><img src="${h(it.image)}" width="512" alt="${h(it.kind === "quote" ? "Quote card: " + it.title : it.title)}" style="display:block;width:100%;max-width:512px;height:auto;border-radius:10px;margin:0 0 18px"></a>` : "";
  const inner = `<p style="font:600 12px Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#9a7a2e;margin:0 0 6px">${h(it.label)}</p>
<h1 style="font-size:26px;line-height:1.25;margin:0 0 4px;font-weight:600">${h(it.title)}</h1><p style="font:14px Arial,sans-serif;color:#6b6457;margin:0 0 18px">${h(it.text)}</p>
${img}${lines}
<div style="background:#f6efe0;border-radius:10px;padding:14px 16px;margin:18px 0"><p style="font:600 12px Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#9a7a2e;margin:0 0 4px">Reflect</p><p style="font-size:17px;line-height:1.5;margin:0">${h(it.reflect)}</p></div>
${btn(it.url, it.kind === "lesson" ? "Open the full outline" : it.kind === "quote" ? "Open the quote" : "Read more")}${it.card && it.card !== it.url ? btn(it.card, "Make it a card", false) : ""}`;
  const text = [it.label.toUpperCase(), it.title, it.text, "", ...body, "", "Reflect: " + it.reflect, "", "Open: " + it.url, ...(it.card && it.card !== it.url ? ["Make it a card: " + it.card] : []), "", "---", "Unsubscribe (one click): " + unsub, "Change what you get: " + manage, "Not an official Church site.", EMAIL.mailingAddress].join("\n");
  return { subject, html: shell(it.reflect, inner, foot(unsub, manage)), text };
}
export function confirmEmail(confirmUrl: string, summary: string) {
  const inner = `<h1 style="font-size:26px;margin:0 0 10px;font-weight:600">Confirm your subscription</h1>
<p style="font-size:17px;line-height:1.55">Tap below to start getting ${h(summary)} from October 2026 General Conference.</p>${btn(confirmUrl, "Yes, send them")}
<p style="font:13px Arial,sans-serif;color:#6b6457;margin-top:18px">Didn't sign up? Ignore this email and you won't hear from us again.</p>`;
  const text = `Confirm your subscription\n\nOpen this link to start getting ${summary} from October 2026 General Conference:\n${confirmUrl}\n\nDidn't sign up? Ignore this email and you won't hear from us again.\n\n---\nNot an official Church site.\n${EMAIL.mailingAddress}`;
  return { subject: "Confirm: Six Months of Light", html: shell("One tap to confirm.", inner, `Six Months of Light is not an official website of The Church of Jesus Christ of Latter-day Saints.<br>${h(EMAIL.mailingAddress)}`), text };
}
