import React, { useCallback, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, useSegments } from 'expo-router';
import livreurStyles from '@/styles/livreur';
import { useTheme } from '@/contexts/ThemeContext';

const LivreurFooter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [activeTab, setActiveTab] = React.useState('home');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Déterminer l'onglet actif basé sur la route actuelle
    const currentPath = pathname || '';
    const lastSegment = segments[segments.length - 1] || '';
    
    console.log('📍 Current path:', currentPath);
    console.log('📍 Segments:', segments);
    console.log('📍 Last segment:', lastSegment);
    
    if (currentPath.includes('/wallet') || lastSegment === 'wallet') {
      setActiveTab('wallet');
    } else if (currentPath.includes('/historique') || lastSegment === 'historique') {
      setActiveTab('history');
    } else if (currentPath.includes('/settings') || lastSegment === 'settings') {
      setActiveTab('settings');
    } else if (currentPath.includes('/livreurScreen') || lastSegment === 'livreurScreen') {
      setActiveTab('home');
    } else {
      setActiveTab('home');
    }
  }, [pathname, segments]);

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
    <View style={[livreurStyles.footer, isDarkMode && { backgroundColor: '#1a1a1a', borderTopColor: '#333' }]}>
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
          <Ionicons name={tab.icon} size={24} color={activeTab === tab.key ? '#1565C0' : (isDarkMode ? '#aaa' : '#718096')} />
          <Text style={[livreurStyles.footerTabText, activeTab === tab.key && livreurStyles.activeTabText, isDarkMode && !activeTab && { color: '#aaa' }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LivreurFooter;
