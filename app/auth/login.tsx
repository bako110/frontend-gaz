import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pinLoginStyles from '@/styles/login';
import { API_BASE_URL } from '@/service/config';
import * as Location from 'expo-location';

export default function PinLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const themeColors = {
    primary: '#455A64',
    secondary: '#546E7A',
    accent: '#455A64',
    text: '#2D3748',
  };

  // Charger userId depuis params OU AsyncStorage
  useEffect(() => {
    const loadUserId = async () => {
      if (params.userId) {
        setUserId(params.userId);
        await AsyncStorage.setItem('userId', params.userId);
        console.log('Received userId from params:', params.userId);
      } else {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('Loaded userId from storage:', storedUserId);
        }
      }
    };
    loadUserId();
  }, [params.userId]);

  // Réinitialiser les tentatives échouées quand l'userId change
  useEffect(() => {
    setFailedAttempts(0);
  }, [userId]);

  // Ajout d'un chiffre au PIN
  const handlePinPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) handleLogin(newPin);
    }
  };

  // Suppression dernier chiffre
  const handleDelete = () => setPin(pin.slice(0, -1));

  // Gestion de la réinitialisation du PIN après 3 échecs
  const handleResetPin = () => {
    Alert.alert(
      'Réinitialisation du PIN',
      'Vous avez dépassé le nombre maximum de tentatives. Souhaitez-vous réinitialiser votre code PIN ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {
            setPin('');
            setFailedAttempts(0);
            // Optionnel: retour à l'écran précédent
            // router.back();
          }
        },
        {
          text: 'Réinitialiser',
          onPress: () => {
            // Redirection vers l'écran de réinitialisation du PIN
            router.push('/auth/reset-pin');
            setPin('');
            setFailedAttempts(0);
          }
        }
      ]
    );
  };

  // Affichage des points PIN
  const renderPinDots = () => (
    <View style={pinLoginStyles.pinDotsContainer}>
      {[...Array(4)].map((_, i) => (
        <View
          key={i}
          style={[
            pinLoginStyles.pinDot,
            { backgroundColor: i < pin.length ? themeColors.accent : '#E2E8F0' },
          ]}
        />
      ))}
    </View>
  );

  // Clavier numérique
  const renderNumericKeypad = () => {
    const buttons = [
      ['1','2','3'],
      ['4','5','6'],
      ['7','8','9'],
      ['','0','⌫'],
    ];

    return (
      <View style={pinLoginStyles.keypadContainer}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={pinLoginStyles.keypadRow}>
            {row.map((button, i) => (
              <TouchableOpacity
                key={i}
                style={[pinLoginStyles.keypadButton, button === '' && pinLoginStyles.hiddenButton]}
                onPress={() => {
                  if(button === '⌫') handleDelete();
                  else if(button !== '') handlePinPress(button);
                }}
                disabled={button === '' || loading}
              >
                <Text style={pinLoginStyles.keypadButtonText}>{button}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  // ✅ Fonction pour envoyer la localisation au serveur
  const sendLocationToServer = async (userId: string, token: string) => {
    try {
      console.log('🔄 [INFO] Demande de permission de localisation...');

      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('❌ [WARN] Permission de localisation refusée');
        Alert.alert(
          'Permission refusée', 
          'Autorisez la localisation pour que le livreur vous trouve plus facilement.'
        );
        return;
      }

      console.log('✅ [INFO] Permission accordée, récupération de la position...');

      // Récupérer la position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeout: 15000,
        maximumAge: 0,
      });

      const { latitude, longitude, altitude, accuracy, heading, speed } = location.coords;

      console.log('📍 [INFO] Position récupérée:', {
        latitude: latitude?.toFixed(7),
        longitude: longitude?.toFixed(7),
        accuracy: accuracy?.toFixed(2) + 'm',
        altitude: altitude ? altitude.toFixed(2) + 'm' : 'N/A',
        heading: heading ?? 'N/A',
        speed: speed ?? 'N/A',
        timestamp: new Date().toISOString()
      });

      // Validation des coordonnées
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordonnées GPS invalides');
      }

      // Préparer le payload
      const payload = {
        userId,
        latitude: parseFloat(latitude.toFixed(7)),
        longitude: parseFloat(longitude.toFixed(7)),
        accuracy: accuracy || null,
        altitude: altitude || null,
        heading: heading || null,
        speed: speed || null,
        timestamp: new Date().toISOString(),
      };

      console.log('🔄 [INFO] Payload à envoyer au serveur:', payload);

      // Envoyer au serveur
      const response = await fetch(`${API_BASE_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('🔄 [INFO] Requête envoyée au serveur, statut:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [SUCCESS] Localisation envoyée avec succès:', result);

        if (result.neighborhood) {
          console.log(`📍 [INFO] Quartier détecté: ${result.neighborhood}`);
        } else {
          console.warn('⚠️ [WARN] Quartier non identifié par le serveur');
        }

        return result;
      } else {
        const error = await response.json();
        console.error('❌ [ERROR] Erreur serveur:', error);
        throw new Error(error.message || `Erreur serveur: ${response.status}`);
      }

    } catch (error: any) {
      console.error('❌ [ERROR] Erreur lors de l\'envoi de localisation:', error);

      // Gestion améliorée des erreurs
      if (error.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert('Timeout GPS', 'La récupération de votre position a pris trop de temps.');
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        Alert.alert('GPS indisponible', 'Activez le GPS dans les paramètres de votre téléphone.');
      } else if (error.message.includes('réseau') || error.message.includes('Network')) {
        Alert.alert('Erreur réseau', 'Vérifiez votre connexion internet.');
      } else if (!error.message.includes('Permission')) {
        Alert.alert('Erreur de localisation', 'Impossible d\'envoyer votre position. Réessayez.');
      }

      throw error;
    }
  };

  // ✅ Connexion avec PIN + sauvegarde token + envoi localisation
  const handleLogin = async (enteredPin: string) => {
    if (!userId) {
      Alert.alert('Erreur', "Identifiant utilisateur manquant.");
      return;
    }

    try {
      setLoading(true);
      const cleanPin = enteredPin.trim();

      console.log('Sending PIN:', cleanPin, 'userId:', userId);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, userId }),
      });

      const data = await response.json();
      console.log("✅ Réponse complète du serveur :", data);

      if (!response.ok) {
        // Incrémenter le compteur d'échecs
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Vérifier si on a atteint 3 tentatives échouées
        if (newFailedAttempts >= 3) {
          handleResetPin();
        } else {
          throw new Error(data.message || 'Code PIN incorrect');
        }
        return;
      }

      // Réinitialiser les tentatives échouées en cas de succès
      setFailedAttempts(0);

      // ✅ Sauvegarde token
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        console.log('Token sauvegardé :', data.token);
      }
      
      // ✅ Sauvegarde infos utilisateur
      if (data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('userId', data.user.id);
        setUserId(data.user.id); 
        console.log('User data saved:', data.user);
      }

      // ✅ Sauvegarde du profil complet
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      console.log('Profil complet sauvegardé dans AsyncStorage');

      // 🔹 Sauvegarde de l'ID client pour les notifications
      if (data.profile?._id) {
        await AsyncStorage.setItem('clientId', data.profile._id);
        console.log('Client ID sauvegardé :', data.profile._id);
      } else {
        console.warn('⚠️ data.profile._id manquant !');
      }

      // 🔹 Log détaillé pour debug
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        console.log('Contenu exact de userProfile :', JSON.parse(savedProfile));
      } else {
        console.warn('userProfile est vide !');
      }

      // 📍 ENVOYER LA LOCALISATION APRÈS CONNEXION RÉUSSIE
      if (data.token && data.user?.id) {
        console.log('🚀 Envoi de la localisation après connexion...');
        sendLocationToServer(data.user.id, data.token).catch(error => {
          console.warn('Erreur localisation (non-bloquant):', error);
        });
      }

      // ✅ Redirection selon userType
      switch (data.user.userType) {
        case 'distributeur':
          router.push('/home/distributeurScreen');
          break;
        case 'client':
          router.push('/home/clientScreen');
          break;
        case 'livreur':
          router.push('/home/livreurScreen');
          break;
        default:
          Alert.alert('Erreur', 'Type utilisateur inconnu');
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion:', error);
      
      // Ne pas afficher l'alerte si c'est parce qu'on a dépassé les tentatives
      if (!error.message.includes('Code PIN incorrect') || failedAttempts < 3) {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
      
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.primary} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={pinLoginStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <LinearGradient
            colors={[themeColors.primary, themeColors.secondary]}
            style={pinLoginStyles.container}
          >
            <ScrollView contentContainerStyle={pinLoginStyles.scrollContent}>
              <View style={pinLoginStyles.contentCard}>
                <View style={pinLoginStyles.cardHeader}>
                  <Text style={pinLoginStyles.cardTitle}>Connexion PIN</Text>
                  <Text style={pinLoginStyles.cardSubtitle}>
                    Entrez votre code PIN à 4 chiffres
                  </Text>
                  
                  {/* Affichage du compteur de tentatives échouées */}
                  {failedAttempts > 0 && (
                    <Text style={[pinLoginStyles.cardSubtitle, { color: '#ff6b6b', marginTop: 8 }]}>
                      Tentatives échouées : {failedAttempts}/3
                    </Text>
                  )}
                </View>
                
                <View style={pinLoginStyles.pinSection}>
                  {renderPinDots()}
                  {renderNumericKeypad()}
                  {loading && <ActivityIndicator size="small" color="#fff" />}
                  
                  {/* Lien pour réinitialiser le PIN */}
                  <TouchableOpacity
                    style={{ marginTop: 20 }}
                    onPress={() => router.push('/auth/reset-pin')}
                  >
                    <Text style={{ 
                      color: themeColors.accent, 
                      textAlign: 'center',
                      textDecorationLine: 'underline'
                    }}>
                      Code PIN oublié ?
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}