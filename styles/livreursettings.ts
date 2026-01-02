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
    width: '85%',
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
    width: '95%',
    maxHeight: '90%',
  },
  kycContent: {
    paddingBottom: 16,
    maxHeight: '100%',
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

  kycMessageSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  kycMessage: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  kycMessageText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  submitKYCButtonDisabled: {
    opacity: 0.5,
  },
  logoutHeaderButton: {
    padding: 4,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    padding: 10,
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  zeroBalanceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  zeroBalanceText: {
    fontSize: 14,
    color: '#f57c00',
    marginLeft: 8,
  },

  // Nouveaux styles pour le KYC moderne
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bdbdbd',
  },
  progressDotActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  progressDotText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 3,
  },
  progressLineActive: {
    backgroundColor: '#1565C0',
  },
  scanStepContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scanIconContainer: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 40,
  },
  scanStepTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  scanStepDescription: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 15,
    lineHeight: 18,
    opacity: 0.8,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewImage: {
    width: width * 0.55,
    height: width * 0.35,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  previewImageFace: {
    width: width * 0.4,
    height: width * 0.52,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    gap: 4,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    marginTop: 10,
    gap: 10,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1565C0',
    backgroundColor: 'transparent',
    gap: 4,
  },
  backStepButtonText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '600',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  qualityBadgeAnalyzing: {
    backgroundColor: '#FFF3E0',
  },
  qualityBadgeGood: {
    backgroundColor: '#E8F5E9',
  },
  qualityBadgePoor: {
    backgroundColor: '#FFEBEE',
  },
  qualityBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  qualityTextAnalyzing: {
    color: '#F57C00',
  },
  qualityTextGood: {
    color: '#4CAF50',
  },
  qualityTextPoor: {
    color: '#F44336',
  },
});
