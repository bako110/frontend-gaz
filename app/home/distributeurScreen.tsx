import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextInput,
  FlatList,
  Linking,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductService } from '@/service/ProductService';
import styles from '@/styles/distributeurScreen';
import AddressInput from './distributeur/geolocalisation';
import DistributorFooter from './distributeur/DistributorFooter';
import { API_BASE_URL } from '@/service/config';
import { useExitAlert } from '@/app/hooks/useExitAlert';

const { width, height } = Dimensions.get('window');

// Constantes pour les statuts des commandes
const ORDER_STATUS = {
  PENDING: 'nouveau',
  IN_DELIVERY: 'en_livraison',
  CONFIRMED: 'confirme',
  COMPLETED: 'livre',
  CANCELLED: 'annule',
};

// Types de carburant disponibles avec leurs images
const FUEL_TYPES = ['oryx', 'pegaz', 'totale', 'shell', 'butagaz', 'sbf', 'oil-libya', 'neste', 'petrobras', 'autres'];

const FUEL_TYPES_CONFIG = {
  'oryx': {
    image: 'https://www.oryxenergies.com/layout/images/pic-products-lpg.jpg'
  },
  'pegaz': {
    image: 'https://www.patabay.co.ke/wp-content/uploads/2020/05/total-gas.jpg'
  },
  'totale': {
    image: 'https://www.patabay.co.ke/wp-content/uploads/2020/05/total-gas.jpg'
  },
  'shell': {
    image: 'https://www.oryxenergies.com/layout/images/pic-products-lpg.jpg'
  },
  'butagaz': {
    image: 'https://www.patabay.co.ke/wp-content/uploads/2020/05/total-gas.jpg'
  },
  'sbf': {
    image: 'https://www.oryxenergies.com/layout/images/pic-products-lpg.jpg'
  },
  'oil-libya': {
    image: 'https://www.patabay.co.ke/wp-content/uploads/2020/05/total-gas.jpg'
  },
  'neste': {
    image: 'https://www.oryxenergies.com/layout/images/pic-products-lpg.jpg'
  },
  'petrobras': {
    image: 'https://www.patabay.co.ke/wp-content/uploads/2020/05/total-gas.jpg'
  },
  'autres': {
    image: 'https://www.oryxenergies.com/layout/images/pic-products-lpg.jpg'
  }
};

// Configuration complète des types de gaz avec poids et prix réalistes pour le Burkina Faso
const GAS_TYPES_CONFIG = {
  '3kg': { 
    name: 'Butane 3kg', 
    price: '3500',
    averagePrice: 3500,
    weight: '3kg'
  },
  '6kg': { 
    name: 'Butane 6kg', 
    price: '6250',
    averagePrice: 6250,
    weight: '6kg'
  },
  '12kg': { 
    name: 'Butane 12.5kg', 
    price: '12500',
    averagePrice: 12500,
    weight: '12.5kg'
  },
  '22kg': { 
    name: 'Butane 22kg', 
    price: '20000',
    averagePrice: 20000,
    weight: '22kg'
  },
  '35kg': { 
    name: 'Butane 35kg', 
    price: '34000',
    averagePrice: 34000,
    weight: '35kg'
  },
  'propane-6kg': { 
    name: 'Propane 6kg', 
    price: '6750',
    averagePrice: 6750,
    weight: '6kg'
  },
  'propane-13kg': { 
    name: 'Propane 13kg', 
    price: '13500',
    averagePrice: 13500,
    weight: '13kg'
  }
};

// Types pour les états
interface Order {
  _id: string;
  clientName: string;
  clientPhone: string;
  address: string;
  products: Array<{
    name: string;
    quantity: number;
    type: string;
  }>;
  total: string | number;
  orderTime: string;
  priority: string;
  status: string;
  distance?: string;
  date: string;
  isDelivery?: boolean;
  livreurId?: string;
  driver?: {
    user?: {
      name: string;
      phone: string;
    };
  };
}

interface Product {
  _id: string;
  name: string;
  type: string;
  stock: number;
  minStock: number;
  price: number;
  sales: number;
  image: any;
  fuelType: string;
  weight: string;
}

interface Driver {
  _id: string;
  user?: {
    name: string;
    phone: string;
  };
  status: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  date: string;
  read: boolean;
  data: any;
  orderId?: string;
  priority?: string;
}

interface DistributorInfo {
  name: string;
  address: string;
  phone: string;
  revenue: number;
  zone: string;
  balance: number;
  photo: string | null;
}

interface DailyStats {
  ordersToday: number;
  deliveredToday: number;
  pendingOrders: number;
  revenue: number;
}

interface Trends {
  ordersToday: number;
  deliveredToday: number;
  pendingOrders: number;
  revenue: number;
}

