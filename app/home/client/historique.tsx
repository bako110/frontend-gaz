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
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { API_BASE_URL } from '@/service/config';
import ClientFooter from './ClientFooter';
import { generateOrderId, generateOrderNumber } from '@/utils/orderUtils';
import RatingModal from '@/components/client/RatingModal';
import { ratingStyles } from '@/styles/historiqueStyles';

const { width, height } = Dimensions.get('window');

// CORRIGÉ: Mapping complet des statuts du backend
const ORDER_STATUS = {
  PENDING: 'pending',          // En attente
  CONFIRMED: 'confirmed',      // Confirmé
  IN_DELIVERY: 'in_delivery',  // En livraison
  DELIVERED: 'delivered',      // Livré
  CANCELLED: 'cancelled',      // Annulé
};

// Pour la compatibilité avec l'ancien code
const OLD_TO_NEW_STATUS = {
  'en_attente': 'pending',
  'confirme': 'confirmed',
  'en_livraison': 'in_delivery',
  'livre': 'delivered',
  'annule': 'cancelled',
};

const STATUS_DISPLAY = {
  'pending': 'EN ATTENTE',
  'confirmed': 'CONFIRMÉ',
  'in_delivery': 'EN LIVRAISON',
  'delivered': 'LIVRÉ',
  'cancelled': 'ANNULÉ',
};

const STATUS_COLORS = {
  'pending': '#757575',
  'confirmed': '#FF9800',
  'in_delivery': '#2E7D32',
  'delivered': '#4CAF50',
  'cancelled': '#E53935',
};

const STATUS_ICONS = {
  'pending': 'time-outline',
  'confirmed': 'checkmark-circle-outline',
  'in_delivery': 'car-outline',
  'delivered': 'checkmark-done-outline',
  'cancelled': 'close-circle-outline',
};

