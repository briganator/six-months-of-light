// Public config. The publishable key is SAFE to ship in a static site: the database
// only allows reading approved comments and calling the submit/admin functions
// (admin functions check a password server-side). Never put a service_role key here.
window.CONF_CONFIG = {
  backend: "supabase",            // "supabase" or "local" (browser-only mock, for previews)
  supabaseUrl: "https://yrofrjdmhnudqbuvukqm.supabase.co",
  supabaseKey: "sb_publishable_CTdJCpH-2P34ANI0Qq3SrQ_9ZbQ-KqB",
  maxLength: 280,
  nameMaxLength: 40,
  // "Keep the Light" reminders: public endpoints and the public half of the push key (the private half stays on the server)
  feedUrl: "https://yrofrjdmhnudqbuvukqm.supabase.co/functions/v1/feed",
  deliverUrl: "https://yrofrjdmhnudqbuvukqm.supabase.co/functions/v1/deliver",
  vapidPublicKey: "BO0uJtuNeJTb878dpP1bjjd9UFrmB6X1Bld_FjONpeUq_0naw3wPFKIqsACU6rIzHtvLLxcHweq40aCKPksUe_o",
  emailOpen: true                  // email sending is on (Resend); set false to hide the email form (see supabase/functions/_shared/email-config.ts)
};
// Add ?mock=1 to any URL to use the local (browser-only) mock backend instead.
if (new URLSearchParams(location.search).get("mock") === "1") window.CONF_CONFIG.backend = "local";
// Talk video for clips. Files are {talk-id}.mp4 on the same timeline as assets/timings/.
// This bucket allows cross-origin reads from https://sixmonthsoflight.com,
// https://www.sixmonthsoflight.com, and http://localhost:8000. Other origins are refused,
// including 127.0.0.1, other localhost ports, and briganator.github.io. Responses expose
// Content-Length, Content-Range, and Accept-Ranges, and Range requests return 206.
// The Church CDN does not send CORS, so a canvas export cannot use it.
// Any other origin can use a same-origin folder: clip.html?m=talk:moment&media=media/
window.CLIP_MEDIA_BASE = "https://pub-61fed319631f4fc3b830feae00835d32.r2.dev/";
