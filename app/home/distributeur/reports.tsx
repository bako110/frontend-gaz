import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedGasType, setSelectedGasType] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [reports, setReports] = useState({
    totalRevenue: 2450000,
    totalOrders: 128,
    totalDeliveries: 92,
    pendingOrders: 36,
    revenueByGas: { Orix: 980000, Pezaz: 720000, TotalGaz: 510000, Shell: 240000 },
    dailySales: [
      { day: 'Lun', revenue: 320000 },
      { day: 'Mar', revenue: 410000 },
      { day: 'Mer', revenue: 380000 },
      { day: 'Jeu', revenue: 520000 },
      { day: 'Ven', revenue: 480000 },
      { day: 'Sam', revenue: 640000 },
      { day: 'Dim', revenue: 300000 },
    ],
    topProducts: [
      { name: 'Butane 13kg (Orix)', sales: 145, revenue: 1305000 },
      { name: 'Propane 6kg (Pezaz)', sales: 89, revenue: 578500 },
      { name: 'Butane 6kg (Shell)', sales: 62, revenue: 341000 },
      { name: 'Propane 13kg (TotalGaz)', sales: 43, revenue: 408500 },
    ],
    recentOrders: [
      { id: 'CMD123', client: 'Aminata Ouédraogo', amount: 24500, status: 'livré', date: '06 Sep 2025' },
      { id: 'CMD124', client: 'Ibrahim Kaboré', amount: 28500, status: 'en cours', date: '05 Sep 2025' },
      { id: 'CMD125', client: 'Fatou Sawadogo', amount: 14500, status: 'annulé', date: '04 Sep 2025' },
      { id: 'CMD126', client: 'Salif Compaoré', amount: 18500, status: 'livré', date: '03 Sep 2025' },
    ],
  });

  const gasTypes = ['all', 'Orix', 'Pezaz', 'TotalGaz', 'Shell'];

  useEffect(() => {
    const loadReports = async () => {
      try {
        const savedReports = await AsyncStorage.getItem('distributorReports');
        if (savedReports) setReports(JSON.parse(savedReports));
      } catch (error) {
        console.error("Erreur lors du chargement des rapports:", error);
      }
    };
    loadReports();
  }, []);

  const applyFilters = () => {
    setFilterModalVisible(false);
    Alert.alert("Filtres appliqués", `Période: ${selectedPeriod}, Type: ${selectedGasType}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'livré': return '#4CAF50';
      case 'en cours': return '#FF9800';
      case 'annulé': return '#F44336';
      default: return '#757575';
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={{ marginLeft: 8 }}>{title}: {value}</Text>
      </View>
    </View>
  );

  const OrderItem = ({ order }) => (
    <View style={{ marginBottom: 12 }}>
      <Text>#{order.id} - {order.client}</Text>
      <Text>{order.amount.toLocaleString()} FCFA</Text>
      <Text style={{ color: getStatusColor(order.status) }}>{order.status}</Text>
      <Text>{order.date}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <LinearGradient colors={['#2E7D32', '#388E3C']} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20 }}>Rapports</Text>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ padding: 16 }}>
        <StatCard title="Chiffre d'affaires" value={`${reports.totalRevenue.toLocaleString()} FCFA`} icon="cash-outline" color="#9C27B0" />
        <StatCard title="Commandes" value={reports.totalOrders} icon="receipt-outline" color="#2E7D32" />
        <StatCard title="Livraisons" value={reports.totalDeliveries} icon="car-outline" color="#4CAF50" />
        <StatCard title="En attente" value={reports.pendingOrders} icon="time-outline" color="#FF9800" />

        <Text style={{ marginTop: 24, marginBottom: 12 }}>Ventes quotidiennes</Text>
        <LineChart
          data={reports.dailySales.map(item => item.revenue)}
          height={220}
          width={width - 32}
          spacing={32}
          color="#2E7D32"
        />

        <View style={{ marginTop: 24 }}>
          <Text>Produits les plus vendus</Text>
          {reports.topProducts.map((p, i) => (
            <Text key={i}>{p.name} - {p.sales} vendus - {p.revenue.toLocaleString()} FCFA</Text>
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <Text>Commandes récentes</Text>
          <FlatList
            data={reports.recentOrders}
            renderItem={({ item }) => <OrderItem order={item} />}
            keyExtractor={item => item.id}
          />
        </View>
      </ScrollView>

      {/* Modal pour filtres */}
      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#00000099', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text>Filtrer les rapports</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text>Période</Text>
            <Picker selectedValue={selectedPeriod} onValueChange={setSelectedPeriod}>
              <Picker.Item label="Cette semaine" value="week" />
              <Picker.Item label="Ce mois" value="month" />
              <Picker.Item label="Cette année" value="year" />
            </Picker>

            <Text>Type de gaz</Text>
            <Picker selectedValue={selectedGasType} onValueChange={setSelectedGasType}>
              {gasTypes.map(type => <Picker.Item key={type} label={type} value={type} />)}
            </Picker>

            <TouchableOpacity onPress={applyFilters} style={{ marginTop: 16, backgroundColor: '#2E7D32', padding: 12, borderRadius: 8 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  productSales: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  orderClient: {
    fontSize: 12,
    color: '#666',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'right',
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  filterItem: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradientButton: {
    padding: 15,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
};
