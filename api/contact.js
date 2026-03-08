module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_CONTACT_TABLE || "contact_inquiries";

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: "Form backend is not configured. Add Supabase environment variables in Vercel."
    });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const company = String(body.company || "").trim();
  const interest = String(body.interest || "").trim();
  const message = String(body.message || "").trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const response = await fetch(
    supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + table,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: "Bearer " + serviceRoleKey,
        Prefer: "return=minimal"
      },
      body: JSON.stringify([
        {
          name,
          email,
          company,
          interest,
          message,
          source: "productmusketeers.com",
          created_at: new Date().toISOString()
        }
      ])
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return res.status(500).json({
      error: "Unable to store inquiry in Supabase.",
      details: errorText
    });
  }

  return res.status(200).json({ ok: true });
};
