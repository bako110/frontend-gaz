import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/service/config';
import LivreurFooter from './LivreurFooter';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [commandes, setCommandes] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [livreurId, setLivreurId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  // ✅ NOUVEAUX ÉTATS POUR LA VALIDATION PAR CODE
  const [showCodeValidation, setShowCodeValidation] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [selectedCommandeForValidation, setSelectedCommandeForValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Récupérer l'ID du livreur (ID de la collection Livreur)
  useEffect(() => {
    const fetchLivreurId = async () => {
      try {
        // Essayer de récupérer le profil complet du livreur
        const userProfile = await AsyncStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          console.log('📋 Profil utilisateur complet:', profile);
          
          // Priorité 1: Récupérer l'ID du livreur depuis le profil
          if (profile.profile?._id) {
            console.log('✅ ID Livreur trouvé dans profile.profile._id:', profile.profile._id);
            setLivreurId(profile.profile._id);
            return;
          }
          
          // Priorité 2: Vérifier si c'est directement l'ID du livreur
          if (profile._id) {
            console.log('✅ ID Livreur trouvé dans profile._id:', profile._id);
            setLivreurId(profile._id);
            return;
          }
        }

        // Essayer de récupérer les données utilisateur
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('📋 Données utilisateur:', user);
          
          if (user.id) {
            console.log('🔍 ID utilisateur trouvé, recherche du profil livreur...');
            
            // Si on a l'ID utilisateur, on va chercher le profil livreur
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
              try {
                const response = await fetch(`${API_BASE_URL}/livreur/profile`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                
                if (response.ok) {
                  const livreurData = await response.json();
                  console.log('📦 Données livreur récupérées:', livreurData);
                  
                  if (livreurData.success && livreurData.data?._id) {
                    console.log('✅ ID Livreur trouvé via API:', livreurData.data._id);
                    setLivreurId(livreurData.data._id);
                    // Sauvegarder pour usage futur
                    await AsyncStorage.setItem('livreurProfile', JSON.stringify(livreurData.data));
                    return;
                  }
                }
              } catch (apiError) {
                console.error('❌ Erreur API profil livreur:', apiError);
              }
            }
          }
        }

        // Dernier recours: chercher dans les données sauvegardées
        const livreurProfile = await AsyncStorage.getItem('livreurProfile');
        if (livreurProfile) {
          const profile = JSON.parse(livreurProfile);
          if (profile._id) {
            console.log('✅ ID Livreur trouvé dans livreurProfile:', profile._id);
            setLivreurId(profile._id);
            return;
          }
        }

        console.warn('⚠️ Aucun ID livreur trouvé');
        setError("Impossible de récupérer vos informations de livreur.");

      } catch (error) {
        console.error("❌ Erreur lors de la récupération de l'ID du livreur :", error);
        setError("Impossible de récupérer vos informations.");
      }
    };
    fetchLivreurId();
  }, []);

  // Fonction pour mapper les statuts backend vers frontend
  const mapBackendStatusToFrontend = useCallback((status) => {
    // ✅ NOUVEAUX STATUTS (backend refactorisé)
    switch (status) {
      case 'pending': return 'en_attente';          // Assignée au livreur
      case 'in_progress': return 'en_cours';        // En cours de livraison
      case 'completed': return 'livre';             // Livrée
      case 'cancelled': return 'annule';            // Annulée
      
      // Anciens statuts (pour compatibilité)
      case 'delivered': return 'livre';
      case 'in_transit': return 'en_cours';
      case 'canceled': return 'annule';
      case 'confirmed': return 'confirme';
      case 'preparing': return 'prepare';
      case 'en_attente': return 'en_attente';
      
      default: return status || 'en_attente';
    }
  }, []);

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

  // ✅ FONCTION POUR VALIDER LE CODE AVEC L'API
  const validateCode = async () => {
    if (!selectedCommandeForValidation || !validationCode.trim()) {
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

      console.log('🔑 [VALIDATE] Token récupéré:', token ? '✓' : '✗');
      console.log('👤 [VALIDATE] Livreur ID:', livreurId);

      if (!token || !livreurId) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // 🔥 CORRECTION : Utiliser l'ID corrigé sans le suffixe -0
      const correctedOrderId = getCorrectOrderId(selectedCommandeForValidation.id);
      
      if (!correctedOrderId) {
        throw new Error('ID de commande invalide');
      }

      console.log('📦 [VALIDATE] Données de validation:', {
        orderIdOriginal: selectedCommandeForValidation.id,
        orderIdCorrigé: correctedOrderId,
        validationCode: validationCode,
        livreurId: livreurId
      });

      // Construction de l'URL avec l'ID corrigé
      const url = `${API_BASE_URL}/orders/${correctedOrderId}/validate-delivery`;
      console.log('🌐 [VALIDATE] URL complète:', url);
      console.log('🔧 [VALIDATE] API_BASE_URL:', API_BASE_URL);

      const requestBody = {
        validationCode: validationCode,
        livreurId: livreurId
      };

      console.log('📤 [VALIDATE] Body envoyé:', JSON.stringify(requestBody, null, 2));

      const startTime = Date.now();
      console.log('⏰ [VALIDATE] Début de la requête...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      console.log('⏱️ [VALIDATE] Temps de réponse:', (endTime - startTime) + 'ms');

      // LOGS DÉTAILLÉS DE LA RÉPONSE
      console.log('📡 [VALIDATE] Statut HTTP:', response.status);
      console.log('📡 [VALIDATE] OK:', response.ok);

      // Lire d'abord le texte brut pour debug
      const responseText = await response.text();
      console.log('📡 [VALIDATE] Réponse brute:', responseText.substring(0, 500));

      // Vérifier si c'est du HTML (erreur)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
        console.error('❌ [VALIDATE] SERVEUR RETOURNE DU HTML - Erreur de route');
        throw new Error('Route API non trouvée - Contactez le support');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ [VALIDATE] JSON parsé avec succès');
      } catch (parseError) {
        console.error('❌ [VALIDATE] ERREUR PARSING JSON');
        throw new Error('Erreur de communication avec le serveur');
      }

      // Vérification du statut HTTP
      if (!response.ok) {
        console.error('❌ [VALIDATE] Erreur HTTP:', response.status);
        throw new Error(data.message || `Erreur serveur ${response.status}`);
      }

      // Traitement de la réponse
      console.log('🎯 [VALIDATE] Réponse API:', {
        success: data.success,
        codeValid: data.codeValid,
        livreurValid: data.livreurValid,
        message: data.message
      });

      if (data.success) {
        console.log('🎉 [VALIDATE] VALIDATION RÉUSSIE');
        Alert.alert(
          '✅ Livraison confirmée',
          data.message || 'La livraison a été marquée comme livrée avec succès.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('🔄 [VALIDATE] Rafraîchissement des données...');
                fetchAllCommandes();
                closeCodeValidation();
                
                if (data.details) {
                  setTimeout(() => {
                    Alert.alert(
                      '💰 Paiements distribués',
                      `Livraison validée avec succès !\n\n` +
                      `🚚 Votre gain: ${data.amounts?.deliveryFee?.toLocaleString() || 0} FCFA\n` +
                      `📦 Distributeur: ${data.amounts?.productAmount?.toLocaleString() || 0} FCFA\n` +
                      `💳 Nouveau solde: ${data.details?.livreur?.newBalance?.toLocaleString() || 0} FCFA`,
                      [{ text: 'Fermer' }]
                    );
                  }, 500);
                }
              }
            }
          ]
        );
      } else {
        console.log('⚠️ [VALIDATE] VALIDATION ÉCHOUÉE:', data.message);
        if (data.codeValid === false) {
          Alert.alert(
            '❌ Code incorrect',
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
            '❌ Non autorisé',
            data.message || 'Vous n\'êtes pas assigné à cette commande.',
            [{ text: 'OK', onPress: closeCodeValidation }]
          );
        } else {
          throw new Error(data.message || 'Erreur de validation');
        }
      }

    } catch (error) {
      console.error('💥 [VALIDATE] ERREUR:', error);
      
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
      console.log('🏁 [VALIDATE] Validation terminée');
      setIsValidating(false);
    }
  };

  // ✅ FONCTION POUR OUVRIR LA VALIDATION PAR CODE
  const openCodeValidation = (commande) => {
    setSelectedCommandeForValidation(commande);
    setValidationCode('');
    setShowCodeValidation(true);
  };

  // ✅ FONCTION POUR FERMER LA VALIDATION PAR CODE
  const closeCodeValidation = () => {
    setShowCodeValidation(false);
    setSelectedCommandeForValidation(null);
    setValidationCode('');
    setIsValidating(false);
  };

  // ✅ NOUVELLE FONCTION : Annuler une commande
  const cancelOrder = useCallback(async (commandeId, reason) => {
    try {
      console.log('🔄 Début annulation commande:', {
        commandeId,
        livreurId,
        reason
      });

      if (!livreurId) {
        throw new Error("ID du livreur non disponible");
      }

      if (!reason || reason.trim() === '') {
        throw new Error("Veuillez fournir un motif d'annulation");
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      console.log('📤 Appel API vers:', `${API_BASE_URL}/orders/${commandeId}/cancel`);
      
      const response = await fetch(`${API_BASE_URL}/orders/${commandeId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          livreurId: livreurId,
          cancellationReason: reason.trim(),
          cancelledBy: 'livreur'
        }),
      });

      console.log('📥 Réponse API - Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', errorText);
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Réponse API - Données:', result);

      if (result.success) {
        setCommandes(prev => 
          prev.map(cmd => 
            cmd.id === commandeId 
              ? { ...cmd, statut: 'annule' }
              : cmd
          )
        );
        
        Alert.alert('Succès', 'Commande annulée avec succès !');
        return result;
      } else {
        throw new Error(result.message || 'Erreur lors de l\'annulation de la commande');
      }
    } catch (error) {
      console.error('❌ Erreur annulation commande:', error);
      throw error;
    }
  }, [livreurId]);

  // ✅ FONCTION POUR GÉRER LE CLIC SUR "MARQUER COMME LIVRÉ" (OUVRE LE MODAL DE CODE)
  const handleMarkAsDelivered = useCallback((commande) => {
    if (!commande) return;

    Alert.alert(
      'Confirmer la livraison',
      `Voulez-vous marquer la commande #${commande.id} comme livrée ?\n\nClient: ${commande.distributorName}\nAdresse: ${commande.address}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider la livraison',
          onPress: () => {
            console.log('🎯 Ouvrir modal validation pour:', commande.id);
            openCodeValidation(commande);
          }
        }
      ]
    );
  }, []);

  // ✅ NOUVELLE FONCTION : Gérer l'annulation de commande
  const handleCancelOrder = useCallback((commande) => {
    if (!commande) return;

    // Ouvrir le modal pour saisir le motif d'annulation
    setSelectedCommande(commande);
    setShowCancellationModal(true);
  }, []);

  // ✅ NOUVELLE FONCTION : Confirmer l'annulation avec le motif
  const confirmCancellation = useCallback(async () => {
    if (!selectedCommande || !cancellationReason.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un motif d\'annulation');
      return;
    }

    try {
      console.log('🎯 Annuler commande:', selectedCommande.id);
      
      await cancelOrder(selectedCommande.id, cancellationReason);
      
      // Fermer les modals
      setShowCancellationModal(false);
      setModalVisible(false);
      setCancellationReason(''); // Réinitialiser le motif
    } catch (error) {
      Alert.alert(
        'Erreur',
        `Impossible d'annuler la commande: ${error.message}`
      );
    }
  }, [selectedCommande, cancellationReason, cancelOrder]);

  // Fonction pour récupérer toutes les commandes
  const fetchAllCommandes = useCallback(async () => {
    try {
      if (!livreurId) {
        console.log('⏳ En attente de l\'ID livreur...');
        return;
      }
      
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error("Token d'authentification manquant.");
      }

      console.log('📡 Récupération des commandes pour livreur ID:', livreurId);

      const response = await fetch(`${API_BASE_URL}/livreur/${livreurId}/deliveries`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la récupération des commandes.");
      }

      const data = await response.json();
      console.log('📦 Commandes reçues:', data.data?.length || 0);

      if (data.success && Array.isArray(data.data)) {
        const formattedCommandes = data.data.map((cmd) => ({
          id: cmd.orderId || cmd._id || `cmd_${Date.now()}_${Math.random()}`,
          date: cmd.createdAt || cmd.assignedAt
            ? new Date(cmd.createdAt || cmd.assignedAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Date inconnue',
          produit: cmd.products?.[0]?.name
            ? `${cmd.products[0].name} (${cmd.products[0].type || 'Standard'})`
            : 'Produit inconnu',
          quantite: cmd.products?.[0]?.quantity || 1,
          total: typeof cmd.total === 'number' ? cmd.total : 0,
          deliveryFee: typeof cmd.deliveryFee === 'number' ? cmd.deliveryFee : 0,
          statut: mapBackendStatusToFrontend(cmd.status),
          priority: cmd.priority || 'normal',
          distributorName: cmd.distributorName || cmd.clientName || 'Distributeur inconnu',
          address: cmd.address || 'Adresse non définie',
          type: cmd.products?.[0]?.type || 'Standard',
          originalOrderId: cmd.orderId || cmd._id,
        }));
        setCommandes(formattedCommandes);
        setFilteredCommandes(formattedCommandes);
        console.log('✅ Commandes formatées:', formattedCommandes);
      } else {
        setCommandes([]);
        setFilteredCommandes([]);
      }
    } catch (error) {
      console.error("Erreur :", error);
      setError(error.message || "Impossible de charger les commandes. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [livreurId, mapBackendStatusToFrontend]);

  // Charger les commandes quand livreurId est disponible
  useEffect(() => {
    if (livreurId) {
      fetchAllCommandes();
    }
  }, [livreurId, fetchAllCommandes]);

  // Filtrer les commandes côté client
  useEffect(() => {
    let results = [...commandes];
    
    if (selectedFilter !== 'all') {
      results = results.filter(cmd => cmd.statut === selectedFilter);
    }
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        cmd =>
          cmd.produit?.toLowerCase().includes(query) ||
          cmd.id?.toLowerCase().includes(query) ||
          cmd.distributorName?.toLowerCase().includes(query) ||
          cmd.type?.toLowerCase().includes(query)
      );
    }
    
    setFilteredCommandes(results);
  }, [searchQuery, selectedFilter, commandes]);

  // Fonctions utilitaires (couleurs, icônes, etc.)
  const getStatutColor = (statut) => {
    switch (statut) {
      case 'livre': return '#2E7D32';
      case 'en_cours': return '#FF8F00';
      case 'annule': return '#E53935';
      case 'confirme': return '#1976D2';
      case 'prepare': return '#FF9800';
      case 'en_attente':
      default: return '#757575';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'livre': return 'checkmark-done-outline';
      case 'en_cours': return 'car-outline';
      case 'annule': return 'close-circle-outline';
      case 'confirme': return 'checkmark-circle-outline';
      case 'prepare': return 'construct-outline';
      case 'en_attente':
      default: return 'time-outline';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#E53935';
      case 'high': return '#FF9800';
      case 'normal':
      default: return '#2E7D32';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return 'warning';
      case 'high': return 'chevron-up';
      case 'normal':
      default: return 'remove';
    }
  };

  // Fonction pour formater le statut
  const formatStatut = (statut) => {
    return (statut || 'en_attente').replace('_', ' ').toUpperCase();
  };

  // ✅ Vérifier si on peut marquer comme livré
  // Peut être en attente (pending) ou en cours (in_progress)
  const canMarkAsDelivered = (statut) => {
    return ['en_attente', 'en_cours'].includes(statut);
  };

  // ✅ NOUVELLE FONCTION : Vérifier si on peut annuler
  // On peut annuler les commandes non-livrées et non-annulées
  const canCancelOrder = (statut) => {
    return ['en_attente', 'en_cours'].includes(statut);
  };

  // Composant HistoryCard
  const HistoryCard = ({ commande }) => (
    <TouchableOpacity
      style={[styles.historyCard, isDarkMode && { backgroundColor: '#2d2d2d', borderColor: '#444' }]}
      onPress={() => {
        setSelectedCommande(commande);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.historyHeader}>
        <Text style={[styles.historyId, isDarkMode && { color: '#fff' }]}>#{commande.id}</Text>
        <View style={[styles.statutBadge, { backgroundColor: `${getStatutColor(commande.statut)}20` }]}>
          <Ionicons
            name={getStatutIcon(commande.statut)}
            size={16}
            color={getStatutColor(commande.statut)}
          />
          <Text style={[styles.statutText, { color: getStatutColor(commande.statut) }]}>
            {formatStatut(commande.statut)}
          </Text>
        </View>
      </View>
      <Text style={styles.historyDate}>{commande.date}</Text>
      <Text style={styles.historyProduit}>{commande.produit}</Text>
      <Text style={styles.historyType}>Type: {commande.type}</Text>
      <Text style={styles.historyQuantite}>Quantité: {commande.quantite}</Text>
      <Text style={styles.historyTotal}>{commande.total.toLocaleString('fr-FR')} FCFA</Text>
      <View style={styles.historyDistributor}>
        <Ionicons name="storefront-outline" size={16} color="#666" />
        <Text style={styles.historyDistributorText}>{commande.distributorName}</Text>
      </View>
      <View style={styles.historyPriority}>
        <Ionicons
          name={getPriorityIcon(commande.priority)}
          size={16}
          color={getPriorityColor(commande.priority)}
        />
        <Text style={[styles.historyPriorityText, { color: getPriorityColor(commande.priority) }]}>
          {commande.priority.toUpperCase()}
        </Text>
      </View>
      
      {/* ✅ Badge "Action requise" pour les commandes en cours */}
      {canMarkAsDelivered(commande.statut) && (
        <View style={styles.actionRequiredBadge}>
          <Ionicons name="alert-circle" size={14} color="#FF8F00" />
          <Text style={styles.actionRequiredText}>À livrer</Text>
        </View>
      )}

      {/* ✅ Badge "Annulable" pour les commandes qu'on peut annuler */}
      {canCancelOrder(commande.statut) && (
        <View style={styles.cancellableBadge}>
          <Ionicons name="close-circle" size={14} color="#E53935" />
          <Text style={styles.cancellableText}>Annulable</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Filtres - Basés sur les NOUVEAUX statuts du backend
  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'en_attente', label: 'En attente' },      // pending - assignée
    { key: 'en_cours', label: 'En cours' },          // in_progress - livreur a commencé
    { key: 'livre', label: 'Livré' },                // completed - validée
    { key: 'annule', label: 'Annulé' },              // cancelled
  ];

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? '#1a1a1a' : '#1565C0'} />
      <LinearGradient colors={isDarkMode ? ['#1a1a1a', '#2d2d2d'] : ['#1565C0', '#1565C0']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des Commandes</Text>
      </LinearGradient>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isDarkMode && { backgroundColor: '#2d2d2d', borderColor: '#444' }]}>
          <Ionicons name="search-outline" size={20} color={isDarkMode ? '#aaa' : '#718096'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDarkMode && { color: '#fff' }]}
            placeholder="Rechercher une commande..."
            placeholderTextColor={isDarkMode ? '#666' : '#A0AEC0'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDarkMode ? '#aaa' : '#718096'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des commandes */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Chargement des commandes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchAllCommandes();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCommandes.length > 0 ? (
        <FlatList
          data={filteredCommandes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard commande={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Ionicons name="document-outline" size={64} color="#718096" />
          <Text style={styles.noResults}>Aucune commande trouvée</Text>
          <Text style={styles.noResultsSubtext}>
            {selectedFilter === 'all'
              ? 'Aucune commande disponible.'
              : `Aucune commande avec le statut "${filters.find(f => f.key === selectedFilter)?.label}".`}
          </Text>
        </View>
      )}

      {/* Modal de détail commande */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCommande && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Détails de la commande</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>ID Commande:</Text>
                    <Text style={styles.modalDetailValue}>#{selectedCommande.id}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date:</Text>
                    <Text style={styles.modalDetailValue}>{selectedCommande.date}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Produit:</Text>
                    <Text style={styles.modalDetailValue}>{selectedCommande.produit}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Quantité:</Text>
                    <Text style={styles.modalDetailValue}>{selectedCommande.quantite}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Total:</Text>
                    <Text style={styles.modalDetailValue}>{selectedCommande.total.toLocaleString('fr-FR')} FCFA</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Statut:</Text>
                    <View style={[styles.statutBadge, { backgroundColor: `${getStatutColor(selectedCommande.statut)}20` }]}>
                      <Ionicons
                        name={getStatutIcon(selectedCommande.statut)}
                        size={16}
                        color={getStatutColor(selectedCommande.statut)}
                      />
                      <Text style={[styles.statutText, { color: getStatutColor(selectedCommande.statut) }]}>
                        {formatStatut(selectedCommande.statut)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Priorité:</Text>
                    <View style={styles.modalPriority}>
                      <Ionicons
                        name={getPriorityIcon(selectedCommande.priority)}
                        size={16}
                        color={getPriorityColor(selectedCommande.priority)}
                      />
                      <Text style={[styles.modalPriorityText, { color: getPriorityColor(selectedCommande.priority) }]}>
                        {selectedCommande.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Client:</Text>
                    <Text style={styles.modalDetailValue}>{selectedCommande.distributorName}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Adresse:</Text>
                    <Text style={styles.modalDetailValue}>{selectedCommande.address}</Text>
                  </View>

                  {/* ✅ Bouton "Marquer comme livré" UNIQUEMENT pour les commandes en cours */}
                  {canMarkAsDelivered(selectedCommande.statut) && (
                    <TouchableOpacity
                      style={styles.deliverButton}
                      onPress={() => handleMarkAsDelivered(selectedCommande)}
                    >
                      <LinearGradient
                        colors={['#FF8F00', '#FFA000']}
                        style={styles.deliverButtonGradient}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.deliverButtonText}>Valider la livraison</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* ✅ Bouton "Annuler la commande" pour les commandes annulables */}
                  {canCancelOrder(selectedCommande.statut) && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelOrder(selectedCommande)}
                    >
                      <LinearGradient
                        colors={['#E53935', '#F44336']}
                        style={styles.cancelButtonGradient}
                      >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>Annuler la commande</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Message d'information pour les autres statuts */}
                  {!canMarkAsDelivered(selectedCommande.statut) && !canCancelOrder(selectedCommande.statut) && (
                    <View style={styles.infoMessage}>
                      <Ionicons name="information-circle" size={20} color="#1565C0" />
                      <Text style={styles.infoMessageText}>
                        {selectedCommande.statut === 'livre' 
                          ? 'Cette commande a déjà été livrée.'
                          : selectedCommande.statut === 'annule'
                          ? 'Cette commande a été annulée.'
                          : 'Aucune action disponible pour cette commande.'}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL DE VALIDATION PAR CODE */}
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
            {selectedCommandeForValidation && (
              <Text style={codeValidationStyles.livraisonInfo}>
                Commande #{selectedCommandeForValidation.id?.substring(0, 8)}
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

      {/* ✅ MODAL : Saisie du motif d'annulation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCancellationModal}
        onRequestClose={() => {
          setShowCancellationModal(false);
          setCancellationReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancellationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Annuler la commande</Text>
              <TouchableOpacity onPress={() => {
                setShowCancellationModal(false);
                setCancellationReason('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.cancellationDescription}>
              Vous êtes sur le point d'annuler la commande #{selectedCommande?.id}. 
              Veuillez indiquer le motif de l'annulation :
            </Text>

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
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setShowCancellationModal(false);
                  setCancellationReason('');
                }}
              >
                <Text style={styles.cancelModalButtonText}>Retour</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmCancelButton,
                  !cancellationReason.trim() && styles.confirmCancelButtonDisabled
                ]}
                onPress={confirmCancellation}
                disabled={!cancellationReason.trim()}
              >
                <Text style={styles.confirmCancelButtonText}>
                  Confirmer l'annulation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <LivreurFooter />
    </View>
  );
};

// ✅ STYLES POUR LA VALIDATION PAR CODE
const codeValidationStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: '#1565C0' 
  },
  closeButton: { padding: 4 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 28 },
  instructionContainer: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20 
  },
  instructionText: { 
    color: '#333', 
    fontSize: 18, 
    textAlign: 'center', 
    marginTop: 20, 
    marginBottom: 8, 
    fontWeight: '600' 
  },
  livraisonInfo: { 
    color: '#1565C0', 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  hintText: { 
    color: '#666', 
    fontSize: 14, 
    textAlign: 'center' 
  },
  inputContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 30 
  },
  inputLabel: { 
    color: '#333', 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 10 
  },
  codeInput: { 
    borderWidth: 2, 
    borderColor: '#1565C0', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 18, 
    textAlign: 'center', 
    fontWeight: 'bold', 
    backgroundColor: '#f8f9fa' 
  },
  actionsContainer: { 
    paddingHorizontal: 20 
  },
  validateButton: { 
    marginBottom: 15 
  },
  validateButtonDisabled: { 
    opacity: 0.6 
  },
  validateButtonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 12 
  },
  validateButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  cancelButton: { 
    padding: 16, 
    alignItems: 'center' 
  },
  cancelButtonText: { 
    color: '#666', 
    fontSize: 16 
  },
  loadingContainer: { 
    alignItems: 'center', 
    padding: 20 
  },
  loadingText: { 
    marginTop: 10, 
    color: '#666', 
    fontSize: 14 
  },
});

// Styles (inchangés)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  filtersContainer: {
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#1565C0',
  },
  filterButtonText: {
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutText: {
    marginLeft: 4,
    fontSize: 12,
  },
  historyDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  historyProduit: {
    fontWeight: '500',
    marginTop: 8,
  },
  historyType: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  historyQuantite: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  historyTotal: {
    fontWeight: 'bold',
    marginTop: 8,
    color: '#1565C0',
  },
  historyDistributor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  historyDistributorText: {
    marginLeft: 4,
    color: '#666',
  },
  historyPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  historyPriorityText: {
    marginLeft: 4,
    fontSize: 12,
  },
  actionRequiredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    position: 'absolute',
    top: 12,
    right: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#E53935',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1565C0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResults: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  noResultsSubtext: {
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalDetailLabel: {
    color: '#666',
  },
  modalDetailValue: {
    fontWeight: '500',
  },
  modalPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPriorityText: {
    marginLeft: 4,
    fontSize: 12,
  },
  deliverButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deliverButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  deliverButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  infoMessageText: {
    color: '#1565C0',
    marginLeft: 8,
    flex: 1,
  },
  cancellationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '60%',
  },
  cancellationDescription: {
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  cancellationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelModalButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmCancelButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#E53935',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmCancelButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HistoryScreen;