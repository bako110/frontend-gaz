import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert, // ⬅️ pour afficher une erreur
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; 
import { API_BASE_URL } from '@/service/config';

const { width, height } = Dimensions.get('window');

const circleSize = width * 0.7;       
const innerImageSize = width * 0.56;  
const glowRingSize = width * 0.8;     
const outerRingSize = width * 0.85;   

export default function HomeScreen() {
  const navigation = useNavigation(); // <-- hook navigation

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation continue
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    // Animation de rotation continue
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // ⬇️ Appel au backend après 6 secondes
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ok`);
        if (response.ok) {
          // si l’API répond OK → on redirige
          navigation.navigate('auth/register'); // <-- utilisation de la navigation
        } else {
          Alert.alert(
            'Erreur de connexion',
            'Le serveur a répondu avec une erreur. Veuillez vérifier votre connexion ou réessayer.'
          );
        }
      } catch (error) {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de se connecter au serveur. Vérifiez votre connexion Internet.'
        );
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

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
            {/* Logo central agrandi */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <View style={styles.logoBackground}>
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
              </View>
            </Animated.View>
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
    paddingTop: height * 0.2,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.6,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
});
