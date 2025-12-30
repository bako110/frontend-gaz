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
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const WalletScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [livreurInfo, setLivreurInfo] = useState({
    name: '',
    balance: 0,
    _id: null,
  });
  const [transactionType, setTransactionType] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedMobileOperator, setSelectedMobileOperator] = useState('orange');
  const [otpCode, setOtpCode] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState(null);

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

  // Récupération des transactions
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
        let displayType = 'transaction';
        let isPositive = true;
        let displayMethod = tx.description || 'Transaction';
        
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
        
        if (tx.description) {
          if (tx.description.includes('Mobile Money')) displayMethod = 'Mobile Money';
          else if (tx.description.includes('Carte')) displayMethod = 'Carte bancaire';
          else if (tx.description.includes('Espèces')) displayMethod = 'Espèces';
          else if (tx.description.includes('livraison')) displayMethod = 'Livraison';
        }

        return {
          id: tx._id || tx.id || `TX${Date.now()}_${index}`,
          type: displayType,
          originalType: tx.type || 'unknown',
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
          isPositive: isPositive,
          originalData: tx
        };
      });
      
      setWalletTransactions(formattedTransactions);
      
      if (data.transactions?.balance !== undefined) {
        setLivreurInfo(prev => ({
          ...prev,
          balance: data.transactions.balance ?? 0
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des transactions :", error);
      setError(error.message || "Impossible de charger l'historique des transactions.");
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
        
        setLivreurInfo({
          name: user?.name || 'Utilisateur',
          balance: 0,
          _id: user?._id || null,
        });

        await Promise.all([
          fetchLivreurBalance(),
          fetchWalletTransactions()
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur :", error);
        Alert.alert("Erreur", "Impossible de charger vos données. Veuillez vous reconnecter.");
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

  // Validation du formulaire de retrait
  const validateWithdrawalForm = () => {
    if (!transactionAmount || isNaN(parseInt(transactionAmount))) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return false;
    }

    const amount = parseInt(transactionAmount);
    if (amount <= 0) {
      Alert.alert('Erreur', 'Le montant doit être supérieur à 0.');
      return false;
    }

    if (amount > livreurInfo.balance) {
      Alert.alert('Erreur', 'Solde insuffisant pour effectuer ce retrait.');
      return false;
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide.');
      return false;
    }

    return true;
  };

  // Soumettre la demande de retrait
  const submitWithdrawalRequest = async () => {
    if (!validateWithdrawalForm()) return;

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error("Session expirée. Veuillez vous reconnecter.");

      const withdrawalData = {
        userId: livreurInfo._id,
        type: 'retrait',
        amount: parseInt(transactionAmount),
        method: 'mobile_money',
        phoneNumber: phoneNumber,
        operator: selectedMobileOperator,
        status: 'pending' // Le statut sera en attente jusqu'à validation OTP
      };

      const response = await fetch(`${API_BASE_URL}/wallet/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(withdrawalData),
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Si ce n'est pas du JSON, essayer de récupérer le texte pour le débogage
        const textResponse = await response.text();
        console.error('Réponse non-JSON du serveur:', textResponse);
        throw new Error('Le serveur a retourné une réponse invalide. Vérifiez que l\'API endpoint existe.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Simuler l'envoi d'un OTP (dans un environnement réel, ce serait envoyé par SMS)
        Alert.alert(
          'OTP Envoyé',
          `Un code OTP a été envoyé au ${phoneNumber}. Veuillez le saisir pour confirmer le retrait.`
        );
        
        // Simuler un OTP (en production, l'OTP serait généré côté serveur)
        const simulatedOtp = '123456'; // À remplacer par un OTP réel
        setPendingWithdrawalId(data.withdrawalId || 'SIMULATED_ID');
        setTransactionModalVisible(false);
        setOtpModalVisible(true);
        
        // Pour démo, pré-remplir l'OTP
        setOtpCode(simulatedOtp);
      } else {
        Alert.alert('Erreur', data.message || 'Échec de la demande de retrait.');
      }
    } catch (error) {
      console.error("Erreur lors de la demande de retrait :", error);
      Alert.alert('Erreur', error.message || 'Impossible de traiter la demande de retrait.');
    }
  };

  // Valider l'OTP
  const validateOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer un code OTP valide (6 chiffres).');
      return;
    }

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error("Session expirée. Veuillez vous reconnecter.");

      // Simuler la validation OTP
      if (otpCode === '123456') { // À remplacer par une validation réelle
        Alert.alert(
          'Succès',
          `Votre retrait de ${parseInt(transactionAmount).toLocaleString()} FCFA a été initié.` +
          '\nLe montant sera transféré sur votre compte Mobile Money dans les 24h.'
        );

        // Mettre à jour les données
        await fetchLivreurBalance();
        await fetchWalletTransactions();
        
        // Réinitialiser les états
        setOtpCode('');
        setPhoneNumber('');
        setTransactionAmount('');
        setOtpModalVisible(false);
        setPendingWithdrawalId(null);
      } else {
        Alert.alert('Erreur', 'Code OTP incorrect. Veuillez réessayer.');
      }
    } catch (error) {
      console.error("Erreur lors de la validation OTP :", error);
      Alert.alert('Erreur', 'Impossible de valider le code OTP.');
    }
  };

  // Composant TransactionCard
  const TransactionCard = ({ transaction }) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <LinearGradient colors={['#1565C0', '#1565C0']} style={styles.header}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 15 }]}>Mon Wallet</Text>
        
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

      {/* Modal pour le retrait - version modifiée */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={transactionModalVisible && transactionType === 'retrait'}
        onRequestClose={() => setTransactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Retrait Mobile Money</Text>
                <TouchableOpacity onPress={() => setTransactionModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Montant à retirer (FCFA)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 5000"
                value={transactionAmount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setTransactionAmount(numericValue);
                }}
                keyboardType="numeric"
              />
              <Text style={styles.modalHelperText}>
                Solde disponible: {livreurInfo.balance.toLocaleString()} FCFA
              </Text>

              <Text style={styles.modalLabel}>Opérateur Mobile Money</Text>
              <View style={styles.operatorContainer}>
                <TouchableOpacity
                  style={[
                    styles.operatorButton,
                    selectedMobileOperator === 'orange' && styles.operatorButtonSelected
                  ]}
                  onPress={() => setSelectedMobileOperator('orange')}
                >
                  <View style={[
                    styles.operatorIcon,
                    { backgroundColor: '#FF6600' }
                  ]}>
                    <Text style={styles.operatorIconText}>O</Text>
                  </View>
                  <Text style={styles.operatorText}>Orange Money</Text>
                  {selectedMobileOperator === 'orange' && (
                    <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.operatorButton,
                    selectedMobileOperator === 'moov' && styles.operatorButtonSelected
                  ]}
                  onPress={() => setSelectedMobileOperator('moov')}
                >
                  <View style={[
                    styles.operatorIcon,
                    { backgroundColor: '#0066CC' }
                  ]}>
                    <Text style={styles.operatorIconText}>M</Text>
                  </View>
                  <Text style={styles.operatorText}>Moov Money</Text>
                  {selectedMobileOperator === 'moov' && (
                    <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 0701020304"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <Text style={styles.modalHelperText}>
                Le numéro doit être associé à votre compte {selectedMobileOperator === 'orange' ? 'Orange Money' : 'Moov Money'}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setTransactionAmount('');
                    setPhoneNumber('');
                    setTransactionModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={submitWithdrawalRequest}
                >
                  <LinearGradient
                    colors={['#E53935', '#D32F2F']}
                    style={styles.modalConfirmButtonGradient}
                  >
                    <Text style={styles.modalConfirmButtonText}>Continuer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal OTP */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Validation OTP</Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              Entrez le code OTP envoyé au {phoneNumber}
            </Text>
            
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus={true}
            />

            <Text style={styles.otpHelperText}>
              Code OTP à 6 chiffres
            </Text>

            <View style={styles.otpResendContainer}>
              <Text style={styles.otpResendText}>Vous n'avez pas reçu le code ? </Text>
              <TouchableOpacity>
                <Text style={styles.otpResendLink}>Renvoyer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setOtpModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={validateOtp}
              >
                <LinearGradient
                  colors={['#2E7D32', '#388E3C']}
                  style={styles.modalConfirmButtonGradient}
                >
                  <Text style={styles.modalConfirmButtonText}>Valider</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de détail de transaction (inchangé) */}
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
    paddingTop: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center',
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
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#718096',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
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
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 10,
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
    fontWeight: 'bold' as const,
    color: '#333',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  modalHelperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
  },
  operatorContainer: {
    marginVertical: 8,
  },
  operatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  operatorButtonSelected: {
    borderColor: '#1565C0',
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
  },
  operatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  operatorIconText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  operatorText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#1565C0',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    letterSpacing: 8,
    marginVertical: 16,
  },
  otpHelperText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpResendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  otpResendText: {
    fontSize: 12,
    color: '#666',
  },
  otpResendLink: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
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
  transactionDescription: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
};

export default WalletScreen;