import * as jose from 'jose';

/**
 * BankingApiClient handles authentication, request signing, and standardized
 * communication with the production banking APIs.
 */
class BankingApiClient {
  private baseUrl: string = '/api/v1/citi/proxy'; // Use backend proxy to avoid CORS
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('BANKING_ACCESS_TOKEN');
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('BANKING_ACCESS_TOKEN', token);
  }

  private async getJwsSignature(payload: any): Promise<string> {
    const secret = import.meta.env.VITE_CITI_CLIENT_SECRET || 'placeholder_secret';
    const key = new TextEncoder().encode(secret);
    
    // Create a JWS Compact signature
    const jws = await new jose.CompactSign(
      new TextEncoder().encode(JSON.stringify(payload))
    )
      .setProtectedHeader({ alg: 'HS256', kid: import.meta.env.VITE_CITI_CLIENT_ID })
      .sign(key);

    // Detach the payload for Citi API format: [header]..[signature]
    const parts = jws.split('.');
    return `${parts[0]}..${parts[2]}`;
  }

  private async getHeaders(payload: any, contentType: string = 'application/json'): Promise<HeadersInit> {
    const headers: any = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': contentType,
      'uuid': crypto.randomUUID(),
      'client_id': import.meta.env.VITE_CITI_CLIENT_ID || '',
    };

    if (payload) {
      headers['x-jws-signature'] = await this.getJwsSignature(payload);
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('BankingApiClient: Fetching URL:', url);
    
    const payload = options.body ? JSON.parse(options.body as string) : null;
    const headers = await this.getHeaders(payload, options.headers ? (options.headers as any)['Content-Type'] : 'application/json');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const bankingApiClient = new BankingApiClient();
