import { useEffect, useRef } from 'react';
import { BackHandler, Alert, AppState } from 'react-native';

export const useExitAlert = () => {
  const backPressCount = useRef(0);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      backPressCount.current += 1;

      if (backPressCount.current === 1) {
        // Premier appui
        Alert.alert(
          'Quitter l\'application',
          'Appuyez à nouveau pour quitter l\'application',
          [
            {
              text: 'Annuler',
              onPress: () => {
                backPressCount.current = 0;
              },
              style: 'cancel',
            },
          ]
        );

        // Réinitialiser après 2 secondes
        setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);

        return true;
      } else if (backPressCount.current === 2) {
        // Deuxième appui - mettre l'app en arrière-plan
        BackHandler.exitApp();
        return true;
      }

      return false;
    });

    return () => backHandler.remove();
  }, []);
};


