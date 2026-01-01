import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
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
  const [loginStatus, setLoginStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');

  // Animations pour les points
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  const themeColors = {
    primary: '#455A64',
    secondary: '#546E7A',
    accent: '#455A64',
    text: '#2D3748',
    success: '#4CAF50',
    error: '#F44336',
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

  // Démarrer l'animation des points quand on vérifie
  useEffect(() => {
    if (loginStatus === 'checking') {
      startDotsAnimation();
    }
  }, [loginStatus]);

  const startDotsAnimation = () => {
    // Arrêter les animations précédentes
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();
    
    // Réinitialiser les valeurs
    dot1Anim.setValue(0);
    dot2Anim.setValue(0);
    dot3Anim.setValue(0);

    // Lancer l'animation des points bleus (vérification en cours)
    Animated.loop(
      Animated.parallel([
        // Point 1
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(dot1Anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.in(Easing.ease),
          }),
        ]),
        // Point 2 avec délai
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(dot2Anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.in(Easing.ease),
          }),
        ]),
        // Point 3 avec délai plus long
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(dot3Anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.in(Easing.ease),
          }),
        ]),
      ])
    ).start();
  };

  const showSuccessAnimation = () => {
    // Arrêter l'animation de clignotement
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();

    // Animation de succès : tous les points deviennent verts fixes
    Animated.parallel([
      Animated.timing(dot1Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(dot2Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(dot3Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const showErrorAnimation = () => {
    // Arrêter l'animation de clignotement
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();

    // Animation d'erreur : points rouges clignotants
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
      ]),
      { iterations: 3 } // Clignoter 3 fois puis s'arrêter
    ).start(() => {
      // Après l'animation, réinitialiser à l'état idle
      setTimeout(() => {
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
        setLoginStatus('idle');
      }, 500);
    });
  };

  // Ajout d'un chiffre au PIN
  const handlePinPress = (num: string) => {
    if (pin.length < 4 && loginStatus !== 'checking') {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) handleLogin(newPin);
    }
  };

  // Suppression dernier chiffre
  const handleDelete = () => {
    if (loginStatus !== 'checking') {
      setPin(pin.slice(0, -1));
    }
  };

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
            setLoginStatus('idle');
          }
        },
        {
          text: 'Réinitialiser',
          onPress: () => {
            router.push('/auth/reset-pin');
            setPin('');
            setFailedAttempts(0);
            setLoginStatus('idle');
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
                style={[
                  pinLoginStyles.keypadButton,
                  button === '' && pinLoginStyles.hiddenButton,
                  loginStatus === 'checking' && pinLoginStyles.disabledButton
                ]}
                onPress={() => {
                  if(button === '⌫') handleDelete();
                  else if(button !== '') handlePinPress(button);
                }}
                disabled={button === '' || loginStatus === 'checking'}
              >
                <Text style={[
                  pinLoginStyles.keypadButtonText,
                  loginStatus === 'checking' && { opacity: 0.5 }
                ]}>
                  {button}
                </Text>
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

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('❌ [WARN] Permission de localisation refusée');
        return;
      }

      console.log('✅ [INFO] Permission accordée, récupération de la position...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeout: 15000,
        maximumAge: 0,
      });

      const { latitude, longitude, accuracy } = location.coords;

      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordonnées GPS invalides');
      }

      const payload = {
        userId,
        latitude: parseFloat(latitude.toFixed(7)),
        longitude: parseFloat(longitude.toFixed(7)),
        accuracy: accuracy || null,
        timestamp: new Date().toISOString(),
      };

      console.log('🔄 [INFO] Envoi de la localisation...');

      const response = await fetch(`${API_BASE_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [SUCCESS] Localisation envoyée avec succès');
        return result;
      } else {
        console.warn('⚠️ [WARN] Erreur lors de l\'envoi de la localisation');
      }
    } catch (error: any) {
      console.warn('⚠️ [WARN] Erreur localisation (non-bloquant):', error.message);
    }
  };

  // ✅ Connexion avec PIN + sauvegarde token + envoi localisation
  const handleLogin = async (enteredPin: string) => {
    if (!userId) {
      Alert.alert('Erreur', "Identifiant utilisateur manquant.");
      return;
    }

    if (loginStatus === 'checking') return; // Empêcher les doubles clics

    try {
      setLoading(true);
      setLoginStatus('checking');
      const cleanPin = enteredPin.trim();

      console.log('🔍 Vérification du PIN...');

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, userId }),
      });

      const data = await response.json();
      console.log("✅ Réponse du serveur :", data);

      if (!response.ok) {
        // Incrémenter le compteur d'échecs
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Vérifier si on a atteint 3 tentatives échouées
        if (newFailedAttempts >= 3) {
          setLoginStatus('error');
          showErrorAnimation();
          setTimeout(() => {
            handleResetPin();
          }, 1000);
        } else {
          setLoginStatus('error');
          showErrorAnimation();
          throw new Error(data.message || 'Code PIN incorrect');
        }
        return;
      }

      // Réinitialiser les tentatives échouées en cas de succès
      setFailedAttempts(0);

      // ✅ Sauvegarde token
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        console.log('Token sauvegardé');
      }
      
      // ✅ Sauvegarde infos utilisateur
      if (data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('userId', data.user.id);
        setUserId(data.user.id); 
        console.log('User data saved');
      }

      // ✅ Sauvegarde du profil complet
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      console.log('Profil complet sauvegardé');

      // 🔹 Sauvegarde de l'ID client pour les notifications
      if (data.profile?._id) {
        await AsyncStorage.setItem('clientId', data.profile._id);
        console.log('Client ID sauvegardé');
      }

      // Animation de succès
      setLoginStatus('success');
      showSuccessAnimation();

      // 📍 ENVOYER LA LOCALISATION APRÈS CONNEXION RÉUSSIE
      if (data.token && data.user?.id) {
        console.log('🚀 Envoi de la localisation...');
        setTimeout(() => {
          sendLocationToServer(data.user.id, data.token).catch(error => {
            console.warn('Erreur localisation (non-bloquant):', error);
          });
        }, 100);
      }

      // ✅ Redirection selon userType après un court délai
      setTimeout(() => {
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
      }, 1000);

    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion:', error);
      
      // Ne pas afficher l'alerte si c'est parce qu'on a dépassé les tentatives
      if (!error.message.includes('Code PIN incorrect') || failedAttempts < 3) {
        setTimeout(() => {
          Alert.alert('Erreur', error.message || 'Une erreur est survenue');
        }, 500);
      }
      
      setPin('');
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
                  
                  {/* Points de chargement animés */}
                  <View style={styles.dotsContainer}>
                    <Animated.View 
                      style={[
                        styles.dot,
                        { 
                          opacity: dot1Anim,
                          backgroundColor: loginStatus === 'success' ? themeColors.success : 
                                        loginStatus === 'error' ? themeColors.error : 
                                        themeColors.accent
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.dot,
                        { 
                          opacity: dot2Anim,
                          backgroundColor: loginStatus === 'success' ? themeColors.success : 
                                        loginStatus === 'error' ? themeColors.error : 
                                        themeColors.accent
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.dot,
                        { 
                          opacity: dot3Anim,
                          backgroundColor: loginStatus === 'success' ? themeColors.success : 
                                        loginStatus === 'error' ? themeColors.error : 
                                        themeColors.accent
                        }
                      ]} 
                    />
                  </View>

                  {/* Message d'état */}
                  {loginStatus === 'checking' && (
                    <Text style={styles.statusMessage}>
                      Vérification en cours...
                    </Text>
                  )}
                  {loginStatus === 'success' && (
                    <Text style={[styles.statusMessage, { color: themeColors.success }]}>
                      Connexion réussie ✓
                    </Text>
                  )}
                  {loginStatus === 'error' && (
                    <Text style={[styles.statusMessage, { color: themeColors.error }]}>
                      Échec de connexion
                    </Text>
                  )}

                  {renderNumericKeypad()}
                  
                  {/* Lien pour réinitialiser le PIN */}
                  <TouchableOpacity
                    style={{ marginTop: 20 }}
                    onPress={() => router.push('/auth/reset-pin')}
                    disabled={loginStatus === 'checking'}
                  >
                    <Text style={{ 
                      color: themeColors.accent, 
                      textAlign: 'center',
                      textDecorationLine: 'underline',
                      opacity: loginStatus === 'checking' ? 0.5 : 1
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

const styles = {
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    height: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#455A64',
  },
  statusMessage: {
    color: '#455A64',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 5,
    opacity: 0.9,
  },
};