import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert,
  Text,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/service/config';

const { width, height } = Dimensions.get('window');

const circleSize = width * 0.7;       
const innerImageSize = width * 0.56;  
const glowRingSize = width * 0.8;     
const outerRingSize = width * 0.85;   

export default function HomeScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // Animations principales
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Animations pour les points
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animations d'entrée pour l'icône et les points
    Animated.parallel([
      // Animation de l'icône
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      
      // Animation des points (démarrent en même temps)
      Animated.sequence([
        Animated.delay(500), // Petit délai après l'apparition de l'icône
        Animated.parallel([
          // Point 1: clignote toujours
          Animated.loop(
            Animated.sequence([
              Animated.timing(dot1Anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }),
              Animated.timing(dot1Anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
              }),
            ])
          ),
          // Point 2: clignote avec un léger délai
          Animated.loop(
            Animated.sequence([
              Animated.delay(150),
              Animated.timing(dot2Anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }),
              Animated.timing(dot2Anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
              }),
              Animated.delay(150),
            ])
          ),
          // Point 3: clignote avec un délai plus long
          Animated.loop(
            Animated.sequence([
              Animated.delay(300),
              Animated.timing(dot3Anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }),
              Animated.timing(dot3Anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
              }),
              Animated.delay(300),
            ])
          ),
        ])
      ])
    ]).start();

    // Animation de pulsation continue pour l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de rotation continue pour les anneaux
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    ).start();

    // Vérification immédiate du backend
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    setIsChecking(true);
    
    try {
      console.log('🔍 Vérification du backend...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(`${API_BASE_URL}/ok`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Backend OK');
        setBackendStatus('success');
        
        // Animation de succès : les 3 points deviennent verts et fixes
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Vérifier si l'utilisateur existe déjà
        setTimeout(async () => {
          const userId = await AsyncStorage.getItem('userId');
          
          if (userId) {
            // UserId existe -> Demander le code PIN
            console.log('🔑 UserId trouvé -> Redirection vers Login');
            router.replace('/auth/login');
          } else {
            // Pas d'userId -> Inscription
            console.log('📝 Pas d\'userId -> Redirection vers Register');
            router.replace('/auth/register');
          }
        }, 1000);
        
      } else {
        console.log('❌ Backend erreur');
        setBackendStatus('error');
        handleBackendError();
      }
      
    } catch (error) {
      console.log('❌ Erreur de connexion:', error);
      setBackendStatus('error');
      handleBackendError();
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackendError = () => {
    // Animation d'erreur : les points deviennent rouges et clignotent en rouge
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
    
    // Afficher l'alerte après un court délai
    setTimeout(() => {
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au serveur. Vérifiez votre connexion Internet et réessayez.',
        [
          {
            text: 'Réessayer',
            onPress: () => {
              // Réinitialiser les animations
              dot1Anim.setValue(0);
              dot2Anim.setValue(0);
              dot3Anim.setValue(0);
              setBackendStatus('pending');
              checkBackendConnection();
            }
          }
        ],
        { cancelable: false }
      );
    }, 1500);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" translucent />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        {/* Éléments de fond animés */}
        <View style={styles.backgroundElements}>
          <Animated.View
            style={[
              styles.orb1,
              { transform: [{ rotate: spin }, { scale: pulseAnim }] }
            ]}
          />
          <Animated.View
            style={[
              styles.orb2,
              { transform: [{ rotate: spin }] }
            ]}
          />
          <View style={styles.mesh} />
        </View>

        {/* Contenu principal */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            {/* Logo central avec animation */}
            <View style={styles.logoContainer}>
              <Animated.View
                style={[
                  styles.logoWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { scale: scaleAnim },
                      { scale: pulseAnim }
                    ],
                  }
                ]}
              >
                <LinearGradient
                  colors={['#00d2ff', '#3a7bd5', '#667eea']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={require('@/assets/images/express.png')}
                    style={styles.logo}
                  />
                </LinearGradient>

                {/* Anneaux animés autour du logo */}
                <Animated.View
                  style={[
                    styles.glowRing,
                    { transform: [{ rotate: spin }] }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.outerRing,
                    { transform: [{ rotate: spin }] }
                  ]}
                />
              </Animated.View>

              {/* Points de chargement juste en dessous de l'icône */}
              <View style={styles.dotsContainer}>
                <Animated.View 
                  style={[
                    styles.dot,
                    { 
                      opacity: dot1Anim,
                      backgroundColor: backendStatus === 'success' ? '#4CAF50' : 
                                    backendStatus === 'error' ? '#F44336' : '#00d2ff'
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.dot,
                    { 
                      opacity: dot2Anim,
                      backgroundColor: backendStatus === 'success' ? '#4CAF50' : 
                                    backendStatus === 'error' ? '#F44336' : '#00d2ff'
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.dot,
                    { 
                      opacity: dot3Anim,
                      backgroundColor: backendStatus === 'success' ? '#4CAF50' : 
                                    backendStatus === 'error' ? '#F44336' : '#00d2ff'
                    }
                  ]} 
                />
              </View>

              {/* Message d'état */}
              <Text style={styles.statusMessage}>
                {backendStatus === 'success' ? 'Connexion établie ✓' :
                 backendStatus === 'error' ? 'Échec de connexion' :
                 'Vérification du serveur...'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orb1: {
    position: 'absolute',
    top: -width * 0.3,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  orb2: {
    position: 'absolute',
    bottom: -width * 0.35,
    left: -width * 0.35,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  mesh: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30, // Espace pour les points
  },
  logoGradient: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 25,
  },
  logo: {
    width: innerImageSize,
    height: innerImageSize,
    resizeMode: 'cover',
    borderRadius: innerImageSize / 2,
  },
  glowRing: {
    position: 'absolute',
    top: -(glowRingSize - circleSize) / 2,
    left: -(glowRingSize - circleSize) / 2,
    width: glowRingSize,
    height: glowRingSize,
    borderRadius: glowRingSize / 2,
    borderWidth: 2,
    borderColor: 'rgba(0, 210, 255, 0.5)',
    borderStyle: 'dashed',
  },
  outerRing: {
    position: 'absolute',
    top: -(outerRingSize - circleSize) / 2,
    left: -(outerRingSize - circleSize) / 2,
    width: outerRingSize,
    height: outerRingSize,
    borderRadius: outerRingSize / 2,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    height: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    backgroundColor: '#00d2ff',
  },
  statusMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
});