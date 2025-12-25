import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Contenu défilant
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Section Profil
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 15,
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
    marginBottom: 5,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  profileAddress: {
    fontSize: 13,
    color: '#888',
  },

  // Options du menu
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  lightOptionButton: {
    backgroundColor: '#fff',
  },
  darkOptionButton: {
    backgroundColor: '#1e1e1e',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lightIconContainer: {
    backgroundColor: '#e8f5e9',
  },
  darkIconContainer: {
    backgroundColor: '#2d2d2d',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Section Switches
  switchContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },

  // Bouton déconnexion
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  lightLogoutButton: {
    backgroundColor: '#d32f2f',
  },
  darkLogoutButton: {
    backgroundColor: '#c62828',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Cartes
  lightCard: {
    backgroundColor: '#fff',
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },

  // Textes
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lightModal: {
    backgroundColor: '#fff',
  },
  darkModal: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Input
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  lightInput: {
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  darkInput: {
    borderColor: '#444',
    backgroundColor: '#2d2d2d',
    color: '#fff',
  },

  // Boutons du modal
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  lightCancelButton: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  darkCancelButton: {
    borderColor: '#444',
    backgroundColor: '#2d2d2d',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lightButtonText: {
    color: '#666',
  },
  darkButtonText: {
    color: '#fff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Profil
  profileModalContent: {
    alignItems: 'center',
  },
  avatarContainerModal: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageModal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  editPhotoButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 20,
  },
  editPhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfoModal: {
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editProfileButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal KYS
  kycModal: {
    maxHeight: '85%',
  },
  kycContent: {
    paddingVertical: 10,
  },
  kycStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  kycStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  kycStatusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  kycDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  kycSteps: {
    marginBottom: 20,
  },
  kycStep: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.7,
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
  },
  uploadButtonSuccess: {
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderStyle: 'solid',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButtonTextSuccess: {
    color: '#4caf50',
  },
  selectedFileText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitKYCButton: {
    width: '100%',
    padding: 16,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitKYCButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Portefeuille
  walletBalance: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});