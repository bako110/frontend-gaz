import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Animation de fade in au démarrage
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animation de pulsation continue pour l'icône
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulse();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulation de tentative de reconnexion
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}]
          }
        ]}
      >
        {/* Icône principale avec animation */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Ionicons 
            name="cloud-offline-outline" 
            size={120} 
            color="#FF6B6B" 
          />
        </Animated.View>

        {/* Titre principal */}
        <Text style={styles.title}>
          Oops ! Pas de connexion
        </Text>

        {/* Message descriptif */}
        <Text style={styles.description}>
          Il semble que vous soyez hors ligne. Vérifiez votre connexion Wi-Fi ou vos données mobiles.
        </Text>

        {/* Liste des suggestions */}
        <View style={styles.suggestionContainer}>
          <View style={styles.suggestionItem}>
            <Ionicons name="wifi" size={20} color="#4ECDC4" />
            <Text style={styles.suggestionText}>Vérifiez votre Wi-Fi</Text>
          </View>
          
          <View style={styles.suggestionItem}>
            <Ionicons name="cellular" size={20} color="#4ECDC4" />
            <Text style={styles.suggestionText}>Activez les données mobiles</Text>
          </View>
          
          <View style={styles.suggestionItem}>
            <Ionicons name="refresh" size={20} color="#4ECDC4" />
            <Text style={styles.suggestionText}>Réessayez dans un moment</Text>
          </View>
        </View>

        {/* Bouton de retry */}
        <TouchableOpacity 
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          <Ionicons 
            name={isRetrying ? "hourglass" : "refresh"} 
            size={20} 
            color="#fff" 
            style={styles.buttonIcon}
          />
          <Text style={styles.retryText}>
            {isRetrying ? "Tentative..." : "Réessayer"}
          </Text>
        </TouchableOpacity>

        {/* Indicateur de statut */}
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            Reconnexion automatique en cours...
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 100,
    backgroundColor: '#FFE5E5',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  suggestionContainer: {
    width: '100%',
    marginBottom: 30,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionText: {
    fontSize: 14,
    color: '#34495E',
    marginLeft: 12,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 30,
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0.1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F39C12',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
});