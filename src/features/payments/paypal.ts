const baseUrl = () => process.env.PAYPAL_ENVIRONMENT === "live"
  ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export async function paypalAccessToken() {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store"
  });
  if (!response.ok) throw new Error("PayPal-Authentifizierung fehlgeschlagen.");
  return (await response.json() as { access_token: string }).access_token;
}

export async function paypalRequest(path: string, options: RequestInit) {
  return fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${await paypalAccessToken()}`, "Content-Type": "application/json", ...options.headers },
    cache: "no-store"
  });
}
