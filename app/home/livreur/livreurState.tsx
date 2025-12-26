// livreurState.js
import { useState, useEffect, useCallback } from 'react';
import { Alert, BackHandler, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/service/config';
import useNotifications from '../livreur/useNotifications';

export const useLivreurState = (router) => { // Accepter router en paramètre
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState({
    livraisons: 0,
    revenus: 0,
    kmParcourus: 0,
    tempsMoyen: 0,
  });
  const [yesterdayStats, setYesterdayStats] = useState({
    livraisons: 0,
    revenus: 0,
  });
  const [objectifLivraisons, setObjectifLivraisons] = useState(12);
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    photo: '',
    livreurId: null,
  });
  const [livraisons, setLivraisons] = useState([]);
  const [weekStats, setWeekStats] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [lastBackPress, setLastBackPress] = useState(0);

  // États pour les notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationAnimation] = useState(new Animated.Value(0));

  // États pour l'annulation
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState(null);

  // États pour le QR Scanner
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [selectedLivraisonForQr, setSelectedLivraisonForQr] = useState(null);

  // Utilisation du hook de notifications
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    clientId: userId, // Ajouter userId manquant
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Fonction pour mapper les statuts backend vers frontend
  const mapBackendStatusToFrontend = (status) => {
    switch (status) {
      case 'delivered': return 'termine';
      case 'in_transit': return 'en_cours';
      case 'canceled': return 'annule';
      case 'confirmed': return 'confirme';
      case 'preparing': return 'prepare';
      case 'pending': return 'en_attente';
      default: return status || 'en_attente';
    }
  };

  // Fonction pour organiser les livraisons par statut et heure
  const organizeLivraisons = (livraisonsList) => {
    if (!livraisonsList || !Array.isArray(livraisonsList)) return [];

    const livraisonsEnCours = livraisonsList.filter(l => 
      l.statut === 'en_cours' || l.statut === 'en_attente' || l.statut === 'confirme'
    );
    
    const autresLivraisons = livraisonsList.filter(l => 
      !['en_cours', 'en_attente', 'confirme'].includes(l.statut)
    );

    const sortByTime = (a, b) => {
      const timeA = a.scheduledAt || a.deliveredAt;
      const timeB = b.scheduledAt || b.deliveredAt;
      
      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;
      
      return new Date(timeA) - new Date(timeB);
    };

    const sortedEnCours = [...livraisonsEnCours].sort(sortByTime);
    const sortedAutres = [...autresLivraisons].sort(sortByTime);

    return [...sortedEnCours, ...sortedAutres];
  };

  // Gestion du bouton retour
  useEffect(() => {
    const backAction = () => {
      if (showQrScanner) {
        setShowQrScanner(false);
        return true;
      }

      if (showNotifications) {
        closeNotifications();
        return true;
      }

      if (showCancellationModal) {
        setShowCancellationModal(false);
        setCancellationReason('');
        return true;
      }

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
  }, [lastBackPress, showNotifications, showCancellationModal, showQrScanner]);

  // Animation pour le modal des notifications
  useEffect(() => {
    Animated.timing(notificationAnimation, {
      toValue: showNotifications ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showNotifications]);

  // Fonction pour faire les appels API
  const makeApiCall = async (url, options = {}) => {
    try {
      console.log('Making API call to:', url);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('Non-JSON response:', text.substring(0, 200));
        throw new Error('La réponse du serveur n\'est pas au format JSON');
      }
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Marquer une livraison comme terminée via l'API
  const validateDelivery = async (livraisonId) => {
    try {
      const response = await makeApiCall(`${API_BASE_URL}/orders/${livraisonId}/delivered`, {
        method: 'PUT',
        body: JSON.stringify({
          livreurId: userInfo.livreurId,
        }),
      });
      return response;
    } catch (error) {
      console.error('Erreur validation livraison:', error);
      throw error;
    }
  };

  // Annuler une livraison via l'API
  const cancelDelivery = async (livraisonId, reason) => {
    try {
      const response = await makeApiCall(`${API_BASE_URL}/orders/${livraisonId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({
          livreurId: userInfo.livreurId,
          cancellationReason: reason,
          cancelledBy: 'livreur'
        }),
      });
      return response;
    } catch (error) {
      console.error('Erreur annulation livraison:', error);
      throw error;
    }
  };

  // Ouvrir le scanner QR pour une livraison
  const openQrScanner = useCallback((livraison) => {
    setSelectedLivraisonForQr(livraison);
    setShowQrScanner(true);
  }, []);

  // Gérer le scan QR réussi
  const handleQrScanSuccess = useCallback(async (qrData) => {
    if (!selectedLivraisonForQr) {
      Alert.alert('Erreur', 'Aucune livraison sélectionnée');
      return;
    }

    try {
      // Vérifier si le QR code correspond à la commande
      const orderId = selectedLivraisonForQr.orderIdOriginal;
      
      // Le QR code peut contenir l'ID de commande directement ou un objet JSON
      let scannedOrderId = qrData;
      try {
        const parsed = JSON.parse(qrData);
        scannedOrderId = parsed.orderId || parsed.id || qrData;
      } catch (e) {
        // Si ce n'est pas du JSON, utiliser directement la valeur
      }

      if (scannedOrderId === orderId || scannedOrderId.includes(orderId)) {
        // QR code valide, valider la livraison
        const result = await validateDelivery(orderId);
        
        if (result.success) {
          setLivraisons(prev =>
            prev.map(l =>
              l.id === selectedLivraisonForQr.id
                ? { ...l, statut: 'termine' }
                : l
            )
          );

          setTodayStats(prev => ({
            ...prev,
            livraisons: prev.livraisons + 1,
            revenus: prev.revenus + (result.data?.amount || 0),
          }));

          Alert.alert(
            'Succès', 
            'Livraison validée avec succès !',
            [{ text: 'OK', onPress: () => setShowQrScanner(false) }]
          );
        } else {
          Alert.alert('Erreur', result.message || 'Impossible de valider la livraison');
        }
      } else {
        Alert.alert(
          'QR Code invalide',
          'Ce QR code ne correspond pas à cette commande.',
          [{ text: 'Réessayer' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors du scan QR:', error);
      Alert.alert('Erreur', `Impossible de traiter le QR code: ${error.message}`);
    }
  }, [selectedLivraisonForQr, userInfo.livreurId]);

  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        if (!userProfile) throw new Error("Aucun profil utilisateur trouvé");

        const parsedUserProfile = JSON.parse(userProfile);
        const { user, profile } = parsedUserProfile;
        const livreurId = profile?._id;
        if (!livreurId) throw new Error("livreurId manquant dans les données utilisateur");

        setUserInfo({
          name: user.name || 'Livreur',
          phone: user.phone || '',
          photo: user.photo || '',
          livreurId,
        });

        const result = await makeApiCall(`${API_BASE_URL}/livreur/${livreurId}/dashboard`);
        if (result.success && result.data) {
          const { user: apiUser, stats, deliveryHistory, todaysDeliveries } = result.data;

          if (apiUser) {
            setUserInfo(prev => ({
              ...prev,
              name: apiUser.name || prev.name,
              phone: apiUser.phone || prev.phone,
              photo: apiUser.photo || prev.photo,
            }));
          }

          if (stats?.today) {
            setTodayStats({
              livraisons: stats.today.livraisons || 0,
              revenus: stats.today.revenus || 0,
              kmParcourus: stats.today.kmParcourus || 0,
              tempsMoyen: stats.today.tempsMoyen || 0,
            });
          }

          if (stats?.yesterday) {
            setYesterdayStats({
              livraisons: stats.yesterday.livraisons || 0,
              revenus: stats.yesterday.revenus || 0,
            });
          }

          if (stats?.objectif) {
            setObjectifLivraisons(stats.objectif || 12);
          }

          const livraisonsData = todaysDeliveries || deliveryHistory || [];
          
          const formattedLivraisons = livraisonsData.map((livraison, index) => ({
            id: `${livraison.orderId || livraison._id}-${index}`,
            orderIdOriginal: livraison.orderId || livraison._id,
            client: livraison.clientName || 'Client inconnu',
            telephone: livraison.clientPhone || '',
            adresse: livraison.address || 'Adresse non précisée',
            statut: mapBackendStatusToFrontend(livraison.status),
            distance: livraison.distance || 'N/A',
            estimatedTime: livraison.estimatedTime || 'N/A',
            total: livraison.total || 0,
            scheduledAt: livraison.scheduledAt,
            deliveredAt: livraison.deliveredAt,
          }));

          const organizedLivraisons = organizeLivraisons(formattedLivraisons);
          setLivraisons(organizedLivraisons);
          setWeekStats(stats?.week || []);

          await fetchNotifications();
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        Alert.alert(
          'Erreur de connexion',
          `Impossible de charger les données: ${error.message}`,
          [
            { text: 'Réessayer', onPress: () => fetchData() },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    };

    fetchData();
  }, []);

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fonction de rafraîchissement
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (!userProfile) throw new Error("Aucun profil utilisateur trouvé");
      
      const parsedUserProfile = JSON.parse(userProfile);
      const livreurId = parsedUserProfile.profile?._id;
      if (!livreurId) throw new Error("livreurId manquant");
      
      const result = await makeApiCall(`${API_BASE_URL}/livreur/${livreurId}/dashboard`);
      if (result.success && result.data) {
        const { user: apiUser, stats, todaysDeliveries, deliveryHistory } = result.data;
        
        if (apiUser) {
          setUserInfo(prevState => ({
            name: apiUser.name || prevState.name,
            phone: apiUser.phone || prevState.phone,
            photo: apiUser.photo || prevState.photo,
            livreurId: prevState.livreurId,
          }));
        }
        
        if (stats?.today) {
          setTodayStats({
            livraisons: stats.today.livraisons || 0,
            revenus: stats.today.revenus || 0,
            kmParcourus: stats.today.kmParcourus || 0,
            tempsMoyen: stats.today.tempsMoyen || 0,
          });
        }

        if (stats?.yesterday) {
          setYesterdayStats({
            livraisons: stats.yesterday.livraisons || 0,
            revenus: stats.yesterday.revenus || 0,
          });
        }

        if (stats?.objectif) {
          setObjectifLivraisons(stats.objectif || 12);
        }
        
        const livraisonsData = todaysDeliveries || deliveryHistory || [];
        
        const formattedLivraisons = livraisonsData.map((livraison, index) => ({
          id: `${livraison.orderId || livraison.id}-${index}`,
          orderIdOriginal: livraison.orderId || livraison.id,
          client: livraison.clientName || 'Client inconnu',
          telephone: livraison.clientPhone || '',
          adresse: livraison.address || 'Adresse non précisée',
          statut: mapBackendStatusToFrontend(livraison.status),
          distance: livraison.distance || 'N/A',
          estimatedTime: livraison.estimatedTime || 'N/A',
          total: livraison.total || 0,
          scheduledAt: livraison.scheduledAt,
          deliveredAt: livraison.deliveredAt,
        }));

        const organizedLivraisons = organizeLivraisons(formattedLivraisons);
        setLivraisons(organizedLivraisons);
        setWeekStats(stats?.week || []);

        await fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement :', error);
      Alert.alert('Erreur', `Impossible de rafraîchir les données: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Fonctions notifications
  const openNotifications = async () => {
    setShowNotifications(true);
    await markAllAsRead();
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            notifications.forEach(async (notif) => {
              await deleteNotification(notif.id);
            });
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'livraison': return 'car-outline';
      case 'paiement': return 'cash-outline';
      case 'statistique': return 'stats-chart-outline';
      case 'system': return 'information-circle-outline';
      case 'new_order': return 'cube-outline';
      case 'order_update': return 'refresh-outline';
      case 'payment': return 'card-outline';
      case 'alert': return 'warning-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'livraison': return '#1565C0';
      case 'paiement': return '#4CAF50';
      case 'statistique': return '#FF9800';
      case 'system': return '#9C27B0';
      case 'new_order': return '#2196F3';
      case 'order_update': return '#FF9800';
      case 'payment': return '#4CAF50';
      case 'alert': return '#F44336';
      default: return '#757575';
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    return new Date(timestamp).toLocaleDateString('fr-FR');
  };

  const getStatutColor = (statut) => {
    if (!statut) return '#757575';
    switch (statut.toLowerCase()) {
      case 'en_cours': return '#1976D2';
      case 'en_attente': return '#FF9800';
      case 'confirme': return '#2196F3';
      case 'prepare': return '#FF9800';
      case 'termine': return '#4CAF50';
      case 'annule': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatutIcon = (statut) => {
    if (!statut) return 'help-outline';
    switch (statut.toLowerCase()) {
      case 'en_cours': return 'car-outline';
      case 'en_attente': return 'time-outline';
      case 'confirme': return 'checkmark-circle-outline';
      case 'prepare': return 'construct-outline';
      case 'termine': return 'checkmark-done-outline';
      case 'annule': return 'close-circle-outline';
      default: return 'help-outline';
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatStatut = (statut) => {
    if (!statut || typeof statut !== 'string') return 'INCONNU';
    return statut.replace(/_/g, ' ').toUpperCase();
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Heure non définie';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Heure invalide';
    }
  };

  const handleCall = useCallback((livraison) => {
    if (!livraison?.telephone) {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
      return;
    }
    Alert.alert(
      'Appel',
      `Appeler ${livraison.client || 'le client'} au ${livraison.telephone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => console.log(`Appel vers ${livraison.telephone}`) }
      ]
    );
  }, []);

  // Marquer comme terminée avec option QR ou manuel
  const markAsDelivered = useCallback(async (livraisonId) => {
    const livraison = livraisons.find(l => l.id === livraisonId);
    if (!livraison) {
      Alert.alert('Erreur', 'Livraison introuvable');
      return;
    }

    Alert.alert(
      'Valider la livraison',
      'Comment souhaitez-vous valider cette livraison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Scanner QR Code',
          onPress: () => openQrScanner(livraison)
        },
        {
          text: 'Validation manuelle',
          onPress: async () => {
            try {
              const result = await validateDelivery(livraison.orderIdOriginal);
              if (result.success) {
                setLivraisons(prev =>
                  prev.map(l =>
                    l.id === livraisonId
                      ? { ...l, statut: 'termine' }
                      : l
                  )
                );

                setTodayStats(prev => ({
                  ...prev,
                  livraisons: prev.livraisons + 1,
                  revenus: prev.revenus + (result.data?.amount || 0),
                }));

                Alert.alert('Succès', 'Livraison marquée comme terminée !');
              } else {
                Alert.alert('Erreur', result.message || 'Impossible de valider la livraison');
              }
            } catch (error) {
              console.error('Erreur validation livraison:', error);
              Alert.alert('Erreur', `Impossible de mettre à jour la livraison: ${error.message}`);
            }
          }
        }
      ]
    );
  }, [livraisons]);

  const handleCancelDelivery = useCallback(async (livraisonId) => {
    const livraison = livraisons.find(l => l.id === livraisonId);
    if (!livraison) {
      Alert.alert('Erreur', 'Livraison introuvable');
      return;
    }

    setSelectedLivraison(livraison);
    setShowCancellationModal(true);
  }, [livraisons]);

  const confirmCancellation = useCallback(async () => {
    if (!selectedLivraison || !cancellationReason.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un motif d\'annulation');
      return;
    }

    try {
      const result = await cancelDelivery(selectedLivraison.orderIdOriginal, cancellationReason);
      if (result.success) {
        setLivraisons(prev =>
          prev.map(l =>
            l.id === selectedLivraison.id
              ? { ...l, statut: 'annule' }
              : l
          )
        );

        setTodayStats(prev => ({
          ...prev,
          livraisons: Math.max(0, prev.livraisons - 1),
        }));

        Alert.alert('Succès', 'Livraison annulée avec succès !');
        
        setShowCancellationModal(false);
        setCancellationReason('');
        setSelectedLivraison(null);
      } else {
        Alert.alert('Erreur', result.message || 'Impossible d\'annuler la livraison');
      }
    } catch (error) {
      console.error('Erreur annulation livraison:', error);
      Alert.alert('Erreur', `Impossible d'annuler la livraison: ${error.message}`);
    }
  }, [selectedLivraison, cancellationReason]);

  const canCancelDelivery = (statut) => {
    return ['en_attente', 'confirme', 'prepare', 'en_cours'].includes(statut);
  };

  const handleNotificationPress = (notification) => {
    console.log('Notification cliquée:', notification);
    
    if (!router) {
      console.warn('Router non disponible');
      return;
    }
    
    // Actions spécifiques selon le type de notification
    switch (notification.type) {
      case 'new_order':
      case 'livraison':
        // Rediriger vers les livraisons
        router.push('/home/livreur/livraisons');
        break;
      case 'paiement':
      case 'payment':
        // Rediriger vers le wallet
        router.push('/home/livreur/wallet');
        break;
      case 'order_update':
        // Rediriger vers les détails de la commande
        if (notification.data?.orderId) {
          router.push(`/home/livreur/livraisons/${notification.data.orderId}`);
        }
        break;
      default:
        // Action par défaut
        console.log('Notification de type:', notification.type);
    }
    
    closeNotifications();
  };

  // Retourner tous les états et fonctions
  return {
    // États
    refreshing,
    currentTime,
    todayStats,
    yesterdayStats,
    objectifLivraisons,
    userInfo,
    livraisons,
    weekStats,
    activeTab,
    showNotifications,
    notificationAnimation,
    cancellationReason,
    showCancellationModal,
    selectedLivraison,
    showQrScanner,
    selectedLivraisonForQr,
    notifications,
    notificationsLoading,
    notificationsError,
    unreadCount,

    // Setters
    setActiveTab,
    setCancellationReason,
    setShowCancellationModal,
    setSelectedLivraison,
    setShowQrScanner,
    setSelectedLivraisonForQr,

    // Fonctions
    onRefresh,
    openNotifications,
    closeNotifications,
    handleDeleteNotification,
    clearAllNotifications,
    getNotificationIcon,
    getNotificationColor,
    formatRelativeTime,
    getStatutColor,
    getStatutIcon,
    getGreeting,
    formatStatut,
    formatCurrency,
    formatTime,
    handleCall,
    markAsDelivered,
    handleCancelDelivery,
    confirmCancellation,
    canCancelDelivery,
    handleNotificationPress,
    handleQrScanSuccess,
    openQrScanner,
    validateDelivery,
    cancelDelivery,
    makeApiCall,
    mapBackendStatusToFrontend,
    organizeLivraisons,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};