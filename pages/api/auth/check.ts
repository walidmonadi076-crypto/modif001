import type { NextApiRequest, NextApiResponse } from 'next';

// Vérification simple de la présence du cookie d'authentification.
function isAuthenticated(req: NextApiRequest): boolean {
  // Utilisation de l'optional chaining pour éviter les erreurs si req.cookies n'existe pas.
  return req.cookies?.admin_auth === 'true';
}

// Vérification de sécurité renforcée pour les points d'API qui modifient des données.
// Inclut une protection anti-CSRF via la méthode "Double Submit Cookie".
export function isAuthorized(req: NextApiRequest): boolean {
  if (!isAuthenticated(req)) {
    return false;
  }

  const isMutatingMethod = ['POST', 'PUT', 'DELETE'].includes(req.method || '');
  if (isMutatingMethod) {
    const csrfTokenFromHeader = req.headers['x-csrf-token'] as string;
    // Utilisation de l'optional chaining ici aussi pour la robustesse.
    const csrfTokenFromCookie = req.cookies?.csrf_token;

    if (!csrfTokenFromHeader || !csrfTokenFromCookie || csrfTokenFromHeader !== csrfTokenFromCookie) {
      console.warn(`Tentative d'action non autorisée (échec CSRF) depuis l'IP : ${req.socket.remoteAddress}`);
      return false;
    }
  }

  return true;
}

// Ce handler par défaut est utilisé pour vérifier si une session est active (ex: au chargement de la page admin).
// Une simple vérification d'authentification suffit ici.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authenticated = isAuthenticated(req);
  return res.status(200).json({ authenticated });
}
