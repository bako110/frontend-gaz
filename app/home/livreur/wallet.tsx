import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/service/config';
import LivreurFooter from './LivreurFooter';

const { width } = Dimensions.get('window');

const WalletScreen = () => {
  const router = useRouter();
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [livreurInfo, setLivreurInfo] = useState({
    name: '',
    balance: 0,
    _id: null,
  });
  const [transactionType, setTransactionType] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Récupération de l'ID du livreur et du token
  const getLivreurAuth = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (!userProfile) throw new Error("Profil utilisateur introuvable.");

      const parsedUserProfile = JSON.parse(userProfile);
      const livreurId = parsedUserProfile?.profile?._id;
      if (!livreurId) throw new Error("ID utilisateur manquant.");

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error("Session expirée. Veuillez vous reconnecter.");

      return { livreurId, userToken };
    } catch (error) {
      throw error;
    }
  };

  // Récupération du solde du livreur
  const fetchLivreurBalance = async () => {
    try {
      setIsLoading(true);
      const { userToken } = await getLivreurAuth();
      const livreurData = await AsyncStorage.getItem('userData');
      if (!livreurData) return;
      
      const parsedData = JSON.parse(livreurData);
      const livreurId = parsedData.id;
      const response = await fetch(`${API_BASE_URL}/wallet/${livreurId}/balance`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la récupération du solde.");
      }

      const data = await response.json();
      console.log('Balance API Response:', data); // Debug

      // Gestion robuste du solde - toujours retourner un nombre
      let balanceValue = 0;
      if (data && typeof data === 'object') {
        balanceValue = data.balance?.balance ?? data.balance ?? data.data?.balance ?? 0;
      }

      setLivreurInfo(prev => ({
        ...prev,
        balance: Number(balanceValue) || 0,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération du solde :", error);
      setError(error.message || "Impossible de charger le solde.");
      // Même en cas d'erreur, on garde un solde cohérent
      setLivreurInfo(prev => ({
        ...prev,
        balance: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Récupération des transactions - Version corrigée avec mapping des types
  const fetchWalletTransactions = async () => {
    try {
      const { userToken } = await getLivreurAuth();
      const livreurData = await AsyncStorage.getItem('userData');
      if (!livreurData) return;
      
      const parsedData = JSON.parse(livreurData);
      const livreurId = parsedData.id;
      console.log("LivreurId:", livreurId);

      const response = await fetch(`${API_BASE_URL}/wallet/${livreurId}/transactions`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la récupération des transactions.");
      }

      const data = await response.json();
      console.log("Données reçues:", data);

      let transactionsArray = [];
      
      // Gestion robuste des transactions - toujours retourner un tableau
      if (data && typeof data === 'object') {
        if (data.transactions?.transactions && Array.isArray(data.transactions.transactions)) {
          transactionsArray = data.transactions.transactions;
        } else if (data.transactions && Array.isArray(data.transactions)) {
          transactionsArray = data.transactions;
        } else if (Array.isArray(data)) {
          transactionsArray = data;
        }
      }

      const formattedTransactions = transactionsArray.map((tx, index) => {
        // Mapping des types pour l'affichage
        let displayType = 'transaction';
        let isPositive = true;
        let displayMethod = tx.description || 'Transaction';
        
        // Déterminer le type d'affichage et le signe
        if (tx.type === 'credit') {
          displayType = 'credit';
          isPositive = true;
          displayMethod = 'Gain livraison';
        } else if (tx.type === 'debit') {
          displayType = 'debit';
          isPositive = false;
          displayMethod = 'Retrait';
        } else if (tx.type === 'recharge') {
          displayType = 'recharge';
          isPositive = true;
          displayMethod = 'Recharge';
        } else if (tx.type === 'retrait') {
          displayType = 'retrait';
          isPositive = false;
          displayMethod = 'Retrait';
        }
        
        // Extraire la méthode de paiement de la description si possible
        if (tx.description) {
          if (tx.description.includes('Mobile Money')) displayMethod = 'Mobile Money';
          else if (tx.description.includes('Carte')) displayMethod = 'Carte bancaire';
          else if (tx.description.includes('Espèces')) displayMethod = 'Espèces';
          else if (tx.description.includes('livraison')) displayMethod = 'Livraison';
        }

        return {
          id: tx._id || tx.id || `TX${Date.now()}_${index}`,
          type: displayType, // Type pour l'affichage
          originalType: tx.type || 'unknown', // Type original de l'API
          amount: tx.amount ?? 0,
          date: tx.date ? new Date(tx.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Date inconnue',
          status: tx.status || 'completed',
          method: displayMethod,
          description: tx.description || '',
          isPositive: isPositive, // Pour faciliter l'affichage
          // Garder les données originales pour référence
          originalData: tx
        };
      });
      
      setWalletTransactions(formattedTransactions);
      
      // Mettre à jour le solde depuis les transactions si disponible
      if (data.transactions?.balance !== undefined) {
        setLivreurInfo(prev => ({
          ...prev,
          balance: data.transactions.balance ?? 0
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des transactions :", error);
      setError(error.message || "Impossible de charger l'historique des transactions.");
      // Même en cas d'erreur, on garde un tableau vide cohérent
      setWalletTransactions([]);
    }
  };

  // Chargement des données utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        if (!userProfile) throw new Error("Aucune donnée utilisateur trouvée.");

        const parsedUserProfile = JSON.parse(userProfile);
        const user = parsedUserProfile.profile;
        
        // Valeurs par défaut complètes pour les informations utilisateur
        setLivreurInfo({
          name: user?.name || 'Utilisateur',
          balance: 0, // Initialisé à 0, sera mis à jour par l'API
          _id: user?._id || null,
        });

        // Charger le solde et les transactions après avoir défini l'ID
        await Promise.all([
          fetchLivreurBalance(),
          fetchWalletTransactions()
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur :", error);
        Alert.alert("Erreur", "Impossible de charger vos données. Veuillez vous reconnecter.");
        // Même en cas d'erreur, on initialise avec des valeurs par défaut
        setLivreurInfo({
          name: 'Utilisateur',
          balance: 0,
          _id: null,
        });
        setWalletTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Gestion de la transaction (recharge/retrait)
  const handleTransaction = async () => {
    if (!transactionAmount || isNaN(parseInt(transactionAmount))) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    const amount = parseInt(transactionAmount);
    if (amount <= 0) {
      Alert.alert('Erreur', 'Le montant doit être supérieur à 0.');
      return;
    }

    if (transactionType === 'retrait' && amount > livreurInfo.balance) {
      Alert.alert('Erreur', 'Solde insuffisant pour effectuer ce retrait.');
      return;
    }

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error("Session expirée. Veuillez vous reconnecter.");

      const transactionData = {
        userId: livreurInfo._id,
        type: transactionType,
        amount: amount,
        method: paymentMethod,
      };

      const response = await fetch(`${API_BASE_URL}/wallet/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Recharger le solde et les transactions après une opération
        await fetchLivreurBalance();
        await fetchWalletTransactions();
        
        setTransactionAmount('');
        setTransactionModalVisible(false);
        Alert.alert(
          'Succès',
          `Votre ${transactionType} de ${amount.toLocaleString()} FCFA a été effectué avec succès.`,
        );
      } else {
        Alert.alert('Erreur', data.message || 'Échec de la transaction.');
      }
    } catch (error) {
      console.error("Erreur lors de la transaction :", error);
      Alert.alert('Erreur', error.message || 'Impossible d\'effectuer la transaction. Veuillez réessayer.');
    }
  };

  // Composant TransactionCard
  // Composant TransactionCard corrigé
const TransactionCard = ({ transaction }) => {
  // Déterminer les couleurs et icônes selon le type
  const getTransactionConfig = (type) => {
    switch (type) {
      case 'credit':
      case 'recharge':
        return {
          icon: 'add-circle-outline',
          color: '#2E7D32',
          label: 'Crédit',
          sign: '+'
        };
      case 'debit':
      case 'retrait':
        return {
          icon: 'remove-circle-outline',
          color: '#E53935',
          label: 'Débit',
          sign: '-'
        };
      default:
        return {
          icon: 'swap-horizontal-outline',
          color: '#FF9800',
          label: 'Transaction',
          sign: ''
        };
    }
  };

  const config = getTransactionConfig(transaction.type);

  return (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => {
        setSelectedTransaction(transaction);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.transactionHeader}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: config.color }
        ]}>
          <Ionicons
            name={config.icon}
            size={20}
            color="#fff"
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {config.label}
          </Text>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
          {transaction.description ? (
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {transaction.description}
            </Text>
          ) : null}
        </View>
        <Text style={[
          styles.transactionAmount,
          { color: config.color }
        ]}>
          {config.sign}{transaction.amount.toLocaleString()} FCFA
        </Text>
      </View>
      <View style={styles.transactionFooter}>
        <View style={styles.transactionStatus}>
          <Text style={[
            styles.transactionStatusText,
            { color: transaction.status === 'completed' ? '#2E7D32' : '#FF9800' }
          ]}>
            {transaction.status === 'completed' ? 'Terminé' : 'En attente'}
          </Text>
        </View>
        <Text style={styles.transactionMethod}>{transaction.method}</Text>
      </View>
    </TouchableOpacity>
  );
};

  // Méthodes de paiement
  const paymentMethods = [
    { key: 'mobile_money', label: 'Mobile Money', icon: 'phone-portrait-outline' },
    { key: 'cash', label: 'Espèces', icon: 'cash-outline' },
    { key: 'card', label: 'Carte bancaire', icon: 'card-outline' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <LinearGradient colors={['#1565C0', '#1565C0']} style={styles.header}>
        <Text style={styles.headerTitle}>Mon Wallet</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Solde actuel */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde actuel</Text>
          <Text style={styles.balanceAmount}>
            {livreurInfo.balance.toLocaleString()} FCFA
          </Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={[styles.balanceActionButton, styles.rechargeButton]}
              onPress={() => {
                setTransactionType('recharge');
                setTransactionModalVisible(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.balanceActionButtonText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.balanceActionButton, styles.withdrawButton]}
              onPress={() => {
                setTransactionType('retrait');
                setTransactionModalVisible(true);
              }}
            >
              <Ionicons name="remove-circle-outline" size={20} color="#fff" />
              <Text style={styles.balanceActionButtonText}>Retirer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Historique des transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Historique des transactions</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>Chargement des transactions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                fetchLivreurBalance();
                fetchWalletTransactions();
              }}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : walletTransactions.length > 0 ? (
          <FlatList
            data={walletTransactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionCard transaction={item} />}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.noTransactionsContainer}>
            <Ionicons name="document-outline" size={64} color="#718096" />
            <Text style={styles.noTransactions}>Aucune transaction</Text>
            <Text style={styles.noTransactionsSubtext}>
              Vos transactions apparaîtront ici après une recharge ou un retrait.
            </Text>
          </View>
        )}
      </View>

      {/* Modal de transaction */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={transactionModalVisible}
        onRequestClose={() => setTransactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {transactionType === 'recharge' ? 'Recharger le Wallet' : 'Retirer du Wallet'}
              </Text>
              <TouchableOpacity onPress={() => setTransactionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Montant</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0 FCFA"
              value={transactionAmount}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setTransactionAmount(numericValue);
              }}
              keyboardType="numeric"
            />
            <Text style={styles.modalLabel}>Méthode de paiement</Text>
            <View style={styles.paymentMethodsContainer}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method.key && styles.paymentMethodButtonSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.key)}
                >
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color={paymentMethod === method.key ? '#fff' : '#2E7D32'}
                  />
                  <Text
                    style={[
                      styles.paymentMethodButtonText,
                      paymentMethod === method.key && styles.paymentMethodButtonTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setTransactionAmount('');
                  setTransactionModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleTransaction}
              >
                <LinearGradient
                  colors={transactionType === 'recharge' ? ['#2E7D32', '#388E3C'] : ['#E53935', '#D32F2F']}
                  style={styles.modalConfirmButtonGradient}
                >
                  <Text style={styles.modalConfirmButtonText}>Confirmer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de détail de transaction */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTransaction && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Détails de la transaction</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>ID Transaction:</Text>
                  <Text style={styles.modalDetailValue}>#{selectedTransaction.id}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Type:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedTransaction.type === 'recharge' ? 'Recharge' : 'Retrait'}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Montant:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedTransaction.amount.toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Date:</Text>
                  <Text style={styles.modalDetailValue}>{selectedTransaction.date}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Statut:</Text>
                  <Text style={[
                    styles.modalDetailValue,
                    { color: selectedTransaction.status === 'completed' ? '#2E7D32' : '#FF9800' }
                  ]}>
                    {selectedTransaction.status === 'completed' ? 'Terminé' : 'En attente'}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Méthode:</Text>
                  <Text style={styles.modalDetailValue}>{selectedTransaction.method}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <LivreurFooter />
    </View>
  );
};


const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 100,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  balanceContainer: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
  },
  rechargeButton: {
    backgroundColor: '#1565C0',
  },
  withdrawButton: {
    backgroundColor: '#E53935',
  },
  balanceActionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#718096',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionMethod: {
    fontSize: 12,
    color: '#718096',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#E53935',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1565C0',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
  },
  noTransactionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noTransactions: {
    fontSize: 16,
    color: '#718096',
    marginTop: 10,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
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
    color: '#333',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 4,
  },
  paymentMethodButtonSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  paymentMethodButtonText: {
    marginLeft: 8,
    color: '#1565C0',
  },
  paymentMethodButtonTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 5,
    overflow: 'hidden',
    marginLeft: 8,
  },
  modalConfirmButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 16,
  },
};

export default WalletScreen;
