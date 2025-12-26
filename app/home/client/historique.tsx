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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/service/config';
import ClientFooter from './ClientFooter';
import { generateOrderId, generateOrderNumber } from '@/utils/orderUtils';

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
            orderId: generateOrderId(order._id),
            orderNumber: generateOrderNumber(order._id),
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
            distributorName: order.distributorId?.user?.name || order.distributorName || 'Distributeur inconnu',
            address: order.address || 'Adresse non définie',
            type: order.products && order.products.length > 0 ? order.products[0].fuelType : 'Standard',
            validationCode: order.validationCode || order.orderCode,
            isDelivery: order.isDelivery || false,
            distributorId: order.distributorId?._id || order.distributorId,
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
          <Ionicons name="receipt-outline" size={16} color="#2E7D32" />
          <Text style={styles.orderIdText}>{commande.orderId}</Text>
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
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{commande.produit}</Text>
          <Text style={styles.orderDate}>{commande.date}</Text>
        </View>
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
      <View style={styles.modernModalOverlay}>
        <View style={styles.modernModalContainer}>
          <LinearGradient
            colors={['#2E7D32', '#388E3C']}
            style={styles.modernModalHeader}
          >
            <View style={styles.modernHeaderContent}>
              <Ionicons name="receipt-outline" size={28} color="#fff" />
              <Text style={styles.modernModalTitle}>Détails de la Commande</Text>
            </View>
            <TouchableOpacity 
              style={styles.modernCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modernModalContent} showsVerticalScrollIndicator={false}>
            {selectedCommande && (
              <View style={styles.modernOrderInfo}>
                <View style={styles.modernInfoCard}>
                  <View style={styles.modernInfoRow}>
                    <View style={styles.modernInfoIconContainer}>
                      <Ionicons name="cart-outline" size={20} color="#2E7D32" />
                    </View>
                    <View style={styles.modernInfoTextContainer}>
                      <Text style={styles.modernInfoLabel}>Produit</Text>
                      <Text style={styles.modernInfoValue}>{selectedCommande.produit}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modernInfoRow}>
                    <View style={styles.modernInfoIconContainer}>
                      <Ionicons name="cash-outline" size={20} color="#2E7D32" />
                    </View>
                    <View style={styles.modernInfoTextContainer}>
                      <Text style={styles.modernInfoLabel}>Total</Text>
                      <Text style={styles.modernInfoValueHighlight}>{selectedCommande.total.toLocaleString()} FCFA</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modernInfoRow}>
                    <View style={styles.modernInfoIconContainer}>
                      <Ionicons name="flag-outline" size={20} color="#2E7D32" />
                    </View>
                    <View style={styles.modernInfoTextContainer}>
                      <Text style={styles.modernInfoLabel}>Statut</Text>
                      <View style={[styles.modernStatusBadge, { backgroundColor: getStatutColor(selectedCommande.statut) + '20' }]}>
                        <Text style={[styles.modernStatusText, { color: getStatutColor(selectedCommande.statut) }]}>
                          {getStatutText(selectedCommande.statut)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modernInfoRow}>
                    <View style={styles.modernInfoIconContainer}>
                      <Ionicons name="business-outline" size={20} color="#2E7D32" />
                    </View>
                    <View style={styles.modernInfoTextContainer}>
                      <Text style={styles.modernInfoLabel}>Distributeur</Text>
                      <Text style={styles.modernInfoValue}>{selectedCommande.distributorName}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modernInfoRow}>
                    <View style={styles.modernInfoIconContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
                    </View>
                    <View style={styles.modernInfoTextContainer}>
                      <Text style={styles.modernInfoLabel}>Date</Text>
                      <Text style={styles.modernInfoValue}>{selectedCommande.date}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modernValidationSection}>
              <View style={styles.modernSectionHeader}>
                <Ionicons name="key-outline" size={24} color="#2E7D32" />
                <Text style={styles.modernSectionTitle}>Code de Validation</Text>
              </View>
              <Text style={styles.modernSectionDescription}>
                {selectedCommande?.isDelivery 
                  ? '🚚 Donnez ce code au livreur pour confirmer la livraison'
                  : '🏪 Utilisez ce code pour confirmer votre retrait sur place'}
              </Text>

              {loadingCode ? (
                <View style={styles.modernCodeLoading}>
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.modernLoadingText}>Chargement du code...</Text>
                </View>
              ) : validationCode ? (
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9']}
                  style={styles.modernCodeContainer}
                >
                  <View style={styles.modernCodeDisplay}>
                    <Text style={styles.modernCodeText}>{validationCode}</Text>
                  </View>
                  <View style={styles.modernCodeFooter}>
                    <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
                    <Text style={styles.modernCodeId}>
                      {selectedCommande?.orderId}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.modernCodeError}>
                  <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                  <Text style={styles.modernErrorText}>Code non disponible</Text>
                  <TouchableOpacity 
                    style={styles.modernRetryButton}
                    onPress={() => selectedCommande && fetchValidationCode(selectedCommande.id)}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.modernRetryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.modernInstructions}>
              <View style={styles.modernInstructionsHeader}>
                <Ionicons name="information-circle" size={22} color="#1976D2" />
                <Text style={styles.modernInstructionsTitle}>Instructions</Text>
              </View>
              {selectedCommande?.isDelivery ? (
                <>
                  <View style={styles.modernInstructionItem}>
                    <View style={styles.modernInstructionNumber}>
                      <Text style={styles.modernInstructionNumberText}>1</Text>
                    </View>
                    <Text style={styles.modernInstructionText}>
                      Donnez ce code au livreur lors de la livraison
                    </Text>
                  </View>
                  <View style={styles.modernInstructionItem}>
                    <View style={styles.modernInstructionNumber}>
                      <Text style={styles.modernInstructionNumberText}>2</Text>
                    </View>
                    <Text style={styles.modernInstructionText}>
                      Le livreur saisira le code pour confirmer la livraison
                    </Text>
                  </View>
                  <View style={styles.modernInstructionItem}>
                    <View style={styles.modernInstructionNumber}>
                      <Text style={styles.modernInstructionNumberText}>3</Text>
                    </View>
                    <Text style={styles.modernInstructionText}>
                      Conservez ce code jusqu'à la livraison complète
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.modernInstructionItem}>
                    <View style={styles.modernInstructionNumber}>
                      <Text style={styles.modernInstructionNumberText}>1</Text>
                    </View>
                    <Text style={styles.modernInstructionText}>
                      Allez chercher votre produit au distributeur
                    </Text>
                  </View>
                  <View style={styles.modernInstructionItem}>
                    <View style={styles.modernInstructionNumber}>
                      <Text style={styles.modernInstructionNumberText}>2</Text>
                    </View>
                    <Text style={styles.modernInstructionText}>
                      Donnez ce code pour confirmer votre retrait
                    </Text>
                  </View>
                  <View style={styles.modernInstructionItem}>
                    <View style={styles.modernInstructionNumber}>
                      <Text style={styles.modernInstructionNumberText}>3</Text>
                    </View>
                    <Text style={styles.modernInstructionText}>
                      Appuyez sur "Confirmer Retrait" pour finaliser
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.modernModalFooter}>
            {!selectedCommande?.isDelivery && selectedCommande?.statut === ORDER_STATUS.CONFIRMED ? (
              <View style={styles.modernFooterButtons}>
                <TouchableOpacity 
                  style={[styles.modernConfirmButton, { opacity: validationCode ? 1 : 0.5 }]}
                  onPress={handleCompletePickup}
                  disabled={!validationCode}
                >
                  <LinearGradient
                    colors={['#2E7D32', '#388E3C']}
                    style={styles.modernButtonGradient}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.modernConfirmButtonText}>Confirmer le Retrait</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modernCancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modernCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.modernCloseButton2}
                onPress={() => setModalVisible(false)}
              >
                <LinearGradient
                  colors={['#757575', '#9E9E9E']}
                  style={styles.modernButtonGradient}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                  <Text style={styles.modernCloseButtonText}>Fermer</Text>
                </LinearGradient>
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

const styles = StyleSheet.create({
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
  orderIdText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
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
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#64748B',
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
  // Modern Modal Styles
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modernModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernCloseButton: {
    padding: 4,
  },
  modernModalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: height * 0.7,
  },
  modernOrderInfo: {
    marginBottom: 20,
  },
  modernInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modernInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernInfoTextContainer: {
    flex: 1,
  },
  modernInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  modernInfoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  modernInfoValueHighlight: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '700',
  },
  modernStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modernValidationSection: {
    marginBottom: 20,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modernSectionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  modernCodeLoading: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  modernLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modernCodeContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  modernCodeDisplay: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  modernCodeText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 8,
  },
  modernCodeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modernCodeId: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  modernCodeError: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  modernErrorText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  modernRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E53935',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modernRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modernInstructions: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modernInstructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modernInstructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  modernInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modernInstructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernInstructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernInstructionText: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    lineHeight: 20,
  },
  modernModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modernFooterButtons: {
    gap: 12,
  },
  modernConfirmButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  modernConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modernCancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modernCancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  modernCloseButton2: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  modernCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});