export default function HistoriqueScreen() {
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [clientInfo, setClientInfo] = useState({ _id: null, name: '', email: '', phone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [validationCode, setValidationCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  
  // États pour la recherche et filtrage
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour la notation
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedDeliveryForRating, setSelectedDeliveryForRating] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    filterCommandes();
  }, [historiqueCommandes, searchQuery, filterStatus]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      
      const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr);
      const user = userProfileStr ? parsedData.user : parsedData;

      const userId = parsedData?.profile?._id || user?._id;
      const userName = parsedData?.profile?.name || user?.name || '';
      const userEmail = parsedData?.profile?.email || user?.email || '';
      const userPhone = parsedData?.profile?.phone || user?.phone || '';
      
      setClientInfo({
        _id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
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
          
          // CORRIGÉ: Formater correctement les commandes
          const formattedOrders = sortedOrders.map((order) => {
            // Normaliser le statut (gérer à la fois ancien et nouveau format)
            let normalizedStatus = ORDER_STATUS.PENDING;
            if (order.status) {
              normalizedStatus = OLD_TO_NEW_STATUS[order.status] || order.status;
            }
            
            // S'assurer que le statut est valide
            if (!Object.values(ORDER_STATUS).includes(normalizedStatus)) {
              console.warn(`Statut inconnu: ${order.status}, normalisé en: pending`);
              normalizedStatus = ORDER_STATUS.PENDING;
            }

            const product = order.products && order.products.length > 0 ? order.products[0] : null;
            
            return {
              id: order._id,
              orderId: generateOrderId(order._id),
              orderNumber: generateOrderNumber(order._id),
              date: order.orderTime ? new Date(order.orderTime).toLocaleString('fr-FR') : 'Date inconnue',
              produit: product 
                ? `${product.name} (${product.fuelType || 'Standard'})`
                : 'Produit inconnu',
              quantite: product ? product.quantity : 1,
              total: order.total || 0,
              statut: normalizedStatus, // Utiliser le statut normalisé
              priority: order.priority,
              distributorName: order.distributorId?.user?.name || order.distributorName || 'Distributeur inconnu',
              address: order.address || 'Adresse non définie',
              type: product ? product.fuelType : 'Standard',
              validationCode: order.validationCode || order.orderCode,
              isDelivery: order.isDelivery || false,
              distributorId: order.distributorId?._id || order.distributorId,
              clientPhone: order.clientPhone || '',
              clientName: order.clientName || '',
              products: order.products || [],
              originalStatus: order.status, // Garder le statut original pour debug
            };
          });
          
          console.log('Commandes formatées:', formattedOrders.map(c => ({ 
            id: c.id, 
            statut: c.statut,
            produit: c.produit 
          })));
          
          setHistoriqueCommandes(formattedOrders);
          setFilteredCommandes(formattedOrders);
        } else {
          setHistoriqueCommandes([]);
          setFilteredCommandes([]);
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
      setFilteredCommandes([]);
    }
  };

  const filterCommandes = () => {
    console.log('Filtrage - Statut sélectionné:', filterStatus);
    console.log('Filtrage - Nombre total de commandes:', historiqueCommandes.length);
    
    let filtered = [...historiqueCommandes];
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((commande) => {
        const matches = (
          (commande.orderId && commande.orderId.toLowerCase().includes(query)) ||
          (commande.orderNumber && commande.orderNumber.toLowerCase().includes(query)) ||
          (commande.produit && commande.produit.toLowerCase().includes(query)) ||
          (commande.distributorName && commande.distributorName.toLowerCase().includes(query)) ||
          (commande.clientName && commande.clientName.toLowerCase().includes(query)) ||
          (commande.clientPhone && commande.clientPhone.toLowerCase().includes(query)) ||
          (commande.statut && getStatutText(commande.statut).toLowerCase().includes(query))
        );
        return matches;
      });
    }
    
    // CORRIGÉ: Filtrer par statut
    if (filterStatus !== 'all') {
      console.log('Filtrage par statut:', filterStatus);
      filtered = filtered.filter((commande) => {
        console.log(`Commande ${commande.id}: statut=${commande.statut}, matches=${commande.statut === filterStatus}`);
        return commande.statut === filterStatus;
      });
    }
    
    console.log('Filtrage - Résultats:', filtered.length);
    setFilteredCommandes(filtered);
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
        
        // Vérifier si la commande est livrée ou annulée
        const selectedCommande = historiqueCommandes.find(cmd => cmd.id === orderId);
        
        if (selectedCommande && 
            (selectedCommande.statut === ORDER_STATUS.DELIVERED || 
             selectedCommande.statut === ORDER_STATUS.CANCELLED)) {
          setValidationCode(null);
          return;
        }
        
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
    
    // Ne pas charger le code pour les commandes livrées ou annulées
    if (commande.statut === ORDER_STATUS.DELIVERED || commande.statut === ORDER_STATUS.CANCELLED) {
      return;
    }
    
    await fetchValidationCode(commande.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (clientInfo._id) {
      await fetchHistorique(clientInfo._id);
    }
    setRefreshing(false);
  };

  // Fonction pour générer et imprimer un PDF
  const generateAndPrintPDF = async (commande) => {
    try {
      Alert.alert(
        'Génération PDF',
        'Voulez-vous générer un PDF pour cette commande ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Générer PDF', 
            onPress: async () => {
              try {
                // Générer le contenu HTML pour le PDF
                const htmlContent = generatePDFHTML(commande);
                
                // Générer le PDF
                const { uri } = await Print.printToFileAsync({
                  html: htmlContent,
                  base64: false,
                });
                
                // Partager/ouvrir le PDF
                await shareAsync(uri, {
                  UTI: '.pdf',
                  mimeType: 'application/pdf',
                });
                
                Alert.alert('Succès', 'PDF généré avec succès !');
              } catch (error) {
                console.error('Erreur génération PDF:', error);
                Alert.alert('Erreur', 'Impossible de générer le PDF');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur impression PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'imprimer la commande');
    }
  };

  // Fonction pour générer le HTML du PDF
  const generatePDFHTML = (commande) => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const currentTime = new Date().toLocaleTimeString('fr-FR');
    
    const productsHTML = commande.products && Array.isArray(commande.products) 
      ? commande.products.map(product => `
        <tr>
          <td>${product.name || 'Produit'}</td>
          <td>${product.type || 'Standard'}</td>
          <td>${product.quantity || 1}</td>
          <td>${(product.price || 0).toLocaleString()} FCFA</td>
          <td>${(product.total || 0).toLocaleString()} FCFA</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td>${commande.produit}</td>
          <td>${commande.type || 'Standard'}</td>
          <td>${commande.quantite}</td>
          <td>${(commande.total / commande.quantite).toLocaleString()} FCFA</td>
          <td>${commande.total.toLocaleString()} FCFA</td>
        </tr>
      `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2E7D32;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2E7D32;
            margin: 0;
            font-size: 24px;
          }
          .header h2 {
            color: #666;
            margin: 5px 0;
            font-size: 18px;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-card {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2E7D32;
          }
          .info-card h3 {
            margin: 0 0 10px 0;
            color: #2E7D32;
            font-size: 16px;
          }
          .info-card p {
            margin: 5px 0;
            font-size: 14px;
          }
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .products-table th {
            background: #2E7D32;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          .products-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .products-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total-section {
            text-align: right;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #2E7D32;
          }
          .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #2E7D32;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .delivered { background: #4CAF50; color: white; }
          .cancelled { background: #E53935; color: white; }
          .delivery { background: #2E7D32; color: white; }
          .confirmed { background: #FF9800; color: white; }
          .pending { background: #757575; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reçu de Commande</h1>
          <h2>${commande.orderId}</h2>
          <p>Date d'émission: ${currentDate} à ${currentTime}</p>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-card">
              <h3>Informations Client</h3>
              <p><strong>Nom:</strong> ${clientInfo.name || 'Non spécifié'}</p>
              <p><strong>Téléphone:</strong> ${clientInfo.phone || 'Non spécifié'}</p>
              <p><strong>Email:</strong> ${clientInfo.email || 'Non spécifié'}</p>
            </div>
            <div class="info-card">
              <h3>Informations Commande</h3>
              <p><strong>Date commande:</strong> ${commande.date}</p>
              <p><strong>Statut:</strong> 
                <span class="status-badge ${commande.statut}">
                  ${getStatutText(commande.statut)}
                </span>
              </p>
              <p><strong>Type:</strong> ${commande.isDelivery ? 'Livraison' : 'Retrait sur place'}</p>
            </div>
          </div>
          
          <div class="info-card">
            <h3>Informations Distributeur</h3>
            <p><strong>Distributeur:</strong> ${commande.distributorName}</p>
            <p><strong>Adresse:</strong> ${commande.address}</p>
          </div>
        </div>

        <h3>Détails des Produits</h3>
        <table class="products-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Prix Unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <h3>Total Général: <span class="total-amount">${commande.total.toLocaleString()} FCFA</span></h3>
          <p>TVA incluse</p>
        </div>

        <div class="footer">
          <p>Merci pour votre confiance !</p>
          <p>Ce document a été généré automatiquement le ${currentDate} à ${currentTime}</p>
          <p>Pour toute question, contactez le service client</p>
        </div>
      </body>
      </html>
    `;
  };

  // CORRIGÉ: Fonctions de statut utilisant les constantes
  const getStatutColor = (statut) => {
    return STATUS_COLORS[statut] || '#757575';
  };

  const getStatutIcon = (statut) => {
    return STATUS_ICONS[statut] || 'time-outline';
  };

  const getStatutText = (statut) => {
    return STATUS_DISPLAY[statut] || 'EN ATTENTE';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'all': return 'Tout';
      case ORDER_STATUS.PENDING: return 'En attente';
      case ORDER_STATUS.CONFIRMED: return 'Confirmé';
      case ORDER_STATUS.IN_DELIVERY: return 'En livraison';
      case ORDER_STATUS.DELIVERED: return 'Livré';
      case ORDER_STATUS.CANCELLED: return 'Annulé';
      default: return status;
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
          {/* Cacher le badge QR pour les commandes livrées/annulées */}
          {commande.validationCode && 
           commande.statut !== ORDER_STATUS.DELIVERED && 
           commande.statut !== ORDER_STATUS.CANCELLED && (
            <View style={styles.qrBadge}>
              <Ionicons name="key-outline" size={12} color="#2E7D32" />
              <Text style={styles.qrBadgeText}>QR</Text>
            </View>
          )}
          {/* Bouton impression PDF */}
          <TouchableOpacity 
            style={styles.printButton}
            onPress={(e) => {
              e.stopPropagation();
              generateAndPrintPDF(commande);
            }}
          >
            <Ionicons name="print-outline" size={16} color="#2E7D32" />
          </TouchableOpacity>
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
                  
                  {/* Bouton impression PDF dans le modal */}
                  <TouchableOpacity 
                    style={styles.pdfButton}
                    onPress={() => {
                      setModalVisible(false);
                      generateAndPrintPDF(selectedCommande);
                    }}
                  >
                    <LinearGradient
                      colors={['#2196F3', '#1976D2']}
                      style={styles.pdfButtonGradient}
                    >
                      <Ionicons name="document-text-outline" size={20} color="#fff" />
                      <Text style={styles.pdfButtonText}>Générer PDF</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Section code de validation - CACHÉE pour les commandes livrées/annulées */}
            {selectedCommande && 
             selectedCommande.statut !== ORDER_STATUS.DELIVERED && 
             selectedCommande.statut !== ORDER_STATUS.CANCELLED && (
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
            )}

            {/* Bouton de notation pour les commandes livrées */}
            {selectedCommande && 
             selectedCommande.statut === ORDER_STATUS.DELIVERED && 
             selectedCommande.livreurId && (
              <View style={ratingStyles.ratingSection}>
                <View style={ratingStyles.ratingSectionHeader}>
                  <Ionicons name="star" size={24} color="#FFA000" />
                  <Text style={ratingStyles.ratingSectionTitle}>Évaluer la livraison</Text>
                </View>
                <Text style={ratingStyles.ratingSectionDescription}>
                  Votre avis nous aide à améliorer notre service
                </Text>
                <TouchableOpacity
                  style={ratingStyles.rateButton}
                  onPress={() => {
                    setSelectedDeliveryForRating(selectedCommande);
                    setShowRatingModal(true);
                  }}
                >
                  <Ionicons name="star-outline" size={20} color="#fff" />
                  <Text style={ratingStyles.rateButtonText}>Noter le livreur</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section instructions - CACHÉE pour les commandes livrées/annulées */}
            {selectedCommande && 
             selectedCommande.statut !== ORDER_STATUS.DELIVERED && 
             selectedCommande.statut !== ORDER_STATUS.CANCELLED && (
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
            )}
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

  const renderHeader = () => (
    <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des Commandes</Text>
        <TouchableOpacity 
          style={styles.filterToggleButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "filter" : "filter-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par ID, produit, distributeur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filtres (conditionnel) */}
      {showFilters && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {[
            { key: 'all', label: 'Tout' },
            { key: ORDER_STATUS.PENDING, label: 'En attente' },
            { key: ORDER_STATUS.CONFIRMED, label: 'Confirmé' },
            { key: ORDER_STATUS.IN_DELIVERY, label: 'En livraison' },
            { key: ORDER_STATUS.DELIVERED, label: 'Livré' },
            { key: ORDER_STATUS.CANCELLED, label: 'Annulé' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                filterStatus === filter.key && styles.filterChipActive
              ]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </LinearGradient>
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
      
      {renderHeader()}

      <FlatList
        data={filteredCommandes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryCard commande={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <Text style={styles.resultsCount}>
              {filteredCommandes.length} commande{filteredCommandes.length !== 1 ? 's' : ''} trouvée{filteredCommandes.length !== 1 ? 's' : ''}
              {filterStatus !== 'all' && ` • ${getStatusLabel(filterStatus)}`}
              {searchQuery.trim() && ` • "${searchQuery}"`}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={searchQuery.trim() || filterStatus !== 'all' ? "search-outline" : "document-text-outline"} 
              size={80} 
              color="#CBD5E0" 
            />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() 
                ? `Aucune commande trouvée pour "${searchQuery}"`
                : filterStatus !== 'all'
                ? `Aucune commande ${getStatusLabel(filterStatus).toLowerCase()}`
                : 'Aucune commande'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim() || filterStatus !== 'all'
                ? 'Essayez avec d\'autres termes ou réinitialisez les filtres'
                : 'Vos commandes apparaîtront ici une fois passées'
              }
            </Text>
            {(searchQuery.trim() || filterStatus !== 'all') && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
      />

      <ValidationCodeModal />
      
      {/* Modal de notation */}
      {selectedDeliveryForRating && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedDeliveryForRating(null);
          }}
          livreurId={selectedDeliveryForRating.livreurId}
          deliveryId={selectedDeliveryForRating.id}
          livreurName={selectedDeliveryForRating.livreurName || 'Livreur'}
          userId={clientInfo._id}
          userName={clientInfo.name}
          userType="client"
          onRatingSubmitted={() => {
            onRefresh();
          }}
        />
      )}
      
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterToggleButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 2,
  },
  clearButton: {
    padding: 5,
    marginLeft: 10,
  },
  filterScroll: {
    marginBottom: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#2E7D32',
  },
  listHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  resultsCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  printButton: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#2E7D32',
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
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  pdfButton: {
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pdfButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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