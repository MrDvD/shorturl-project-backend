import { sha256 } from 'crypto-hash';

export async function hash(url: string): Promise<string> {
  const hash = await sha256(url);
  return hash.substring(0, 6);
}
