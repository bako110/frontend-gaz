import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FacturesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [activeFilter, setActiveFilter] = useState('toutes');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadUserDataAndInvoices();
  }, []);

  const loadUserDataAndInvoices = async () => {
    try {
      setIsLoading(true);
      
      // Charger les données utilisateur
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      
      let userData = null;
      if (userProfileStr) {
        userData = JSON.parse(userProfileStr);
      } else if (userDataStr) {
        userData = JSON.parse(userDataStr);
      }

      if (userData) {
        setUserInfo(userData);
      }

      // Charger les commandes depuis AsyncStorage
      const savedOrders = await AsyncStorage.getItem('userOrders');
      const orders = savedOrders ? JSON.parse(savedOrders) : [];

      // Générer les factures à partir des commandes
      const generatedInvoices = generateInvoicesFromOrders(orders);
      setInvoices(generatedInvoices);

      // Calculer les statistiques
      calculateStats(generatedInvoices);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger vos factures');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoicesFromOrders = (orders) => {
    return orders.map((order, index) => {
      const invoiceDate = new Date(order.date || new Date());
      const isPaid = order.status === 'livrée' || order.status === 'completed' || order.paid === true;
      const isOverdue = !isPaid && new Date() > new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours pour payer
      
      let status = 'Payée';
      let statusColor = '#2E7D32';
      
      if (!isPaid) {
        status = isOverdue ? 'En retard' : 'En attente';
        statusColor = isOverdue ? '#FF6B35' : '#FFA000';
      }

      return {
        id: `FCT-${invoiceDate.getFullYear()}-${(index + 1).toString().padStart(3, '0')}`,
        date: invoiceDate.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        originalDate: invoiceDate,
        amount: `${(order.totalAmount || 0).toLocaleString('fr-FR')} FCFA`,
        numericAmount: order.totalAmount || 0,
        status: status,
        statusColor: statusColor,
        type: 'Commande de livraison',
        orderId: order.id || `CMD-${index + 1}`,
        items: order.items || [],
        deliveryAddress: order.deliveryAddress || order.address || 'Adresse non spécifiée',
        isPaid: isPaid,
        isOverdue: isOverdue
      };
    }).sort((a, b) => b.originalDate - a.originalDate); // Trier par date décroissante
  };

  const calculateStats = (invoices) => {
    const totalPaid = invoices
      .filter(inv => inv.isPaid)
      .reduce((sum, inv) => sum + inv.numericAmount, 0);
    
    const pending = invoices
      .filter(inv => !inv.isPaid)
      .reduce((sum, inv) => sum + inv.numericAmount, 0);

    const thisMonth = invoices
      .filter(inv => {
        const invoiceDate = inv.originalDate;
        const now = new Date();
        return invoiceDate.getMonth() === now.getMonth() && 
               invoiceDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, inv) => sum + inv.numericAmount, 0);

    setStats({
      totalPaid: `${totalPaid.toLocaleString('fr-FR')} FCFA`,
      pending: `${pending.toLocaleString('fr-FR')} FCFA`,
      invoicesCount: invoices.length,
      thisMonth: `${thisMonth.toLocaleString('fr-FR')} FCFA`,
      overdueCount: invoices.filter(inv => inv.isOverdue).length
    });
  };

  const downloadInvoice = async (invoice) => {
    try {
      // Créer le contenu de la facture
      const invoiceContent = `
FACTURE ${invoice.id}
Date: ${invoice.date}
Client: ${userInfo?.user?.name || userInfo?.name || 'Non spécifié'}
Téléphone: ${userInfo?.user?.phone || userInfo?.phone || 'Non spécifié'}

DÉTAILS DE LA COMMANDE:
${invoice.items.map((item, index) => `- ${item.name || `Article ${index + 1}`} x${item.quantity || 1}: ${((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')} FCFA`).join('\n')}

Adresse de livraison: ${invoice.deliveryAddress}

SOUS-TOTAL: ${invoice.amount}
STATUT: ${invoice.status}

Merci pour votre confiance!
Application Livraison Burkina
      `.trim();

      // Afficher la facture dans une alerte (solution temporaire)
      Alert.alert(
        `Facture ${invoice.id}`,
        invoiceContent,
        [
          { text: 'Fermer', style: 'cancel' },
          { 
            text: 'Copier', 
            onPress: () => {
              // Copier le contenu dans le presse-papiers
              // Note: Vous devrez installer expo-clipboard pour cette fonctionnalité
              Alert.alert('Succès', 'Contenu de la facture copié');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de générer la facture');
    }
  };

  const shareInvoice = async (invoice) => {
    Alert.alert(
      'Partager la facture',
      `Facture ${invoice.id}\nMontant: ${invoice.amount}\nDate: ${invoice.date}\n\nLa fonction de partage sera disponible prochainement.`,
      [{ text: 'OK' }]
    );
  };

  const payInvoice = (invoice) => {
    Alert.alert(
      'Paiement de facture',
      `Voulez-vous payer la facture ${invoice.id} d'un montant de ${invoice.amount} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Payer', 
          onPress: () => {
            // Simuler le paiement
            const updatedInvoices = invoices.map(inv => 
              inv.id === invoice.id 
                ? { ...inv, status: 'Payée', statusColor: '#2E7D32', isPaid: true, isOverdue: false }
                : inv
            );
            setInvoices(updatedInvoices);
            calculateStats(updatedInvoices);
            
            // Sauvegarder l'état de paiement
            savePaidInvoice(invoice.id);
            
            Alert.alert('Succès', 'Paiement effectué avec succès');
          }
        }
      ]
    );
  };

  const savePaidInvoice = async (invoiceId) => {
    try {
      const paidInvoices = await AsyncStorage.getItem('paidInvoices') || '[]';
      const paidArray = JSON.parse(paidInvoices);
      paidArray.push(invoiceId);
      await AsyncStorage.setItem('paidInvoices', JSON.stringify([...new Set(paidArray)]));
    } catch (error) {
      console.error('Erreur sauvegarde paiement:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    switch (activeFilter) {
      case 'payées':
        return invoice.isPaid;
      case 'en-attente':
        return !invoice.isPaid && !invoice.isOverdue;
      case 'en-retard':
        return invoice.isOverdue;
      default:
        return true;
    }
  });

  // Écran de chargement
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Mes Factures' }} />
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Chargement de vos factures...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Mes Factures' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Mes Factures</Text>
        <Text style={styles.subtitle}>Historique et gestion des paiements</Text>
      </View>

      {/* Cartes de statistiques */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
          <Text style={styles.statAmount}>{stats.totalPaid}</Text>
          <Text style={styles.statLabel}>Total Payé</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#FF6B35" />
          <Text style={styles.statAmount}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En Attente</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#1976D2" />
          <Text style={styles.statAmount}>{stats.invoicesCount}</Text>
          <Text style={styles.statLabel}>Factures</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={24} color="#D32F2F" />
          <Text style={styles.statAmount}>{stats.overdueCount || 0}</Text>
          <Text style={styles.statLabel}>En Retard</Text>
        </View>
      </ScrollView>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        {[
          { id: 'toutes', label: 'Toutes' },
          { id: 'payées', label: 'Payées' },
          { id: 'en-attente', label: 'En attente' },
          { id: 'en-retard', label: 'En retard' }
        ].map((filter) => (
          <TouchableOpacity 
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.filterActive
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter.id && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des factures */}
      <Text style={styles.sectionTitle}>
        Historique des Factures {filteredInvoices.length > 0 && `(${filteredInvoices.length})`}
      </Text>
      
      {filteredInvoices.length > 0 ? (
        filteredInvoices.map((invoice) => (
          <View key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceId}>{invoice.id}</Text>
                <Text style={styles.invoiceType}>{invoice.type}</Text>
                <Text style={styles.invoiceOrder}>Commande: {invoice.orderId}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${invoice.statusColor}15` }]}>
                <Text style={[styles.statusText, { color: invoice.statusColor }]}>
                  {invoice.status}
                </Text>
              </View>
            </View>
            
            <View style={styles.invoiceDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{invoice.date}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{invoice.amount}</Text>
              </View>
            </View>
            
            <View style={styles.invoiceActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => downloadInvoice(invoice)}
              >
                <Ionicons name="download-outline" size={18} color="#1976D2" />
                <Text style={[styles.actionText, { color: '#1976D2' }]}>Voir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => shareInvoice(invoice)}
              >
                <Ionicons name="share-outline" size={18} color="#666" />
                <Text style={styles.actionText}>Partager</Text>
              </TouchableOpacity>

              {!invoice.isPaid && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => payInvoice(invoice)}
                >
                  <Ionicons name="card-outline" size={18} color="#2E7D32" />
                  <Text style={[styles.actionText, { color: '#2E7D32' }]}>Payer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>Aucune facture trouvée</Text>
          <Text style={styles.emptyStateSubtext}>
            {activeFilter !== 'toutes' 
              ? `Aucune facture ${activeFilter.replace('-', ' ')}` 
              : 'Vos factures apparaîtront ici après vos commandes'
            }
          </Text>
        </View>
      )}

      {filteredInvoices.length > 0 && (
        <TouchableOpacity style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Voir plus de factures</Text>
          <Ionicons name="chevron-down" size={20} color="#2E7D32" />
        </TouchableOpacity>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'white',
  },
  filterActive: {
    backgroundColor: '#2E7D32',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 15,
  },
  invoiceCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  invoiceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  invoiceOrder: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 5,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    marginRight: 8,
  },
  emptyState: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});