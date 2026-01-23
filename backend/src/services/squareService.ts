import dotenv from 'dotenv';

dotenv.config();

// Check environment variables and log helpful errors
const accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
const environment = process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN is missing!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SQUARE')));
  throw new Error('SQUARE_ACCESS_TOKEN is required');
}

export const locationId = process.env.SQUARE_LOCATION_ID || '';

if (!locationId) {
  console.error('❌ SQUARE_LOCATION_ID is missing!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SQUARE')));
  throw new Error('SQUARE_LOCATION_ID is required');
}

// Square API base URL
export const squareBaseUrl = environment === 'production' 
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';

// Helper function to make Square API requests
export async function squareApiRequest(method: string, path: string, body?: any) {
  const url = `${squareBaseUrl}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Square-Version': '2024-01-18',
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Square API error: ${response.status}\n${JSON.stringify(data, null, 2)}`);
  }

  return data;
}

// Keep squareClient for backward compatibility but mark as deprecated
// Note: The SDK has authentication issues, so we use direct API calls instead
export const squareClient = null as any;

