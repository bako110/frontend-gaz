import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook personnalisé pour vérifier le statut KYC avant d'effectuer une action
 * Retourne une fonction qui vérifie le KYC et affiche le modal si nécessaire
 */
export const useKYCCheck = () => {
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>('non_verifie');

  /**
   * Vérifie si l'utilisateur a un KYC vérifié
   * @returns true si KYC vérifié, false sinon
   */
  const checkKYCStatus = useCallback(async (): Promise<boolean> => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (!userProfile) {
        return false;
      }

      const parsedProfile = JSON.parse(userProfile);
      const status = parsedProfile.user?.kyc?.status || parsedProfile.kyc?.status || 'non_verifie';
      
      setKycStatus(status);
      
      return status === 'verifie';
    } catch (error) {
      console.error('Erreur vérification KYC:', error);
      return false;
    }
  }, []);

  /**
   * Vérifie le KYC avant d'exécuter une action
   * Si KYC non vérifié, affiche le modal
   * Si KYC vérifié, exécute l'action
   * @param action - Fonction à exécuter si KYC vérifié
   */
  const checkKYCBeforeAction = useCallback(async (action: () => void | Promise<void>) => {
    const isVerified = await checkKYCStatus();
    
    if (isVerified) {
      // KYC vérifié, exécuter l'action
      await action();
    } else {
      // KYC non vérifié, afficher le modal
      setShowKYCModal(true);
    }
  }, [checkKYCStatus]);

  /**
   * Ferme le modal KYC
   */
  const closeKYCModal = useCallback(() => {
    setShowKYCModal(false);
  }, []);

  return {
    showKYCModal,
    kycStatus,
    checkKYCBeforeAction,
    closeKYCModal,
    checkKYCStatus,
  };
};
