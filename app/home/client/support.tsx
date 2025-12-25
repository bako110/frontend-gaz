import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SupportScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('tous');
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // Catégories réelles
  const categories = [
    { id: 'tous', name: 'Tous', icon: 'list' },
    { id: 'technique', name: 'Technique', icon: 'hardware-chip' },
    { id: 'livraison', name: 'Livraison', icon: 'bicycle' },
    { id: 'paiement', name: 'Paiement', icon: 'card' },
    { id: 'compte', name: 'Compte', icon: 'person' },
    { id: 'suggestion', name: 'Suggestion', icon: 'bulb' },
  ];

  // FAQ réelle basée sur les besoins d'une app de livraison
  const realFaqs = [
    {
      question: 'Comment suivre ma commande ?',
      answer: 'Allez dans "Mes Commandes" pour voir le statut en temps réel de votre livraison.',
      category: 'livraison'
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons le paiement par carte, mobile money (Orange Money, Moov Money) et espèces à la livraison.',
      category: 'paiement'
    },
    {
      question: 'Comment modifier mon adresse de livraison ?',
      answer: 'Allez dans "Mes Adresses" pour gérer vos adresses de livraison.',
      category: 'livraison'
    },
    {
      question: 'Que faire si je ne reçois pas ma commande ?',
      answer: 'Contactez immédiatement le support au +226 01 02 03 04 ou via cette application.',
      category: 'livraison'
    },
    {
      question: 'Comment réinitialiser mon mot de passe ?',
      answer: 'Utilisez la fonction "Mot de passe oublié" sur l\'écran de connexion.',
      category: 'compte'
    },
    {
      question: 'L\'application ne se connecte pas, que faire ?',
      answer: 'Vérifiez votre connexion internet et réessayez. Si le problème persiste, contactez le support technique.',
      category: 'technique'
    },
  ];

  useEffect(() => {
    loadUserDataAndTickets();
  }, []);

  const loadUserDataAndTickets = async () => {
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

      // Charger les tickets sauvegardés
      const savedTickets = await AsyncStorage.getItem('userSupportTickets');
      if (savedTickets) {
        setTickets(JSON.parse(savedTickets));
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewTicket = () => {
    // Dans une vraie app, vous navigueriez vers un formulaire de création de ticket
    Alert.alert(
      'Nouveau Ticket',
      'Fonctionnalité bientôt disponible. Pour le moment, contactez-nous par téléphone ou email.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => callSupport()
        },
        { 
          text: 'Envoyer Email', 
          onPress: () => sendEmail()
        }
      ]
    );
  };

  const callSupport = () => {
    Linking.openURL('tel:+22601020304').catch(err => {
      Alert.alert('Erreur', 'Impossible de composer le numéro');
    });
  };

  const sendEmail = () => {
    const subject = encodeURIComponent('Demande de support - Application Livraison');
    const body = encodeURIComponent(`Bonjour,\n\nJe souhaite obtenir de l'aide concernant :\n\n[Veuillez décrire votre problème ici]\n\n---\nInformations utilisateur :\nNom: ${userInfo?.user?.name || userInfo?.name || 'Non spécifié'}\nTéléphone: ${userInfo?.user?.phone || userInfo?.phone || 'Non spécifié'}`);
    
    Linking.openURL(`mailto:support@livraison.bf?subject=${subject}&body=${body}`).catch(err => {
      Alert.alert('Erreur', 'Aucune application email trouvée');
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Résolu': return { bg: '#E8F5E8', text: '#2E7D32' };
      case 'En cours': return { bg: '#E3F2FD', text: '#1976D2' };
      case 'Nouveau': return { bg: '#FFF3E0', text: '#FF6B35' };
      case 'Fermé': return { bg: '#F5F5F5', text: '#666' };
      default: return { bg: '#F5F5F5', text: '#666' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Haute': return '#D32F2F';
      case 'Moyenne': return '#FFA000';
      case 'Basse': return '#2E7D32';
      default: return '#666';
    }
  };

  // Filtrer les FAQ par catégorie et recherche
  const filteredFaqs = realFaqs.filter(faq => {
    const matchesCategory = activeCategory === 'tous' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtrer les tickets par catégorie
  const filteredTickets = tickets.filter(ticket => 
    activeCategory === 'tous' || ticket.category === activeCategory
  );

  // Écran de chargement
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Support' }} />
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Chargement du centre d'aide...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Support' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Centre d'Aide</Text>
        <Text style={styles.subtitle}>Nous sommes là pour vous aider</Text>
      </View>

      {/* Cartes de contact rapide */}
      <View style={styles.quickContact}>
        <TouchableOpacity style={styles.contactCard} onPress={callSupport}>
          <Ionicons name="call" size={24} color="#2E7D32" />
          <Text style={styles.contactTitle}>Appeler</Text>
          <Text style={styles.contactInfo}>+226 01 02 03 04</Text>
          <Text style={styles.contactHours}>Lun-Sam, 7h-20h</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard} onPress={sendEmail}>
          <Ionicons name="mail" size={24} color="#1976D2" />
          <Text style={styles.contactTitle}>Email</Text>
          <Text style={styles.contactInfo}>support@livraison.bf</Text>
          <Text style={styles.contactHours}>Réponse sous 24h</Text>
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher dans l'aide..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Catégories */}
      <Text style={styles.sectionTitle}>Catégories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              activeCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={20} 
              color={activeCategory === category.id ? 'white' : '#2E7D32'} 
            />
            <Text style={[
              styles.categoryText,
              activeCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ */}
      <Text style={styles.sectionTitle}>
        Questions Fréquentes {filteredFaqs.length > 0 && `(${filteredFaqs.length})`}
      </Text>
      
      {filteredFaqs.length > 0 ? (
        filteredFaqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
            </View>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="help-circle" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>Aucune question trouvée</Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery ? 'Essayez avec d\'autres termes' : 'Aucune FAQ disponible pour cette catégorie'}
          </Text>
        </View>
      )}

      {/* Tickets de support */}
      <View style={styles.ticketsHeader}>
        <Text style={styles.sectionTitle}>
          Mes Demandes {filteredTickets.length > 0 && `(${filteredTickets.length})`}
        </Text>
        <TouchableOpacity style={styles.newTicketButton} onPress={createNewTicket}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.newTicketText}>Nouvelle Demande</Text>
        </TouchableOpacity>
      </View>

      {filteredTickets.length > 0 ? (
        filteredTickets.map((ticket) => {
          const statusColors = getStatusColor(ticket.status);
          return (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <Text style={styles.ticketDate}>{ticket.date}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                  <Text style={styles.priorityText}>{ticket.priority}</Text>
                </View>
              </View>
              
              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="folder" size={14} color="#666" />
                    <Text style={styles.detailText}>{ticket.category}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors.text }]}>
                    {ticket.status}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>Aucune demande de support</Text>
          <Text style={styles.emptyStateSubtext}>
            Créez votre première demande pour obtenir de l'aide
          </Text>
        </View>
      )}

      {/* Contact rapide */}
      <View style={styles.helpSection}>
        <Ionicons name="help-circle" size={48} color="#2E7D32" />
        <Text style={styles.helpTitle}>Besoin d'aide supplémentaire ?</Text>
        <Text style={styles.helpText}>
          Notre équipe de support est disponible pour vous aider avec vos problèmes de livraison
        </Text>
        <View style={styles.helpButtons}>
          <TouchableOpacity style={styles.helpButtonSecondary} onPress={callSupport}>
            <Ionicons name="call" size={18} color="#2E7D32" />
            <Text style={styles.helpButtonSecondaryText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpButton} onPress={sendEmail}>
            <Ionicons name="mail" size={18} color="white" />
            <Text style={styles.helpButtonText}>Envoyer Email</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  quickContact: {
    flexDirection: 'row',
    padding: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 5,
  },
  contactHours: {
    fontSize: 12,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  categoryButtonActive: {
    backgroundColor: '#2E7D32',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  faqItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 15,
  },
  newTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newTicketText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  ticketCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ticketDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
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
  helpSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  helpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  helpButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  helpButtonSecondaryText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
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