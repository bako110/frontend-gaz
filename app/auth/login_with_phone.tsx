import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/service/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function LoginWithPhoneScreen() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('+226 ');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Réinitialiser les tentatives échouées quand le numéro change
  useEffect(() => {
    setFailedAttempts(0);
  }, [phone]);

  const handleNext = () => {
    if (phone.length !== 13 || !phone.startsWith('+226')) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro valide (+226 suivi de 9 chiffres)');
      return;
    }
    setStep(2);
  };

  const handlePinPress = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleResetPin = () => {
    Alert.alert(
      'Réinitialisation du PIN',
      'Vous avez dépassé le nombre maximum de tentatives. Souhaitez-vous réinitialiser votre code PIN ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {
            // Retour à l'écran de numéro de téléphone
            setStep(1);
            setPin('');
            setFailedAttempts(0);
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

  const sendLocationToServer = async (userId: string, token: string) => {
    try {
      console.log('🔄 [INFO] Demande de permission de localisation...');

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

      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordonnées GPS invalides');
      }

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
        
        throw new Error(error.message || `Erreur serveur: ${response.status}`);
      }

    } catch (error: any) {
    

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

  const handleLogin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Erreur', 'Veuillez entrer un code PIN à 4 chiffres');
      return;
    }
    setIsLoading(true);

    try {
      console.log('🔄 Tentative de connexion avec:', { phone, pin });
      
      const response = await fetch(`${API_BASE_URL}/auth/login-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });

      const data = await response.json();
      console.log("✅ Réponse complète du serveur login-phone :", data);

      if (!response.ok) {
        // Incrémenter le compteur d'échecs
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Vérifier si on a atteint 3 tentatives échouées
        if (newFailedAttempts >= 3) {
          handleResetPin();
        } else {
          throw new Error(data.message || 'Numéro ou code PIN incorrect');
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
        await AsyncStorage.setItem('userId', data.user.id.toString());
        console.log('User data saved :', data.user);
      }

      // ✅ Sauvegarde profil complet
      if (data.profile || data.user) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        console.log('Profil complet sauvegardé dans AsyncStorage');

        if (data.profile?._id) {
          await AsyncStorage.setItem('clientId', data.profile._id);
          console.log('Client ID sauvegardé :', data.profile._id);
        } else {
          console.warn('⚠️ data.profile._id manquant !');
        }

        const savedProfile = await AsyncStorage.getItem('userProfile');
        if (savedProfile) {
          console.log('Contenu exact de userProfile :', JSON.parse(savedProfile));
        } else {
          console.warn('userProfile est vide !');
        }
      }

      // 📍 ENVOYER LA LOCALISATION APRÈS CONNEXION RÉUSSIE
      if (data.token && data.user?.id) {
        console.log('🚀 Envoi de la localisation après connexion...');
        sendLocationToServer(data.user.id.toString(), data.token).catch(error => {
          console.warn('Erreur localisation (non-bloquant):', error);
        });
      }

      // ✅ Redirection selon userType
      switch (data.user.userType) {
        case 'distributeur':
          router.replace('/home/distributeurScreen');
          break;
        case 'client':
          router.replace('/home/clientScreen');
          break;
        case 'livreur':
          router.replace('/home/livreurScreen');
          break;
        default:
          Alert.alert('Erreur', 'Type utilisateur inconnu');
      }

    } catch (error: any) {
      
      // Ne pas afficher l'alerte si c'est parce qu'on a dépassé les tentatives
      if (!error.message.includes('Numéro ou code PIN incorrect') || failedAttempts < 3) {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
      
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2 && pin.length === 4) {
      handleLogin();
    }
  }, [pin, step]);

  const renderPinDots = () => (
    <View style={styles.pinDotsContainer}>
      {[...Array(4)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.pinDot,
            { backgroundColor: i < pin.length ? '#00d2ff' : 'rgba(255, 255, 255, 0.3)' }
          ]}
        />
      ))}
    </View>
  );

  const renderNumericKeypad = () => {
    const buttons = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', <Ionicons name="backspace" size={24} color="#FFFFFF" key="backspace" />],
    ];
    return (
      <View style={styles.keypadContainer}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((button, buttonIndex) => (
              <TouchableOpacity
                key={buttonIndex}
                style={[
                  styles.keypadButton,
                  !button && styles.keypadButtonEmpty,
                ]}
                onPress={() =>
                  button === '' ? null :
                  typeof button === 'string' ? handlePinPress(button) :
                  handleDelete()
                }
                disabled={!button || isLoading}
              >
                {typeof button === 'string' ? (
                  <Text style={styles.keypadButtonText}>{button}</Text>
                ) : (
                  button
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" translucent />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={['#00d2ff', '#3a7bd5']}
              style={styles.logoContainer}
            >
              <Ionicons name="logo-ionitron" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>
              Connexion à <Text style={styles.titleAccent}>express-gaz</Text>
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Entrez votre numéro de téléphone' : 'Entrez votre code PIN'}
            </Text>
            <View style={styles.stepIndicatorContainer}>
              <View style={[styles.stepIndicator, step === 1 && styles.stepIndicatorActive]} />
              <View style={[styles.stepIndicator, step === 2 && styles.stepIndicatorActive]} />
            </View>
          </Animated.View>
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              {step === 1 ? (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={20} color="#00d2ff" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Numéro de téléphone"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      keyboardType="phone-pad"
                      maxLength={13}
                      value={phone}
                      onChangeText={setPhone}
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={isLoading ? ['#777', '#555'] : ['#00d2ff', '#3a7bd5']}
                      style={styles.nextButtonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.nextButtonText}>Continuer</Text>
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.registerContainer}
                    onPress={() => router.push('/auth/register')}
                  >
                    <Text style={styles.registerText}>
                      Vous n'avez pas de compte ? <Text style={styles.registerLink}>S'inscrire</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {renderPinDots()}
                  {failedAttempts > 0 && (
                    <Text style={styles.attemptsText}>
                      Tentatives échouées : {failedAttempts}/3
                    </Text>
                  )}
                  {renderNumericKeypad()}
                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#00d2ff" />
                      <Text style={styles.loadingText}>Connexion en cours...</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.forgotPinContainer}
                    onPress={() => router.push('/auth/reset-pin')}
                  >
                    <Text style={styles.forgotPinText}>
                      Code PIN oublié ?
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.registerContainer}
                    onPress={() => router.push('/auth/register')}
                  >
                    <Text style={styles.registerText}>
                      Vous n'avez pas de compte ? <Text style={styles.registerLink}>S'inscrire</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  titleAccent: {
    color: '#00d2ff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 15,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  stepIndicator: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepIndicatorActive: {
    backgroundColor: '#00d2ff',
    width: 24,
  },
  card: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 12,
  },
  nextButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
    marginRight: 8,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  keypadContainer: {
    marginBottom: 15,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 10,
  },
  keypadButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keypadButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    opacity: 0.9,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  registerContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  registerLink: {
    color: '#00d2ff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  attemptsText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  forgotPinContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  forgotPinText: {
    color: '#00d2ff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});