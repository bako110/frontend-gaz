import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Conteneurs principaux
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },

  // En-tête
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  lightHeader: {
    backgroundColor: '#1976D2', // Bleu principal pour le header
    borderBottomColor: '#1565C0',
  },
  darkHeader: {
    backgroundColor: '#0d47a1', // Bleu plus foncé pour le mode sombre
    borderBottomColor: '#1565C0',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  backButton: {
    padding: 4,
    color: '#fff',
  },

  // Contenu défilable
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  // Section profil
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  lightCard: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  darkCard: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lightProfileName: {
    color: '#000',
  },
  darkProfileName: {
    color: '#fff',
  },
  profilePhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  lightProfilePhone: {
    color: '#666',
  },
  darkProfilePhone: {
    color: '#aaa',
  },
  profileAddress: {
    fontSize: 14,
  },
  lightProfileAddress: {
    color: '#666',
  },
  darkProfileAddress: {
    color: '#aaa',
  },

  // Options du menu
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  lightOptionButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  darkOptionButton: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lightIconContainer: {
    backgroundColor: '#e3f2fd', // Bleu très clair pour les icônes
  },
  darkIconContainer: {
    backgroundColor: '#1565C0',
  },
  optionText: {
    fontSize: 16,
  },
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },

  // Switches
  switchContainer: {
    marginVertical: 16,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  lightSwitch: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  darkSwitch: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Bouton de déconnexion
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  lightLogoutButton: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  darkLogoutButton: {
    backgroundColor: '#ef9a9a',
    borderColor: '#ef9a9a',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Modales
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  lightModal: {
    backgroundColor: '#fff',
  },
  darkModal: {
    backgroundColor: '#2D2D2D',
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
    textAlign: 'center',
  },
  lightModalTitle: {
    color: '#1976D2',
  },
  darkModalTitle: {
    color: '#bbdefb',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  lightModalDescription: {
    color: '#000',
  },
  darkModalDescription: {
    color: '#fff',
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
  },
  lightInput: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#1976D2',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderColor: '#1565C0',
  },

  // Boutons dans les modales
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#757575',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  lightCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  darkCancelButton: {
    backgroundColor: '#555',
  },
  submitButton: {
    backgroundColor: '#1976D2',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Modale Profil
  profileModalContent: {
    alignItems: 'center',
  },
  avatarContainerModal: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageModal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  editPhotoButton: {
    backgroundColor: '#1976D2',
    padding: 8,
    borderRadius: 5,
  },
  editPhotoText: {
    color: '#fff',
    fontSize: 14,
  },
  profileInfoModal: {
    width: '100%',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
  },
  lightInfoLabel: {
    color: '#666',
  },
  darkInfoLabel: {
    color: '#aaa',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lightInfoValue: {
    color: '#000',
  },
  darkInfoValue: {
    color: '#fff',
  },
  editProfileButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  editProfileText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Modale KYS
  kycModal: {
    width: '90%',
  },
  kycContent: {
    paddingBottom: 16,
  },
  kycStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kycStatusText: {
    fontSize: 16,
    marginRight: 8,
  },
  kycStatusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  kycDescription: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  kycSteps: {
    marginBottom: 16,
  },
  kycStep: {
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    backgroundColor: '#1976D2',
    color: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  lightStepDescription: {
    color: '#666',
  },
  darkStepDescription: {
    color: '#aaa',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 8,
  },
  uploadButtonSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 14,
  },
  uploadButtonTextSuccess: {
    color: '#4CAF50',
  },
  selectedFileText: {
    fontSize: 12,
    textAlign: 'center',
  },
  lightSelectedFileText: {
    color: '#666',
  },
  darkSelectedFileText: {
    color: '#aaa',
  },
  submitKYCButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  submitKYCButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Modale Portefeuille
  walletBalance: {
    alignItems: 'center',
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  lightBalanceLabel: {
    color: '#000',
  },
  darkBalanceLabel: {
    color: '#fff',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'blue',
  },

  // Ajoutez ces styles dans votre fichier styles/clientsetting
kycMessageSubText: {
  fontSize: 14,
  textAlign: 'center',
  marginTop: 8,
  opacity: 0.8,
},


});
