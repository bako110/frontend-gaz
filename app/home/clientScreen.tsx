import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
  Alert,
  Modal,
  Linking,
  Platform,
  ActivityIndicator,
  BackHandler,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Link } from 'expo-router';
import { API_BASE_URL } from '@/service/config';
import styles from '@/styles/clientScreen';
import useNotifications from './client/useNotifications';
import SearchSystem from './client/SearchSystem';
import OrderModal from './client/ordermodal'; // Import du nouveau composant modal
import ClientFooter from './client/ClientFooter'; // Import du footer partagé
import { useExitAlert } from '@/app/hooks/useExitAlert';

const { width, height } = Dimensions.get('window');

// Constantes pour les statuts des commandes
const ORDER_STATUS = {
  PENDING: 'en_attente',
  CONFIRMED: 'confirme',
  IN_DELIVERY: 'en_livraison',
  DELIVERED: 'livre',
  CANCELLED: 'annule',
};

export default function ClientDashboard() {
  // Gestion de la sortie de l'application
  useExitAlert();

  // ========== États ==========
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lastBackPress, setLastBackPress] = useState(0);
  const [commandesEnCours, setCommandesEnCours] = useState([]);
  const [showAllLivraisons, setShowAllLivraisons] = useState(false);
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [ordersThisMonthCount, setOrdersThisMonthCount] = useState(0);

  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    address: '',
    phone: '',
    credit: null,
    photo: null,
    lastLocation: null,
    _id: null,
  });

  // États pour les notifications avec le hook personnalisé
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const {
    notifications,
    loading: isLoadingNotifications,
    error: notificationError,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(clientInfo);

  // ========== Effets ==========
  useEffect(() => {
    const backAction = () => {
      const now = Date.now();
      if (lastBackPress && now - lastBackPress <= 2000) {
        BackHandler.exitApp();
        return false;
      }
      setLastBackPress(now);
      Alert.alert('Quitter l\'application', 'Appuyez encore une fois pour quitter.', [{ text: 'OK' }]);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [lastBackPress]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        const userProfileStr = await AsyncStorage.getItem('userProfile');
        const userId = await AsyncStorage.getItem('userId');
        if (!userDataStr && !userProfileStr) {
          throw new Error("Aucune donnée utilisateur trouvée. Veuillez vous reconnecter.");
        }
        const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr);
        const user = userProfileStr ? parsedData.user : parsedData;
        if (!parsedData || !user) {
          throw new Error("Données utilisateur invalides. Veuillez vous reconnecter.");
        }
        const userIdToUse = parsedData?.profile?._id || user?._id || userId;
        if (!userIdToUse) {
          throw new Error("ID utilisateur manquant. Veuillez vous reconnecter.");
        }
        setClientInfo({
          name: user?.name || parsedData?.profile?.name || 'Utilisateur',
          address: user?.address || parsedData?.profile?.address || 'Adresse non définie',
          phone: user?.phone || parsedData?.profile?.phone || 'Téléphone non défini',
          credit: user?.credit || parsedData?.profile?.credit || 0,
          photo: user?.photo || parsedData?.profile?.photo || null,
          _id: userIdToUse,
          lastLocation: user?.lastLocation || null,
        });
        await fetchClientBalance();
      } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur :", error.message);
        Alert.alert(
          "Erreur",
          error.message || "Impossible de charger vos données. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => router.push('/') }]
        );
      }
    };
    loadUserData();
  }, []);

  // Récupération du solde du client
  const fetchClientBalance = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      const userId = await AsyncStorage.getItem('userId');
      if (!userDataStr && !userProfileStr) {
        throw new Error('Données utilisateur non trouvées');
      }
      let clientId;
      let userToken;
      if (userProfileStr) {
        const profileData = JSON.parse(userProfileStr);
        clientId = profileData.user?.id || profileData.profile?._id || profileData.user?._id;
      }
      if (!clientId && userDataStr) {
        const userData = JSON.parse(userDataStr);
        clientId = userData.id || userData._id || userData.user?.id || userData.user?._id;
      }
      if (!clientId && userId) {
        clientId = userId;
      }
      if (!clientId) {
        throw new Error('ID client non trouvé dans les données utilisateur');
      }
      userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        throw new Error('Token d\'authentification manquant');
      }
      const response = await fetch(`${API_BASE_URL}/wallet/${clientId}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const balanceValue = data.balance?.balance || data.balance || data.data?.balance || data.credit || data.solde || 0;
      setClientInfo(prev => ({
        ...prev,
        credit: parseFloat(balanceValue) || 0,
        _id: clientId
      }));
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du solde client :", error);
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        const userProfileStr = await AsyncStorage.getItem('userProfile');
        if (userProfileStr) {
          const profileData = JSON.parse(userProfileStr);
          const localCredit = profileData.user?.credit || profileData.profile?.credit;
          if (localCredit !== undefined) {
            setClientInfo(prev => ({ ...prev, credit: parseFloat(localCredit) || 0 }));
          }
        } else if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const localCredit = userData.credit || userData.user?.credit;
          if (localCredit !== undefined) {
            setClientInfo(prev => ({ ...prev, credit: parseFloat(localCredit) || 0 }));
          }
        }
      } catch (localError) {
        console.error("Erreur récupération solde local:", localError);
      }
      setError(error.message || "Impossible de charger le solde du client.");
    }
  };

  // Chargement des notifications
  useEffect(() => {
    if (clientInfo._id) {
      fetchNotifications();
    }
  }, [clientInfo._id, fetchNotifications]);

  // Rafraîchissement automatique des notifications
  useEffect(() => {
    if (clientInfo._id) {
      const notificationInterval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(notificationInterval);
    }
  }, [clientInfo._id, fetchNotifications]);

  // Rechargement du solde
  const fetchUserCredit = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/users/${clientInfo._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.user) {
          setClientInfo(prev => ({ ...prev, credit: userData.user.credit }));
        }
      }
    } catch (error) {
      console.error("Erreur lors du rechargement du solde :", error);
    }
  }, [clientInfo._id]);

  // Récupération des commandes
  // Récupération des commandes - VERSION SIMPLIFIÉE
const fetchOrders = useCallback(async () => {
  if (!clientInfo._id) return;
  
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    // Utiliser la nouvelle route API qui retourne TOUTES les commandes
    const response = await fetch(`${API_BASE_URL}/orders/client-history/${clientInfo._id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log("📡 [API] Réponse status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("📦 Réponse API complète:", data);
      
      if (data.success && data.historique) {
        // SÉPARER les commandes selon leur statut
        const allOrders = data.historique;
        
        // COMMANDES EN COURS : statuts non terminés
        const commandesEnCoursData = allOrders.filter(order => 
          order.status === ORDER_STATUS.PENDING || 
          order.status === ORDER_STATUS.CONFIRMED || 
          order.status === ORDER_STATUS.IN_DELIVERY ||
          order.status === 'nouveau' // Ajout du statut "nouveau" depuis vos données
        );
        
        // HISTORIQUE : statuts terminés
        const historiqueData = allOrders.filter(order => 
          order.status === ORDER_STATUS.DELIVERED || 
          order.status === ORDER_STATUS.CANCELLED
        );
        
        console.log(`📊 Résultat du tri:
          - Commandes en cours: ${commandesEnCoursData.length}
          - Historique: ${historiqueData.length}
        `);
        
        // Formater les commandes en cours
        const formattedEnCours = commandesEnCoursData.map((order) => ({
          id: order._id,
          produit: order.products && order.products.length > 0
            ? `${order.products[0].name} (${order.products[0].fuelType || 'Standard'})`
            : 'Produit inconnu',
          quantite: order.products && order.products.length > 0 ? order.products[0].quantity : 1,
          statut: order.status,
          livreur: order.delivery?.driverName || 'En attente',
          heureEstimee: order.estimatedDeliveryTime || 'Heure non définie',
          total: order.total || 0,
          orderTime: order.orderTime,
          address: order.address || 'Adresse non définie',
          clientName: order.clientName || clientInfo.name,
          clientPhone: order.clientPhone || clientInfo.phone,
          distributorId: order.distributorId || 'inconnu',
          distributorName: order.distributorName || 'Distributeur inconnu',
          _id: order._id,
          type: order.products && order.products.length > 0 ? order.products[0].fuelType : 'Standard',
          isDelivery: order.isDelivery // Ajout du booléen isDelivery
        }));
        
        // Formater l'historique (trié par date)
        const sortedHistorique = [...historiqueData].sort((a, b) =>
          new Date(b.orderTime) - new Date(a.orderTime)
        );
        
        const formattedHistorique = sortedHistorique.map((order) => ({
          id: order._id,
          date: order.orderTime ? new Date(order.orderTime).toLocaleString('fr-FR') : 'Date inconnue',
          orderTime: order.orderTime || order.date,
          produit: order.products && order.products.length > 0
            ? `${order.products[0].name} (${order.products[0].fuelType || 'Standard'})`
            : 'Produit inconnu',
          quantite: order.products && order.products.length > 0 ? order.products[0].quantity : 1,
          total: order.total || 0,
          statut: order.status,
          priority: order.priority,
          distributorName: order.distributorName || 'Distributeur inconnu',
          address: order.address || 'Adresse non définie',
          type: order.products && order.products.length > 0 ? order.products[0].fuelType : 'Standard',
        }));
        
        // Mettre à jour les états
        setCommandesEnCours(formattedEnCours);
        setHistoriqueCommandes(formattedHistorique);
        
        // 📊 Calculer les commandes de ce mois
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const count = formattedHistorique.filter(order => {
          const orderDate = new Date(order.orderTime);
          return orderDate.getMonth() === currentMonth && 
                 orderDate.getFullYear() === currentYear && 
                 order.statut === 'livre';
        }).length;
        setOrdersThisMonthCount(count);
        console.log('✅ MISE À JOUR: ordersThisMonthCount =', count);
        
      } else {
        console.log("❌ Données invalides dans la réponse");
      }
    } else {
      console.log("❌ Erreur API:", response.status, response.statusText);
      const errorData = await response.text();
      console.log("❌ Détails erreur:", errorData);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des commandes :", error);
  }
}, [clientInfo._id, clientInfo.name, clientInfo.phone]);
  // Rafraîchissement automatique des commandes
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Rafraîchissement manuel
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchOrders(), fetchUserCredit(), fetchNotifications()]).finally(() => setRefreshing(false));
  }, [fetchOrders, fetchUserCredit, fetchNotifications]);

  // Récupération des produits
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/distributeurs/all-products`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Erreur lors de la récupération des produits.");
        let allProducts = [];
        if (data.products && Array.isArray(data.products)) {
          allProducts = data.products.map((product) => ({
            ...product,
            distributorId: product.distributorId || product.distributor?._id || 'inconnu',
            distributorName: product.distributorName || 'Distributeur inconnu',
            zone: product.zone || 'Zone non définie',
            name: product.name || 'Produit sans nom',
            price: product.price || 0,
            stock: product.stock || 0,
            type: product.fuelType || 'Standard',
          }));
        } else if (data.distributors && Array.isArray(data.distributors)) {
          allProducts = data.distributors
            .filter((distributor) => distributor && distributor.products && Array.isArray(distributor.products))
            .flatMap((distributor) =>
              distributor.products.map((product) => ({
                ...product,
                distributorId: distributor._id || distributor.id || 'inconnu',
                distributorName: distributor.user?.name || distributor.name || 'Distributeur inconnu',
                zone: distributor.zone || 'Zone non définie',
                type: product.fuelType || 'Standard',
              }))
            );
        }
        if (allProducts.length === 0) {
          setError("Aucun produit disponible pour le moment.");
        }
        setDistributors(allProducts);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setError(error.message || "Erreur de connexion. Veuillez réessayer plus tard.");
        setDistributors([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  // ========== Fonctions utilitaires ==========
  const getStatutColor = (statut) => {
    switch (statut) {
      case ORDER_STATUS.IN_DELIVERY: return '#2E7D32';
      case ORDER_STATUS.DELIVERED: return '#4CAF50';
      case ORDER_STATUS.CANCELLED: return '#E53935';
      case ORDER_STATUS.CONFIRMED: return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case ORDER_STATUS.IN_DELIVERY: return 'car-outline';
      case ORDER_STATUS.DELIVERED: return 'checkmark-done-outline';
      case ORDER_STATUS.CANCELLED: return 'close-circle-outline';
      case ORDER_STATUS.CONFIRMED: return 'checkmark-circle-outline';
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#E53935';
      case 'high': return '#FF9800';
      default: return '#2E7D32';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return 'warning';
      case 'high': return 'chevron-up';
      default: return 'remove';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const openMaps = (latitude, longitude) => {
    if (!latitude || !longitude) {
      Alert.alert('Erreur', 'Localisation indisponible');
      return;
    }
    const label = 'Distributeur';
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}(${label})`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`
    });
    Linking.openURL(url).catch(err => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la carte');
      console.error(err);
    });
  };

  const handleSelectProduct = async (product) => {
    let updatedProduct = { ...product };
    if (clientInfo.lastLocation?.latitude && clientInfo.lastLocation?.longitude) {
      try {
        const response = await fetch(`${API_BASE_URL}/delivery-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientLat: clientInfo.lastLocation.latitude,
            clientLng: clientInfo.lastLocation.longitude,
            distributorId: product.distributorId,
          }),
        });
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        updatedProduct.distance = typeof data.distance === 'number' ? data.distance : 0;
        updatedProduct.deliveryFee = typeof data.deliveryFee === 'number' ? data.deliveryFee : 0;
      } catch (error) {
        console.error("Erreur calcul livraison:", error);
        updatedProduct.distance = 0;
        updatedProduct.deliveryFee = 0;
      }
    } else {
      console.warn("Position du client non disponible !");
      updatedProduct.distance = 0;
      updatedProduct.deliveryFee = 0;
    }
    setSelectedProduct(updatedProduct);
    setModalVisible(true);
  };

  // Callback appelé après une commande réussie
  const handleOrderSuccess = useCallback(({ product, quantity, total, newOrder }) => {
    // Mettre à jour le crédit client
    setClientInfo(prev => ({ ...prev, credit: (prev.credit || 0) - total }));
    
    // Ajouter la nouvelle commande aux historiques
    setHistoriqueCommandes(prev => [newOrder, ...prev]);
    setCommandesEnCours(prev => [newOrder, ...prev]);
  }, []);

  // Gestion du clic sur une notification
  const handleNotificationPress = (notification) => {
    markAsRead(notification.id);
    if (notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
      setNotificationModalVisible(false);
    } else if (notification.data?.type === 'promotion') {
      router.push('/promotions');
      setNotificationModalVisible(false);
    } else if (notification.data?.type === 'system') {
      Alert.alert(notification.title, notification.message, [
        { text: "OK" }
      ]);
    }
  };

  // ========== Composant Modal des Notifications ==========
  const NotificationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={notificationModalVisible}
      onRequestClose={() => setNotificationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.8, width: width * 0.9 }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {notifications.some(n => !n.read) && (
                <TouchableOpacity
                  style={styles.markAllReadButton}
                  onPress={markAllAsRead}
                >
                  <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setNotificationModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {notificationError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{notificationError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchNotifications}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}
          {isLoadingNotifications ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Chargement des notifications...</Text>
            </View>
          ) : notifications.length > 0 ? (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.notificationItem,
                    !item.read && styles.unreadNotification,
                  ]}
                  onPress={() => handleNotificationPress(item)}
                  onLongPress={() => {
                    Alert.alert(
                      "Supprimer la notification",
                      "Voulez-vous supprimer cette notification ?",
                      [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Supprimer",
                          style: "destructive",
                          onPress: () => deleteNotification(item.id)
                        }
                      ]
                    );
                  }}
                >
                  <View style={styles.notificationIconContainer}>
                    <Ionicons
                      name={
                        item.type === 'success' ? 'checkmark-circle' :
                        item.type === 'warning' ? 'warning' :
                        item.type === 'error' ? 'alert-circle' :
                        'information-circle'
                      }
                      size={20}
                      color={
                        item.type === 'success' ? '#4CAF50' :
                        item.type === 'warning' ? '#FF9800' :
                        item.type === 'error' ? '#E53935' :
                        '#2196F3'
                      }
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    {!item.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.notificationAction}
                    onPress={() => deleteNotification(item.id)}
                  >
                    <Ionicons name="close" size={16} color="#999" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.noNotifications}>
              <Ionicons name="notifications-off-outline" size={48} color="#718096" />
              <Text style={styles.noNotificationsText}>Aucune notification</Text>
              <Text style={styles.noNotificationsSubtext}>
                Vous serez notifié des mises à jour importantes ici
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // ========== Composants réutilisables ==========
  const QuickStatCard = ({ icon, title, value, color = '#2E7D32' }) => (
    <View style={[styles.quickStatCard, { borderLeftColor: color }]}>
      <View style={styles.quickStatCardContent}>
        <View style={[styles.quickStatIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.quickStatValue}>{value}</Text>
      </View>
      <Text style={styles.quickStatTitle}>{title}</Text>
    </View>
  );

  const ProductCard = ({ product }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => handleSelectProduct(product)}>
      <View style={styles.productImageContainer}>
        <Image source={require('@/assets/images/express-gaz.png')} style={styles.productImage} />
        {product.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Rupture</Text>
          </View>
        )}
      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productType}>{product.type}</Text>
      <Text style={styles.productPrice}>{product.price?.toLocaleString()} FCFA</Text>
      <Text style={styles.productDistributor}>{product.distributorName}</Text>
      <Text style={[
        styles.productStock,
        product.stock === 0 ? styles.productStockOut : styles.productStockIn
      ]}>
        {product.stock === 0 ? 'Rupture' : `Stock: ${product.stock || 0}`}
      </Text>
      {product.distance > 0 && (
        <Text style={styles.productDistance}>
          📍 {product.distance.toFixed(1)} km
        </Text>
      )}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => openMaps(product.lastLocation?.latitude, product.lastLocation?.longitude)}
      >
        <Ionicons name="location-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const CommandeCard = ({ commande }) => (
    <TouchableOpacity style={styles.commandeCard} activeOpacity={0.8}>
      <View style={styles.commandeHeader}>
        <Text style={styles.commandeId}>#{commande.id}</Text>
        <View style={[styles.statutBadge, { backgroundColor: getStatutColor(commande.statut) + '20' }]}>
          <Ionicons name={getStatutIcon(commande.statut)} size={16} color={getStatutColor(commande.statut)} />
          <Text style={[styles.statutText, { color: getStatutColor(commande.statut) }]}>
            {commande.statut.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.commandeProduit}>{commande.produit}</Text>
      <Text style={styles.commandeType}>Type: {commande.type}</Text>
      <Text style={styles.commandeQuantite}>Quantité: {commande.quantite}</Text>
      <View style={styles.commandeDetails}>
        <View style={styles.commandeDetailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.commandeDetailText}>{commande.livreur}</Text>
        </View>
        <View style={styles.commandeDetailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.commandeDetailText}>{commande.heureEstimee}</Text>
        </View>
        <View style={styles.commandeDetailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.commandeDetailText}>{commande.total.toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.commandeDetailRow}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.commandeDetailText}>{commande.distributorName || 'Distributeur inconnu'}</Text>
        </View>
      </View>
      {commande.statut === ORDER_STATUS.IN_DELIVERY && (
        <TouchableOpacity style={styles.trackButton}>
          <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.trackButtonGradient}>
            <Ionicons name="navigate-outline" size={18} color="#fff" />
            <Text style={styles.trackButtonText}>Suivre la livraison</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const HistoryCard = ({ commande }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyCardTop}>
        <View style={styles.historyCardLeft}>
          <Text style={styles.historyProduct}>{commande.produit}</Text>
          <Text style={styles.historyDate}>{commande.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatutColor(commande.statut) + '20' }]}>
          <Ionicons name={getStatutIcon(commande.statut)} size={14} color={getStatutColor(commande.statut)} />
          <Text style={[styles.statusText, { color: getStatutColor(commande.statut) }]}>
            {getStatutText(commande.statut)}
          </Text>
        </View>
      </View>
      <View style={styles.historyCardMiddle}>
        <View style={styles.historyDistributor}>
          <Ionicons name="storefront-outline" size={12} color="#757575" />
          <Text style={styles.historyDistributorText}>
            {commande.distributorName || 'Distributeur inconnu'}
          </Text>
        </View>
      </View>
      <View style={styles.historyCardBottom}>
        <Text style={styles.historyQuantity}>Quantité: x{commande.quantite}</Text>
        <Text style={styles.historyTotal}>{commande.total?.toLocaleString() || '0'} FCFA</Text>
      </View>
    </View>
  );

  
  const renderHomeContent = () => {
    const processProductsWithDistance = async (products) => {
      if (!clientInfo.lastLocation?.latitude || !clientInfo.lastLocation?.longitude) {
        console.warn("Position du client non disponible, tri par distance désactivé");
        return products;
      }
      return await Promise.all(
        products.map(async (product) => {
          try {
            const response = await fetch(`${API_BASE_URL}/delivery-info`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientLat: clientInfo.lastLocation.latitude,
                clientLng: clientInfo.lastLocation.longitude,
                distributorId: product.distributorId,
              }),
            });
            if (response.ok) {
              const data = await response.json();
              return {
                ...product,
                distance: typeof data.distance === 'number' ? data.distance : 0,
                deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
              };
            }
            return { ...product, distance: 0, deliveryFee: 0 };
          } catch (error) {
            console.error("Erreur calcul distance pour produit:", product.name, error);
            return { ...product, distance: 0, deliveryFee: 0 };
          }
        })
      ).then(productsWithDistance =>
        [...productsWithDistance].sort((a, b) => a.distance - b.distance)
      );
    };

    const loadAndSortProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/distributeurs/all-products`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Erreur lors de la récupération");
        let allProducts = [];
        if (data.products && Array.isArray(data.products)) {
          allProducts = data.products.map((product) => ({
            ...product,
            distributorId: product.distributorId || product.distributor?._id || 'inconnu',
            distributorName: product.distributorName || 'Distributeur inconnu',
            zone: product.zone || 'Zone non définie',
            name: product.name || 'Produit sans nom',
            price: product.price || 0,
            stock: product.stock || 0,
            type: product.type || 'Standard',
            distance: 0,
            deliveryFee: 0
          }));
        } else if (data.distributors && Array.isArray(data.distributors)) {
          allProducts = data.distributors
            .filter(d => d && d.products && Array.isArray(d.products))
            .flatMap(d =>
              d.products.map(product => ({
                ...product,
                distributorId: d._id || d.id || 'inconnu',
                distributorName: d.user?.name || d.name || 'Distributeur inconnu',
                zone: d.zone || 'Zone non définie',
                type: product.type || 'Standard',
                distance: 0,
                deliveryFee: 0
              }))
            );
        }
        if (allProducts.length === 0) {
          setError("Aucun produit disponible pour le moment.");
        } else {
          const sortedProducts = await processProductsWithDistance(allProducts);
          setDistributors(sortedProducts);
        }
      } catch (error) {
        console.error("Erreur chargement produits:", error);
        setError(error.message || "Erreur de connexion. Veuillez réessayer.");
        setDistributors([]);
      } finally {
        setIsLoading(false);
      }
    };

    // 📊 Fonction pour calculer les commandes du mois courant
    const getOrdersThisMonth = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      console.log('🔍 DEBUG getOrdersThisMonth DETAILLE:');
      console.log('  Current Month:', currentMonth, 'Current Year:', currentYear);
      console.log('  historiqueCommandes.length:', historiqueCommandes.length);

      // Afficher TOUTES les commandes avec leurs statuts
      historiqueCommandes.forEach((order, index) => {
        const orderTime = order.orderTime;
        const orderDate = new Date(orderTime);
        console.log(`  [${index}] Produit: ${order.produit}, Status: '${order.statut}', OrderTime: ${orderTime}, OrderDate: ${orderDate.toLocaleString('fr-FR')}, Mois: ${orderDate.getMonth()}`);
      });

      // Compter les commandes TERMINÉES (status 'livre') du mois courant
      const ordersThisMonth = historiqueCommandes.filter(order => {
        const orderDate = new Date(order.orderTime);
        const isCurrentMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        const isTerminated = order.statut === 'livre';
        
        console.log(`  Filtre: ${order.produit} - isTerminated=${isTerminated}, isCurrentMonth=${isCurrentMonth}`);
        
        return isCurrentMonth && isTerminated;
      });

      console.log('  ✅ Final count:', ordersThisMonth.length);
      return ordersThisMonth.length;
    };

    return (
      <>
        <View style={styles.quickStatsContainer}>
          <QuickStatCard
            icon="flame-outline"
            title="Commandes ce mois"
            value={ordersThisMonthCount.toString()}
            color="#2E7D32"
          />
          <QuickStatCard
            icon="car-outline"
            title="Livraisons en cours"
            value={commandesEnCours.filter(cmd => cmd.statut === ORDER_STATUS.IN_DELIVERY).length.toString()}
            color="#FF9800"
          />
        </View>
        {commandesEnCours.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Livraison en cours</Text>
              {commandesEnCours.length > 2 && (
                <TouchableOpacity onPress={() => setShowAllLivraisons(!showAllLivraisons)}>
                  <Text style={styles.sectionAction}>
                    {showAllLivraisons ? 'Voir moins' : 'Voir tout'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {(showAllLivraisons ? commandesEnCours : commandesEnCours.slice(0, 2)).map((commande) => (
              <CommandeCard key={commande.id} commande={commande} />
            ))}
          </View>
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="document-outline" size={48} color="#718096" />
            <Text style={styles.noResults}>Aucune commande en livraison</Text>
            <Text style={styles.noResultsSubtext}>Vos commandes en cours de livraison apparaîtront ici</Text>
          </View>
        )}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Produits disponibles</Text>
              <Text style={styles.sectionSubtitle}>Sélectionnez et commandez maintenant</Text>
            </View>
            {distributors.length > 16 && (
              <TouchableOpacity style={styles.seeMoreButton} onPress={() => setSearchModalVisible(true)}>
                <Text style={styles.seeMoreText}>Tous</Text>
                <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
              </TouchableOpacity>
            )}
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Chargement des produits...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadAndSortProducts}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : distributors.length > 0 ? (
            <>
              <ScrollView 
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsGridContent}
              >
                {distributors.slice(0, 16).map((product, index) => (
                  <ProductCard key={product._id || product.id || index} product={product} />
                ))}
              </ScrollView>
              {distributors.slice(0, 16).some(p => p.distance > 0) && (
                <View style={styles.distanceInfoContainer}>
                  <Ionicons name="location-outline" size={16} color="#2E7D32" />
                  <Text style={styles.distanceInfoText}>
                    {distributors[0].distance > 0
                      ? `Produits triés par proximité (le plus proche à ${distributors[0].distance.toFixed(1)} km)`
                      : 'Produits disponibles dans votre zone'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="storefront-outline" size={48} color="#718096" />
              <Text style={styles.noResults}>Aucun produit disponible pour le moment.</Text>
              <Text style={styles.noResultsSubtext}>Revenez plus tard ou contactez notre support.</Text>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique récent</Text>
            {historiqueCommandes.length > 2 && (
              <TouchableOpacity onPress={() => router.push('/home/client/historique')}>
                <Text style={styles.sectionAction}>Voir plus</Text>
              </TouchableOpacity>
            )}
          </View>
          {historiqueCommandes.length > 0 ? (
            <>
              {historiqueCommandes.slice(0, 2).map((commande) => (
                <HistoryCard key={commande.id} commande={commande} />
              ))}
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="document-outline" size={48} color="#718096" />
              <Text style={styles.noResults}>Aucune commande dans l'historique</Text>
              <Text style={styles.noResultsSubtext}>Vos commandes passées apparaîtront ici</Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsContainer}>
          {/* <Text style={styles.quickActionsTitle}>Actions rapides</Text> */}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/home/client/wallet')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="card-outline" size={28} color="#2E7D32" />
              </View>
              <Text style={styles.quickActionText}>Recharger</Text>
            </TouchableOpacity>
            
            <Link href="/home/client/factures" asChild>
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="receipt-outline" size={28} color="#2E7D32" />
                </View>
                <Text style={styles.quickActionText}>Factures</Text>
              </TouchableOpacity>
            </Link>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/home/client/adresses')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="location-outline" size={28} color="#2E7D32" />
              </View>
              <Text style={styles.quickActionText}>Adresses</Text>
            </TouchableOpacity>
            
            <Link href="/home/client/support" asChild>
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="help-circle-outline" size={28} color="#2E7D32" />
                </View>
                <Text style={styles.quickActionText}>Support</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        </View>
      </>
    );
  };

  // ========== Rendu principal ==========
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.profileImage}>
              {clientInfo.photo ? (
                <Image source={{ uri: clientInfo.photo }} style={styles.image} />
              ) : (
                <Ionicons name="person" size={40} color="#fff" />
              )}
            </View>
            <View>
              <Text style={styles.welcomeText}>{getGreeting()}</Text>
              <Text style={styles.userName}>{clientInfo.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setNotificationModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {notifications.some((n) => !n.read) && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notifications.filter((n) => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerSearchBarContainer}
          onPress={() => setSearchModalVisible(true)}
        >
          <View style={styles.headerSearchBar}>
            <Ionicons name="search-outline" size={20} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.headerSearchPlaceholder}>
              Rechercher un produit, une commande...
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.creditInfo}>
          <Ionicons name="wallet-outline" size={20} color="#A5D6A7" />
          <Text style={styles.creditText}>
            Crédit: {showBalance ? (clientInfo.credit || 0).toLocaleString() : '••••'} FCFA
          </Text>
          <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={{ marginLeft: 'auto' }}>
            <Ionicons 
              name={showBalance ? 'eye-outline' : 'eye-off-outline'} 
              size={18} 
              color="#A5D6A7" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderHomeContent()}
      </ScrollView>
      
      {/* Modal de recherche plein écran */}
      <SearchSystem
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onProductSelect={handleSelectProduct}
        clientLocation={clientInfo.lastLocation}
        clientInfo={clientInfo}
      />
      
      {/* Modal de commande (nouveau composant) */}
      <OrderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedProduct={selectedProduct}
        clientInfo={clientInfo}
        onOrderSuccess={handleOrderSuccess}
        fetchUserCredit={fetchUserCredit}
      />
      
      {/* Modal des notifications */}
      <NotificationModal />
      <ClientFooter />
    </View>
  );
}