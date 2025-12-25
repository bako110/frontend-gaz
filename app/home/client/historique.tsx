import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/service/config';
import ClientFooter from './ClientFooter';

const { width, height } = Dimensions.get('window');

const ORDER_STATUS = {
  PENDING: 'en_attente',
  CONFIRMED: 'confirme',
  IN_DELIVERY: 'en_livraison',
  DELIVERED: 'livre',
  CANCELLED: 'annule',
};

export default function HistoriqueScreen() {
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [clientInfo, setClientInfo] = useState({ _id: null });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [validationCode, setValidationCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      
      const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr);
      const user = userProfileStr ? parsedData.user : parsedData;

      const userId = parsedData?.profile?._id || user?._id;
      
      setClientInfo({
        _id: userId,
      });

      if (userId) {
        await fetchHistorique(userId);
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer les informations utilisateur');
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      Alert.alert('Erreur', 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistorique = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      console.log('Fetching historique for user:', userId);
      
      // Utiliser la nouvelle route avec meilleure gestion des IDs
      const response = await fetch(`${API_BASE_URL}/orders/client-history/${userId}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success && data.historique) {
          const sortedOrders = [...data.historique].sort((a, b) =>
            new Date(b.orderTime) - new Date(a.orderTime)
          );
          const formattedOrders = sortedOrders.map((order) => ({
            id: order._id,
            date: order.orderTime ? new Date(order.orderTime).toLocaleString('fr-FR') : 'Date inconnue',
            produit: order.products && order.products.length > 0
              ? `${order.products[0].name} (${order.products[0].fuelType || 'Standard'})`
              : 'Produit inconnu',
            quantite: order.products && order.products.length > 0
              ? order.products[0].quantity
              : 1,
            total: order.total || 0,
            statut: order.status || ORDER_STATUS.PENDING,
            priority: order.priority,
            distributorName: order.distributorName || 'Distributeur inconnu',
            address: order.address || 'Adresse non définie',
            type: order.products && order.products.length > 0 ? order.products[0].fuelType : 'Standard',
            validationCode: order.validationCode || order.orderCode, // Code de validation
            isDelivery: order.isDelivery || false, // Flag pour déterminer si c'est une livraison ou un retrait
            distributorId: order.distributorId, // ID du distributeur pour appel API
          }));
          setHistoriqueCommandes(formattedOrders);
        } else {
          setHistoriqueCommandes([]);
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Erreur API: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur récupération historique:", error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des commandes');
      setHistoriqueCommandes([]);
    }
  };

  const fetchValidationCode = async (orderId) => {
    try {
      setLoadingCode(true);
      const token = await AsyncStorage.getItem('userToken');
      
      console.log('Fetching validation code for order:', orderId);
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/validation-code`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Validation Code API Response:', data);
        
        if (data.success && data.validationCode) {
          setValidationCode(data.validationCode);
        } else {
          throw new Error(data.message || 'Code de validation non disponible');
        }
      } else {
        const errorText = await response.text();
        console.error('Validation Code API Error:', response.status, errorText);
        throw new Error(`Erreur serveur: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur récupération code de validation:", error);
      Alert.alert('Erreur', error.message || 'Impossible de charger le code de validation');
      setValidationCode(null);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleCompletePickup = async () => {
    try {
      if (!selectedCommande || !validationCode) {
        Alert.alert('Erreur', 'Code ou commande manquante');
        return;
      }

      console.log('Completing pickup for order:', selectedCommande.id);
      
      const response = await fetch(`${API_BASE_URL}/orders/${selectedCommande.id}/complete-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validationCode: validationCode,
          distributorId: selectedCommande.distributorId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Complete Pickup Response:', data);
        
        if (data.success) {
          Alert.alert(
            'Succès',
            '✅ Retrait sur place confirmé!\n\nLe distributeur a bien reçu votre paiement.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setModalVisible(false);
                  onRefresh();
                }
              }
            ]
          );
        } else {
          Alert.alert('Erreur', data.message || 'Impossible de confirmer le retrait');
        }
      } else {
        const errorText = await response.text();
        console.error('Complete Pickup Error:', response.status, errorText);
        Alert.alert('Erreur', `Erreur serveur: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur confirmation retrait:", error);
      Alert.alert('Erreur', 'Impossible de confirmer le retrait');
    }
  };

  const handleCommandePress = async (commande) => {
    setSelectedCommande(commande);
    setModalVisible(true);
    setValidationCode(null);
    
    // Charger le code de validation
    await fetchValidationCode(commande.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (clientInfo._id) {
      await fetchHistorique(clientInfo._id);
    }
    setRefreshing(false);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case ORDER_STATUS.IN_DELIVERY: return '#2E7D32';
      case ORDER_STATUS.DELIVERED: return '#4CAF50';
      case ORDER_STATUS.CANCELLED: return '#E53935';
      case ORDER_STATUS.CONFIRMED: return '#FF9800';
      case ORDER_STATUS.PENDING:
      default: return '#757575';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case ORDER_STATUS.IN_DELIVERY: return 'car-outline';
      case ORDER_STATUS.DELIVERED: return 'checkmark-done-outline';
      case ORDER_STATUS.CANCELLED: return 'close-circle-outline';
      case ORDER_STATUS.CONFIRMED: return 'checkmark-circle-outline';
      case ORDER_STATUS.PENDING:
      default: return 'time-outline';
    }
  };

  const getStatutText = (statut) => {
    switch (statut) {
      case ORDER_STATUS.IN_DELIVERY: return 'EN LIVRAISON';
      case ORDER_STATUS.DELIVERED: return 'LIVRÉ';
      case ORDER_STATUS.CANCELLED: return 'ANNULÉ';
      case ORDER_STATUS.CONFIRMED: return 'CONFIRMÉ';
      case ORDER_STATUS.PENDING:
      default: return 'EN ATTENTE';
    }
  };

  const HistoryCard = ({ commande }) => (
    <TouchableOpacity 
      style={styles.historyCard}
      onPress={() => handleCommandePress(commande)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.historyDate}>{commande.date}</Text>
        </View>
        <View style={styles.headerRightSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatutColor(commande.statut) + '20' }]}>
            <Ionicons
              name={getStatutIcon(commande.statut)}
              size={14}
              color={getStatutColor(commande.statut)}
            />
            <Text style={[styles.statusText, { color: getStatutColor(commande.statut) }]}>
              {getStatutText(commande.statut)}
            </Text>
          </View>
          {commande.validationCode && (
            <View style={styles.qrBadge}>
              <Ionicons name="key-outline" size={12} color="#2E7D32" />
              <Text style={styles.qrBadgeText}>QR</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.productName}>{commande.produit}</Text>
        <Text style={styles.productQuantity}>x{commande.quantite}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.distributorInfo}>
          <Ionicons name="storefront-outline" size={14} color="#666" />
          <Text style={styles.distributorText}>{commande.distributorName}</Text>
        </View>
        <Text style={styles.totalAmount}>{commande.total.toLocaleString()} FCFA</Text>
      </View>
    </TouchableOpacity>
  );

  const ValidationCodeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Code de Validation</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedCommande && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderInfoTitle}>Détails de la commande</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Produit:</Text>
                  <Text style={styles.infoValue}>{selectedCommande.produit}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Quantité:</Text>
                  <Text style={styles.infoValue}>{selectedCommande.quantite}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total:</Text>
                  <Text style={styles.infoValue}>{selectedCommande.total.toLocaleString()} FCFA</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Statut:</Text>
                  <Text style={[styles.infoValue, { color: getStatutColor(selectedCommande.statut) }]}>
                    {getStatutText(selectedCommande.statut)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Distributeur:</Text>
                  <Text style={styles.infoValue}>{selectedCommande.distributorName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{selectedCommande.date}</Text>
                </View>
              </View>
            )}

            <View style={styles.validationCodeSection}>
              <Text style={styles.validationCodeTitle}>Code de Validation</Text>
              <Text style={styles.validationCodeDescription}>
                {selectedCommande?.isDelivery 
                  ? 'Donnez ce code au livreur pour confirmer la livraison'
                  : 'Utilisez ce code pour confirmer votre retrait sur place'}
              </Text>

              {loadingCode ? (
                <View style={styles.codeLoading}>
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.loadingText}>Chargement du code...</Text>
                </View>
              ) : validationCode ? (
                <View style={styles.codeContainer}>
                  <View style={styles.codeDisplay}>
                    <Text style={styles.codeText}>{validationCode}</Text>
                  </View>
                  <Text style={styles.codeId}>
                    Commande: {selectedCommande?.id?.slice(-8).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.codeError}>
                  <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                  <Text style={styles.errorText}>Code non disponible</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => selectedCommande && fetchValidationCode(selectedCommande.id)}
                  >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Instructions:</Text>
              {selectedCommande?.isDelivery ? (
                <>
                  <View style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={styles.instructionText}>
                      Donnez ce code au livreur lors de la livraison
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={styles.instructionText}>
                      Le livreur saisira le code pour confirmer la livraison
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={styles.instructionText}>
                      Conservez ce code jusqu'à la livraison complète
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={styles.instructionText}>
                      Allez chercher votre produit au distributeur
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={styles.instructionText}>
                      Donnez ce code pour confirmer votre retrait
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={styles.instructionText}>
                      Appuyez sur "Confirmer Retrait" pour finaliser
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {!selectedCommande?.isDelivery && selectedCommande?.statut === ORDER_STATUS.CONFIRMED ? (
              // Bouton de confirmation pour RETRAIT SUR PLACE en statut confirmé
              <>
                <TouchableOpacity 
                  style={[styles.confirmPickupButton, { opacity: validationCode ? 1 : 0.5 }]}
                  onPress={handleCompletePickup}
                  disabled={!validationCode}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmPickupButtonText}>Confirmer le Retrait</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.closeModalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeModalButtonText}>Annuler</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Bouton de fermeture standard pour les livraisons
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>Fermer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique des Commandes</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={historiqueCommandes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryCard commande={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySubtitle}>
              Vos commandes apparaîtront ici une fois passées
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadUserData}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
      />

      <ValidationCodeModal />
      <ClientFooter />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  qrBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
    marginLeft: 3,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  productQuantity: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distributorText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  codeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  codeBadgeText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: height * 0.7,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  closeModalButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmPickupButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  confirmPickupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orderInfo: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  validationCodeSection: {
    padding: 20,
    alignItems: 'center',
  },
  validationCodeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  validationCodeDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeLoading: {
    padding: 40,
    alignItems: 'center',
  },
  codeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  codeDisplay: {
    backgroundColor: '#F8FAFC',
    padding: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 4,
  },
  codeId: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  codeError: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  instructions: {
    padding: 20,
    backgroundColor: '#F0FDF4',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
};