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
