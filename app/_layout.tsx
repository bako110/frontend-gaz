import { Slot, useRouter, usePathname } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Appearance, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  // ========================================
  // HOOKS ET STATE
  // ========================================
  const router = useRouter();
  const currentPath = usePathname();
  
  const [lastPath, setLastPath] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs pour éviter les dépendances circulaires
  const currentPathRef = useRef('/');

  // ========================================
  // MISE À JOUR DES REFS
  // ========================================
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  // ========================================
  // FONCTIONS D'AUTHENTIFICATION
  // ========================================
  
  /**
   * Gère la redirection lors de l'initialisation
   */
  const handleInitialRedirection = useCallback(async () => {
    console.log('🟢 Initialisation - Authentification');

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      setTimeout(() => {
        if (token && userData) {
          router.replace('/auth/login');
        } else {
          router.replace('/');
        }
      }, 0);
    } catch (error) {
      console.log('❌ Erreur auth:', error);
      setTimeout(() => router.replace('/'), 0);
    }
  }, [router]);

  // ========================================
  // GESTION DES ÉVÉNEMENTS APP
  // ========================================
  
  /**
   * Gère le retour de l'app au premier plan
   */
  const handleAppStateChange = useCallback((nextAppState) => {
    if (nextAppState === 'active') {
      console.log('📱 App revenue au premier plan');
      
      // Vous pouvez ajouter ici d'autres logiques au retour de l'app
      // comme rafraîchir les données, etc.
    }
  }, []);

  // ========================================
  // EFFECTS D'INITIALISATION
  // ========================================
  
  /**
   * Initialisation principale de l'app (une seule fois)
   */
  useEffect(() => {
    if (isInitialized) return;

    const initializeApp = async () => {
      console.log('🚀 Initialisation de l\'app...');
      
      // Configuration du thème
      Appearance.setColorScheme('light');
      
      // Gestion de la redirection initiale
      await handleInitialRedirection();
      
      setIsInitialized(true);
    };

    initializeApp();
  }, [isInitialized, handleInitialRedirection]);

  /**
   * Configuration des listeners après l'initialisation
   */
  useEffect(() => {
    if (!isInitialized) return;

    // Listener pour les changements d'état de l'app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Nettoyage
    return () => {
      console.log('🧹 Nettoyage...');
      subscription?.remove();
    };
  }, [isInitialized, handleAppStateChange]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}