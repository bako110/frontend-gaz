import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdressesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  // Charger les données utilisateur et adresses
  useEffect(() => {
    loadUserDataAndAddresses();
  }, []);

  const loadUserDataAndAddresses = async () => {
    try {
      setIsLoading(true);
      
      // Charger les données utilisateur depuis AsyncStorage
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      
      let userData = null;
      if (userProfileStr) {
        userData = JSON.parse(userProfileStr);
      } else if (userDataStr) {
        userData = JSON.parse(userDataStr);
      }

      if (userData) {
        setUserInfo(userData);
        
        // Charger les adresses sauvegardées ou utiliser l'adresse du profil
        const savedAddresses = await AsyncStorage.getItem('userAddresses');
        
        if (savedAddresses) {
          // Utiliser les adresses sauvegardées
          setAddresses(JSON.parse(savedAddresses));
        } else {
          // Créer une adresse par défaut à partir des infos utilisateur
          const defaultAddress = createDefaultAddress(userData);
          setAddresses([defaultAddress]);
          await AsyncStorage.setItem('userAddresses', JSON.stringify([defaultAddress]));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger vos adresses');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultAddress = (userData) => {
    const user = userData.user || userData;
    return {
      id: 'default_' + Date.now(),
      type: 'Domicile',
      name: 'Adresse Principale',
      address: user.address || 'Adresse non spécifiée',
      city: user.city || 'Ville non spécifiée',
      postalCode: user.postalCode || '',
      country: 'Burkina Faso',
      isDefault: true,
      phone: user.phone || '',
      fullName: user.name || 'Utilisateur'
    };
  };

  const addNewAddress = async () => {
    // Pour l'instant, on va créer une adresse vide
    // Dans une vraie app, vous auriez un formulaire de saisie
    const newAddress = {
      id: 'new_' + Date.now(),
      type: 'Autre',
      name: 'Nouvelle Adresse',
      address: 'Cliquez pour modifier',
      city: '',
      postalCode: '',
      country: 'Burkina Faso',
      isDefault: false,
      phone: userInfo?.user?.phone || userInfo?.phone || '',
      fullName: userInfo?.user?.name || userInfo?.name || 'Utilisateur'
    };

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    await AsyncStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    
    Alert.alert('Succès', 'Nouvelle adresse ajoutée. Vous pouvez maintenant la modifier.');
  };

  const setDefaultAddress = async (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    setAddresses(updatedAddresses);
    await AsyncStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  const deleteAddress = async (addressId) => {
    // Empêcher la suppression de la dernière adresse
    if (addresses.length <= 1) {
      Alert.alert('Erreur', 'Vous devez avoir au moins une adresse');
      return;
    }

    const addressToDelete = addresses.find(addr => addr.id === addressId);
    
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer l'adresse "${addressToDelete.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            let updatedAddresses = addresses.filter(addr => addr.id !== addressId);
            
            // Si on supprime l'adresse par défaut, définir une nouvelle adresse par défaut
            if (addressToDelete.isDefault && updatedAddresses.length > 0) {
              updatedAddresses[0].isDefault = true;
            }

            setAddresses(updatedAddresses);
            await AsyncStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
          }
        }
      ]
    );
  };

  const editAddress = (addressId) => {
    // Dans une vraie app, vous navigueriez vers un écran d'édition
    Alert.alert(
      'Modification d\'adresse',
      'La fonctionnalité de modification sera bientôt disponible. Pour le moment, vous pouvez supprimer et recréer l\'adresse.',
      [{ text: 'OK' }]
    );
  };

  const getAddressStats = () => {
    const totalDeliveries = addresses.reduce((total, addr) => 
      total + (addr.deliveryCount || 0), 0
    );
    
    return {
      totalAddresses: addresses.length,
      totalDeliveries,
      defaultAddresses: addresses.filter(addr => addr.isDefault).length
    };
  };

  const formatAddress = (address) => {
    const parts = [];
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.join('\n');
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Mes Adresses' }} />
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Chargement de vos adresses...</Text>
      </View>
    );
  }

  const stats = getAddressStats();

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Mes Adresses' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Mes Adresses</Text>
        <Text style={styles.subtitle}>Gérez vos adresses de livraison</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={addNewAddress}>
        <Ionicons name="add-circle" size={24} color="#2E7D32" />
        <Text style={styles.addButtonText}>Ajouter une nouvelle adresse</Text>
      </TouchableOpacity>

      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <View style={styles.addressType}>
              <Ionicons 
                name={
                  address.type === 'Domicile' ? 'home' : 
                  address.type === 'Bureau' ? 'business' : 
                  'location'
                } 
                size={20} 
                color="#2E7D32" 
              />
              <Text style={styles.typeText}>{address.type}</Text>
            </View>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Par défaut</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.addressName}>{address.name}</Text>
          <Text style={styles.addressText}>{formatAddress(address)}</Text>
          
          {address.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call" size={16} color="#666" />
              <Text style={styles.phoneText}>{address.phone}</Text>
            </View>
          )}
          
          <View style={styles.addressActions}>
            {!address.isDefault && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setDefaultAddress(address.id)}
              >
                <Ionicons name="star" size={18} color="#FFA000" />
                <Text style={[styles.actionText, { color: '#FFA000' }]}>Défaut</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => editAddress(address.id)}
            >
              <Ionicons name="pencil" size={18} color="#666" />
              <Text style={styles.actionText}>Modifier</Text>
            </TouchableOpacity>
            
            {!address.isDefault && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => deleteAddress(address.id)}
              >
                <Ionicons name="trash" size={18} color="#ff4444" />
                <Text style={[styles.actionText, { color: '#ff4444' }]}>Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statistiques</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalAddresses}</Text>
            <Text style={styles.statLabel}>Adresses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.defaultAddresses}</Text>
            <Text style={styles.statLabel}>Par défaut</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#2E7D32" />
        <Text style={styles.infoText}>
          Vos adresses sont sauvegardées localement sur votre appareil. 
          L'adresse par défaut sera utilisée pour vos livraisons.
        </Text>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  addressName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 5,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 18,
  },
});