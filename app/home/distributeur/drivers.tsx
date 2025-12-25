import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '@/service/config';
import DistributorFooter from './DistributorFooter';

const { width, height } = Dimensions.get('window');

// Fonction pour déterminer le statut d'un livreur basée sur le champ "status" de l'API
const getDriverStatus = (driver) => {
  // Utilise le champ "status" directement de l'API
  if (driver.status === 'occupé' || driver.status === 'occupied') {
    return 'occupied';
  }
  if (driver.status === 'disponible' || driver.status === 'available') {
    return 'available';
  }
  // Par défaut, considérer comme disponible
  return 'available';
};

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status) => {
  switch (status) {
    case 'available':
      return '#4CAF50';
    case 'occupied':
      return '#FF9800';
    case 'offline':
      return '#F44336';
    default:
      return '#757575';
  }
};

// Composant DriverCard
const DriverCard = ({ driver, onAssign, onCall }) => {
  const status = getDriverStatus(driver);

  return (
    <View style={styles.driverCard}>
      <View style={styles.driverPhotoContainer}>
        {driver.user?.photo ? (
          <Image source={{ uri: driver.user.photo }} style={styles.driverPhoto} />
        ) : (
          <View style={[styles.driverPhoto, styles.placeholderPhoto]}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.driverInfoContainer}>
        <Text style={styles.driverName}>{driver.user?.name || 'Inconnu'}</Text>
        <View style={styles.driverMetaRow}>
          <Text style={styles.driverRating}>
            <Ionicons name="star" size={14} color="#FFD700" /> {driver.totalLivraisons || 0}
          </Text>
          <Text style={styles.driverDeliveries}>
            <Ionicons name="cube" size={14} color="#2E7D32" /> {driver.totalLivraisons || 0} livraisons
          </Text>
        </View>
        <View style={styles.driverMetaRow}>
          <Text style={styles.driverVehicle}>
            <Ionicons name="car-sport" size={14} color="#666" /> {driver.vehicleType || 'Non spécifié'}
          </Text>
          <Text style={styles.driverPlate}>
            <Ionicons name="location" size={14} color="#666" /> {driver.zone || 'Non spécifiée'}
          </Text>
        </View>
        <View style={styles.driverMetaRow}>
          <Text style={styles.driverRevenue}>
            <Ionicons name="cash" size={14} color="#2E7D32" /> {driver.totalRevenue || 0} FCFA
          </Text>
        </View>
      </View>
      <View style={styles.driverStatusContainer}>
        <View style={[styles.driverStatus, { backgroundColor: `${getStatusColor(status)}20` }]}>
          <Text style={[styles.driverStatusText, { color: getStatusColor(status) }]}>
            {status === 'available' ? 'DISPONIBLE' : 'OCCUPÉ'}
          </Text>
        </View>
      </View>
      <View style={styles.driverActionsContainer}>
        {status === 'available' ? (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => onAssign(driver)}
          >
            <Ionicons name="list" size={16} color="#fff" />
            <Text style={styles.assignButtonText}>Assigner</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.trackButton}>
            <Ionicons name="navigate" size={16} color="#2E7D32" />
            <Text style={styles.trackButtonText}>Suivre</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => onCall(driver.user?.phone)}
        >
          <Ionicons name="call" size={16} color="#2E7D32" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Composant OrderItem
const OrderItem = ({ order, onAssign }) => (
  <TouchableOpacity
    style={styles.orderItem}
    onPress={() => onAssign(order)}
  >
    <View style={styles.orderIdContainer}>
      <Text style={styles.orderId}>#{order.id}</Text>
    </View>
    <View style={styles.orderClientContainer}>
      <Text style={styles.orderClient}>{order.clientName}</Text>
      <Text style={styles.orderAddress}>
        <Ionicons name="location" size={12} color="#666" /> {order.address}
      </Text>
    </View>
    <View style={styles.orderInfoContainer}>
      <Text style={styles.orderTotal}>{order.total?.toLocaleString() || '0'} FCFA</Text>
      <Text style={styles.orderDistance}>
        <Ionicons name="walk" size={12} color="#2E7D32" /> {order.distance || '0 km'}
      </Text>
      <Text style={styles.orderTime}>{order.orderTime || '--:--'}</Text>
    </View>
  </TouchableOpacity>
);

// Composant principal
export default function DriversScreen() {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [addDriverModalVisible, setAddDriverModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    vehicle: '',
    licensePlate: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtrer les livreurs pour n'afficher que ceux disponibles
  const filterAvailableDrivers = useCallback((driversList) => {
    return driversList.filter(driver => getDriverStatus(driver) === 'available');
  }, []);

  // Récupérer les livreurs depuis l'API
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/livreur/all`);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      
      console.log('Données livreurs reçues:', data); // Pour debug
      
      const driversList = data.data || [];
      setDrivers(driversList);
      
      // Filtrer pour n'afficher que les livreurs disponibles
      const availableDrivers = filterAvailableDrivers(driversList);
      setFilteredDrivers(availableDrivers);
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      Alert.alert("Erreur", "Impossible de charger les livreurs. Veuillez vérifier votre connexion.");
    }
  }, [filterAvailableDrivers]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleAssignOrder = useCallback((driver, order) => {
    // Mettre à jour le statut du livreur
    const updatedDrivers = drivers.map((d) =>
      d._id === driver._id
        ? { 
            ...d, 
            status: 'occupé', // Marquer comme occupé
          }
        : d
    );
    
    setDrivers(updatedDrivers);
    
    // Re-filtrer les livreurs disponibles
    const availableDrivers = filterAvailableDrivers(updatedDrivers);
    setFilteredDrivers(availableDrivers);
    
    setPendingOrders(pendingOrders.filter((o) => o.id !== order.id));
    setAssignModalVisible(false);
    Alert.alert(
      "Commande assignée",
      `La commande ${order.id} a été assignée à ${driver.user?.name || 'un livreur'}.`
    );
  }, [drivers, pendingOrders, filterAvailableDrivers]);

  const handleAddDriver = useCallback(async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.vehicle || !newDriver.licensePlate) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/livreur/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver),
      });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      await fetchDrivers();
      setNewDriver({ name: '', phone: '', vehicle: '', licensePlate: '' });
      setAddDriverModalVisible(false);
      Alert.alert("Succès", "Livreur ajouté avec succès !");
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'ajouter le livreur.");
    }
  }, [newDriver, fetchDrivers]);

  const handleCallDriver = useCallback((phone) => {
    if (!phone) {
      Alert.alert("Erreur", "Le numéro de téléphone est introuvable.");
      return;
    }
    Alert.alert("Appeler", `Appeler ${phone} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Appeler", onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  }, []);

  // Statistiques
  const availableDriversCount = filteredDrivers.length;
  const occupiedDriversCount = drivers.length - availableDriversCount;
  const totalDeliveries = drivers.reduce((sum, driver) => sum + (driver.totalLivraisons || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Chargement des livreurs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDrivers}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <View style={styles.contentContainer}>
        <LinearGradient colors={['#2E7D32', '#388E3C']} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Livreurs Disponibles</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAddDriverModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <FlatList
        data={filteredDrivers}
        renderItem={({ item }) => (
          <DriverCard
            driver={item}
            onAssign={(driver) => {
              setSelectedDriver(driver);
              setAssignModalVisible(true);
            }}
            onCall={handleCallDriver}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{drivers.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{availableDriversCount}</Text>
                <Text style={styles.statLabel}>Disponibles</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{occupiedDriversCount}</Text>
                <Text style={styles.statLabel}>Occupés</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{totalDeliveries}</Text>
                <Text style={styles.statLabel}>Livraisons</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>
              Livreurs disponibles ({availableDriversCount})
            </Text>
            {availableDriversCount === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Aucun livreur disponible</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tous les livreurs sont actuellement occupés
                </Text>
              </View>
            )}
          </>
        }
      />
      {/* Modal pour assigner une commande */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={assignModalVisible}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assigner une commande</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedDriver && (
              <View style={styles.driverSummary}>
                <Text style={styles.driverSummaryName}>{selectedDriver.user?.name || 'Inconnu'}</Text>
                <Text style={styles.driverSummaryStatus}>
                  Statut:{" "}
                  <Text style={{ color: getStatusColor(getDriverStatus(selectedDriver)) }}>
                    {getDriverStatus(selectedDriver) === 'available' ? 'Disponible' : 'Occupé'}
                  </Text>
                </Text>
              </View>
            )}
            <Text style={styles.modalSubtitle}>Commandes en attente</Text>
            {pendingOrders && pendingOrders.length > 0 ? (
              <FlatList
                data={pendingOrders}
                renderItem={({ item }) => (
                  <OrderItem
                    order={item}
                    onAssign={(order) => handleAssignOrder(selectedDriver, item)}
                  />
                )}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <View style={styles.noOrdersContainer}>
                <Ionicons name="document-outline" size={40} color="#ccc" />
                <Text style={styles.noOrdersText}>Aucune commande en attente</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Modal pour ajouter un livreur */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addDriverModalVisible}
        onRequestClose={() => setAddDriverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 'auto', maxHeight: height * 0.8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un livreur</Text>
              <TouchableOpacity onPress={() => setAddDriverModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Abdoul Traoré"
                value={newDriver.name}
                onChangeText={(text) => setNewDriver({ ...newDriver, name: text })}
              />
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: +226 72 34 56 78"
                keyboardType="phone-pad"
                value={newDriver.phone}
                onChangeText={(text) => setNewDriver({ ...newDriver, phone: text })}
              />
              <Text style={styles.inputLabel}>Véhicule</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Moto"
                value={newDriver.vehicle}
                onChangeText={(text) => setNewDriver({ ...newDriver, vehicle: text })}
              />
              <Text style={styles.inputLabel}>Plaque d'immatriculation</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: BF-1234-A1"
                value={newDriver.licensePlate}
                onChangeText={(text) => setNewDriver({ ...newDriver, licensePlate: text })}
              />
            </View>
            <TouchableOpacity
              style={styles.addDriverButton}
              onPress={handleAddDriver}
            >
              <LinearGradient
                colors={['#2E7D32', '#388E3C']}
                style={styles.gradientButton}
              >
                <Text style={styles.addDriverButtonText}>Enregistrer</Text>
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

// Les styles restent les mêmes...
const styles = StyleSheet.create({
  screenContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  contentContainer: { 
    flex: 1,
    backgroundColor: '#f8fafc' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  header: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 15 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, width: '22%', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statNumber: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  listContent: { paddingBottom: 20, paddingTop: 10 },
  driverCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, flexDirection: 'row', alignItems: 'center' },
  driverPhotoContainer: { width: '18%' },
  driverPhoto: { width: 50, height: 50, borderRadius: 25 },
  placeholderPhoto: { backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', width: 50, height: 50, borderRadius: 25 },
  driverInfoContainer: { width: '45%' },
  driverName: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 2 },
  driverMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  driverRating: { fontSize: 11, color: '#666', marginRight: 5 },
  driverDeliveries: { fontSize: 11, color: '#666', marginRight: 5 },
  driverVehicle: { fontSize: 11, color: '#666', marginRight: 5 },
  driverPlate: { fontSize: 11, color: '#666' },
  driverRevenue: { fontSize: 11, color: '#2E7D32', marginRight: 5 },
  driverStatusContainer: { width: '20%' },
  driverStatus: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  driverStatusText: { fontSize: 10, fontWeight: 'bold' },
  driverActionsContainer: { width: '17%', alignItems: 'flex-end' },
  assignButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 3 },
  assignButtonText: { color: '#fff', fontSize: 11, fontWeight: '600', marginLeft: 3 },
  trackButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 3 },
  trackButtonText: { color: '#2E7D32', fontSize: 11, fontWeight: '600', marginLeft: 3 },
  callButton: { padding: 6, backgroundColor: '#E8F5E8', borderRadius: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 15, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  driverSummary: { marginBottom: 15 },
  driverSummaryName: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 3 },
  driverSummaryStatus: { fontSize: 13, color: '#666' },
  modalSubtitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginBottom: 10 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#F8F9FA', borderRadius: 10, marginBottom: 6, alignItems: 'center' },
  orderIdContainer: { width: '18%' },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },
  orderClientContainer: { width: '45%' },
  orderClient: { fontSize: 13, color: '#666', marginBottom: 1 },
  orderAddress: { fontSize: 11, color: '#666' },
  orderInfoContainer: { width: '30%', alignItems: 'flex-end' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#2E7D32' },
  orderDistance: { fontSize: 11, color: '#2E7D32', marginTop: 1 },
  orderTime: { fontSize: 11, color: '#999', marginTop: 1 },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#F8F9FA', marginBottom: 12 },
  addDriverButton: { borderRadius: 10, overflow: 'hidden' },
  gradientButton: { padding: 12, alignItems: 'center' },
  addDriverButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#2E7D32' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#F44336', marginBottom: 10 },
  retryButton: { backgroundColor: '#2E7D32', padding: 10, borderRadius: 5 },
  retryButtonText: { color: '#fff' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 16, color: '#666', marginTop: 10 },
  emptyStateSubtext: { fontSize: 14, color: '#999', marginTop: 5, textAlign: 'center' },
  noOrdersContainer: { alignItems: 'center', padding: 20 },
  noOrdersText: { fontSize: 14, color: '#666', marginTop: 10 },
  
  // ========== FOOTER ==========
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 95,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    paddingBottom: 20,
  },
  footerTab: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 70,
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  footerTabText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
});