import { Alert } from 'react-native';

/**
 * Gère les erreurs liées au KYC depuis les réponses API
 * Détecte si une erreur est due à un KYC non vérifié
 * @param error - Erreur de l'API
 * @returns true si c'est une erreur KYC, false sinon
 */
export const isKYCError = (error: any): boolean => {
  if (!error) return false;
  
  // Vérifier si c'est une erreur 403 avec kycRequired
  if (error.response?.status === 403) {
    const data = error.response?.data;
    return data?.kycRequired === true || data?.action === 'verify_kyc';
  }
  
  // Vérifier le message d'erreur
  const message = error.message || error.response?.data?.message || '';
  return message.toLowerCase().includes('kyc') || 
         message.toLowerCase().includes('vérif') ||
         message.toLowerCase().includes('identité');
};

/**
 * Extrait le statut KYC depuis une erreur API
 * @param error - Erreur de l'API
 * @returns Statut KYC ou null
 */
export const getKYCStatusFromError = (error: any): string | null => {
  return error.response?.data?.kycStatus || null;
};

/**
 * Affiche un message d'erreur KYC approprié
 * @param kycStatus - Statut KYC actuel
 * @param onVerifyKYC - Callback pour ouvrir le modal KYC
 */
export const showKYCErrorAlert = (
  kycStatus: string,
  onVerifyKYC: () => void
) => {
  let message = '';
  
  switch (kycStatus) {
    case 'non_verifie':
      message = 'Vous devez vérifier votre identité pour effectuer cette action.';
      break;
    case 'en_cours':
      message = 'Votre vérification KYC est en cours de traitement. Veuillez patienter.';
      break;
    case 'rejete':
      message = 'Votre vérification KYC a été rejetée. Veuillez soumettre à nouveau vos documents.';
      break;
    default:
      message = 'Vérification KYC requise pour cette action.';
  }
  
  if (kycStatus === 'en_cours') {
    Alert.alert('Vérification en cours', message);
  } else {
    Alert.alert(
      'Vérification KYC requise',
      message,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Vérifier maintenant', onPress: onVerifyKYC }
      ]
    );
  }
};

/**
 * Vérifie si une action nécessite un KYC vérifié
 * @param actionType - Type d'action (order, delivery, product, etc.)
 * @returns true si KYC requis, false sinon
 */
export const isKYCRequiredForAction = (actionType: string): boolean => {
  const kycRequiredActions = [
    'order',
    'create_order',
    'delivery',
    'accept_delivery',
    'toggle_availability',
    'add_product',
    'update_product',
    'delete_product',
    'assign_delivery',
    'transaction',
    'withdraw'
  ];
  
  return kycRequiredActions.includes(actionType.toLowerCase());
};
