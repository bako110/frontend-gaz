import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const AddressInput = ({ onAddressChange, initialAddress = '', style, enableRealTime = false }) => {
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const locationSubscription = useRef(null);
  const lastUpdateTime = useRef(0);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      stopRealTimeTracking();
    };
  }, []);

  const stopRealTimeTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  };

  const checkLocationPermissions = async () => {
    try {
      // Vérifier les permissions d'abord
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        if (requestStatus !== 'granted') {
          Alert.alert(
            'Permission refusée',
            'L\'accès à la géolocalisation est nécessaire pour cette fonctionnalité.',
            [
              { text: 'Saisir manuellement', onPress: () => setUseManualInput(true) },
            ]
          );
          return false;
        }
      }

      // Vérifier si les services de géolocalisation sont activés
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Géolocalisation désactivée',
          'Veuillez activer les services de géolocalisation dans les paramètres.',
          [
            { text: 'Saisir manuellement', onPress: () => setUseManualInput(true) },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return false;
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ExpressGazApp/1.0 (contact@expressgaz.bf)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Erreur géocodage inverse:', error);
      return `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
    }
  };

  const updateLocationData = async (location) => {
    const { latitude, longitude } = location.coords;
    
    // Limiter les appels d'API (max une fois par 10 secondes)
    const now = Date.now();
    if (now - lastUpdateTime.current < 10000) {
      return;
    }
    lastUpdateTime.current = now;

    try {
      const formattedAddress = await reverseGeocode(latitude, longitude);
      
      setAddress(formattedAddress);
      setCurrentLocation({ latitude, longitude });
      
      if (onAddressChange) {
        onAddressChange({
          address: formattedAddress,
          coordinates: { latitude, longitude },
          timestamp: now,
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour localisation:', error);
    }
  };

  const startRealTimeTracking = async () => {
    const hasPermission = await checkLocationPermissions();
    if (!hasPermission) return;

    try {
      setLoading(true);
      setIsTracking(true);

      // Configuration pour le suivi temps réel
      const options = {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Mise à jour toutes les 5 secondes
        distanceInterval: 10, // Ou tous les 10 mètres
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      };

      locationSubscription.current = await Location.watchPositionAsync(
        options,
        (location) => {
          updateLocationData(location);
        }
      );

      Alert.alert('Suivi activé', 'La géolocalisation temps réel est active.');
    } catch (error) {
      console.error('Erreur suivi temps réel:', error);
      Alert.alert(
        'Erreur',
        'Impossible de démarrer le suivi temps réel. ' + error.message,
        [
          { text: 'Réessayer', onPress: startRealTimeTracking },
          { text: 'Saisir manuellement', onPress: () => setUseManualInput(true) },
        ]
      );
      setIsTracking(false);
    } finally {
      setLoading(false);
    }
  };

  const getSingleLocation = async () => {
    const hasPermission = await checkLocationPermissions();
    if (!hasPermission) return;

    try {
      setLoading(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 60000, // Cache de 1 minute
      });

      await updateLocationData(location);
      Alert.alert('Succès', 'Adresse récupérée avec succès !');
    } catch (error) {
      console.error('Erreur localisation unique:', error);
      let errorMessage = 'Impossible de récupérer votre position.';
      
      if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion GPS.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Service de géolocalisation indisponible.';
      }

      Alert.alert(
        'Erreur',
        errorMessage + ' Voulez-vous réessayer ?',
        [
          { text: 'Réessayer', onPress: getSingleLocation },
          { text: 'Saisir manuellement', onPress: () => setUseManualInput(true) },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = (text) => {
    setAddress(text);
    if (onAddressChange) {
      onAddressChange({
        address: text,
        coordinates: null,
        details: null,
      });
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopRealTimeTracking();
    } else {
      startRealTimeTracking();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Adresse</Text>

      {!useManualInput ? (
        <View style={styles.locationContainer}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getSingleLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : (
              <>
                <Ionicons name="location" size={20} color="#2E7D32" />
                <Text style={styles.locationButtonText}>
                  Obtenir ma position
                </Text>
              </>
            )}
          </TouchableOpacity>

          {enableRealTime && (
            <TouchableOpacity
              style={[
                styles.trackingButton,
                isTracking && styles.trackingButtonActive
              ]}
              onPress={toggleTracking}
              disabled={loading}
            >
              <Ionicons 
                name={isTracking ? "pause" : "play"} 
                size={20} 
                color={isTracking ? "#fff" : "#2E7D32"} 
              />
              <Text style={[
                styles.trackingButtonText,
                isTracking && styles.trackingButtonTextActive
              ]}>
                {isTracking ? 'Arrêter suivi' : 'Suivi temps réel'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setUseManualInput(true)}
          >
            <Ionicons name="create-outline" size={20} color="#666" />
            <Text style={styles.manualButtonText}>Saisir manuellement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={handleManualInput}
            placeholder="Entrez votre adresse complète"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setUseManualInput(false);
              stopRealTimeTracking(); // Arrêter le suivi si actif
            }}
          >
            <Ionicons name="location-outline" size={16} color="#2E7D32" />
            <Text style={styles.switchButtonText}>Utiliser la géolocalisation</Text>
          </TouchableOpacity>
        </View>
      )}

      {address && !useManualInput && (
        <View style={styles.addressPreview}>
          <Text style={styles.addressPreviewLabel}>
            Adresse actuelle:
            {isTracking && <Text style={styles.liveIndicator}> 🔴 LIVE</Text>}
          </Text>
          <Text style={styles.addressPreviewText}>{address}</Text>
          {currentLocation && (
            <Text style={styles.coordinatesText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = {
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  locationContainer: {
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  locationButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  trackingButtonActive: {
    backgroundColor: '#FF9800',
  },
  trackingButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '500',
  },
  trackingButtonTextActive: {
    color: '#fff',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  manualButtonText: {
    color: '#666',
    fontSize: 16,
  },
  inputContainer: {
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    backgroundColor: '#fff',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  switchButtonText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  addressPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  addressPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  liveIndicator: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addressPreviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
};

export default AddressInput;