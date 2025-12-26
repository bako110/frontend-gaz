import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateOrderId } from '@/utils/orderUtils';
import { API_BASE_URL } from '@/service/config';
import DistributorFooter from './DistributorFooter';

const { width, height } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [distributorInfo, setDistributorInfo] = useState({ 
    balance: 0, 
    name: '', 
    phone: '', 
    id: '' 
  });
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadDistributorData = async () => {
    try {
      const distributorData = await AsyncStorage.getItem('userData');
      if (distributorData) {
        const parsedData = JSON.parse(distributorData);
        setDistributorInfo({
          name: parsedData.name || '',
          balance: parsedData.balance ?? 0,
          phone: parsedData.phone || '',
          id: parsedData.id || '',
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  useEffect(() => {
    loadDistributorData();
    loadsBalance();
    loadTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDistributorData(),
      loadsBalance(),
      loadTransactions()
    ]);
    setRefreshing(false);
  };

  const handleTopUp = () => setWalletModalVisible(true);
  const handleWithdraw = () => {
    if ((distributorInfo.balance ?? 0) <= 0) {
      return Alert.alert("Information", "Votre solde est insuffisant pour effectuer un retrait.");
    }
    setWithdrawModalVisible(true);
  };

  const loadsBalance = async () => {
    try {
      const distributorData = await AsyncStorage.getItem('userData');
      if (!distributorData) return;
      const parsedData = JSON.parse(distributorData);
      const distributorId = parsedData.id;
      const response = await fetch(`${API_BASE_URL}/wallet/${distributorId}/balance`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du solde');
      const data = await response.json();
      
      // Gestion robuste du solde - toujours retourner un nombre
      let balanceValue = 0;
      if (data && typeof data === 'object') {
        balanceValue = data.balance?.balance ?? data.balance ?? data.data?.balance ?? 0;
      }
      
      setDistributorInfo(prev => ({ 
        ...prev, 
        balance: Number(balanceValue) || 0 
      }));
    } catch (error) {
      console.error('Erreur loadBalance:', error);
      Alert.alert('Erreur', 'Impossible de récupérer le solde.');
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const distributorData = await AsyncStorage.getItem('userData');
      if (!distributorData) return;
      const parsedData = JSON.parse(distributorData);
      const distributorId = parsedData.id;
      if (!distributorId) throw new Error('ID distributeur non trouvé');
      
      const response = await fetch(`${API_BASE_URL}/wallet/${distributorId}/transactions`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des transactions');
      
      const data = await response.json();
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

      // S'assurer que chaque transaction a des valeurs par défaut
      transactionsArray = transactionsArray.map(transaction => ({
        type: transaction.type || 'unknown',
        transactionType: transaction.transactionType || transaction.type || 'unknown',
        amount: transaction.amount ?? 0,
        description: transaction.description || transaction.motif || 'Transaction',
        date: transaction.date || transaction.createdAt || new Date().toISOString(),
        status: transaction.status || 'completed',
        relatedOrder: transaction.relatedOrder || null,
        _id: transaction._id || transaction.id || `txn-${Date.now()}-${Math.random()}`,
        ...transaction
      }));

      setTransactions(transactionsArray);
    } catch (error) {
      console.error('Erreur loadTransactions:', error);
      // Même en cas d'erreur, on garde un tableau vide cohérent
      setTransactions([]);
      Alert.alert('Erreur', 'Impossible de charger les transactions.');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const confirmTopUp = async () => {
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      return Alert.alert("Erreur", "Veuillez entrer un montant valide.");
    }
    setProcessing(true);
    try {
      const topUpAmount = parseInt(amount);
      const response = await fetch(`${API_BASE_URL}/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId: distributorInfo.id, amount: topUpAmount })
      });
      if (!response.ok) throw new Error('Erreur lors de la recharge');
      const newBalance = (distributorInfo.balance ?? 0) + topUpAmount;
      setDistributorInfo(prev => ({ ...prev, balance: newBalance }));
      await loadTransactions();
      setAmount('');
      setWalletModalVisible(false);
      Alert.alert("Succès", `Votre portefeuille a été rechargé de ${topUpAmount.toLocaleString()} FCFA.`);
    } catch (error) {
      console.error('Erreur recharge:', error);
      Alert.alert('Erreur', 'Problème lors de la recharge. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmWithdraw = async () => {
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      return Alert.alert("Erreur", "Veuillez entrer un montant valide.");
    }
    const withdrawAmount = parseInt(amount);
    if (withdrawAmount > (distributorInfo.balance ?? 0)) {
      return Alert.alert("Erreur", "Solde insuffisant.");
    }
    setProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId: distributorInfo.id, amount: withdrawAmount })
      });
      if (!response.ok) throw new Error('Erreur lors du retrait');
      const newBalance = (distributorInfo.balance ?? 0) - withdrawAmount;
      setDistributorInfo(prev => ({ ...prev, balance: newBalance }));
      await loadTransactions();
      setAmount('');
      setWithdrawModalVisible(false);
      Alert.alert("Succès", `Retrait de ${withdrawAmount.toLocaleString()} FCFA effectué.`);
    } catch (error) {
      console.error('Erreur retrait:', error);
      Alert.alert('Erreur', 'Problème lors du retrait. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const formatBalance = (balance) => {
    const bal = balance ?? 0;
    return `${bal.toLocaleString()} FCFA`;
  };

  // Fonction pour transformer les IDs MongoDB dans une description
  const formatDescriptionWithOrderId = (description) => {
    if (!description) return "Aucune description";
    // Regex pour détecter les IDs MongoDB (24 caractères hexadécimaux)
    const mongoIdRegex = /([a-f0-9]{24})/gi;
    return description.replace(mongoIdRegex, (match) => generateOrderId(match));
  };

  const formatTransactionDetails = (transaction) => {
    if (!transaction) return [];
    
    return [
      { 
        label: "Type", 
        value: transaction.type || transaction.transactionType || "Inconnu" 
      },
      { 
        label: "Montant", 
        value: `${(transaction.amount ?? 0).toLocaleString()} FCFA` 
      },
      { 
        label: "Description", 
        value: formatDescriptionWithOrderId(transaction.description || transaction.motif) 
      },
      { 
        label: "Date", 
        value: formatDate(transaction.date || transaction.createdAt) 
      },
      { 
        label: "Statut", 
        value: transaction.status || "Non spécifié" 
      },
      ...(transaction.relatedOrder ? [{ 
        label: "Commande", 
        value: generateOrderId(transaction.relatedOrder) 
      }] : []),
    ];
  };

  const filteredTransactions = showAllTransactions
    ? transactions
    : transactions.filter(transaction =>
        transaction.type === 'debit' ||
        transaction.transactionType === 'debit' ||
        transaction.type === 'vente'
      );

  const TransactionItem = ({ transaction }) => {
    const isCredit = transaction.type === 'credit' ||
                     transaction.transactionType === 'credit' ||
                     transaction.type === 'vente';
    const iconName = isCredit ? 'add-circle' : 'remove-circle';
    const color = isCredit ? '#2E7D32' : '#FF5722';

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => {
          setSelectedTransaction(transaction);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.transactionIcon}>
          <Ionicons name={iconName} size={24} color={color} />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>
            {formatDescriptionWithOrderId(transaction.description || transaction.motif)}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.date || transaction.createdAt)}
          </Text>
          {transaction.relatedOrder && (
            <Text style={styles.transactionOrderId}>
              {generateOrderId(transaction.relatedOrder)}
            </Text>
          )}
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color }]}>
            {isCredit ? '+' : '-'}
            {(transaction.amount ?? 0).toLocaleString()} FCFA
          </Text>
          {transaction.status && (
            <Text style={styles.transactionStatus}>
              {transaction.status}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.replace('/home/distributeurScreen')}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon Portefeuille</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Ionicons name={showBalance ? 'eye-off' : 'eye'} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2E7D32']}
              tintColor="#2E7D32"
            />
          }
        >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceAmount}>
            {showBalance ? formatBalance(distributorInfo.balance) : '••••••'}
          </Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTopUp}>
              <Ionicons name="add-circle-outline" size={20} color="#2E7D32" />
              <Text style={styles.actionButtonText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (distributorInfo.balance ?? 0) <= 0 && styles.disabledActionButton
              ]}
              onPress={handleWithdraw}
              disabled={(distributorInfo.balance ?? 0) <= 0}
            >
              <Ionicons 
                name="remove-circle-outline" 
                size={20} 
                color={(distributorInfo.balance ?? 0) <= 0 ? "#ccc" : "#FF5722"} 
              />
              <Text style={[
                styles.actionButtonText,
                (distributorInfo.balance ?? 0) <= 0 && { color: "#ccc" }
              ]}>
                Retirer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowAllTransactions(!showAllTransactions)}
            >
              <Text style={styles.filterButtonText}>
                {showAllTransactions ? 'Voir ventes seulement' : 'Voir toutes'}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingTransactions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Chargement des transactions...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {showAllTransactions
                  ? 'Aucune transaction'
                  : 'Aucune vente effectuée'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={({ item }) => <TransactionItem transaction={item} />}
              keyExtractor={(item, index) =>
                item._id || item.transactionId || item.id || `txn-${index}`
              }
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal pour les détails de transaction */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la transaction</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedTransaction && (
              <>
                {formatTransactionDetails(selectedTransaction).map((detail, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{detail.label}:</Text>
                    <Text style={styles.detailValue}>{detail.value}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal pour la recharge */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={walletModalVisible}
        onRequestClose={() => !processing && setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recharger le portefeuille</Text>
              <TouchableOpacity
                onPress={() => !processing && setWalletModalVisible(false)}
                disabled={processing}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le montant"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!processing}
            />
            <TouchableOpacity
              style={[styles.confirmButton, processing && styles.disabledButton]}
              onPress={confirmTopUp}
              disabled={processing}
            >
              <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.gradientButton}>
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer la recharge</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal pour le retrait */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={withdrawModalVisible}
        onRequestClose={() => !processing && setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Retirer du portefeuille</Text>
              <TouchableOpacity
                onPress={() => !processing && setWithdrawModalVisible(false)}
                disabled={processing}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le montant"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!processing}
            />
            <Text style={styles.balanceInfo}>
              Solde disponible: {formatBalance(distributorInfo.balance)}
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, processing && styles.disabledButton]}
              onPress={confirmWithdraw}
              disabled={processing}
            >
              <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.gradientButton}>
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer le retrait</Text>
                )}
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

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  disabledActionButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionOrderId: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionStatus: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 15,
  },
  balanceInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradientButton: {
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
};