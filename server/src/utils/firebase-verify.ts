import jwt from 'jsonwebtoken';
import axios from 'axios';

let cachedKeys: Record<string, string> | null = null;
let keysFetchedAt = 0;
const KEY_CACHE_TTL = 60 * 60 * 1000;

async function getFirebasePublicKeys(): Promise<Record<string, string>> {
  if (cachedKeys && Date.now() - keysFetchedAt < KEY_CACHE_TTL) {
    return cachedKeys;
  }
  const { data } = await axios.get(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  cachedKeys = data;
  keysFetchedAt = Date.now();
  return data;
}

export async function verifyFirebaseToken(idToken: string) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'startup-16d5b';

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header?.kid) {
    throw new Error('Invalid Firebase token format');
  }

  const keys = await getFirebasePublicKeys();
  const publicKey = keys[decoded.header.kid];
  if (!publicKey) {
    throw new Error('Firebase public key not found for token kid');
  }

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  }) as jwt.JwtPayload;

  return {
    uid: payload.sub!,
    email: payload.email || '',
    name: payload.name || '',
    picture: payload.picture || '',
  };
}
