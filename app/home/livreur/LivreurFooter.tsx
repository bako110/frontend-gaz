import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import livreurStyles from '@/styles/livreur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LivreurFooter = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('home');

  React.useEffect(() => {
    // Déterminer l'onglet actif basé sur la route actuelle
    const determineActiveTab = async () => {
      const currentPath = router.pathname;
      if (currentPath.includes('wallet')) setActiveTab('wallet');
      else if (currentPath.includes('historique')) setActiveTab('history');
      else if (currentPath.includes('settings')) setActiveTab('settings');
      else setActiveTab('home');
    };
    determineActiveTab();
  }, [router.pathname]);

  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.push('/home/livreurScreen');
        break;
      case 'wallet':
        router.push('/home/livreur/wallet');
        break;
      case 'history':
        router.push('/home/livreur/historique');
        break;
      case 'settings':
        router.push('/home/livreur/settings');
        break;
      default:
        break;
    }
  }, [router]);

  return (
    <View style={livreurStyles.footer}>
      {[
        { key: 'home', icon: 'home-outline', label: 'Accueil' },
        { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
        { key: 'history', icon: 'time-outline', label: 'Historique' },
        { key: 'settings', icon: 'settings-outline', label: 'Paramètres' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[livreurStyles.footerTab, activeTab === tab.key && livreurStyles.activeTab]}
          onPress={() => handleTabPress(tab.key)}
        >
          <Ionicons name={tab.icon} size={24} color={activeTab === tab.key ? '#1565C0' : '#718096'} />
          <Text style={[livreurStyles.footerTabText, activeTab === tab.key && livreurStyles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LivreurFooter;