export default function DistributorDashboard() {
  // Gestion de la sortie de l'application
  useExitAlert();

  // États
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory'>('dashboard');
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStock, setNewStock] = useState('');
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [gasTypes] = useState<string[]>(Object.keys(GAS_TYPES_CONFIG));
  const [selectedGasType, setSelectedGasType] = useState<string>(gasTypes[0]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [showDriversModal, setShowDriversModal] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [distributorLocation, setDistributorLocation] = useState<{
    coordinates: { latitude: number; longitude: number };
    address: string;
    details?: string;
    timestamp?: Date;
  } | null>(null);
  
  const [distributorInfo, setDistributorInfo] = useState<DistributorInfo>({
    name: '',
    address: '',
    phone: '',
    revenue: 0,
    zone: '',
    balance: 0,
    photo: null,
  });
  
  const [distributorId, setDistributorId] = useState<string | null>(null);
  
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    ordersToday: 0,
    deliveredToday: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  
  const [trends, setTrends] = useState<Trends>({
    ordersToday: 0,
    deliveredToday: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  
  const [yesterdayStats, setYesterdayStats] = useState<DailyStats>({
    ordersToday: 0,
    deliveredToday: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  
  // Configuration des types de gaz avec noms et prix automatiques
  const [gasConfig] = useState(GAS_TYPES_CONFIG);

  const [newProduct, setNewProduct] = useState({
    name: '',
    type: '3kg',
    stock: '',
    minStock: '1',
    price: '',
    sales: 0,
    image: FUEL_TYPES_CONFIG['oryx'].image,
    fuelType: 'oryx',
    weight: '3kg'
  });

  const [lastBackPress, setLastBackPress] = useState(0);

  // États pour les notifications
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fonction pour gérer le changement de type de gaz
  const handleGasTypeChange = (gasType: string) => {
    const config = gasConfig[gasType as keyof typeof gasConfig];
    setNewProduct({
      ...newProduct,
      type: gasType,
      name: config.name,
      price: config.price,
      weight: config.weight
    });
  };

  // Fonction pour gérer le changement de type de carburant
  const handleFuelTypeChange = (fuelType: string) => {
    const fuelConfig = FUEL_TYPES_CONFIG[fuelType as keyof typeof FUEL_TYPES_CONFIG];
    setNewProduct({
      ...newProduct,
      fuelType: fuelType,
      image: fuelConfig.image
    });
  };

  // Composant pour les types de carburant
  const FuelTypeSelector = ({ selectedType, onTypeChange }: { selectedType: string; onTypeChange: (type: string) => void }) => (
    <View style={styles.typesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesScrollContainer}
      >
        {FUEL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeChip,
              selectedType === type && styles.typeChipActive
            ]}
            onPress={() => onTypeChange(type)}
          >
            <Text style={[
              styles.typeText,
              selectedType === type && styles.typeTextActive
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Fonction pour valider et ajouter le produit
  const handleAddNewProduct = async () => {
    console.log("🔄 handleAddNewProduct appelée");
    console.log("📦 Données newProduct:", newProduct);

    if (!newProduct.name || !newProduct.stock || !newProduct.minStock || !newProduct.price) {
      console.log("❌ Validation échouée - champs manquants");
      console.log("   name:", newProduct.name);
      console.log("   stock:", newProduct.stock);
      console.log("   minStock:", newProduct.minStock);
      console.log("   price:", newProduct.price);
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const stock = parseInt(newProduct.stock);
    const minStock = parseInt(newProduct.minStock);
    
    console.log("🔢 Conversion numérique - stock:", stock, "minStock:", minStock);
    
    if (stock < 1) {
      console.log("❌ Stock initial trop faible:", stock);
      Alert.alert("Erreur", "Le stock initial doit être d'au moins 1.");
      return;
    }

    if (minStock < 1) {
      console.log("❌ Stock minimum trop faible:", minStock);
      Alert.alert("Erreur", "Le stock minimum doit être d'au moins 1.");
      return;
    }

    if (stock < minStock) {
      console.log("❌ Stock initial inférieur au stock minimum:", stock, "<", minStock);
      Alert.alert("Erreur", "Le stock initial ne peut pas être inférieur au stock minimum.");
      return;
    }

    // Préparation des données pour l'API
    const productData = {
      name: newProduct.name,
      type: newProduct.type,
      fuelType: newProduct.fuelType,
      weight: newProduct.weight,
      image: newProduct.image,
      stock: stock,
      minStock: minStock,
      price: parseInt(newProduct.price),
      sales: 0,
    };

    console.log("📤 Données préparées pour l'API:", productData);
    console.log("   fuelType:", productData.fuelType);
    console.log("   weight:", productData.weight);

    try {
      console.log("🚀 Appel à ProductService.addProduct...");
      
      const result = await ProductService.addProduct(productData);
      console.log("✅ Produit ajouté avec succès, réponse:", result);
      
      console.log("🔄 Rechargement des produits avec délai...");
      // Attendre 500ms pour que le backend traite l'ajout
      setTimeout(async () => {
        await loadProducts();
        console.log("✅ Produits rechargés");
      }, 500);
      
      // Réinitialisation du formulaire
      const resetProduct = {
        name: '',
        type: '3kg',
        stock: '',
        minStock: '1',
        price: '',
        sales: 0,
        image: FUEL_TYPES_CONFIG['oryx'].image,
        fuelType: 'oryx',
        weight: '3kg'
      };
      
      setNewProduct(resetProduct);
      console.log("🧹 Formulaire réinitialisé:", resetProduct);
      
      setAddProductModalVisible(false);
      console.log("🎯 Modal fermé");
      
      Alert.alert("Succès", "Produit ajouté avec succès !");
      
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout du produit:", error);
      console.log("   Type d'erreur:", typeof error);
      if (error instanceof Error) {
        console.log("   Message d'erreur:", error.message);
        console.log("   Stack:", error.stack);
        Alert.alert(
          "Erreur", 
          `Impossible d'enregistrer le produit: ${error.message || "Erreur inconnue"}`
        );
      } else {
        Alert.alert("Erreur", "Impossible d'enregistrer le produit: Erreur inconnue");
      }
    }
  };

  // Gestion du bouton retour
  useEffect(() => {
    const backAction = () => {
      const now = Date.now();
      if (lastBackPress && now - lastBackPress <= 2000) {
        BackHandler.exitApp();
        return false;
      }
      setLastBackPress(now);
      Alert.alert(
        'Quitter l\'application',
        'Appuyez encore une fois pour quitter.',
        [{ text: 'OK' }]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [lastBackPress]);

  // Fonction pour calculer les tendances (pourcentage d'évolution)
  const calculateTrends = (currentStats: DailyStats, previousStats: DailyStats): Trends => {
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) {
        // Si hier c'était 0 et aujourd'hui > 0, c'est +100%
        return current > 0 ? 100 : 0;
      }
      // Calcul du pourcentage d'évolution : ((Aujourd'hui - Hier) / Hier) * 100
      const evolution = ((current - previous) / previous) * 100;
      return Math.round(evolution);
    };

    return {
      ordersToday: calculateTrend(currentStats.ordersToday, previousStats.ordersToday),
      deliveredToday: calculateTrend(currentStats.deliveredToday, previousStats.deliveredToday),
      pendingOrders: calculateTrend(currentStats.pendingOrders, previousStats.pendingOrders),
      revenue: calculateTrend(currentStats.revenue, previousStats.revenue),
    };
  };

  // Fonction pour formater la date en YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Fonction pour obtenir la date d'hier
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  };

  // Fonction pour formater la date des notifications
  const formatNotificationDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays < 7) return `Il y a ${diffDays} j`;
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  // 🔔 FONCTION PRINCIPALE POUR CHARGER LES NOTIFICATIONS
  const fetchNotifications = async () => {
    console.log("🔄 Début du chargement des notifications...");
    
    // Essayer de récupérer l'ID du distributeur depuis AsyncStorage si non disponible
    let currentDistributorId: string | null = distributorId;
    if (!currentDistributorId) {
      try {
        currentDistributorId = await AsyncStorage.getItem('distributorId');
        if (currentDistributorId) {
          setDistributorId(currentDistributorId);
          console.log("✅ ID distributeur récupéré depuis AsyncStorage:", currentDistributorId);
        } else {
          console.log("❌ Aucun ID distributeur trouvé");
          return;
        }
      } catch (error) {
        console.error("❌ Erreur lors de la récupération de l'ID distributeur:", error);
        return;
      }
    }
    
    try {
      setIsLoadingNotifications(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.warn("❌ Token utilisateur non disponible");
        return;
      }

      console.log("📡 Envoi de la requête pour les notifications...");
      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${currentDistributorId}?userType=distributor&limit=50`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log("📨 Réponse reçue, statut:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Données des notifications reçues");
        
        if (data.success) {
          const formattedNotifications = data.notifications.map((notification: any) => ({
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            date: formatNotificationDate(notification.createdAt),
            read: notification.read,
            data: notification.data || {},
            orderId: notification.orderId,
            priority: notification.priority,
          }));
          setNotifications(formattedNotifications);
          setUnreadCount(data.unreadCount || 0);
          console.log(`📢 ${formattedNotifications.length} notifications chargées, ${data.unreadCount || 0} non lues`);
        } else {
          console.warn("⚠️ Réponse API non réussie");
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        console.warn("❌ Erreur HTTP lors du chargement des notifications:", response.status);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des notifications :", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
      console.log("🏁 Chargement des notifications terminé");
    }
  };

  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      console.log("📌 Marquage notification comme lue - ID:", notificationId);
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log("📨 Réponse API status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Notification marquée comme lue - Réponse:", data);
        
        if (data.success) {
          // Mettre à jour l'état local
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === notificationId 
                ? { ...notification, read: true } 
                : notification
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          console.log("✅ État local mis à jour - Notification marquée comme lue");
        } else {
          console.log("❌ Erreur API:", data.error);
        }
      } else {
        const error = await response.text();
        console.error("❌ Erreur API:", response.status, error);
      }
    } catch (error) {
      console.error("❌ Erreur lors du marquage comme lu :", error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${distributorId}/read-all`,
        {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userType: 'distributor'
          })
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
        Alert.alert("Succès", "Toutes les notifications ont été marquées comme lues");
      }
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues :", error);
      Alert.alert("Erreur", "Impossible de marquer toutes les notifications comme lues");
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        // Recalculer le nombre de non-lues
        const newUnreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification :", error);
    }
  };

  // Fonction pour récupérer les commandes par statut
  const fetchOrdersByStatus = async (distributorId: string, status: string): Promise<Order[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/distributeurs/orders/${distributorId}/orders?status=${status}`);
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des commandes (${status}):`, error);
      return [];
    }
  };

  // Fonction pour récupérer les livreurs disponibles
  const fetchAvailableDrivers = async (): Promise<Driver[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/livreur/all?status=disponible`);
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des livreurs:", error);
      return [];
    }
  };

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: string, driverId: string | null = null) => {
    try {
      const distributorId = await AsyncStorage.getItem('distributorId');
      if (!distributorId) {
        throw new Error("ID du distributeur manquant.");
      }
      const body: any = { status: newStatus, distributorId };
      if (driverId) body.driverId = driverId;
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande:", error);
      throw error;
    }
  };

  // Récupération de toutes les commandes
  const fetchAllOrders = async (distributorId: string) => {
    try {
      const [pending, inDelivery, confirmed, completed, drivers] = await Promise.all([
        fetchOrdersByStatus(distributorId, ORDER_STATUS.PENDING),
        fetchOrdersByStatus(distributorId, ORDER_STATUS.IN_DELIVERY),
        fetchOrdersByStatus(distributorId, ORDER_STATUS.CONFIRMED),
        fetchOrdersByStatus(distributorId, ORDER_STATUS.COMPLETED),
        fetchAvailableDrivers(),
      ]);
      
      const today = formatDate(new Date());
      const yesterday = getYesterdayDate();
      
      const formatOrder = (order: any): Order => ({
        _id: order._id,
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        address: order.address || 'Adresse non définie',
        products: order.products,
        total: order.total,
        orderTime: new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: order.priority,
        status: order.status,
        distance: 'Calcul en cours...',
        date: formatDate(new Date(order.orderTime)),
        isDelivery: order.isDelivery,
        livreurId: order.livreurId,
        driver: order.driver,
      });
      
      const formattedPending = pending.map(formatOrder);
      const formattedInDelivery = inDelivery.map(formatOrder);
      const formattedConfirmed = confirmed.map(formatOrder);
      const formattedCompleted = completed.map(formatOrder);

      // Calculer les statistiques pour aujourd'hui
      const todayPending = formattedPending.filter(order => order.date === today);
      const todayCompleted = formattedCompleted.filter(order => order.date === today);
      
      // Calculer les statistiques pour hier
      const yesterdayPending = formattedPending.filter(order => order.date === yesterday);
      const yesterdayCompleted = formattedCompleted.filter(order => order.date === yesterday);

      const newStats: DailyStats = {
        ordersToday: todayPending.length,
        deliveredToday: todayCompleted.length,
        pendingOrders: formattedPending.length,
        revenue: todayCompleted.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      };

      const yesterdayStatsData: DailyStats = {
        ordersToday: yesterdayPending.length,
        deliveredToday: yesterdayCompleted.length,
        pendingOrders: yesterdayPending.length,
        revenue: yesterdayCompleted.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      };

      // Calculer les tendances (pourcentage d'évolution)
      const newTrends = calculateTrends(newStats, yesterdayStatsData);

      // Mettre à jour tous les états
      setPendingOrders(formattedPending);
      setTodayOrders(todayPending);
      setActiveDeliveries(formattedInDelivery);
      setConfirmedOrders(formattedConfirmed);
      setCompletedOrders(formattedCompleted);
      setDrivers(drivers);
      setDailyStats(newStats);
      setYesterdayStats(yesterdayStatsData);
      setTrends(newTrends);

      // Mise à jour du revenu dans distributorInfo
      setDistributorInfo(prev => ({
        ...prev,
        revenue: newStats.revenue,
      }));

    } catch (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
      Alert.alert("Erreur", "Impossible de charger les commandes.");
    }
  };

  // CHARGEMENT AUTOMATIQUE AU MONTAGE
  useEffect(() => {
    console.log("🎯 Effet principal - Début du chargement initial");
    
    const loadInitialData = async () => {
      try {
        // 1. Récupérer l'ID du distributeur
        const data = await AsyncStorage.getItem('userProfile');
        if (!data) {
          console.error("❌ Aucun profil utilisateur trouvé");
          return;
        }
        
        const parsedData = JSON.parse(data);
        const distributorId = parsedData?.profile?._id;
        
        if (!distributorId) {
          console.error("❌ ID du distributeur manquant dans le profil sauvegardé");
          return;
        }
        
        console.log("✅ ID distributeur trouvé:", distributorId);
        setDistributorId(distributorId);
        await AsyncStorage.setItem('distributorId', distributorId);

        // 2. Charger les commandes ET les notifications en parallèle
        console.log("🔄 Chargement parallèle des commandes et notifications...");
        await Promise.all([
          fetchAllOrders(distributorId),
          fetchNotifications() // ⬅️ CHARGEMENT IMMÉDIAT DES NOTIFICATIONS
        ]);
        
        console.log("✅ Chargement initial terminé avec succès");
        
      } catch (error) {
        console.error("❌ Erreur lors du chargement initial :", error);
      }
    };

    loadInitialData();
  }, []);

  // CHARGEMENT AUTOMATIQUE QUAND L'ÉCRAN EST FOCUS
  useFocusEffect(
    useCallback(() => {
      console.log("👀 Écran DistributorDashboard focus - Rechargement des notifications");
      
      const reloadData = async () => {
        const distributorId = await AsyncStorage.getItem('distributorId');
        if (distributorId) {
          await fetchNotifications(); // ⬅️ RECHARGEMENT À CHAQUE FOIS QUE L'ÉCRAN EST AFFICHÉ
        }
      };

      reloadData();
    }, [])
  );

  // RAFRAÎCHISSEMENT AUTOMATIQUE TOUTES LES 30 SECONDES
  useEffect(() => {
    if (distributorId) {
      console.log("⏰ Mise en place du rafraîchissement automatique des notifications");
      const notificationInterval = setInterval(() => {
        console.log("🔄 Rafraîchissement automatique des notifications");
        fetchNotifications();
      }, 30000); // 30 secondes
      
      return () => {
        console.log("🧹 Nettoyage de l'intervalle de rafraîchissement");
        clearInterval(notificationInterval);
      };
    }
  }, [distributorId]);

  // RAFRAÎCHISSEMENT MANUEL
  const onRefresh = useCallback(async () => {
    console.log("🔄 Rafraîchissement manuel déclenché");
    setRefreshing(true);
    try {
      const distributorId = await AsyncStorage.getItem('distributorId');
      if (distributorId) {
        await Promise.all([
          fetchAllOrders(distributorId),
          fetchNotifications() // ⬅️ RECHARGEMENT DES NOTIFICATIONS LORS DU REFRESH
        ]);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Chargement des produits
  const loadProducts = async () => {
    try {
      const products = await ProductService.getAllProducts();
      setInventory(products);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les produits.");
    }
  };

  // Gestion des actions sur les commandes
  const handleOrderAction = async (order: Order, action: string) => {
    try {
      switch (action) {
        case 'accept':
          // ✅ Étape 1: ACCEPTER (confirmer le statut SANS code)
          if (!distributorId) {
            Alert.alert('Erreur', 'ID distributeur manquant');
            return;
          }

          const confirmResponse = await fetch(`${API_BASE_URL}/orders/${order._id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: ORDER_STATUS.CONFIRMED,
              distributorId: distributorId,
            }),
          });

          if (!confirmResponse.ok) {
            Alert.alert('Erreur', 'Impossible d\'accepter la commande');
            return;
          }

          Alert.alert('Succès', '✅ Commande acceptée!');
          if (distributorId) {
            await fetchAllOrders(distributorId);
          }
          break;

        case 'confirm':
          // ✅ Étape 2: CONFIRMER (valider avec le CODE et recevoir l'argent)
          handleOpenValidationModal(order);
          break;

        case 'assign':
          setSelectedOrder(order);
          setOrderModalVisible(true);
          break;
        case 'reject':
          Alert.alert(
            'Rejeter la commande',
            `Êtes-vous sûr de vouloir rejeter cette commande ?`,
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Rejeter',
                style: 'destructive',
                onPress: async () => {
                  await updateOrderStatus(order._id, ORDER_STATUS.CANCELLED);
                  if (distributorId) {
                    await fetchAllOrders(distributorId);
                  }
                },
              },
            ]
          );
          break;
        case 'complete':
          await updateOrderStatus(order._id, ORDER_STATUS.COMPLETED);
          Alert.alert('Succès', 'Commande marquée comme livrée.');
          if (distributorId) {
            await fetchAllOrders(distributorId);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Impossible de traiter la commande.");
    }
  };

  // Assigner un livreur à une commande
  const handleAssignDriver = async (driver: Driver, order: Order) => {
    try {
      await updateOrderStatus(order._id, ORDER_STATUS.IN_DELIVERY, driver._id);
      Alert.alert("Succès", "Livreur assigné avec succès !");
      setOrderModalVisible(false);
      if (distributorId) {
        await fetchAllOrders(distributorId);
      }
    } catch (error) {
      console.error("Erreur lors de l'assignation du livreur:", error);
      Alert.alert("Erreur", error instanceof Error ? error.message : "Impossible d'assigner le livreur.");
    }
  };

  const handleValidateOrderCode = async () => {
    if (!validationCode || !selectedOrder) {
      Alert.alert('Erreur', 'Veuillez entrer le code de validation');
      return;
    }

    if (validationCode.length !== 6) {
      Alert.alert('Erreur', 'Le code doit contenir 6 chiffres');
      return;
    }

    try {
      setIsValidatingCode(true);
      
      // ✅ La commande est déjà confirmée (acceptée)
      // On va directement valider le code et compléter
      
      const endpoint = selectedOrder.isDelivery 
        ? `/orders/${selectedOrder._id}/validate-delivery`
        : `/orders/${selectedOrder._id}/complete-pickup`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validationCode: validationCode,
          distributorId: distributorId,
          livreurUserId: selectedOrder.livreurId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          Alert.alert(
            'Succès',
            `✅ ${selectedOrder.isDelivery ? 'Livraison' : 'Retrait'} validé(e)!\n\nMontant reçu: ${data.financial?.distributor?.amount?.toLocaleString() || 0} FCFA`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setValidationModalVisible(false);
                  setValidationCode('');
                  if (distributorId) {
                    fetchAllOrders(distributorId);
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Erreur', data.message || 'Code invalide');
        }
      } else {
        try {
          const errorData = await response.json();
          Alert.alert('Erreur', errorData.message || `Erreur serveur (${response.status})`);
        } catch (parseError) {
          // Si le serveur retourne du HTML ou n'est pas JSON
          console.error('Erreur serveur (réponse non-JSON):', response.status, response.statusText);
          Alert.alert('Erreur serveur', `Le serveur a retourné une erreur (${response.status}). Vérifiez la connexion.`);
        }
      }
    } catch (error) {
      console.error('Erreur validation code:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la validation');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleOpenValidationModal = (order: Order) => {
    setSelectedOrder(order);
    setValidationCode('');
    setValidationModalVisible(true);
  };

  // Gestion de l'adresse du distributeur
  const handleAddressChange = (addressData: any) => {
    setDistributorInfo((prev) => ({ ...prev, address: addressData.address }));
    if (addressData.coordinates) {
      setDistributorLocation({
        coordinates: addressData.coordinates,
        address: addressData.address,
        details: addressData.details,
        timestamp: new Date(),
      });
    }
  };

  // Sauvegarde de l'adresse
  const saveDistributorAddress = async () => {
    try {
      const addressData = { ...distributorInfo, location: distributorLocation };
      await AsyncStorage.setItem('distributorData', JSON.stringify(addressData));
      setAddressModalVisible(false);
      Alert.alert('Succès', 'Adresse mise à jour avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'adresse.');
    }
  };

  // Ajout de stock
  const handleAddStock = async () => {
    if (!newStock || !selectedProduct) return;
    try {
      await ProductService.updateStock(
        selectedProduct._id,
        selectedProduct.stock + parseInt(newStock),
        selectedGasType
      );
      await loadProducts();
      setStockModalVisible(false);
      setNewStock('');
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le stock.");
    }
  };

  // Suppression d'un produit
  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      "Supprimer le produit",
      "Êtes-vous sûr de vouloir supprimer ce produit ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await ProductService.deleteProduct(productId);
              await loadProducts();
              Alert.alert("Succès", "Produit supprimé avec succès !");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le produit.");
            }
          },
        },
      ]
    );
  };

  // Chargement des données du distributeur
  useEffect(() => {
    const loadDistributorData = async () => {
      try {
        const distributorData = await AsyncStorage.getItem('userData');
        if (distributorData) {
          const parsedData = JSON.parse(distributorData);
          setDistributorInfo({
            name: parsedData.name || '',
            address: parsedData.address || '',
            phone: parsedData.phone || '',
            revenue: parsedData.revenue || 2450000,
            zone: parsedData.zone || '',
            balance: parsedData.balance || 0,
            photo: parsedData.photo || null,
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données du distributeur :", error);
      }
    };
    loadDistributorData();
    loadProducts();
  }, []);

  // Sauvegarde automatique des données du distributeur
  useEffect(() => {
    const saveDistributorData = async () => {
      try {
        await AsyncStorage.setItem('distributorData', JSON.stringify(distributorInfo));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des données du distributeur :", error);
      }
    };
    saveDistributorData();
  }, [distributorInfo]);

  // Couleurs pour les priorités et statuts
  const getOrderPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF5722';
      case 'high': return '#FF9800';
      default: return '#2E7D32';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau': return '#FF9800';
      case 'confirme': return '#2196F3';
      case 'en_livraison': return '#2E7D32';
      case 'livre': return '#4CAF50';
      case 'annule': return '#F44336';
      default: return '#757575';
    }
  };

  // Couleurs pour les types de notifications
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order': return '#4CAF50';
      case 'order_accepted': return '#2196F3';
      case 'order_rejected': return '#F44336';
      case 'low_stock': return '#FF9800';
      case 'driver_assigned': return '#9C27B0';
      case 'order_completed': return '#4CAF50';
      case 'payment_received': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  // Icônes pour les types de notifications
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order': return 'cart-outline';
      case 'order_accepted': return 'checkmark-circle-outline';
      case 'order_rejected': return 'close-circle-outline';
      case 'low_stock': return 'warning-outline';
      case 'driver_assigned': return 'car-outline';
      case 'order_completed': return 'checkmark-done-outline';
      case 'payment_received': return 'cash-outline';
      default: return 'notifications-outline';
    }
  };

  const NotificationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={notificationModalVisible}
      onRequestClose={() => setNotificationModalVisible(false)}
    >
      <View style={styles.modernModalOverlay}>
        <TouchableOpacity 
          style={styles.modernModalBackdrop} 
          activeOpacity={1} 
          onPress={() => setNotificationModalVisible(false)}
        />
        <View style={styles.modernNotificationPanel}>
          {/* Header moderne avec gradient */}
          <LinearGradient
            colors={['#2E7D32', '#388E3C']}
            style={styles.modernNotificationHeader}
          >
            <View style={styles.modernHeaderContent}>
              <View style={styles.modernHeaderLeft}>
                <View style={styles.notificationIconBadge}>
                  <Ionicons name="notifications" size={24} color="#fff" />
                </View>
                <View>
                  <Text style={styles.modernHeaderTitle}>Notifications</Text>
                  <Text style={styles.modernHeaderSubtitle}>
                    {notifications.length} {notifications.length > 1 ? 'nouvelles' : 'nouvelle'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modernCloseButton} 
                onPress={() => setNotificationModalVisible(false)}
              >
                <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>
            
            {notifications.some(n => !n.read) && (
              <TouchableOpacity 
                style={styles.modernClearAllButton} 
                onPress={markAllNotificationsAsRead}
              >
                <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                <Text style={styles.modernClearAllText}>Tout marquer comme lu</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
          
          {/* Liste des notifications avec scroll */}
          <ScrollView 
            style={styles.modernNotificationList}
            showsVerticalScrollIndicator={false}
          >
            {isLoadingNotifications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Chargement des notifications...</Text>
              </View>
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <View key={item.id} style={styles.modernNotificationItemWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.modernNotificationItem,
                      !item.read && styles.modernUnreadNotification
                    ]}
                    onPress={() => markNotificationAsRead(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.modernNotificationIconContainer,
                      { backgroundColor: `${getNotificationColor(item.type)}15` }
                    ]}>
                      <Ionicons 
                        name={getNotificationIcon(item.type)}
                        size={24} 
                        color={getNotificationColor(item.type)}
                      />
                    </View>
                    
                    <View style={styles.modernNotificationContent}>
                      <View style={styles.modernNotificationTitleRow}>
                        <Text style={styles.modernNotificationTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.read && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={styles.modernNotificationMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                      <View style={styles.modernNotificationFooter}>
                        <Ionicons name="time-outline" size={12} color="#999" />
                        <Text style={styles.modernNotificationTime}>
                          {item.date}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.modernNotificationDelete}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          "Supprimer",
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
                      <Ionicons name="close-circle" size={22} color="#999" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.modernNoNotifications}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="notifications-off-outline" size={64} color="#cbd5e0" />
                </View>
                <Text style={styles.modernNoNotificationsTitle}>Aucune notification</Text>
                <Text style={styles.modernNoNotificationsSubtitle}>
                  Vous êtes à jour ! Revenez plus tard.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Composant pour les cartes statistiques redessinées
  const EnhancedStatCard = ({ icon, title, value, subtitle, color, trend }: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    color: string;
    trend: number;
  }) => (
    <LinearGradient colors={[color + '15', color + '05']} style={styles.enhancedStatCard}>
      <View style={styles.enhancedStatHeader}>
        <View style={[styles.enhancedStatIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {trend !== undefined && (
          <View style={[styles.enhancedTrendBadge, { backgroundColor: trend >= 0 ? '#4CAF5020' : '#FF574220' }]}>
            <Ionicons name={trend >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={trend >= 0 ? '#4CAF50' : '#FF5722'} />
            <Text style={[styles.enhancedTrendText, { color: trend >= 0 ? '#4CAF50' : '#FF5722' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.enhancedStatValue}>{value}</Text>
      <Text style={styles.enhancedStatTitle}>{title}</Text>
      {subtitle && <Text style={styles.enhancedStatSubtitle}>{subtitle}</Text>}
    </LinearGradient>
  );

  const OrderCard = ({ order, onAction }: { order: Order; onAction: (order: Order, action: string) => void }) => (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.8}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderTime}>{order.orderTime}</Text>
        </View>
        <View style={styles.orderBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getOrderPriorityColor(order.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getOrderPriorityColor(order.priority) }]}>{order.priority?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.orderClient}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.clientName}>{order.clientName}</Text>
        <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${order.clientPhone}`)}>
          <Ionicons name="call-outline" size={14} color="#2E7D32" />
        </TouchableOpacity>
      </View>
      <View style={styles.orderAddress}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.addressText}>{order.address}</Text>
        <Text style={styles.distanceText}>{order.distance}</Text>
      </View>
      <View style={styles.orderProducts}>
        {order.products.map((product, index) => (
          <Text key={index} style={styles.productText}>{product.quantity}x {product.name} ({product.type})</Text>
        ))}
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>{Number(order.total).toLocaleString()} FCFA</Text>
        <View style={styles.orderActions}>
          {order.status === ORDER_STATUS.PENDING && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => onAction(order, 'reject')}>
                <Ionicons name="close" size={16} color="#FF5722" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => onAction(order, 'accept')}>
                <Ionicons name="checkmark" size={16} color="#2E7D32" />
                <Text style={{ color: '#fff', fontSize: 12 }}>Accepter</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === ORDER_STATUS.CONFIRMED && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.validateCodeButton]} onPress={() => onAction(order, 'confirm')}>
                <Ionicons name="key-outline" size={16} color="#fff" />
                <Text style={styles.validateCodeButtonText}>Confirmer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.assignButton]} onPress={() => onAction(order, 'assign')}>
                <Ionicons name="person-add-outline" size={16} color="#fff" />
                <Text style={styles.assignButtonText}>Assigner</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === ORDER_STATUS.IN_DELIVERY && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.validateCodeButton]} onPress={() => onAction(order, 'confirm')}>
                <Ionicons name="key-outline" size={16} color="#fff" />
                <Text style={styles.validateCodeButtonText}>Confirmer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={() => onAction(order, 'complete')}>
                <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const DeliveryCard = ({ delivery }: { delivery: Order }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryId}>#{delivery._id?.slice(-8)}</Text>
        <View style={[styles.deliveryStatus, { backgroundColor: getStatusColor(delivery.status) + '20' }]}>
          <Text style={[styles.deliveryStatusText, { color: getStatusColor(delivery.status) }]}>
            {delivery.status === 'en_livraison' ? 'EN LIVRAISON' : 'LIVRÉ'}
          </Text>
        </View>
      </View>
      <Text style={styles.deliveryClient}>{delivery.clientName}</Text>
      <View style={styles.deliveryDriver}>
        <Ionicons name="car-outline" size={16} color="#666" />
        <Text style={styles.driverName}>{delivery.driver?.user?.name || 'Non assigné'}</Text>
        <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${delivery.driver?.user?.phone || ''}`)}>
          <Ionicons name="call-outline" size={14} color="#2E7D32" />
        </TouchableOpacity>
      </View>
      <View style={styles.deliveryTime}>
        <Text style={styles.timeLabel}>Départ: {delivery.orderTime}</Text>
      </View>
      <View style={styles.deliveryFooter}>
        <Text style={styles.deliveryTotal}>{Number(delivery.total).toLocaleString()} FCFA</Text>
      </View>
    </View>
  );

  const InventoryCard = ({ product }: { product: Product }) => {
    // Déterminer la source de l'image (URL ou require)
    const imageSource = typeof product.image === 'string' && product.image.startsWith('http')
      ? { uri: product.image }
      : product.image;

    return (
      <View style={[styles.inventoryCard, product.stock < product.minStock && styles.lowStockCard]}>
        <View style={styles.inventoryHeader}>
          <Image source={imageSource} style={styles.productImage} />
          <View style={styles.inventoryInfo}>
            <Text style={styles.inventoryName}>{product.name}</Text>
            <Text style={styles.inventoryType}>Type: {product.fuelType}</Text>
            <Text style={styles.inventoryPrice}>{Number(product.price).toLocaleString()} FCFA</Text>
            {product.fuelType && (
              <View style={styles.fuelTypeBadge}>
                <Text style={styles.fuelTypeText}>{product.fuelType.toUpperCase()}</Text>
              </View>
            )}
            {product.weight && (
              <View style={styles.weightBadge}>
                <Ionicons name="scale-outline" size={12} color="#666" />
                <Text style={styles.weightText}>{product.weight}</Text>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.addStockButton} onPress={() => { setSelectedProduct(product); setSelectedGasType(product.type); setStockModalVisible(true); }}>
              <Ionicons name="add" size={20} color="#2E7D32" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(product._id)}>
              <Ionicons name="trash-outline" size={20} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stockInfo}>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Stock</Text>
            <Text style={[styles.stockValue, product.stock < product.minStock && styles.lowStock]}>{product.stock}</Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Min.</Text>
            <Text style={styles.stockValue}>{product.minStock}</Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Vendus</Text>
            <Text style={styles.stockValue}>{product.sales}</Text>
          </View>
        </View>
        {product.stock < product.minStock && (
          <View style={styles.lowStockWarning}>
            <Ionicons name="warning-outline" size={16} color="#FF9800" />
            <Text style={styles.lowStockText}>Stock faible</Text>
          </View>
        )}
      </View>
    );
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content} 
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Section statistiques principales */}
      <View style={styles.enhancedStatsContainer}>
        <EnhancedStatCard 
          icon="receipt-outline" 
          title="Commandes" 
          value={dailyStats.ordersToday.toString()} 
          color="#2E7D32" 
          trend={trends.ordersToday} 
        />
        <EnhancedStatCard 
          icon="checkmark-circle-outline" 
          title="Livrées" 
          value={dailyStats.deliveredToday.toString()} 
          color="#4CAF50" 
          trend={trends.deliveredToday} 
        />
        <EnhancedStatCard 
          icon="hourglass-outline" 
          title="En attente" 
          value={dailyStats.pendingOrders.toString()} 
          color="#FF9800" 
          trend={trends.pendingOrders} 
        />
        <EnhancedStatCard 
          icon="wallet-outline" 
          title="Chiffre d'affaires" 
          value={`${Number(dailyStats.revenue).toLocaleString()}`} 
          subtitle="FCFA" 
          color="#9C27B0" 
          trend={trends.revenue} 
        />
      </View>

      {/* Section commandes en attente */}
      <View style={styles.enhancedSection}>
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.enhancedSectionTitleContainer}>
            <View style={styles.enhancedSectionIcon}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF9800" />
            </View>
            <Text style={styles.enhancedSectionTitle}>En attente</Text>
            <View style={styles.enhancedBadge}>
              <Text style={styles.enhancedBadgeText}>{pendingOrders.length}</Text>
            </View>
          </View>
        </View>
        {pendingOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {pendingOrders.slice(-3).map((order) => <OrderCard key={order._id} order={order} onAction={handleOrderAction} />)}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="checkmark-done" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateText}>Aucune commande en attente</Text>
            <Text style={styles.emptyStateSubtext}>Excellent travail! 🎉</Text>
          </View>
        )}
      </View>

      {/* Section commandes validées */}
      <View style={styles.enhancedSection}>
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.enhancedSectionTitleContainer}>
            <View style={styles.enhancedSectionIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.enhancedSectionTitle}>Validées</Text>
            <View style={styles.enhancedBadge}>
              <Text style={styles.enhancedBadgeText}>{confirmedOrders.length}</Text>
            </View>
          </View>
        </View>
        {confirmedOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {confirmedOrders.slice(-3).map((order) => <OrderCard key={order._id} order={order} onAction={handleOrderAction} />)}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="document-outline" size={48} color="#999" />
            <Text style={styles.emptyStateText}>Aucune commande validée</Text>
          </View>
        )}
      </View>

      {/* Section livraisons en cours */}
      <View style={styles.enhancedSection}>
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.enhancedSectionTitleContainer}>
            <View style={styles.enhancedSectionIcon}>
              <Ionicons name="car-outline" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.enhancedSectionTitle}>En livraison</Text>
            <View style={styles.enhancedBadge}>
              <Text style={styles.enhancedBadgeText}>{activeDeliveries.length}</Text>
            </View>
          </View>
        </View>
        {activeDeliveries.length > 0 ? (
          <View style={styles.ordersList}>
            {activeDeliveries.slice(-3).map((delivery) => <DeliveryCard key={delivery._id} delivery={delivery} />)}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="checkmark-done" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateText}>Aucune livraison en cours</Text>
          </View>
        )}
      </View>

      {/* Section commandes complétées */}
      <View style={styles.enhancedSection}>
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.enhancedSectionTitleContainer}>
            <View style={styles.enhancedSectionIcon}>
              <Ionicons name="checkmark-done-outline" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.enhancedSectionTitle}>Complétées</Text>
            <View style={styles.enhancedBadge}>
              <Text style={styles.enhancedBadgeText}>{completedOrders.length}</Text>
            </View>
          </View>
        </View>
        {completedOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {completedOrders.slice(-3).map((order) => <OrderCard key={order._id} order={order} onAction={handleOrderAction} />)}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="time" size={48} color="#999" />
            <Text style={styles.emptyStateText}>Aucune commande complétée</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderAddressModal = () => (
    <Modal animationType="slide" transparent={true} visible={addressModalVisible} onRequestClose={() => setAddressModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '90%', maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Définir votre adresse</Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              Définissez l'adresse de votre point de distribution. Cette information sera utilisée pour calculer les distances et optimiser les livraisons.
            </Text>
            <AddressInput initialAddress={distributorInfo.address} onAddressChange={handleAddressChange} style={{ marginVertical: 20 }} />
            {distributorLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationInfoTitle}>Informations de géolocalisation :</Text>
                <Text style={styles.locationInfoText}>Latitude: {distributorLocation.coordinates.latitude.toFixed(6)}</Text>
                <Text style={styles.locationInfoText}>Longitude: {distributorLocation.coordinates.longitude.toFixed(6)}</Text>
                <Text style={styles.locationInfoText}>Mise à jour: {distributorLocation.timestamp?.toLocaleString()}</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setAddressModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveDistributorAddress} disabled={!distributorInfo.address}>
              <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.saveButtonGradient}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderInventory = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inventaire</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setAddProductModalVisible(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
        {inventory.length > 0 ? (
          inventory.map((product) => <InventoryCard key={product._id} product={product} />)
        ) : (
          <Text style={styles.emptyText}>Aucun produit dans l'inventaire</Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.profileImage}>
                {distributorInfo.photo ? (
                  <Image source={{ uri: distributorInfo.photo }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                ) : (
                  <Ionicons name="business" size={24} color="#fff" />
                )}
              </View>
              <View>
                <Text style={styles.welcomeText}>Distributeur</Text>
                <Text style={styles.userName}>{distributorInfo.name}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => setNotificationModalVisible(true)}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.zoneInfo} onPress={() => setShowDriversModal(true)}>
            <Ionicons name="people-outline" size={20} color="#A5D6A7" />
            <Text style={styles.zoneText} numberOfLines={1}>
              {drivers.filter(d => d.status === 'disponible').length} livreurs disponibles
            </Text>
            <Ionicons name="chevron-forward-outline" size={16} color="#A5D6A7" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} onPress={() => setActiveTab('dashboard')}>
            <Ionicons name="grid-outline" size={20} color={activeTab === 'dashboard' ? '#2E7D32' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Tableau de bord</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'inventory' && styles.activeTab]} onPress={() => setActiveTab('inventory')}>
            <Ionicons name="cube-outline" size={20} color={activeTab === 'inventory' ? '#2E7D32' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventaire</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'dashboard' ? renderDashboard() : renderInventory()}
        {renderAddressModal()}
      </View>
      <DistributorFooter />
      
      <NotificationModal />

      <Modal animationType="slide" transparent={true} visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assigner un livreur</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedOrder && (
              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Commande #{selectedOrder._id?.slice(-8)}</Text>
                <Text style={styles.orderSummaryClient}>{selectedOrder.clientName}</Text>
                <Text style={styles.orderSummaryTotal}>{Number(selectedOrder.total).toLocaleString()} FCFA</Text>
              </View>
            )}
            <Text style={styles.driversTitle}>Livreurs disponibles :</Text>
            <FlatList
              data={drivers.filter((driver) => driver.status === 'disponible')}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.driverCard}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{item.user?.name || 'Non défini'}</Text>
                    <Text style={styles.driverPhone}>{item.user?.phone || 'Non défini'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.assignDriverButton}
                    onPress={() => handleAssignDriver(item, selectedOrder!)}
                  >
                    <Text style={styles.assignDriverText}>Assigner</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              style={styles.driversList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucun livreur disponible</Text>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={validationModalVisible} onRequestClose={() => setValidationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.validationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedOrder?.status === ORDER_STATUS.PENDING 
                  ? 'Accepter la Commande' 
                  : 'Valider la Commande'}
              </Text>
              <TouchableOpacity onPress={() => setValidationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.validationOrderInfo}>
                <Text style={styles.validationOrderTitle}>Commande #{selectedOrder._id?.slice(-8)}</Text>
                <Text style={styles.validationOrderClient}>{selectedOrder.clientName}</Text>
                <View style={styles.validationOrderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Produit:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.products?.[0]?.name} ({selectedOrder.products?.[0]?.quantity}x)
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Montant:</Text>
                    <Text style={[styles.detailValue, { fontWeight: '700', color: '#2E7D32' }]}>
                      {Number(selectedOrder.total).toLocaleString()} FCFA
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.isDelivery ? '🚚 LIVRAISON' : '🏪 RETRAIT'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.validationSection}>
              <Text style={styles.validationLabel}>
                {selectedOrder?.status === ORDER_STATUS.PENDING
                  ? 'Entrez le code de validation pour ACCEPTER la commande:'
                  : 'Entrez le code de validation (6 chiffres):'}
              </Text>
              <TextInput
                style={styles.validationCodeInput}
                placeholder="000000"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                maxLength={6}
                value={validationCode}
                onChangeText={setValidationCode}
                editable={!isValidatingCode}
              />
              <Text style={styles.codeHint}>
                {selectedOrder?.status === ORDER_STATUS.PENDING
                  ? 'Code fourni par le client - Vous recevrez l\'argent une fois validé'
                  : 'Code fourni par le client'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.validateButton, isValidatingCode && styles.validateButtonDisabled]}
              onPress={handleValidateOrderCode}
              disabled={isValidatingCode}
            >
              {isValidatingCode ? (
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.validateButtonText}>
                {isValidatingCode 
                  ? (selectedOrder?.status === ORDER_STATUS.PENDING ? 'Acceptation...' : 'Validation...')
                  : (selectedOrder?.status === ORDER_STATUS.PENDING ? 'Accepter' : 'Valider')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setValidationModalVisible(false)}
              disabled={isValidatingCode}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={stockModalVisible} onRequestClose={() => setStockModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter du stock</Text>
              <TouchableOpacity onPress={() => setStockModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <>
                <View style={styles.productInfo}>
                  <Image source={selectedProduct.image} style={styles.modalProductImage} />
                  <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.currentStock}>Stock actuel: {selectedProduct.stock}</Text>
                  <Text style={styles.currentStock}>Type: {selectedProduct.type}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Type de gaz:</Text>
                  <Picker selectedValue={selectedGasType} style={styles.picker} onValueChange={(itemValue) => setSelectedGasType(itemValue)}>
                    {gasTypes.map((type) => <Picker.Item key={type} label={type} value={type} />)}
                  </Picker>
                  <Text style={styles.inputLabel}>Quantité à ajouter:</Text>
                  <TextInput style={styles.stockInput} value={newStock} onChangeText={setNewStock} placeholder="Entrez la quantité" keyboardType="numeric" />
                </View>
                <TouchableOpacity style={styles.addStockButtonModal} onPress={handleAddStock}>
                  <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.addStockGradient}>
                    <Text style={styles.addStockButtonText}>Ajouter au stock</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={addProductModalVisible} onRequestClose={() => setAddProductModalVisible(false)}>
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: height * 0.8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un produit</Text>
              <TouchableOpacity onPress={() => setAddProductModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Type de gaz</Text>
              <Picker 
                selectedValue={newProduct.type} 
                style={styles.picker} 
                onValueChange={handleGasTypeChange}
              >
                {gasTypes.map((type) => (
                  <Picker.Item 
                    key={type} 
                    label={`${gasConfig[type as keyof typeof gasConfig].name} - ${gasConfig[type as keyof typeof gasConfig].price} FCFA`} 
                    value={type} 
                  />
                ))}
              </Picker>
              
              <Text style={styles.inputLabel}>Type de carburant</Text>
              <FuelTypeSelector 
                selectedType={newProduct.fuelType}
                onTypeChange={handleFuelTypeChange}
              />
              
              <Text style={styles.inputLabel}>Nom du produit</Text>
              <TextInput 
                style={styles.stockInput} 
                value={newProduct.name} 
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })} 
                placeholder="Nom du produit"
                editable={true}
              />
              
              <Text style={styles.inputLabel}>Prix (FCFA)</Text>
              <TextInput 
                style={styles.stockInput} 
                value={newProduct.price} 
                onChangeText={(text) => setNewProduct({ ...newProduct, price: text })} 
                placeholder="Prix"
                keyboardType="numeric"
                editable={true}
              />
              
              <Text style={styles.inputLabel}>Stock initial</Text>
              <TextInput 
                style={styles.stockInput} 
                value={newProduct.stock} 
                onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })} 
                placeholder="Ex: 50" 
                keyboardType="numeric" 
              />
              
              <Text style={styles.inputLabel}>Stock minimum</Text>
              <TextInput 
                style={styles.stockInput} 
                value={newProduct.minStock} 
                onChangeText={(text) => setNewProduct({ ...newProduct, minStock: text })} 
                placeholder="Ex: 20" 
                keyboardType="numeric" 
              />
            </ScrollView>
            <TouchableOpacity style={styles.addStockButtonModal} onPress={handleAddNewProduct}>
              <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.addStockGradient}>
                <Text style={styles.addStockButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={showDriversModal} onRequestClose={() => setShowDriversModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Livreurs Disponibles</Text>
              <TouchableOpacity onPress={() => setShowDriversModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={drivers.filter((driver) => driver.status === 'disponible')}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.driverCard}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{item.user?.name || 'Non défini'}</Text>
                    <Text style={styles.driverPhone}>{item.user?.phone || 'Non défini'}</Text>
                  </View>
                  <View style={styles.driverStatus}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucun livreur disponible</Text>
              }
              style={styles.driversList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}