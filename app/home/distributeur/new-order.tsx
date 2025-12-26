import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '@/service/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DistributorFooter from './DistributorFooter';

const { width } = Dimensions.get('window');

export default function NewOrderScreen() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [inDeliveryOrders, setInDeliveryOrders] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [otherOrders, setOtherOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderActionModalVisible, setOrderActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverList, setShowDriverList] = useState(false);
  
  // États pour la validation de code
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const generateUniqueKey = (item) => {
    return item._id ? item._id.toString() : Math.random().toString();
  };

  const getDistributorId = async () => {
    try {
      const data = await AsyncStorage.getItem('userProfile');
      if (!data) {
        throw new Error('Aucune donnée utilisateur trouvée');
      }
      const parsedData = JSON.parse(data);
      const distributorId = parsedData?.profile?._id;
      if (!distributorId) {
        throw new Error('ID du distributeur introuvable dans le profil');
      }
      return distributorId;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'ID du distributeur :", error);
      throw error;
    }
  };

  const makeApiRequest = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur API pour ${url}:`, error);
      throw error;
    }
  };

  const fetchOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const distributorId = await getDistributorId();
      const urls = {
        pending: `${API_BASE_URL}/distributeurs/orders/${distributorId}/orders?status=nouveau`,
        in_delivery: `${API_BASE_URL}/distributeurs/orders/${distributorId}/orders?status=en_livraison`,
        confirmed: `${API_BASE_URL}/distributeurs/orders/${distributorId}/orders?status=confirme`,
        completed: `${API_BASE_URL}/distributeurs/orders/${distributorId}/orders?status=livre`,
        cancelled: `${API_BASE_URL}/distributeurs/orders/${distributorId}/orders?status=annule`,
        drivers: `${API_BASE_URL}/livreur/all?status=disponible`,
      };
      
      const results = await Promise.allSettled([
        makeApiRequest(urls.pending),
        makeApiRequest(urls.in_delivery),
        makeApiRequest(urls.confirmed),
        makeApiRequest(urls.completed),
        makeApiRequest(urls.cancelled),
        makeApiRequest(urls.drivers),
      ]);
      
      const [pendingResult, inDeliveryResult, confirmedResult, completedResult, cancelledResult, driversResult] = results;
      
      const processOrders = (orders) => {
        if (!Array.isArray(orders)) return [];
        const seen = new Set();
        return orders.filter(order => {
          if (!order?._id) return false;
          const key = order._id.toString();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      if (pendingResult.status === 'fulfilled') {
        setPendingOrders(processOrders(pendingResult.value?.orders || []));
      } else {
        console.error('Erreur commandes en attente:', pendingResult.reason);
        setPendingOrders([]);
      }
      
      if (inDeliveryResult.status === 'fulfilled') {
        setInDeliveryOrders(processOrders(inDeliveryResult.value?.orders || []));
      } else {
        console.error('Erreur commandes en livraison:', inDeliveryResult.reason);
        setInDeliveryOrders([]);
      }
      
      if (confirmedResult.status === 'fulfilled') {
        setConfirmedOrders(processOrders(confirmedResult.value?.orders || []));
      } else {
        console.error('Erreur commandes confirmées:', confirmedResult.reason);
        setConfirmedOrders([]);
      }
      
      if (completedResult.status === 'fulfilled') {
        setCompletedOrders(processOrders(completedResult.value?.orders || []));
      } else {
        console.error('Erreur commandes terminées:', completedResult.reason);
        setCompletedOrders([]);
      }
      
      if (cancelledResult.status === 'fulfilled') {
        setOtherOrders(processOrders(cancelledResult.value?.orders || []));
      } else {
        console.error('Erreur autres commandes:', cancelledResult.reason);
        setOtherOrders([]);
      }
      
      if (driversResult.status === 'fulfilled') {
        const driversData = driversResult.value?.data && Array.isArray(driversResult.value.data)
          ? driversResult.value.data
          : [];
        setDrivers(driversData);
      } else {
        console.error('Erreur livreurs:', driversResult.reason);
        setDrivers([]);
      }
      
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes :", error);
      Alert.alert(
        "Erreur",
        error.message === 'Aucune donnée utilisateur trouvée' ||
        error.message === 'ID du distributeur introuvable dans le profil'
          ? "Session expirée. Veuillez vous reconnecter."
          : "Impossible de charger les commandes. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(false);
  }, [fetchOrders]);

  const handleOrderAction = (order, action) => {
    if (!order || !order._id) {
      Alert.alert("Erreur", "Commande invalide.");
      return;
    }
    
    // ✅ CORRECTION: Le code n'est demandé QUE pour validate_pickup (confirmation finale)
    // Pour 'accept', on accepte directement SANS code
    if (action === 'validate_pickup') {
      setSelectedOrder(order);
      setSelectedAction(action);
      setValidationCode('');
      setValidationError('');
      setValidationSuccess(false);
      setValidationModalVisible(true);
    } else {
      // Pour les autres actions (accept, assign, cancel)
      setSelectedOrder(order);
      setSelectedAction(action);
      setSelectedDriver(null);
      setShowDriverList(false);
      setOrderActionModalVisible(true);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, driverId = null) => {
    try {
      if (!orderId) {
        throw new Error('ID de commande manquant');
      }
      const distributorId = await getDistributorId();
      const body = {
        status: newStatus,
        distributorId
      };
      if (driverId) {
        body.driverId = driverId;
      }
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur serveur: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande :", error);
      throw error;
    }
  };

  const validateOrderCode = async () => {
    if (!selectedOrder || !validationCode) {
      setValidationError('Veuillez entrer le code de validation');
      return;
    }

    if (validationCode.length !== 6) {
      setValidationError('Le code doit contenir exactement 6 chiffres');
      return;
    }

    setIsValidatingCode(true);
    setValidationError('');

    try {
      const distributorId = await getDistributorId();
      const orderId = selectedOrder._id;
      const isDeliveryOrder = selectedOrder.isDelivery === true;

      // ✅ CORRECTION: Cette fonction ne valide QUE les commandes confirmées avec le CODE
      // Les nouvelles commandes sont acceptées via confirmOrderAction() SANS code
      console.log('🔐 Validation avec le code pour commande confirmée...');
      
      const endpoint = isDeliveryOrder 
        ? `/orders/${orderId}/validate-delivery`
        : `/orders/${orderId}/complete-pickup`;
      
      const body = {
        validationCode: validationCode,
        distributorId: distributorId,
        livreurUserId: selectedOrder.livreurId || null,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setValidationSuccess(true);
        let message = '';

        if (isDeliveryOrder) {
          // Livraison validée
          message = `✅ Livraison validée avec succès!\n\n`;
          setInDeliveryOrders(prev => prev.filter(o => o._id !== orderId));
        } else {
          // Retrait validé
          message = `✅ Retrait validé avec succès!\n\n`;
          setConfirmedOrders(prev => prev.filter(o => o._id !== orderId));
        }

        setCompletedOrders(prev => [...prev, { 
          ...selectedOrder, 
          status: 'livre',
          validated: true 
        }]);

        // Ajouter le montant reçu si disponible
        let amount = 0;
        if (data.financial?.distributor?.amount) {
          amount = data.financial.distributor.amount;
          message += `Montant reçu: ${amount.toLocaleString()} FCFA`;
        }

        setValidationMessage(message);
        
        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
          setValidationModalVisible(false);
          setValidationCode('');
          setValidationSuccess(false);
          setValidationMessage('');
        }, 3000);
        
      } else {
        setValidationError(data.message || 'Code de validation incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la validation du code:', error);
      setValidationError('Une erreur est survenue lors de la validation');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const sendDriverAssignmentData = async (order, driver) => {
    try {
      const distributorId = await getDistributorId();
      
      const response = await fetch(`${API_BASE_URL}/distributeurs/orders/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distributorId,
          orderId: order._id,
          driverId: driver._id,
          driverName: driver.user?.name || "Inconnu",
          driverPhone: driver.user?.phone || "Non fourni",
          clientName: order.clientName || "Inconnu",
          status: 'en_route',
          startTime: new Date().toISOString(),
          total: order.total || 0,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error && errorData.error.includes('déjà en cours de livraison')) {
          console.log("✅ Commande déjà assignée, poursuite du processus");
          return { success: true, alreadyAssigned: true };
        }
        throw new Error(errorData.error || `Erreur serveur: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de l'envoi des données du livreur :", error);
      throw error;
    }
  };

  const confirmOrderAction = async () => {
    if (!selectedOrder || !selectedAction) {
      Alert.alert("Erreur", "Données de commande manquantes.");
      return;
    }
    
    if (selectedAction === 'assign' && !selectedDriver) {
      Alert.alert("Erreur", "Veuillez sélectionner un livreur.");
      return;
    }
    
    try {
      let newStatus;
      const orderId = selectedOrder._id;
      const isDeliveryOrder = selectedOrder.isDelivery === true;

      switch (selectedAction) {
        case 'accept':
          // Accepter la commande SANS code
          newStatus = 'confirme';
          await updateOrderStatus(orderId, newStatus);
          setPendingOrders(prev => prev.filter((o) => o._id !== orderId));
          setConfirmedOrders(prev => [...prev, { ...selectedOrder, status: newStatus }]);
          break;

        case 'assign':
          // Assigner un livreur (UNIQUEMENT pour les livraisons)
          if (!isDeliveryOrder) {
            throw new Error("Cette commande ne nécessite pas de livreur (retrait sur place)");
          }
          
          newStatus = 'en_livraison';
          const selectedDriverObj = drivers.find(d => d._id === selectedDriver);
          if (!selectedDriverObj) {
            Alert.alert("Erreur", "Livreur sélectionné introuvable.");
            return;
          }

          // Mettre à jour le statut
          await updateOrderStatus(orderId, newStatus, selectedDriver);
          
          // Envoyer les données d'assignation
          try {
            await sendDriverAssignmentData(selectedOrder, selectedDriverObj);
          } catch (assignmentError) {
            console.warn("Avertissement assignation:", assignmentError.message);
          }

          setConfirmedOrders(prev => prev.filter((o) => o._id !== orderId));
          setInDeliveryOrders(prev => [...prev, { 
            ...selectedOrder, 
            status: newStatus, 
            driver: selectedDriverObj 
          }]);
          
          setDrivers(prev =>
            prev.map((d) =>
              d._id === selectedDriver ? { ...d, status: 'occupé' } : d
            )
          );
          break;

        case 'cancel':
          newStatus = 'annule';
          await updateOrderStatus(orderId, newStatus);
          setPendingOrders(prev => prev.filter((o) => o._id !== orderId));
          setOtherOrders(prev => [...prev, { ...selectedOrder, status: newStatus }]);
          break;

        default:
          Alert.alert("Erreur", "Action non reconnue.");
          return;
      }
      
      Alert.alert("Succès", "Commande mise à jour avec succès.");
      
    } catch (error) {
      console.error("Erreur lors de la confirmation de l'action :", error);
      Alert.alert("Erreur", error.message || "Impossible de confirmer l'action.");
    } finally {
      setOrderActionModalVisible(false);
      setSelectedOrder(null);
      setSelectedAction('');
      setSelectedDriver(null);
      setShowDriverList(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'nouveau': '#FF9800',
      'confirme': '#2196F3',
      'en_livraison': '#2E7D32',
      'livre': '#4CAF50',
      'annule': '#F44336',
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'nouveau': 'NOUVEAU',
      'confirme': 'CONFIRMÉ',
      'en_livraison': 'EN LIVRAISON',
      'livre': 'LIVRÉ',
      'annule': 'ANNULÉ',
    };
    return labels[status] || status.toUpperCase();
  };

  const OrderCard = React.memo(({ order, onAction }) => {
    if (!order || !order._id) {
      return null;
    }

    const isDeliveryOrder = order.isDelivery === true;

    return (
      <View style={[styles.orderCard, { borderLeftColor: getStatusColor(order.status), borderLeftWidth: 4 }]}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{order._id?.slice(-8) || 'N/A'}</Text>
            <Text style={styles.orderTime}>
              {order.orderTime ? new Date(order.orderTime).toLocaleString() : 'Date non disponible'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.typeBadge, { 
              backgroundColor: isDeliveryOrder ? '#E3F2FD' : '#E8F5E8' 
            }]}>
              <Text style={[styles.typeText, { 
                color: isDeliveryOrder ? '#1976D2' : '#2E7D32' 
              }]}>
                {isDeliveryOrder ? 'LIVRAISON' : 'RETRAIT'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.orderClient}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.clientName}>{order.clientName || 'Client non défini'}</Text>
        </View>
        <View style={styles.orderAddress}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.addressText}>{order.address || 'Adresse non définie'}</Text>
        </View>
        <View style={styles.orderProducts}>
          {order.products && Array.isArray(order.products) ? (
            order.products.map((product, index) => (
              <Text key={`${order._id}-product-${index}`} style={styles.productText}>
                {product.quantity || 0}x {product.name || 'Produit'} ({product.type || 'Type non défini'})
              </Text>
            ))
          ) : (
            <Text style={styles.productText}>Aucun produit</Text>
          )}
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            {order.total ? order.total.toLocaleString() : '0'} FCFA
          </Text>
          <View style={styles.orderActions}>
            {order.status === 'nouveau' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => onAction(order, 'cancel')}
                >
                  <Ionicons name="close" size={16} color="#FF5722" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => onAction(order, 'accept')}
                >
                  <Ionicons name="checkmark" size={16} color="#2E7D32" />
                </TouchableOpacity>
              </>
            )}
            
            {order.status === 'confirme' && (
              <>
                {isDeliveryOrder && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => onAction(order, 'assign')}
                  >
                    <Ionicons name="car-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                {!isDeliveryOrder && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.validateButton]}
                    onPress={() => onAction(order, 'validate_pickup')}
                  >
                    <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {order.status === 'en_livraison' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.validateButton]}
                onPress={() => onAction(order, 'validate_pickup')}
              >
                <Ionicons name="key-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  });

  const OrderSection = React.memo(({ title, orders, onAction }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title} ({orders.length})</Text>
      </View>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={generateUniqueKey}
          renderItem={({ item }) => <OrderCard order={item} onAction={onAction} />}
          scrollEnabled={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      ) : (
        <Text style={styles.emptyText}>Aucune commande {title.toLowerCase()}.</Text>
      )}
    </View>
  ));

  const availableDrivers = Array.isArray(drivers)
    ? drivers.filter(driver =>
        driver &&
        driver.status === 'disponible' &&
        driver._id &&
        driver.user?.name
      )
    : [];

  const getModalTitle = () => {
    const isDeliveryOrder = selectedOrder?.isDelivery === true;
    
    switch (selectedAction) {
      case 'accept':
        return 'Accepter la commande';
      case 'assign':
        return 'Assigner un livreur';
      case 'validate_pickup':
        return 'Valider le retrait';
      case 'cancel':
        return 'Annuler la commande';
      default:
        return 'Action sur commande';
    }
  };

  const getValidationModalTitle = () => {
    if (!selectedOrder) return 'Validation';
    
    if (selectedOrder.status === 'nouveau') {
      return 'Accepter la commande';
    } else if (selectedOrder.isDelivery) {
      return 'Valider la livraison';
    } else {
      return 'Valider le retrait';
    }
  };

  const getValidationInstructions = () => {
    if (!selectedOrder) return '';
    
    // ✅ Cette fonction n'est appelée QUE pour les commandes confirmées
    // Les nouvelles commandes sont acceptées via le modal d'action SANS code
    if (selectedOrder.isDelivery) {
      return 'Entrez le code de validation fourni par le client pour finaliser la livraison.';
    } else {
      return 'Entrez le code de validation fourni par le client pour valider le retrait sur place.';
    }
  };

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
          <Text style={styles.headerTitle}>Nouvelles Commandes</Text>
        </LinearGradient>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2E7D32']}
              tintColor="#2E7D3C"
            />
          }
        >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Chargement des commandes...</Text>
          </View>
        ) : (
          <>
            <OrderSection
              title="En attente"
              orders={pendingOrders}
              onAction={handleOrderAction}
            />
            <OrderSection
              title="Confirmées"
              orders={confirmedOrders}
              onAction={handleOrderAction}
            />
            <OrderSection
              title="En livraison"
              orders={inDeliveryOrders}
              onAction={handleOrderAction}
            />
            <OrderSection
              title="Terminées"
              orders={completedOrders}
              onAction={handleOrderAction}
            />
            <OrderSection
              title="Annulées"
              orders={otherOrders}
              onAction={handleOrderAction}
            />
          </>
        )}
      </ScrollView>
      
      {/* MODAL DE VALIDATION DE CODE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={validationModalVisible}
        onRequestClose={() => {
          if (!isValidatingCode) {
            setValidationModalVisible(false);
            setValidationCode('');
            setValidationError('');
            setValidationSuccess(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.validationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getValidationModalTitle()}</Text>
              {!isValidatingCode && (
                <TouchableOpacity 
                  onPress={() => {
                    setValidationModalVisible(false);
                    setValidationCode('');
                    setValidationError('');
                    setValidationSuccess(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            {selectedOrder && (
              <View style={styles.validationOrderInfo}>
                <Text style={styles.validationOrderTitle}>
                  Commande #{selectedOrder._id?.slice(-8) || 'N/A'}
                </Text>
                <Text style={styles.validationOrderClient}>
                  {selectedOrder.clientName || 'Client non défini'}
                </Text>
                <View style={styles.validationOrderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Montant:</Text>
                    <Text style={[styles.detailValue, { fontWeight: '700', color: '#2E7D32' }]}>
                      {selectedOrder.total ? selectedOrder.total.toLocaleString() : '0'} FCFA
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.isDelivery ? '🚚 LIVRAISON' : '🏪 RETRAIT SUR PLACE'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {validationSuccess ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                <Text style={styles.successText}>{validationMessage}</Text>
              </View>
            ) : (
              <>
                <View style={styles.validationSection}>
                  <Text style={styles.validationLabel}>
                    {getValidationInstructions()}
                  </Text>
                  <TextInput
                    style={[styles.validationCodeInput, validationError ? styles.inputError : null]}
                    placeholder="000000"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                    maxLength={6}
                    value={validationCode}
                    onChangeText={(text) => {
                      setValidationCode(text);
                      setValidationError('');
                    }}
                    editable={!isValidatingCode}
                    autoFocus={true}
                  />
                  {validationError ? (
                    <Text style={styles.errorText}>{validationError}</Text>
                  ) : null}
                  <Text style={styles.codeHint}>
                    Le code de validation est composé de 6 chiffres
                  </Text>
                </View>

                <View style={styles.validationButtons}>
                  <TouchableOpacity 
                    style={[styles.validateButtonModal, isValidatingCode && styles.buttonDisabled]}
                    onPress={validateOrderCode}
                    disabled={isValidatingCode}
                  >
                    {isValidatingCode ? (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.validateButtonText}>
                      {isValidatingCode ? 'Validation...' : 'Valider'}
                    </Text>
                  </TouchableOpacity>

                  {!isValidatingCode && (
                    <TouchableOpacity 
                      style={styles.cancelButtonModal}
                      onPress={() => {
                        setValidationModalVisible(false);
                        setValidationCode('');
                        setValidationError('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL D'ACTION (assign, cancel) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderActionModalVisible}
        onRequestClose={() => setOrderActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={() => setOrderActionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedOrder && (
              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>
                  Commande #{selectedOrder._id?.slice(-8) || 'N/A'}
                </Text>
                <Text style={styles.orderSummaryClient}>
                  {selectedOrder.clientName || 'Client non défini'}
                </Text>
                <Text style={styles.orderSummaryTotal}>
                  {selectedOrder.total ? selectedOrder.total.toLocaleString() : '0'} FCFA
                </Text>
                <View style={[styles.typeBadge, { 
                  backgroundColor: selectedOrder.isDelivery ? '#E3F2FD' : '#E8F5E8',
                  alignSelf: 'flex-start',
                  marginTop: 5
                }]}>
                  <Text style={[styles.typeText, { 
                    color: selectedOrder.isDelivery ? '#1976D2' : '#2E7D32' 
                  }]}>
                    {selectedOrder.isDelivery ? 'LIVRAISON' : 'RETRAIT SUR PLACE'}
                  </Text>
                </View>
              </View>
            )}
            
            {selectedAction === 'assign' && selectedOrder?.isDelivery && (
              <>
                <Text style={styles.inputLabel}>Sélectionner un livreur:</Text>
                <TouchableOpacity
                  style={styles.driverSelector}
                  onPress={() => setShowDriverList(!showDriverList)}
                >
                  <Text style={styles.driverSelectorText}>
                    {selectedDriver
                      ? drivers.find(d => d._id === selectedDriver)?.user?.name || 'Sélectionnez un livreur...'
                      : 'Sélectionnez un livreur...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {showDriverList && (
                  <View style={styles.driverList}>
                    {availableDrivers.length > 0 ? (
                      availableDrivers.map((driver) => (
                        <TouchableOpacity
                          key={driver._id}
                          style={styles.driverItem}
                          onPress={() => {
                            setSelectedDriver(driver._id);
                            setShowDriverList(false);
                          }}
                        >
                          <Text style={styles.driverName}>{driver.user.name}</Text>
                          <Text style={styles.driverPhone}>{driver.user.phone || 'N/A'}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noDriverText}>Aucun livreur disponible</Text>
                    )}
                  </View>
                )}
              </>
            )}
            
            <TouchableOpacity
              style={[styles.confirmActionButton,
                (selectedAction === 'assign' && !selectedDriver && selectedOrder?.isDelivery) ? styles.disabledButton : null
              ]}
              onPress={confirmOrderAction}
              disabled={selectedAction === 'assign' && !selectedDriver && selectedOrder?.isDelivery}
            >
              <LinearGradient
                colors={
                  (selectedAction === 'assign' && !selectedDriver && selectedOrder?.isDelivery)
                    ? ['#cccccc', '#999999']
                    : selectedAction === 'cancel'
                    ? ['#F44336', '#D32F2F']
                    : ['#2E7D32', '#388E3C']
                }
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>
                  {selectedAction === 'assign'
                    ? 'Assigner'
                    : selectedAction === 'cancel'
                    ? 'Annuler'
                    : 'Confirmer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
      <DistributorFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 20,
    fontStyle: 'italic',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderClient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  orderAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  orderProducts: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  assignButton: {
    backgroundColor: '#2196F3',
  },
  validateButton: {
    backgroundColor: '#4CAF50',
  },
  infoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  // ===== MODAL PRINCIPAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  // ===== MODAL DE VALIDATION =====
  validationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  validationOrderInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  validationOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  validationOrderClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  validationOrderDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
  },
  validationSection: {
    marginBottom: 20,
  },
  validationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  validationCodeInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 10,
    color: '#333',
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  codeHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  validationButtons: {
    gap: 10,
  },
  validateButtonModal: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  orderSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  orderSummaryClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderSummaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  driverSelector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverSelectorText: {
    fontSize: 14,
    color: '#666',
  },
  driverList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 250,
    marginBottom: 15,
  },
  driverItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  driverPhone: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noDriverText: {
    padding: 15,
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
  },
  confirmActionButton: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});