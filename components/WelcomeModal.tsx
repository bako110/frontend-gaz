import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userType: 'client' | 'distributeur' | 'livreur';
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  userName,
  userType,
}) => {
  const getWelcomeContent = () => {
    switch (userType) {
      case 'client':
        return {
          title: 'Bienvenue sur GazApp !',
          subtitle: `Bonjour ${userName} 👋`,
          icon: 'home' as const,
          features: [
            {
              icon: 'search',
              title: 'Trouvez des distributeurs',
              description: 'Localisez facilement les distributeurs de gaz près de chez vous',
            },
            {
              icon: 'cart',
              title: 'Commandez en ligne',
              description: 'Passez vos commandes rapidement et suivez leur livraison en temps réel',
            },
            {
              icon: 'wallet',
              title: 'Gérez votre portefeuille',
              description: 'Rechargez votre compte et payez vos commandes en toute sécurité',
            },
            {
              icon: 'notifications',
              title: 'Restez informé',
              description: 'Recevez des notifications sur vos commandes et promotions',
            },
          ],
        };
      case 'distributeur':
        return {
          title: 'Bienvenue Distributeur !',
          subtitle: `Bonjour ${userName} 👋`,
          icon: 'business' as const,
          features: [
            {
              icon: 'cube',
              title: 'Gérez vos produits',
              description: 'Ajoutez et mettez à jour votre catalogue de produits facilement',
            },
            {
              icon: 'list',
              title: 'Suivez vos commandes',
              description: 'Gérez les commandes de vos clients en temps réel',
            },
            {
              icon: 'stats-chart',
              title: 'Analysez vos ventes',
              description: 'Consultez vos statistiques et revenus quotidiens',
            },
            {
              icon: 'people',
              title: 'Fidélisez vos clients',
              description: 'Offrez un service de qualité et développez votre activité',
            },
          ],
        };
      case 'livreur':
        return {
          title: 'Bienvenue Livreur !',
          subtitle: `Bonjour ${userName} 👋`,
          icon: 'bicycle' as const,
          features: [
            {
              icon: 'location',
              title: 'Activez votre disponibilité',
              description: 'Indiquez quand vous êtes disponible pour recevoir des livraisons',
            },
            {
              icon: 'navigate',
              title: 'Recevez des courses',
              description: 'Acceptez les livraisons proches de votre position',
            },
            {
              icon: 'cash',
              title: 'Gagnez de l\'argent',
              description: 'Recevez vos paiements directement dans votre portefeuille',
            },
            {
              icon: 'star',
              title: 'Construisez votre réputation',
              description: 'Offrez un excellent service et obtenez de bonnes évaluations',
            },
          ],
        };
      default:
        return {
          title: 'Bienvenue !',
          subtitle: `Bonjour ${userName} 👋`,
          icon: 'person' as const,
          features: [],
        };
    }
  };

  const content = getWelcomeContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1976D2', '#1565C0', '#0D47A1']}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={content.icon} size={60} color="#fff" />
            </View>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </LinearGradient>

          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.introText}>
              Nous sommes ravis de vous accueillir ! Voici ce que vous pouvez faire :
            </Text>

            {content.features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={28} color="#1976D2" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}

            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={24} color="#FF9800" />
              <Text style={styles.tipText}>
                Astuce : Complétez votre profil et vérifiez votre identité (KYC) pour accéder à toutes les fonctionnalités !
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Commencer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  introText: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 12,
    lineHeight: 20,
  },
  closeButton: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default WelcomeModal;
