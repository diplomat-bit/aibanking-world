import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { callGemini, Type } from "./services/geminiService";
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import Stripe from 'stripe';

dotenv.config();

// Initialize Stripe
let stripeClient: Stripe | null = null;
const getStripe = () => {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
};

// Initialize Plaid
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

const app = express();
const PORT = 3000;
const SECRETS_FILE = path.join(process.cwd(), "secrets.json");

// Initialize Firebase Admin for server-side updates
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let adminDb: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    initializeApp({
      projectId: config.projectId,
    });
    adminDb = getFirestore();
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

app.use(cors());

// OIDC Discovery Endpoint
app.get("/.well-known/openid-configuration", (req: Request, res: Response) => {
  const configPath = path.join(process.cwd(), "api", "oidc-config.json");
  res.sendFile(configPath);
});

// Webhook needs raw body
app.post("/api/v1/stripe/webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const stripeSig = req.headers['stripe-signature'] as string;
  const mtSig = req.headers['x-signature'] as string;
  const secrets = loadSecrets();
  
  // Handle Modern Treasury Webhook
  if (mtSig) {
    const mtSecret = process.env.MT_WEBHOOK_KEY || secrets.MT_WEBHOOK_KEY;
    if (mtSecret) {
      try {
        const payload = req.body.toString();
        const expectedSignature = crypto
          .createHmac('sha256', mtSecret)
          .update(payload)
          .digest('hex');
        
        if (expectedSignature === mtSig) {
          console.log("Modern Treasury Webhook Received:", JSON.parse(payload));
          return res.json({ received: true });
        } else {
          console.error("Modern Treasury Signature Mismatch");
        }
      } catch (err: any) {
        console.error("Modern Treasury Webhook Error:", err.message);
      }
    }
  }

  // Handle Stripe Webhook
  if (stripeSig) {
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).send("Invalid JSON");
    }

    if (event && event.type) {
      console.log(`Stripe Webhook (${event.type}) received.`);
      return res.json({ received: true });
    }
  }

  res.json({ received: true });
});

app.use(bodyParser.json());

// Helper to load secrets
const loadSecrets = () => {
  if (fs.existsSync(SECRETS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SECRETS_FILE, "utf-8"));
    } catch (e) {
      console.error("Error parsing secrets file:", e);
      return {};
    }
  }
  return {};
};

// Helper to save secrets
const saveSecrets = (secrets: any) => {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2));
};

// Initialize secrets if file doesn't exist
if (!fs.existsSync(SECRETS_FILE)) {
  saveSecrets({});
}

// API for secrets management
app.get("/api/v1/config/secrets", (req: Request, res: Response) => {
  const secrets = loadSecrets();
  // Mask sensitive values before sending to frontend
  const maskedSecrets = Object.keys(secrets).reduce((acc: any, key) => {
    acc[key] = secrets[key] ? "********" : "";
    return acc;
  }, {});
  
  // Also include environment variables in the masked list if they exist
  const envKeys = ['CITI_CLIENT_ID', 'CITI_CLIENT_SECRET', 'VITE_AUTH0_DOMAIN', 'VITE_AUTH0_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID', 'VITE_AZURE_CLIENT_ID', 'VITE_AZURE_AUTHORITY'];
  envKeys.forEach(key => {
    if (process.env[key] && !maskedSecrets[key]) {
      maskedSecrets[key] = "********";
    }
  });

  res.json(maskedSecrets);
});

// Endpoint to get public config (non-sensitive)
app.get("/api/v1/config/public", (req: Request, res: Response) => {
  const config = getAppConfig();
  const secrets = loadSecrets();
  res.json({
    auth0: {
      domain: config.auth0.domain,
      clientId: config.auth0.clientId
    },
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || secrets.VITE_GOOGLE_CLIENT_ID || "",
    azure: {
      clientId: process.env.VITE_AZURE_CLIENT_ID || secrets.VITE_AZURE_CLIENT_ID || "",
      authority: process.env.VITE_AZURE_AUTHORITY || secrets.VITE_AZURE_AUTHORITY || ""
    }
  });
});

