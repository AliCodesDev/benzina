import { NextRequest } from 'next/server';

export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get('admin-session')?.value;

  if (!sessionToken) {
    return false;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(adminPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedToken = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return sessionToken === expectedToken;
}
