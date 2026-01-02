import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { API_BASE_URL } from '@/service/config';

interface AvailabilityToggleProps {
  livreurId: string;
  initialAvailability?: boolean;
  onStatusChange?: (isAvailable: boolean) => void;
}

export default function AvailabilityToggle({
  livreurId,
  initialAvailability = false,
  onStatusChange,
}: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailability);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    getCurrentLocation();
    fetchCurrentAvailability();
  }, [livreurId]);

  const fetchCurrentAvailability = async () => {
    if (!livreurId || livreurId === 'null' || livreurId === 'undefined') {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/livreur/${livreurId}/dashboard`);
      const data = await response.json();

      if (response.ok && data.success && data.data.availability) {
        setIsAvailable(data.data.availability.isAvailable);
      }
    } catch (error) {
      console.error('Erreur récupération disponibilité:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location);
    } catch (error) {
      console.error('Erreur récupération position:', error);
    }
  };

  const toggleAvailability = async (newValue: boolean) => {
    // Vérifier que livreurId est valide
    if (!livreurId || livreurId === 'null' || livreurId === 'undefined') {
      Alert.alert('Erreur', 'Identifiant livreur invalide. Veuillez vous reconnecter.');
      return;
    }

    console.log('🔄 Toggle disponibilité - livreurId:', livreurId);
    console.log('🔄 Nouvelle valeur:', newValue);

    setIsLoading(true);

    try {
      if (!currentLocation) {
        await getCurrentLocation();
      }

      const url = `${API_BASE_URL}/livreurs/${livreurId}/availability`;
      console.log('📡 URL appelée:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: newValue,
          location: currentLocation
            ? {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                accuracy: currentLocation.coords.accuracy,
                timestamp: new Date().toISOString(),
              }
            : null,
        }),
      });

      console.log('📡 Status de la réponse:', response.status);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Réponse non-JSON:', text.substring(0, 200));
        throw new Error('Le serveur a retourné une réponse invalide');
      }

      const data = await response.json();
      console.log('📡 Réponse du serveur:', data);

      if (response.ok && data.success) {
        setIsAvailable(newValue);
        onStatusChange?.(newValue);
        
        Alert.alert(
          'Statut mis à jour',
          newValue
            ? 'Vous êtes maintenant disponible pour recevoir des livraisons'
            : 'Vous êtes maintenant indisponible',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur toggle disponibilité:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le statut');
      // Revenir à l'état précédent
      setIsAvailable(!newValue);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isAvailable ? 'checkmark-circle' : 'close-circle'}
            size={32}
            color={isAvailable ? '#4CAF50' : '#F44336'}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isAvailable ? 'Disponible' : 'Indisponible'}
          </Text>
          <Text style={styles.subtitle}>
            {isAvailable
              ? 'Vous recevez des propositions de livraison'
              : 'Vous ne recevez pas de propositions'}
          </Text>
        </View>

        <View style={styles.switchContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          )}
        </View>
      </View>

      {isAvailable && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#1976D2" />
          <Text style={styles.infoText}>
            Votre position GPS est partagée avec les distributeurs proches
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
  },
  switchContainer: {
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
});