app.post("/api/v1/config/secrets", (req: Request, res: Response) => {
  const newSecrets = req.body;
  const currentSecrets = loadSecrets();
  
  // Only update if the value is not the masked placeholder
  const updatedSecrets = { ...currentSecrets };
  Object.keys(newSecrets).forEach(key => {
    if (newSecrets[key] !== "********") {
      updatedSecrets[key] = newSecrets[key];
    }
  });

  saveSecrets(updatedSecrets);
  res.json({ message: "Configuration saved successfully" });
});

// Lazy initialization for Gemini - No longer needed with direct fetch
const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is required");
  }
  return key;
};

// Plaid Endpoints




// Stripe Endpoints
app.post("/api/v1/stripe/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const { priceId } = req.body;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${protocol}://${host}`;

    let sessionOptions: any = {
      payment_method_types: ['card'],
      success_url: `${baseUrl}/?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?stripe_cancel=true`,
    };

    if (priceId) {
      sessionOptions.line_items = [{ price: priceId, quantity: 1 }];
      // For simplicity, we'll assume priceId is for one-time payment (e.g. points)
      // unless it's the specific subscription priceId.
      // Ideally we'd retrieve the price from Stripe to check if it's recurring.
      sessionOptions.mode = 'payment';
    } else {
      sessionOptions.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sovereign OS Pro Subscription',
            },
            unit_amount: 2900, // $29.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
      sessionOptions.mode = 'subscription';
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/stripe/session/:sessionId", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId as string);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get(["/citi/callback", "/citi/callback/"], async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  // Send success message to parent window and close popup
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: '${code}' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

// Plaid Endpoints
app.post("/api/v1/plaid/create-link-token", async (req: Request, res: Response) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'user-id' }, // In a real app, use the actual user ID
      client_name: 'Aquarius AI',
      products: ['auth', 'transactions'] as any,
      country_codes: ['US'] as any,
      language: 'en',
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Plaid Link Token Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/plaid/exchange-public-token", async (req: Request, res: Response) => {
  const { public_token } = req.body;
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    res.json({ access_token: accessToken, item_id: itemId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/plaid/accounts", async (req: Request, res: Response) => {
  const { access_token } = req.body;
  try {
    const response = await plaidClient.accountsGet({
      access_token,
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/plaid/transactions", async (req: Request, res: Response) => {
  const { access_token, start_date, end_date } = req.body;
  try {
    const response = await plaidClient.transactionsGet({
      access_token,
      start_date,
      end_date,
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// App Configuration Helper
const getAppConfig = () => {
  const secrets = loadSecrets();
  const citiClientId = process.env.CITI_CLIENT_ID || secrets.CITI_CLIENT_ID || "73709a4f-4cf2-418e-89a8-f39c1a849273";
  const citiClientSecret = process.env.CITI_CLIENT_SECRET || secrets.CITI_CLIENT_SECRET || "SECRET";
  
  return {
    citi: {
      clientId: citiClientId,
      clientSecret: citiClientSecret,
      uuid: "25e73a52-2c5e-4295-a4d4-9a1660bd2b92",
      tokenUrl: "https://partner.citi.com/gcgapi/sandbox/prod/api/identity/auth/v1/clientCredentials/oauth2/token/us/gcb",
      accountsUrl: "https://partner.citi.com/gcgapi/sandbox/prod/api/accounts",
      authBaseUrl: "https://partner.citi.com/api/identity/v1/authcode/oauth2/authorize",
      appAuth: `Basic ${Buffer.from(`${citiClientId}:${citiClientSecret}`).toString('base64')}`
    },
    auth0: {
      domain: process.env.VITE_AUTH0_DOMAIN || secrets.VITE_AUTH0_DOMAIN || "",
      clientId: process.env.VITE_AUTH0_CLIENT_ID || secrets.VITE_AUTH0_CLIENT_ID || ""
    }
  };
};

// AI Endpoints
app.post("/api/v1/ai/recommendations", async (req: Request, res: Response) => {
  const { contextSummary } = req.body;
  try {
    const prompt = `As Agora AI, an elite marketplace curator, suggest 6 highly personalized products for a high-net-worth individual based on these recent transactions: ${contextSummary}. 
    Respond in valid JSON format. Include: id, name, price, category, description, and aiReason (why it fits their spending profile).`;

    const response = await callGemini('gemini-2.0-flash', prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          products: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                aiReason: { type: Type.STRING }
              },
              required: ["id", "name", "price", "category", "description", "aiReason"]
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{"products": []}'));
  } catch (error: any) {
    console.error("AI Recommendation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/ai/forge", async (req: Request, res: Response) => {
  const { aiPrompt } = req.body;
  try {
    const prompt = `You are the Sovereignty OS Integration Architect. Analyze this integration idea: "${aiPrompt}". 
    Provide a high-fidelity technical roadmap in Markdown. Include:
    1. Architectural Design Pattern (e.g. Pub/Sub, Webhook Mesh)
    2. Required Demo Bank API Endpoints
    3. Security & Compliance (e.g. Zero-Knowledge Proofs, ISO20022 mapping)
    4. Performance Vectors (e.g. expected latency, throughput)
    Use professional, executive tone. No fluff.`;

    const result = await callGemini("gemini-2.0-flash", prompt);
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("AI Forge Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/citi/auth-url", (req: Request, res: Response) => {
  const config = getAppConfig().citi;
  // Use protocol-agnostic redirect URI
  const host = req.headers["x-forwarded-host"] || req.get("host");
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${protocol}://${host}/citi/callback`;
  
  // Construct the Citi authorize URL based on the Swift snippet logic
  const authorizeUrl = `${config.authBaseUrl}?response_type=code&client_id=${config.clientId}&scope=accounts_details_transactions customers_profiles&countryCode=US&businessCode=GCB&locale=en_US&state=12093&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.json({ url: authorizeUrl });
});

app.post("/api/v1/citi/token", async (req: Request, res: Response) => {
  const config = getAppConfig().citi;
  const { code, redirectUri } = req.body;
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": config.appAuth,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Citi API error: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error exchanging Citi token:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/citi/accounts", async (req: Request, res: Response) => {
  const config = getAppConfig().citi;
  const { access_token } = req.body;
  try {
    const response = await fetch(config.accountsUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "uuid": config.uuid,
        "client_id": config.clientId,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Citi API error: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching Citi accounts:", error);
    res.status(500).json({ error: error.message });
  }
});

app.all(/^\/api\/v1\/citi\/proxy\/(.*)/, async (req: Request, res: Response) => {
  const config = getAppConfig().citi;
  const path = req.params[0];
  const url = `https://api.citi.com/${path}`;
  
  try {
    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': req.headers['content-type'] as string || 'application/json',
      'uuid': req.headers['uuid'] as string || config.uuid,
      'client_id': req.headers['client_id'] as string || config.clientId,
    };

    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'];
    }
    if (req.headers['x-jws-signature']) {
      headers['x-jws-signature'] = req.headers['x-jws-signature'];
    }

    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Citi Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/azure-apps", (req: Request, res: Response) => {
  try {
    const appsPath = path.join(process.cwd(), "apps", "apps.json");
    if (!fs.existsSync(appsPath)) {
      return res.json({ apps: [] });
    }
    const data = fs.readFileSync(appsPath, "utf8");
    const apps = JSON.parse(data);
    res.json({ apps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/tools", (req: Request, res: Response) => {
  try {
    res.json({ tools: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
