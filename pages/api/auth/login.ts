// Fix: Use type-only import for NextApiRequest to correct type resolution.
import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';

// Système simple en mémoire pour limiter les tentatives de connexion par IP
const loginAttempts = new Map<string, { count: number; expiry: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const attempts = loginAttempts.get(ip);

  if (attempts && attempts.count >= MAX_ATTEMPTS && Date.now() < attempts.expiry) {
    return res.status(429).json({ message: 'Trop de tentatives. Veuillez réessayer dans 5 minutes.' });
  }

  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === ADMIN_PASSWORD) {
    // Succès : on supprime les tentatives précédentes pour cette IP
    loginAttempts.delete(ip);
    
    // On génère un jeton CSRF sécurisé
    const csrfToken = randomBytes(32).toString('hex');
    const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    
    // On définit les cookies : un pour l'authentification (HttpOnly) et un pour le jeton CSRF
    res.setHeader('Set-Cookie', [
      `admin_auth=true; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict${secureCookie}`,
      `csrf_token=${csrfToken}; Path=/; Max-Age=86400; SameSite=Strict${secureCookie}` // Non HttpOnly pour être lisible par le client
    ]);
    
    return res.status(200).json({ success: true });
  } else {
    // Échec : on enregistre la tentative
    const newCount = (attempts?.count || 0) + 1;
    const newExpiry = Date.now() + LOCKOUT_PERIOD;
    loginAttempts.set(ip, { count: newCount, expiry: newExpiry });

    // Nettoyage de l'entrée après la période de blocage pour éviter les fuites de mémoire
    setTimeout(() => {
        const currentAttempt = loginAttempts.get(ip);
        if(currentAttempt && currentAttempt.expiry <= Date.now()){
            loginAttempts.delete(ip);
        }
    }, LOCKOUT_PERIOD);

    return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
  }
}