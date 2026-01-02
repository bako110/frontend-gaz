import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import styles from '@/styles/livreur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/service/config';
import { useLivreurState } from './livreur/livreurState';
import { useExitAlert } from '@/app/hooks/useExitAlert';
import { useTheme } from '@/contexts/ThemeContext';
import { generateOrderId } from '@/utils/orderUtils';
import AvailabilityToggle from '@/components/livreur/AvailabilityToggle';
import NearbyDistributors from '@/components/livreur/NearbyDistributors';

const LivreurDashboard = () => {
  // Gestion de la sortie de l'application
  useExitAlert();

  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  // États pour la validation par code
  const [showCodeValidation, setShowCodeValidation] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [selectedLivraisonForValidation, setSelectedLivraisonForValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Utilisation du hook personnalisé pour la gestion d'état
  const {
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
    cancellationReason,
    showCancellationModal,
    selectedLivraison,
    notifications,
    unreadCount,

    // Setters
    setActiveTab,
    setCancellationReason,
    setShowCancellationModal,
    setSelectedLivraison,

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
    markAsRead,
  } = useLivreurState();

  // ✅ FONCTION POUR CORRIGER L'ID DE COMMANDE
  const getCorrectOrderId = (orderId) => {
    if (!orderId) return null;
    
    // Si l'ID contient un suffixe comme -0, -1, etc., on l'enlève
    if (orderId.includes('-')) {
      const correctedId = orderId.split('-')[0];
      console.log('🔄 [ID_CORRECTION] ID corrigé:', { original: orderId, corrigé: correctedId });
      return correctedId;
    }
    
    return orderId;
  };

  // Fonction pour ouvrir la validation par code
  const openCodeValidation = (livraison) => {
    setSelectedLivraisonForValidation(livraison);
    setValidationCode('');
    setShowCodeValidation(true);
  };

  // Fonction pour fermer la validation par code
  const closeCodeValidation = () => {
    setShowCodeValidation(false);
    setSelectedLivraisonForValidation(null);
    setValidationCode('');
    setIsValidating(false);
  };

  // Fonction pour valider le code avec l'API - VERSION CORRIGÉE
  const validateCode = async () => {
    if (!selectedLivraisonForValidation || !validationCode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code à 6 chiffres');
      return;
    }

    if (validationCode.length !== 6) {
      Alert.alert('Erreur', 'Le code doit contenir exactement 6 chiffres');
      return;
    }

    Vibration.vibrate(100);
    setIsValidating(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const livreurId = await AsyncStorage.getItem('userId');

      console.log(' [VALIDATE] Token récupéré:', token ? '✓' : '✗');
      console.log(' [VALIDATE] Livreur ID:', livreurId);

      if (!token || !livreurId) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // 🔥 CORRECTION : Utiliser l'ID corrigé sans le suffixe -0
      const correctedOrderId = getCorrectOrderId(selectedLivraisonForValidation.id);
      
      if (!correctedOrderId) {
        throw new Error('ID de commande invalide');
      }

      // Utiliser generateOrderId pour afficher un ID formaté dans les logs
      const formattedOrderId = generateOrderId(correctedOrderId);
      
      console.log(' [VALIDATE] Données de validation:', {
        orderIdOriginal: selectedLivraisonForValidation.id,
        orderIdCorrigé: correctedOrderId,
        formattedOrderId: formattedOrderId,
        validationCode: validationCode,
        livreurId: livreurId
      });

      // Construction de l'URL avec l'ID corrigé
      const url = `${API_BASE_URL}/orders/${correctedOrderId}/validate-delivery`;
      console.log(' [VALIDATE] URL complète:', url);
      console.log(' [VALIDATE] API_BASE_URL:', API_BASE_URL);

      const requestBody = {
        validationCode: validationCode,
        livreurId: livreurId
      };

      console.log(' [VALIDATE] Body envoyé:', JSON.stringify(requestBody, null, 2));

      const startTime = Date.now();
      console.log(' [VALIDATE] Début de la requête...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      console.log(' [VALIDATE] Temps de réponse:', (endTime - startTime) + 'ms');

      // LOGS DÉTAILLÉS DE LA RÉPONSE
      console.log(' [VALIDATE] Statut HTTP:', response.status);
      console.log(' [VALIDATE] OK:', response.ok);

      // Lire d'abord le texte brut pour debug
      const responseText = await response.text();
      console.log(' [VALIDATE] Réponse brute:', responseText.substring(0, 500));

      // Vérifier si c'est du HTML (erreur)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
        console.error(' [VALIDATE] SERVEUR RETOURNE DU HTML - Erreur de route');
        throw new Error('Route API non trouvée - Contactez le support');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log(' [VALIDATE] JSON parsé avec succès');
      } catch (parseError) {
        console.error(' [VALIDATE] ERREUR PARSING JSON');
        throw new Error('Erreur de communication avec le serveur');
      }

      // Vérification du statut HTTP
      if (!response.ok) {
        console.error(' [VALIDATE] Erreur HTTP:', response.status);
        throw new Error(data.message || `Erreur serveur ${response.status}`);
      }

      // Traitement de la réponse
      console.log(' [VALIDATE] Réponse API:', {
        success: data.success,
        codeValid: data.codeValid,
        livreurValid: data.livreurValid,
        message: data.message
      });

      if (data.success) {
        console.log(' [VALIDATE] VALIDATION RÉUSSIE');
        Alert.alert(
          ' Livraison confirmée',
          data.message || 'La livraison a été marquée comme livrée avec succès.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log(' [VALIDATE] Rafraîchissement des données...');
                onRefresh();
                closeCodeValidation();
                
                if (data.details) {
                  setTimeout(() => {
                    Alert.alert(
                      ' Paiements distribués',
                      `Livraison validée avec succès !\n\n` +
                      ` Votre gain: ${data.amounts?.deliveryFee?.toLocaleString() || 0} FCFA\n` +
                      ` Distributeur: ${data.amounts?.productAmount?.toLocaleString() || 0} FCFA\n` +
                      ` Nouveau solde: ${data.details?.livreur?.newBalance?.toLocaleString() || 0} FCFA`,
                      [{ text: 'Fermer' }]
                    );
                  }, 500);
                }
              }
            }
          ]
        );
      } else {
        console.log(' [VALIDATE] VALIDATION ÉCHOUÉE:', data.message);
        if (data.codeValid === false) {
          Alert.alert(
            ' Code incorrect',
            data.message || 'Le code saisi est incorrect. Veuillez réessayer.',
            [
              {
                text: 'Réessayer',
                onPress: () => setValidationCode(''),
              },
              {
                text: 'Annuler',
                onPress: closeCodeValidation,
                style: 'cancel',
              },
            ]
          );
        } else if (data.livreurValid === false) {
          Alert.alert(
            ' Non autorisé',
            data.message || 'Vous n\'êtes pas assigné à cette commande.',
            [{ text: 'OK', onPress: closeCodeValidation }]
          );
        } else {
          throw new Error(data.message || 'Erreur de validation');
        }
      }

    } catch (error) {
      console.error(' [VALIDATE] ERREUR:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Route API non trouvée')) {
        errorMessage = 'Fonctionnalité temporairement indisponible';
      }

      Alert.alert(
        'Erreur',
        errorMessage,
        [
          { text: 'Réessayer', onPress: () => setValidationCode('') },
          { text: 'Annuler', onPress: closeCodeValidation },
        ]
      );
    } finally {
      console.log(' [VALIDATE] Validation terminée');
      setIsValidating(false);
    }
  };

  // Composants UI
  const StatCard = ({ icon, title, value, subtitle, color = '#1565C0' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon || 'help-outline'} size={24} color="#fff" />
        </View>
        <Text style={styles.statValue}>{value || '0'}</Text>
      </View>
      <Text style={styles.statTitle}>{title || 'N/A'}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  // ✅ Vérifier si on peut marquer comme livré
  // Peut être en attente (pending) ou en cours (in_progress)
  const canMarkAsDelivered = (statut) => {
    return ['en_attente', 'en_cours', 'confirme'].includes(statut);
  };

  // ✅ Vérifier si on peut annuler
  // On peut annuler les commandes non-livrées et non-annulées
  const canCancelOrder = (statut) => {
    return ['en_attente', 'en_cours', 'confirme'].includes(statut);
  };

  // Composant LivraisonCard
  const LivraisonCard = ({ livraison }) => {
    if (!livraison) return null;
    
    const correctedOrderId = getCorrectOrderId(livraison.id);
    const formattedOrderId = generateOrderId(correctedOrderId || livraison.id);
    
    return (
      <TouchableOpacity style={styles.livraisonCard} activeOpacity={0.8}>
        <View style={styles.livraisonHeader}>
          <View style={styles.livraisonInfo}>
            {/* Utiliser l'ID formaté */}
            <Text style={styles.livraisonId}>{formattedOrderId}</Text>
            <View style={[styles.statutBadge, { backgroundColor: getStatutColor(livraison.statut) + '20' }]}>
              <Ionicons name={getStatutIcon(livraison.statut)} size={16} color={getStatutColor(livraison.statut)} />
              <Text style={[styles.statutText, { color: getStatutColor(livraison.statut) }]}>
                {formatStatut(livraison.statut)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={() => handleCall(livraison)}>
            <Ionicons name="call" size={20} color="#1565C0" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.clientName}>{livraison.client || 'Client inconnu'}</Text>
        
        {/* Badges d'action */}
        {/* <View style={styles.actionBadgesContainer}>
          {canMarkAsDelivered(livraison.statut) && (
            <View style={styles.actionRequiredBadge}>
              <Ionicons name="alert-circle" size={12} color="#FF8F00" />
              <Text style={styles.actionRequiredText}>À livrer</Text>
            </View>
          )}

          {canCancelOrder(livraison.statut) && (
            <View style={styles.cancellableBadge}>
              <Ionicons name="close-circle" size={12} color="#E53935" />
              <Text style={styles.cancellableText}>Annulable</Text>
            </View>
          )}
        </View> */}
        
        {(livraison.scheduledAt || livraison.deliveredAt) && (
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.timeText}>
              {livraison.statut === 'termine' 
                ? `Livré à ${formatTime(livraison.deliveredAt)}`
                : `Planifié à ${formatTime(livraison.scheduledAt)}`
              }
            </Text>
          </View>
        )}
        
        <View style={styles.livraisonDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{livraison.adresse || 'Adresse non précisée'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{livraison.distance || 'Distance inconnue'}</Text>
          </View>
          {livraison.total && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{formatCurrency(livraison.total)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {livraison.statut === 'en_cours' && (
            <>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => openCodeValidation(livraison)}
              >
                <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.actionButtonGradient}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Valider la livraison</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => handleCancelDelivery(livraison.id)}
              >
                <LinearGradient colors={['#E53935', '#F44336']} style={styles.cancelButtonGradient}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Composant pour afficher les livraisons avec sections
  const LivraisonsSection = () => {
    if (!livraisons || livraisons.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Aucune livraison pour aujourd'hui</Text>
        </View>
      );
    }

    const livraisonsEnCours = livraisons.filter(l => 
      ['en_cours', 'en_attente', 'confirme'].includes(l.statut)
    );
    
    const autresLivraisons = livraisons.filter(l => 
      !['en_cours', 'en_attente', 'confirme'].includes(l.statut)
    );

    return (
      <View>
        {livraisonsEnCours.length > 0 && (
          <View style={styles.livraisonSection}>
            <Text style={styles.sectionSubtitle}>En cours ({livraisonsEnCours.length})</Text>
            {livraisonsEnCours.map((livraison) => (
              <LivraisonCard key={livraison?.id || Math.random()} livraison={livraison} />
            ))}
          </View>
        )}

        {autresLivraisons.length > 0 && (
          <View style={styles.livraisonSection}>
            <Text style={styles.sectionSubtitle}>Autres livraisons ({autresLivraisons.length})</Text>
            {autresLivraisons.map((livraison) => (
              <LivraisonCard key={livraison?.id || Math.random()} livraison={livraison} />
            ))}
          </View>
        )}
      </View>
    );
  };

  // Reste du code inchangé...
  const NotificationItem = ({ notification }) => (
    <View style={[
      styles.notificationItem,
      !notification.read && styles.unreadNotification
    ]}>
      <TouchableOpacity 
        style={styles.notificationHeader}
        onPress={async () => {
          await markAsRead(notification.id);
          handleNotificationPress(notification);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIconContainer}>
          <Ionicons 
            name={getNotificationIcon(notification.type)} 
            size={20} 
            color={getNotificationColor(notification.type)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>
            {notification.date || formatRelativeTime(notification.timestamp)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationDelete}
          onPress={() => handleDeleteNotification(notification.id)}
        >
          <Ionicons name="close" size={16} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const WeekChart = () => {
    if (!weekStats || weekStats.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Performance de la semaine</Text>
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        </View>
      );
    }

    // Afficher les 7 jours de la semaine avec tous les données
    const maxLivraisons = Math.max(...weekStats.map(s => s?.livraisons || 0), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance de la semaine</Text>
        
        {/* Résumé hebdomadaire */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingHorizontal: 8 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1565C0' }}>
              {weekStats.reduce((sum, s) => sum + (s?.livraisons || 0), 0)}
            </Text>
            <Text style={{ fontSize: 11, color: '#a0aec0' }}>livraisons</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Revenus</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#48bb78' }}>
              {weekStats.reduce((sum, s) => sum + (s?.revenus || 0), 0).toFixed(0)} FCFA
            </Text>
            <Text style={{ fontSize: 11, color: '#a0aec0' }}>semaine</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#718096', marginBottom: 4 }}>Moyenne</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ed8936' }}>
              {weekStats.length > 0 ? Math.round(weekStats.reduce((sum, s) => sum + (s?.livraisons || 0), 0) / 7) : 0}
            </Text>
            <Text style={{ fontSize: 11, color: '#a0aec0' }}>par jour</Text>
          </View>
        </View>

        {/* Graphe en barres pour chaque jour */}
        <View style={styles.chartBars}>
          {weekStats.map((stat, index) => {
            const barHeight = maxLivraisons > 0 ? ((stat?.livraisons || 0) / maxLivraisons) * 100 : 0;
            const hasDeliveries = (stat?.livraisons || 0) > 0;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${barHeight}%` }]}>
                    <LinearGradient 
                      colors={hasDeliveries ? ['#1565C0', '#1976D2'] : ['#cbd5e0', '#e2e8f0']} 
                      style={styles.barGradient} 
                    />
                  </View>
                </View>
                <Text style={styles.barLabel}>{stat?.jour || '?'}</Text>
                <View>
                  <Text style={styles.barValue}>{stat?.livraisons || 0}</Text>
                  <Text style={{ fontSize: 10, color: '#a0aec0', textAlign: 'center' }}>
                    {stat?.revenus || 0} FCFA
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home': router.push('/home/livreurScreen'); break;
      case 'wallet': router.push('/home/livreur/wallet'); break;
      case 'history': router.push('/home/livreur/historique'); break;
      case 'settings': router.push('/home/livreur/settings'); break;
      default: break;
    }
  }, [router]);

  const Footer = () => (
    <View style={styles.footer}>
      {[
        { key: 'home', icon: 'home-outline', label: 'Accueil' },
        { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
        { key: 'history', icon: 'time-outline', label: 'Historique' },
        { key: 'settings', icon: 'settings-outline', label: 'Paramètres' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.footerTab, activeTab === tab.key && styles.activeTab]}
          onPress={() => handleTabPress(tab.key)}
        >
          <Ionicons name={tab.icon} size={24} color={activeTab === tab.key ? '#1565C0' : '#718096'} />
          <Text style={[styles.footerTabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // const quickActions = [
  //   { icon: 'map-outline', label: 'Itinéraire', onPress: () => console.log('Itinéraire') },
  //   { icon: 'car-outline', label: 'Ma position', onPress: () => console.log('Ma position') },
  //   { icon: 'document-text-outline', label: 'Rapport', onPress: () => console.log('Rapport') },
  //   { icon: 'help-circle-outline', label: 'Support', onPress: () => console.log('Support') },
  // ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <LinearGradient colors={['#1565C0', '#1565C0']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.profileImage}>
              {userInfo.photo ? (
                <Image source={{ uri: userInfo.photo }} style={styles.profileImageSize} />
              ) : (
                <Ionicons name="person" size={24} color="#fff" />
              )}
            </View>
            <View>
              <Text style={styles.welcomeText}>Livreur</Text>
              <Text style={styles.userName}>{userInfo.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton} onPress={openNotifications}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.dateTime}>
          {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} -
          {' '}{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </LinearGradient>

      {/* Modal des notifications - Design Moderne */}
      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={closeNotifications}>
        <View style={styles.modernModalOverlay}>
          <TouchableOpacity 
            style={styles.modernModalBackdrop} 
            activeOpacity={1} 
            onPress={closeNotifications}
          />
          <View style={styles.modernNotificationPanel}>
            {/* Header moderne avec gradient */}
            <LinearGradient
              colors={['#1565C0', '#1976D2']}
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
                  onPress={closeNotifications}
                >
                  <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              </View>
              
              {notifications.length > 0 && (
                <TouchableOpacity 
                  style={styles.modernClearAllButton} 
                  onPress={clearAllNotifications}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.modernClearAllText}>Tout effacer</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
            
            {/* Liste des notifications avec scroll */}
            <ScrollView 
              style={styles.modernNotificationList}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <View key={notification.id} style={styles.modernNotificationItemWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.modernNotificationItem,
                        !notification.read && styles.modernUnreadNotification
                      ]}
                      onPress={async () => {
                        await markAsRead(notification.id);
                        handleNotificationPress(notification);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.modernNotificationIconContainer,
                        { backgroundColor: `${getNotificationColor(notification.type)}15` }
                      ]}>
                        <Ionicons 
                          name={getNotificationIcon(notification.type)} 
                          size={24} 
                          color={getNotificationColor(notification.type)} 
                        />
                      </View>
                      
                      <View style={styles.modernNotificationContent}>
                        <View style={styles.modernNotificationTitleRow}>
                          <Text style={styles.modernNotificationTitle} numberOfLines={1}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <Text style={styles.modernNotificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <View style={styles.modernNotificationFooter}>
                          <Ionicons name="time-outline" size={12} color="#999" />
                          <Text style={styles.modernNotificationTime}>
                            {notification.date || formatRelativeTime(notification.timestamp)}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.modernNotificationDelete}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
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

      {/* Modal de validation par code */}
      <Modal visible={showCodeValidation} animationType="slide" onRequestClose={closeCodeValidation}>
        <View style={codeValidationStyles.container}>
          <View style={codeValidationStyles.header}>
            <TouchableOpacity onPress={closeCodeValidation} style={codeValidationStyles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={codeValidationStyles.title}>Validation de livraison</Text>
            <View style={codeValidationStyles.placeholder} />
          </View>

          <View style={codeValidationStyles.instructionContainer}>
            <Ionicons name="key" size={64} color="#1565C0" />
            <Text style={codeValidationStyles.instructionText}>Entrez le code à 6 chiffres</Text>
            {selectedLivraisonForValidation && (
              <Text style={codeValidationStyles.livraisonInfo}>
                Commande {generateOrderId(getCorrectOrderId(selectedLivraisonForValidation.id) || selectedLivraisonForValidation.id)}
              </Text>
            )}
            <Text style={codeValidationStyles.hintText}>Le code vous a été fourni par le système</Text>
          </View>

          <View style={codeValidationStyles.inputContainer}>
            <Text style={codeValidationStyles.inputLabel}>Code de validation (6 chiffres)</Text>
            <TextInput
              style={codeValidationStyles.codeInput}
              placeholder="000000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              value={validationCode}
              onChangeText={setValidationCode}
              autoFocus={true}
              editable={!isValidating}
            />
          </View>

          <View style={codeValidationStyles.actionsContainer}>
            {isValidating ? (
              <View style={codeValidationStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={codeValidationStyles.loadingText}>Validation en cours...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[
                    codeValidationStyles.validateButton,
                    (validationCode.length !== 6 || isValidating) && codeValidationStyles.validateButtonDisabled
                  ]}
                  onPress={validateCode}
                  disabled={validationCode.length !== 6 || isValidating}
                >
                  <LinearGradient 
                    colors={validationCode.length !== 6 ? ['#ccc', '#ccc'] : ['#4CAF50', '#66BB6A']} 
                    style={codeValidationStyles.validateButtonGradient}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={codeValidationStyles.validateButtonText}>Valider la livraison</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={codeValidationStyles.cancelButton}
                  onPress={closeCodeValidation}
                  disabled={isValidating}
                >
                  <Text style={codeValidationStyles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal d'annulation de livraison */}
      <Modal animationType="fade" transparent={true} visible={showCancellationModal} onRequestClose={() => {
        setShowCancellationModal(false);
        setCancellationReason('');
      }}>
        <View style={styles.modalOverlay}>
          <View style={styles.cancellationModalContent}>
            <Text style={styles.modalTitle}>Annuler la livraison</Text>
            <Text style={styles.cancellationDescription}>Veuillez indiquer le motif de l'annulation :</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Saisissez le motif d'annulation..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              textAlignVertical="top"
            />
            <View style={styles.cancellationButtons}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => {
                setShowCancellationModal(false);
                setCancellationReason('');
              }}>
                <Text style={styles.cancelModalButtonText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmCancelButton, !cancellationReason.trim() && styles.confirmCancelButtonDisabled]}
                onPress={confirmCancellation}
                disabled={!cancellationReason.trim()}
              >
                <Text style={styles.confirmCancelButtonText}>Confirmer l'annulation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} tintColor="#1565C0" />} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <StatCard 
            icon="car-outline" 
            title="Livraisons aujourd'hui" 
            value={todayStats.livraisons?.toString() || '0'} 
            subtitle={`Objectif: ${objectifLivraisons}`} 
            color="#1565C0" 
          />
          <StatCard 
            icon="cash-outline" 
            title="Revenus du jour" 
            value={formatCurrency(todayStats.revenus)} 
            subtitle={(() => {
              if (yesterdayStats.revenus === 0) return 'Pas de comparaison';
              const diff = todayStats.revenus - yesterdayStats.revenus;
              const percentage = ((diff / yesterdayStats.revenus) * 100).toFixed(1);
              const sign = diff >= 0 ? '+' : '';
              return `${sign}${((diff / yesterdayStats.revenus) * 100).toFixed(1)}% vs hier`;
            })()} 
            color="#4CAF50" 
          />
        </View>

        {/* Section Disponibilité */}
        <View style={styles.section}>
          <AvailabilityToggle 
            livreurId={userInfo.livreurId}
            onStatusChange={(isAvailable) => {
              console.log('Statut disponibilité changé:', isAvailable);
              onRefresh();
            }}
          />
        </View>

        {/* Section Distributeurs Proches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distributeurs proches</Text>
          <NearbyDistributors livreurId={userInfo.livreurId} maxDistance={5000} />
        </View>

        <WeekChart />
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Livraisons du jour</Text>
            <TouchableOpacity onPress={() => router.push('/home/livreur/historique')}>
              <Text style={styles.sectionAction}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <LivraisonsSection />
        </View>
        {/* <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.quickActionButton} onPress={action.onPress}>
                <Ionicons name={action.icon} size={24} color="#1565C0" />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}
      </ScrollView>
      <Footer />
    </View>
  );
};

// Styles pour la validation par code
const codeValidationStyles = {
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 20, backgroundColor: '#1565C0' },
  closeButton: { padding: 4 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 28 },
  instructionContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  instructionText: { color: '#333', fontSize: 18, textAlign: 'center', marginTop: 20, marginBottom: 8, fontWeight: '600' },
  livraisonInfo: { color: '#1565C0', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  hintText: { color: '#666', fontSize: 14, textAlign: 'center' },
  inputContainer: { paddingHorizontal: 20, marginBottom: 30 },
  inputLabel: { color: '#333', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  codeInput: { borderWidth: 2, borderColor: '#1565C0', borderRadius: 12, padding: 16, fontSize: 18, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8f9fa' },
  actionsContainer: { paddingHorizontal: 20 },
  validateButton: { marginBottom: 15 },
  validateButtonDisabled: { opacity: 0.6 },
  validateButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  validateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#666', fontSize: 16 },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
};

// Ajout des styles pour les badges d'action
const additionalStyles = {
  actionBadgesContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  actionRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF8F00',
  },
  actionRequiredText: {
    color: '#FF8F00',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cancellableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  cancellableText: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
};

export default LivreurDashboard;