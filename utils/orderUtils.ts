/**
 * Génère un ID de commande attractif à partir d'un ID MongoDB
 * Format: CMD-XXXXXX (6 caractères alphanumériques en majuscules)
 * Le même ID MongoDB génère toujours le même ID attractif
 */
export const generateOrderId = (mongoId: string): string => {
  if (!mongoId) return 'CMD-000000';
  
  // Utiliser les 6 derniers caractères de l'ID MongoDB et les convertir en majuscules
  const shortId = mongoId.slice(-6).toUpperCase();
  return `CMD-${shortId}`;
};

/**
 * Génère un numéro de commande court pour l'affichage
 * Format: #XXXXXX
 */
export const generateOrderNumber = (mongoId: string): string => {
  if (!mongoId) return '#000000';
  
  const shortId = mongoId.slice(-6).toUpperCase();
  return `#${shortId}`;
};

/**
 * Génère un ID de commande avec préfixe personnalisé
 */
export const generateCustomOrderId = (mongoId: string, prefix: string = 'ORD'): string => {
  if (!mongoId) return `${prefix}-000000`;
  
  const shortId = mongoId.slice(-6).toUpperCase();
  return `${prefix}-${shortId}`;
};

/**
 * Extrait l'ID MongoDB original depuis un ID formaté (si nécessaire pour les appels API)
 * Note: Cette fonction n'est pas utilisée car on garde l'ID original en interne
 */
export const extractMongoId = (formattedId: string): string => {
  // Cette fonction est un placeholder au cas où on aurait besoin de retrouver l'ID original
  // Pour l'instant, on garde toujours l'ID MongoDB original en interne
  return formattedId.replace(/^[A-Z]+-/, '');
};
