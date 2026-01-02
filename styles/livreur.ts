// styles/livreur.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // CONTAINER PRINCIPAL
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },

  // HEADER
  header: { 
    paddingTop: 36, 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  profileImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  profileImageSize: { 
    width: 50, 
    height: 50, 
    borderRadius: 25 
  },
  welcomeText: { 
    color: '#B3E5FC', 
    fontSize: 14 
  },
  userName: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  headerRight: { 
    position: 'relative' 
  },
  notificationButton: { 
    padding: 8 
  },
  notificationBadge: { 
    position: 'absolute', 
    top: 5, 
    right: 5, 
    backgroundColor: '#FF5722', 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  notificationBadgeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  dateTime: { 
    color: '#B3E5FC', 
    fontSize: 14 
  },

  // CONTENU PRINCIPAL
  content: { 
    flex: 1 
  },

  // STATISTIQUES
  statsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    gap: 15 
  },
  statCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    width: (width - 55) / 2, 
    borderLeftWidth: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  statCardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    flex: 1 
  },
  statTitle: { 
    fontSize: 12, 
    color: '#718096', 
    fontWeight: '500', 
    marginBottom: 4 
  },
  statSubtitle: { 
    fontSize: 11, 
    color: '#A0AEC0' 
  },

  // GRAPHIQUE SEMAINE
  chartContainer: { 
    backgroundColor: '#fff', 
    margin: 20, 
    marginTop: 0, 
    borderRadius: 16, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  chartTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    marginBottom: 20 
  },
  chartBars: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    height: 120 
  },
  barContainer: { 
    flex: 1, 
    alignItems: 'center' 
  },
  barWrapper: { 
    height: 80, 
    width: 30, 
    justifyContent: 'flex-end' 
  },
  bar: { 
    width: 30, 
    borderRadius: 15, 
    overflow: 'hidden' 
  },
  barGradient: { 
    flex: 1 
  },
  barLabel: { 
    marginTop: 8, 
    fontSize: 12, 
    color: '#718096', 
    fontWeight: '500' 
  },
  barValue: { 
    fontSize: 10, 
    color: '#A0AEC0', 
    marginTop: 2 
  },

  // SECTIONS
  section: { 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2D3748' 
  },
  sectionAction: { 
    fontSize: 14, 
    color: '#1565C0', 
    fontWeight: '500' 
  },

  // SECTIONS DE LIVRAISONS
  livraisonSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 12,
    marginLeft: 4,
  },

  // CARTES DE LIVRAISON
  livraisonCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  livraisonHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  livraisonInfo: { 
    flex: 1 
  },
  livraisonId: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1565C0', 
    marginBottom: 8 
  },
  statutBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: 'flex-start' 
  },
  statutText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    marginLeft: 4 
  },
  callButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#E3F2FD', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  clientName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    marginBottom: 12 
  },

  // CONTAINER TEMPS
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },

  // DÉTAILS LIVRAISON
  livraisonDetails: { 
    gap: 8 
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  detailText: { 
    fontSize: 14, 
    color: '#718096', 
    marginLeft: 8, 
    flex: 1 
  },

  // ACTIONS LIVRAISON
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },

  // ACTIONS RAPIDES
  quickActions: { 
    paddingHorizontal: 20, 
    marginBottom: 30 
  },
  actionsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15, 
    marginTop: 15 
  },
  quickActionButton: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    width: (width - 55) / 2, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  quickActionText: { 
    fontSize: 14, 
    color: '#2D3748', 
    fontWeight: '500', 
    marginTop: 8 
  },

  // FOOTER / NAVIGATION - STICKY/FIXED EN BAS
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    height: 95,
    paddingVertical: 12,
    paddingBottom: 35, 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 5 
  },
  footerTab: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1 
  },
  activeTab: { 
    backgroundColor: 'rgba(21, 101, 192, 0.1)', 
    borderRadius: 16, 
    paddingVertical: 8 
  },
  footerTabText: { 
    fontSize: 12, 
    color: '#718096', 
    marginTop: 4 
  },
  activeTabText: { 
    color: '#1565C0', 
    fontWeight: 'bold' 
  },

  // NOTIFICATIONS - MODAL
  notificationModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  notificationPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: '80%',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationHeaderPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearAllText: {
    color: '#FF4757',
    fontSize: 14,
    fontWeight: '500',
  },
  closeNotificationButton: {
    padding: 4,
  },
  notificationList: {
    maxHeight: 400,
  },

  // ITEMS NOTIFICATION
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f8fafd',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationDelete: {
    padding: 4,
  },

  // MODAL D'ANNULATION
  cancellationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
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
    fontWeight: 'bold',
  },
  cancellationDescription: {
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 14,
  },
  cancellationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmCancelButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#E53935',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmCancelButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ÉTATS VIDES ET CHARGEMENT
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  noNotifications: {
    padding: 40,
    alignItems: 'center',
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  noNotificationsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // OVERLAY MODAL
  modalOverlay: {
    flex: 1,
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // STYLES ALTERNATIFS POUR MODAL
  modalContentCentered: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  modalHeaderCentered: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitleCentered: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    letterSpacing: -0.5,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 15,
  },
  closeButtonCentered: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // BOUTONS ET ACTIONS SUPPLÉMENTAIRES
  markAllReadButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markAllReadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationAction: {
    padding: 8,
  },

  // STYLES POUR LES ÉTATS D'ERREUR
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // STYLES MODERNES POUR LE MODAL DE NOTIFICATION
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modernModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modernNotificationPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modernNotificationHeader: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modernHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  modernCloseButton: {
    padding: 4,
  },
  modernClearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  modernClearAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  modernNotificationList: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modernNotificationItemWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modernNotificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modernUnreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
  },
  modernNotificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernNotificationContent: {
    flex: 1,
  },
  modernNotificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modernNotificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1565C0',
    marginLeft: 8,
  },
  modernNotificationMessage: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 8,
  },
  modernNotificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernNotificationTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  modernNotificationDelete: {
    padding: 4,
    marginLeft: 8,
  },
  modernNoNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernNoNotificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  modernNoNotificationsSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default styles;