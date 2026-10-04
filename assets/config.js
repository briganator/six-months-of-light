// Public config. The publishable key is SAFE to ship in a static site: the database
// only allows reading approved comments and calling the submit/admin functions
// (admin functions check a password server-side). Never put a service_role key here.
window.CONF_CONFIG = {
  backend: "supabase",            // "supabase" or "local" (browser-only mock, for previews)
  supabaseUrl: "https://yrofrjdmhnudqbuvukqm.supabase.co",
  supabaseKey: "sb_publishable_CTdJCpH-2P34ANI0Qq3SrQ_9ZbQ-KqB",
  maxLength: 280,
  nameMaxLength: 40
};
// Add ?mock=1 to any URL to use the local (browser-only) mock backend instead.
if (new URLSearchParams(location.search).get("mock") === "1") window.CONF_CONFIG.backend = "local";
