import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Clipboard,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import styles from '@/styles/WalletClientScreen';
import { API_BASE_URL } from '@/service/config';
import ClientFooter from './ClientFooter';

const paymentMethods = [
  { id: 'orange', name: 'Orange Money', color: '#F7931A', ussd: '*144*2*1*57443692*{amount}#' },
  { id: 'moov', name: 'Moov Money', color: '#005BBB', ussd: '*555*4*1*57443692*{amount}#' },
  { id: 'wave', name: 'Wave', color: '#0099FF', ussd: 'via application Wave' },
];

export default function WalletScreen() {
  const [clientInfo, setClientInfo] = useState({
    credit: 0,
    _id: null,
    name: '',
  });
  const [isBalanceHidden, setIsBalanceHidden] = useState(true); // TRUE = masqué, FALSE = visible
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionDetailModalVisible, setTransactionDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionStep, setTransactionStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [ussdCode, setUssdCode] = useState('');
  const [transactionType, setTransactionType] = useState('recharge');
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();

  useEffect(() => {
    loadUserData();
    fetchWalletTransactions();
    loadBalanceVisibilityPreference();
  }, []);

  // Charger la préférence de visibilité du solde
  const loadBalanceVisibilityPreference = async () => {
    try {
      const hideBalance = await AsyncStorage.getItem('hideBalance');
      console.log('Valeur chargée depuis AsyncStorage:', hideBalance);
      
      if (hideBalance !== null) {
        // Si 'true' dans AsyncStorage = solde masqué, donc isBalanceHidden = true
        // Si 'false' dans AsyncStorage = solde visible, donc isBalanceHidden = false
        setIsBalanceHidden(JSON.parse(hideBalance));
      } else {
        // Par défaut, masquer le solde
        await AsyncStorage.setItem('hideBalance', 'true');
        setIsBalanceHidden(true);
      }
    } catch (error) {
      console.error("Erreur chargement préférence solde:", error);
      setIsBalanceHidden(true); // Masqué par défaut en cas d'erreur
    }
  };

  // Sauvegarder la préférence de visibilité du solde
  const saveBalanceVisibilityPreference = async (hideBalance) => {
    try {
      await AsyncStorage.setItem('hideBalance', JSON.stringify(hideBalance));
      console.log('Valeur sauvegardée dans AsyncStorage:', hideBalance);
    } catch (error) {
      console.error("Erreur sauvegarde préférence solde:", error);
    }
  };

  const toggleBalanceVisibility = async () => {
    const newHiddenState = !isBalanceHidden;
    console.log('Changement visibilité - ancien:', isBalanceHidden, 'nouveau:', newHiddenState);
    
    setIsBalanceHidden(newHiddenState);
    await saveBalanceVisibilityPreference(newHiddenState);
  };

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr);
      const user = userProfileStr ? parsedData.user : parsedData;
      setClientInfo({
        credit: user?.credit || parsedData?.profile?.credit || 0,
        _id: parsedData?.profile?._id || user?._id,
        name: user?.name || parsedData?.profile?.name || 'Utilisateur',
      });
    } catch (error) {
      console.error("Erreur chargement données:", error);
      Alert.alert('Erreur', 'Impossible de charger vos données');
    }
  };

  const fetchWalletTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      setError(null);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('Token d\'authentification manquant');
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (!userDataStr && !userProfileStr) throw new Error('Données utilisateur non trouvées');
      const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr);
      let clientId = userProfileStr ? parsedData.user?.id || parsedData.profile?._id : parsedData.id || parsedData._id;
      const response = await fetch(`${API_BASE_URL}/wallet/${clientId}/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la récupération des transactions.");
      }
      const data = await response.json();
      if (data.success && data.transactions) {
        const transactions = data.transactions.transactions || [];
        const formattedTransactions = transactions.map((tx, index) => {
          let displayMethod = 'Transaction';
          let isPositive = true;
          if (tx.type === 'recharge') {
            isPositive = true;
            displayMethod = 'Recharge wallet';
          } else if (tx.type === 'retrait') {
            isPositive = false;
            if (tx.description) {
              if (tx.description.includes('Commande')) displayMethod = 'Paiement commande';
              else if (tx.description.includes('Orange')) displayMethod = 'Orange Money';
              else if (tx.description.includes('Moov')) displayMethod = 'Moov Money';
              else if (tx.description.includes('Wave')) displayMethod = 'Wave';
              else displayMethod = 'Retrait';
            } else displayMethod = 'Retrait';
          } else if (tx.type === 'credit') {
            isPositive = true;
            displayMethod = 'Crédit';
          } else if (tx.type === 'debit') {
            isPositive = false;
            displayMethod = 'Débit';
          }
          return {
            id: tx._id || `TX${Date.now()}_${index}`,
            type: tx.type,
            amount: tx.amount || 0,
            date: tx.date ? new Date(tx.date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Date inconnue',
            originalDate: tx.date,
            status: 'completed',
            method: displayMethod,
            description: tx.description || '',
            isPositive: isPositive
          };
        });
        const sortedTransactions = formattedTransactions.sort((a, b) => {
          const dateA = a.originalDate ? new Date(a.originalDate) : new Date(0);
          const dateB = b.originalDate ? new Date(b.originalDate) : new Date(0);
          return dateB - dateA;
        });
        setWalletTransactions(sortedTransactions);
        if (data.transactions.balance !== undefined) {
          setClientInfo(prev => ({ ...prev, credit: data.transactions.balance }));
        }
      } else setWalletTransactions([]);
    } catch (error) {
      console.error("Erreur lors de la récupération des transactions :", error);
      setError(error.message || "Impossible de charger l'historique des transactions.");
      setWalletTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const generateUssd = () => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement.');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide.');
      return;
    }
    if (!amount || isNaN(parseInt(amount))) {
      Alert.alert('Erreur', 'Montant invalide.');
      return;
    }
    const method = paymentMethods.find((m) => m.id === selectedMethod);
    if (method.id === 'wave') {
      setUssdCode(`Ouvrez l'application Wave et envoyez ${amount} FCFA au marchand.`);
    } else {
      const code = method.ussd.replace('{amount}', amount);
      setUssdCode(code);
    }
    setTransactionStep(3);
  };

  const handleCopyUssd = () => {
    Clipboard.setString(ussdCode);
    Alert.alert('Copié !', 'Le code a été copié dans votre presse-papiers.');
  };

  const resetTransaction = () => {
    setTransactionModalVisible(false);
    setTransactionStep(1);
    setSelectedMethod(null);
    setPhoneNumber('');
    setAmount('');
    setUssdCode('');
  };

  const validateStep2 = () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide (ex: 771234567).');
      return false;
    }
    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide (supérieur à 0).');
      return false;
    }
    if (transactionType === 'retrait' && parseInt(amount) > (clientInfo.credit || 0)) {
      Alert.alert('Erreur', `Montant trop élevé. Votre solde est de ${(clientInfo.credit || 0).toLocaleString()} FCFA.`);
      return false;
    }
    return true;
  };

  const applyTransaction = async () => {
    if (!validateStep2()) return;
    const newAmount = parseInt(amount);
    if (transactionType === 'recharge' && newAmount > 400000) {
      Alert.alert('Erreur', 'Le montant maximum de recharge est de 400 000 FCFA.');
      return;
    }
    if (transactionType === 'retrait' && newAmount > clientInfo.credit) {
      Alert.alert('Erreur', 'Solde insuffisant');
      return;
    }
    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('Token d\'authentification manquant');
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr);
      const user = userProfileStr ? parsedData.user : parsedData;
      const userId = parsedData?.profile?._id || user?._id || parsedData?.id;
      if (!userId) throw new Error('ID utilisateur non trouvé');
      const newCredit = transactionType === 'recharge' ? (clientInfo.credit || 0) + newAmount : (clientInfo.credit || 0) - newAmount;
      const transactionData = {
        credit: newCredit,
        transaction: {
          type: transactionType,
          amount: newAmount,
          method: selectedMethod,
          description: `${transactionType === 'recharge' ? 'Recharge' : 'Retrait'} via ${paymentMethods.find(m => m.id === selectedMethod)?.name || 'Mobile Money'}`,
          date: new Date().toISOString(),
          phoneNumber: phoneNumber
        }
      };
      const response = await fetch(`${API_BASE_URL}/wallet/${userId}/wallettransaction`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(transactionData),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Réponse inattendue du serveur (${response.status}): ${textResponse.substring(0, 100)}`);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Erreur ${response.status} lors de la transaction`);
      if (data.success) {
        await fetchWalletTransactions();
        Alert.alert('Succès', transactionType === 'recharge' ? `${newAmount.toLocaleString()} FCFA ajouté à votre wallet !` : `${newAmount.toLocaleString()} FCFA retiré de votre wallet !`);
        resetTransaction();
      } else throw new Error(data.message || 'Erreur lors de la transaction');
    } catch (error) {
      console.error('Erreur transaction wallet:', error);
      let errorMessage = error.message || 'Impossible de traiter la transaction.';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Méthode', 'Infos', 'Code'].map((step, index) => (
        <View key={index} style={[styles.stepItem, { backgroundColor: transactionStep === index + 1 ? '#2E7D32' : '#E0E0E0' }]}>
          <Text style={[styles.stepText, { color: transactionStep === index + 1 ? '#fff' : '#666' }]}>{step}</Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.modalTitle}>{transactionType === 'recharge' ? 'Choisissez une méthode de recharge' : 'Choisissez une méthode de retrait'}</Text>
      {paymentMethods.map((method) => (
        <TouchableOpacity key={method.id} style={[styles.methodButton, { borderColor: method.color }]} onPress={() => { setSelectedMethod(method.id); setTransactionStep(2); }}>
          <Ionicons name="card-outline" size={18} color={method.color} />
          <Text style={[styles.methodText, { color: method.color }]}>{method.name}</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.modalTitle}>Entrez vos informations</Text>
      <TextInput placeholder="Votre numéro de téléphone (ex: 771234567)" style={styles.input} keyboardType="phone-pad" value={phoneNumber} onChangeText={(text) => { const filteredText = text.replace(/[^0-9+]/g, ''); setPhoneNumber(filteredText); }} maxLength={12} />
      <TextInput placeholder={`Montant (FCFA) ${transactionType === 'retrait' ? `(Max: ${(clientInfo.credit || 0).toLocaleString()})` : ''}`} style={styles.input} keyboardType="numeric" value={amount} onChangeText={(text) => { const numericValue = text.replace(/[^0-9]/g, ''); setAmount(numericValue); }} />
      <TouchableOpacity style={styles.nextButton} onPress={() => { if (validateStep2()) generateUssd(); }}>
        <Text style={styles.nextButtonText}>Suivant</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.modalTitle}>Code à composer</Text>
      <View style={styles.ussdContainer}>
        <Text style={styles.ussdCodeSelectable} selectable={true}>{ussdCode}</Text>
      </View>
      <TouchableOpacity style={styles.copyButton} onPress={handleCopyUssd}>
        <Ionicons name="copy-outline" size={20} color="#2E7D32" />
        <Text style={styles.copyButtonText}>Copier le code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.nextButton, { marginTop: 20 }]} onPress={applyTransaction} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>{transactionType === 'recharge' ? 'Confirmer la recharge' : 'Confirmer le retrait'}</Text>}
      </TouchableOpacity>
      <Text style={styles.ussdInstruction}>
        {selectedMethod === 'wave' ? (
          <>
            1. Ouvrez l'application <Text style={{ fontWeight: 'bold' }}>Wave</Text>.\n2. Envoyez <Text style={{ fontWeight: 'bold' }}>{parseInt(amount).toLocaleString()} FCFA</Text> au numéro marchand indiqué.\n3. Votre solde sera mis à jour automatiquement après confirmation.
          </>
        ) : (
          <>
            1. Ouvrez le clavier de composition de votre téléphone.\n2. Composez le code ci-dessus.\n3. Validez avec <Text style={{ fontWeight: 'bold' }}>#</Text> ou <Text style={{ fontWeight: 'bold' }}>Appel</Text>.\n4. Votre solde sera mis à jour après confirmation par l'opérateur.
          </>
        )}
      </Text>
    </>
  );

  const renderTransactionModal = () => (
    <Modal visible={transactionModalVisible} transparent={true} animationType="slide" onRequestClose={resetTransaction}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {renderStepIndicator()}
          {transactionStep === 1 && renderStep1()}
          {transactionStep === 2 && renderStep2()}
          {transactionStep === 3 && renderStep3()}
          <TouchableOpacity style={styles.cancelButton} onPress={resetTransaction}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTransactionDetailModal = () => (
    <Modal visible={transactionDetailModalVisible} transparent={true} animationType="slide" onRequestClose={() => setTransactionDetailModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Détails de la transaction</Text>
          {selectedTransaction && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={[styles.detailValue, { color: selectedTransaction.isPositive ? '#2E7D32' : '#E53935' }]}>
                  {selectedTransaction.isPositive ? '+' : '-'} {selectedTransaction.amount.toLocaleString()} FCFA
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Méthode:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.method}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.date}</Text>
              </View>
              {selectedTransaction.description ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                </View>
              ) : null}
            </>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setTransactionDetailModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const TransactionItem = ({ transaction }) => {
    const getTransactionConfig = (type) => {
      switch (type) {
        case 'recharge': return { icon: 'add-circle-outline', color: '#2E7D32', label: 'Recharge' };
        case 'retrait': return { icon: 'remove-circle-outline', color: '#E53935', label: 'Retrait' };
        case 'credit': return { icon: 'arrow-down-circle-outline', color: '#2E7D32', label: 'Crédit' };
        case 'debit': return { icon: 'arrow-up-circle-outline', color: '#E53935', label: 'Débit' };
        default: return { icon: 'swap-horizontal-outline', color: '#FF9800', label: 'Transaction' };
      }
    };
    const config = getTransactionConfig(transaction.type);
    return (
      <TouchableOpacity style={styles.transactionItem} onPress={() => { setSelectedTransaction(transaction); setTransactionDetailModalVisible(true); }}>
        <Ionicons name={config.icon} size={20} color={config.color} />
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>{config.label} - {transaction.method}</Text>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
          {transaction.description ? <Text style={styles.transactionDescription} numberOfLines={1}>{transaction.description}</Text> : null}
        </View>
        <Text style={[styles.transactionAmount, { color: config.color }]}>
          {transaction.isPositive ? '+' : '-'} {transaction.amount.toLocaleString()} FCFA
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Wallet</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }} refreshControl={<RefreshControl refreshing={isLoadingTransactions} onRefresh={fetchWalletTransactions} colors={['#2E7D32']} />}>
        <View style={styles.walletCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.walletTitle}>Solde actuel</Text>
            <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.eyeIcon}>
              {/* Icône: eye-outline = visible, eye-off-outline = masqué */}
              <Ionicons name={isBalanceHidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#0c0b0bff" />
            </TouchableOpacity>
          </View>
          {/* Afficher ***** si masqué, sinon le montant réel */}
          <Text style={styles.walletAmount}>
            {isBalanceHidden ? '*****' : (clientInfo.credit || 0).toLocaleString()} FCFA
          </Text>
          <Text style={styles.walletSubtitle}>Bonjour, {clientInfo.name}</Text>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletActionButton} onPress={() => { setTransactionType('recharge'); setTransactionStep(1); setTransactionModalVisible(true); setSelectedMethod(null); setPhoneNumber(''); setAmount(''); setUssdCode(''); }}>
              <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.walletActionButtonGradient}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.walletActionButtonText}>Recharger</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletActionButton} onPress={() => { setTransactionType('retrait'); setTransactionStep(1); setTransactionModalVisible(true); setSelectedMethod(null); setPhoneNumber(''); setAmount(''); setUssdCode(''); }}>
              <LinearGradient colors={['#E53935', '#D32F2F']} style={styles.walletActionButtonGradient}>
                <Ionicons name="remove-circle-outline" size={20} color="#fff" />
                <Text style={styles.walletActionButtonText}>Retirer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.transactionHistory}>
          <View style={styles.sectionHeader}>
            <Text style={styles.transactionHistoryTitle}>Historique des transactions</Text>
            <TouchableOpacity onPress={fetchWalletTransactions}>
              <Ionicons name="refresh-outline" size={20} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {isLoadingTransactions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Chargement des transactions...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchWalletTransactions}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : walletTransactions.length > 0 ? (
            walletTransactions.slice(0, 10).map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} />)
          ) : (
            <View style={styles.noTransactionsContainer}>
              <Ionicons name="receipt-outline" size={48} color="#718096" />
              <Text style={styles.noTransactions}>Aucune transaction récente</Text>
              <Text style={styles.noTransactionsSubtext}>Vos transactions apparaîtront ici</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {renderTransactionModal()}
      {renderTransactionDetailModal()}
      <ClientFooter />
    </View>
  );
}