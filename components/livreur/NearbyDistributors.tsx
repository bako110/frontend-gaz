import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/service/config';

interface Distributor {
  _id: string;
  user: {
    name: string;
    phone: string;
    photo?: string;
  };
  address: string;
  zone: string;
  distance: number;
  distanceKm: string;
  activeOrders: number;
  products: number;
}

interface NearbyDistributorsProps {
  livreurId: string;
  maxDistance?: number;
}

export default function NearbyDistributors({
  livreurId,
  maxDistance = 5000,
}: NearbyDistributorsProps) {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNearbyDistributors();
  }, [livreurId]);

  const fetchNearbyDistributors = async () => {
    try {
      setError('');
      
      // Vérifier que livreurId est valide
      if (!livreurId || livreurId === 'null' || livreurId === 'undefined') {
        console.log('⚠️ livreurId invalide, attente des données...');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/livreurs/${livreurId}/nearby-distributors?maxDistance=${maxDistance}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setDistributors(data.data);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération');
      }
    } catch (error: any) {
      console.error('Erreur fetch distributeurs:', error);
      setError(error.message || 'Impossible de charger les distributeurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyDistributors();
  };

  const renderDistributor = ({ item }: { item: Distributor }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.user.photo ? (
            <Image source={{ uri: item.user.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="business" size={24} color="#1976D2" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.user.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#718096" />
            <Text style={styles.zone}>{item.zone || item.address}</Text>
          </View>
        </View>

        <View style={styles.distanceContainer}>
          <Text style={styles.distance}>{item.distanceKm} km</Text>
          <Text style={styles.distanceLabel}>distance</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="cart" size={16} color="#1976D2" />
          <Text style={styles.statText}>{item.activeOrders} commandes</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="cube" size={16} color="#4CAF50" />
          <Text style={styles.statText}>{item.products} produits</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.contactButton}>
        <Ionicons name="call" size={18} color="#fff" />
        <Text style={styles.contactButtonText}>Contacter</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Recherche des distributeurs proches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNearbyDistributors}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (distributors.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="business-outline" size={64} color="#CBD5E0" />
        <Text style={styles.emptyText}>Aucun distributeur proche</Text>
        <Text style={styles.emptySubtext}>
          Aucun distributeur trouvé dans un rayon de {maxDistance / 1000} km
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Distributeurs proches</Text>
        <Text style={styles.subtitle}>{distributors.length} trouvé(s)</Text>
      </View>

      {/* Utiliser map au lieu de FlatList pour éviter l'imbrication dans ScrollView */}
      <View style={styles.list}>
        {distributors.map((item) => (
          <View key={item._id}>
            {renderDistributor({ item })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zone: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 4,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#718096',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 13,
    color: '#4A5568',
    marginLeft: 6,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#718096',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
});
