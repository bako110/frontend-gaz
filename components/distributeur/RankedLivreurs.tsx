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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { API_BASE_URL } from '@/service/config';

interface Livreur {
  _id: string;
  user: {
    _id: string;
    name: string;
    phone: string;
    photo?: string;
  };
  vehicleType: string;
  zone: string;
  distance: number;
  distanceKm: string;
  scoring: {
    totalScore: number;
    baseScore: number;
    distanceScore: number;
    ratings: {
      overall: number;
      count: number;
    };
    reliability: {
      completionRate: number;
    };
    currentLoad: {
      activeDeliveries: number;
    };
  };
  totalLivraisons: number;
}

interface RankedLivreursProps {
  onSelectLivreur?: (livreur: Livreur) => void;
}

export default function RankedLivreurs({ onSelectLivreur }: RankedLivreursProps) {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedLivreur, setSelectedLivreur] = useState<Livreur | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRankedLivreurs();
  }, []);

  const fetchRankedLivreurs = async () => {
    try {
      setError('');
      
      // Obtenir la position du distributeur
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission de localisation requise');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const response = await fetch(
        `${API_BASE_URL}/livreurs/ranked?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&maxDistance=10000`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setLivreurs(data.data);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération');
      }
    } catch (error: any) {
      console.error('Erreur fetch livreurs:', error);
      setError(error.message || 'Impossible de charger les livreurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRankedLivreurs();
  };

  const handleSelectLivreur = (livreur: Livreur) => {
    setSelectedLivreur(livreur);
    setShowDetailsModal(true);
  };

  const handleConfirmSelection = () => {
    if (selectedLivreur) {
      onSelectLivreur?.(selectedLivreur);
      setShowDetailsModal(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFA000"
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFA000';
    return '#F44336';
  };

  const renderLivreur = ({ item, index }: { item: Livreur; index: number }) => (
    <TouchableOpacity
      style={[
        styles.card,
        index === 0 && styles.topCard,
      ]}
      activeOpacity={0.7}
      onPress={() => handleSelectLivreur(item)}
    >
      {index === 0 && (
        <View style={styles.topBadge}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.topBadgeText}>Meilleur</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.rankContainer}>
          <Text style={styles.rank}>#{index + 1}</Text>
        </View>

        <View style={styles.avatarContainer}>
          {item.user.photo ? (
            <Image source={{ uri: item.user.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#1976D2" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.user.name}</Text>
          <View style={styles.vehicleRow}>
            <Ionicons name="bicycle" size={14} color="#718096" />
            <Text style={styles.vehicle}>{item.vehicleType}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getScoreColor(item.scoring.totalScore) }]}>
            {Math.round(item.scoring.totalScore)}
          </Text>
          <Text style={styles.scoreLabel}>score</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="location" size={16} color="#1976D2" />
          <Text style={styles.metricText}>{item.distanceKm} km</Text>
        </View>

        <View style={styles.metric}>
          {renderStars(Math.round(item.scoring.ratings.overall))}
          <Text style={styles.metricText}>({item.scoring.ratings.count})</Text>
        </View>

        <View style={styles.metric}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.metricText}>{item.scoring.reliability.completionRate}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalLivraisons}</Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.scoring.currentLoad.activeDeliveries}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.zone || 'N/A'}</Text>
          <Text style={styles.statLabel}>Zone</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Recherche des meilleurs livreurs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRankedLivreurs}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (livreurs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="bicycle-outline" size={64} color="#CBD5E0" />
        <Text style={styles.emptyText}>Aucun livreur disponible</Text>
        <Text style={styles.emptySubtext}>
          Aucun livreur disponible dans votre zone actuellement
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Livreurs disponibles</Text>
        <Text style={styles.subtitle}>Classés par score de performance</Text>
      </View>

      {/* Utiliser map au lieu de FlatList pour éviter l'imbrication dans ScrollView */}
      <View style={styles.list}>
        {livreurs.map((item, index) => (
          <View key={item._id}>
            {renderLivreur({ item, index })}
          </View>
        ))}
      </View>

      {/* Modal de détails */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails du livreur</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#2D3748" />
              </TouchableOpacity>
            </View>

            {selectedLivreur && (
              <View style={styles.modalBody}>
                <View style={styles.modalAvatarContainer}>
                  {selectedLivreur.user.photo ? (
                    <Image source={{ uri: selectedLivreur.user.photo }} style={styles.modalAvatar} />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Ionicons name="person" size={48} color="#1976D2" />
                    </View>
                  )}
                </View>

                <Text style={styles.modalName}>{selectedLivreur.user.name}</Text>
                <Text style={styles.modalPhone}>{selectedLivreur.user.phone}</Text>

                <View style={styles.modalScoreBox}>
                  <Text style={styles.modalScoreLabel}>Score global</Text>
                  <Text style={[styles.modalScore, { color: getScoreColor(selectedLivreur.scoring.totalScore) }]}>
                    {Math.round(selectedLivreur.scoring.totalScore)}/100
                  </Text>
                </View>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Distance</Text>
                    <Text style={styles.modalStatValue}>{selectedLivreur.distanceKm} km</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Note moyenne</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedLivreur.scoring.ratings.overall.toFixed(1)} ⭐
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Fiabilité</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedLivreur.scoring.reliability.completionRate}%
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmSelection}
                >
                  <Text style={styles.confirmButtonText}>Sélectionner ce livreur</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
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
  topCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  topBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
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
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicle: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 4,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#718096',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 13,
    color: '#4A5568',
    marginLeft: 4,
  },
  starsRow: {
    flexDirection: 'row',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#718096',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalAvatarContainer: {
    marginBottom: 16,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  modalPhone: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
  },
  modalScoreBox: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  modalScoreLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  modalScore: {
    fontSize: 32,
    fontWeight: '700',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  confirmButton: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
