import homestyles from '@/styles/home';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [userType] = useState('client');
  const [userName] = useState('Jean Dupont');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [balance, setBalance] = useState(25000);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const getThemeColors = () => {
    switch (userType) {
      case 'distributeur':
        return {
          primary: '#4D96FF',
          secondary: '#667eea',
          accent: '#8B5CF6',
          background: '#F8FAFF',
        };
      case 'client':
        return {
          primary: '#4D96FF',
          secondary: '#A0C4FF',
          accent: '#6366F1',
          background: '#F8FAFF',
        };
      case 'livreur':
        return {
          primary: '#4facfe',
          secondary: '#00f2fe',
          accent: '#06B6D4',
          background: '#F0F9FF',
        };
      default:
        return {
          primary: '#4D96FF',
          secondary: '#667eea',
          accent: '#8B5CF6',
          background: '#F8FAFF',
        };
    }
  };

  const colors = getThemeColors();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const quickActions = [
    { id: 1, icon: 'add-circle', label: 'Nouvelle\nCommande', color: '#10B981' },
    { id: 2, icon: 'card', label: 'Paiement', color: '#3B82F6' },
    { id: 3, icon: 'location', label: 'Livraison', color: '#F59E0B' },
    { id: 4, icon: 'people', label: 'Support', color: '#8B5CF6' },
  ];

  const recentOrders = [
    { id: 1, type: 'Bouteille 12kg', quantity: 2, status: 'Livré', date: '15 Sep', price: 12000, color: '#10B981' },
    { id: 2, type: 'Bouteille 6kg', quantity: 1, status: 'En cours', date: '14 Sep', price: 6500, color: '#F59E0B' },
    { id: 3, type: 'Bouteille 25kg', quantity: 1, status: 'Préparation', date: '13 Sep', price: 18000, color: '#3B82F6' },
  ];

  const promotions = [
    {
      id: 1,
      title: 'Offre Spéciale',
      description: '20% de réduction sur votre prochaine commande',
      gradient: ['#4D96FF', '#A0C4FF'],
      icon: 'gift',
    },
    {
      id: 2,
      title: 'Livraison Gratuite',
      description: 'Pour toute commande supérieure à 15 000 FCFA',
      gradient: ['#4ECDC4', '#44A08D'],
      icon: 'car',
    },
  ];

  const stats = [
    { label: 'Commandes', value: '12', icon: 'bag', color: '#10B981' },
    { label: 'Économies', value: '5K', icon: 'trending-down', color: '#3B82F6' },
    { label: 'Points', value: '850', icon: 'star', color: '#F59E0B' },
  ];

  const HeaderComponent = () => (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={homestyles.header}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={homestyles.topBar}>
        <TouchableOpacity style={homestyles.profileSection}>
          <View style={homestyles.avatarContainer}>
            <LinearGradient colors={['#fff', '#f0f0f0']} style={homestyles.avatar}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </LinearGradient>
          </View>
          <View style={homestyles.welcomeText}>
            <Text style={homestyles.greeting}>Bonjour 👋</Text>
            <Text style={homestyles.userName}>{userName}</Text>
          </View>
        </TouchableOpacity>
        <View style={homestyles.headerActions}>
          <TouchableOpacity style={homestyles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notifications > 0 && (
              <View style={[homestyles.notificationBadge, { backgroundColor: '#4D96FF' }]}>
                <Text style={homestyles.badgeText}>{notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={homestyles.menuBtn}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={homestyles.balanceCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={homestyles.balanceCardGradient}
        >
          <View style={homestyles.balanceHeader}>
            <Text style={homestyles.balanceLabel}>Solde disponible</Text>
            <TouchableOpacity>
              <Ionicons name="eye-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={homestyles.balanceAmount}>{balance.toLocaleString()} FCFA</Text>
          <View style={homestyles.balanceActions}>
            <TouchableOpacity style={homestyles.balanceBtn}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={homestyles.balanceBtnText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={homestyles.balanceBtn}>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={homestyles.balanceBtnText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </LinearGradient>
  );

  const QuickActionsComponent = () => (
    <View style={homestyles.section}>
      <View style={homestyles.sectionHeader}>
        <Text style={homestyles.sectionTitle}>Actions rapides</Text>
        <TouchableOpacity onPress={() => setShowQuickActions(!showQuickActions)}>
          <Text style={[homestyles.seeAll, { color: colors.primary }]}>
            {showQuickActions ? 'Réduire' : 'Voir tout'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={homestyles.quickActionsGrid}>
        {quickActions.slice(0, showQuickActions ? quickActions.length : 4).map((action) => (
          <TouchableOpacity key={action.id} style={homestyles.quickActionItem} activeOpacity={0.8}>
            <LinearGradient
              colors={[action.color + '20', action.color + '10']}
              style={homestyles.quickActionGradient}
            >
              <View style={[homestyles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={24} color="#fff" />
              </View>
              <Text style={homestyles.quickActionLabel}>{action.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const PromotionsComponent = () => (
    <View style={homestyles.section}>
      <Text style={homestyles.sectionTitle}>Offres spéciales</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={promotions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={homestyles.promotionCard} activeOpacity={0.9}>
            <LinearGradient colors={item.gradient} style={homestyles.promotionGradient}>
              <View style={homestyles.promotionContent}>
                <Ionicons name={item.icon} size={32} color="#fff" style={homestyles.promotionIcon} />
                <Text style={homestyles.promotionTitle}>{item.title}</Text>
                <Text style={homestyles.promotionDescription}>{item.description}</Text>
              </View>
              <View style={homestyles.promotionAction}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const StatsComponent = () => (
    <View style={homestyles.statsContainer}>
      {stats.map((stat, index) => (
        <View key={index} style={homestyles.statItem}>
          <View style={[homestyles.statIcon, { backgroundColor: stat.color + '20' }]}>
            <Ionicons name={stat.icon} size={20} color={stat.color} />
          </View>
          <Text style={homestyles.statValue}>{stat.value}</Text>
          <Text style={homestyles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const RecentOrdersComponent = () => (
    <View style={homestyles.section}>
      <View style={homestyles.sectionHeader}>
        <Text style={homestyles.sectionTitle}>Commandes récentes</Text>
        <TouchableOpacity>
          <Text style={[homestyles.seeAll, { color: colors.primary }]}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      {recentOrders.map((order) => (
        <TouchableOpacity key={order.id} style={homestyles.orderCard} activeOpacity={0.8}>
          <View style={homestyles.orderInfo}>
            <View style={[homestyles.orderIcon, { backgroundColor: order.color + '20' }]}>
              <Ionicons name="flame" size={20} color={order.color} />
            </View>
            <View style={homestyles.orderDetails}>
              <Text style={homestyles.orderType}>{order.type}</Text>
              <Text style={homestyles.orderMeta}>Quantité: {order.quantity} • {order.date}</Text>
            </View>
          </View>
          <View style={homestyles.orderRight}>
            <Text style={homestyles.orderPrice}>{order.price.toLocaleString()} F</Text>
            <View style={[homestyles.statusBadge, { backgroundColor: order.color + '20' }]}>
              <Text style={[homestyles.statusText, { color: order.color }]}>{order.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const FloatingActionButton = () => (
    <TouchableOpacity style={[homestyles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={homestyles.fabGradient}>
        <Ionicons name="add" size={24} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[homestyles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView
          style={homestyles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <HeaderComponent />
          <View style={homestyles.content}>
            <QuickActionsComponent />
            <PromotionsComponent />
            <StatsComponent />
            <RecentOrdersComponent />
          </View>
        </ScrollView>
      </Animated.View>
      <FloatingActionButton />
    </View>
  );
}
                                                                                                                                                                                                                                