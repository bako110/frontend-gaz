import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import styles from '@/styles/clientScreen';

export default function ClientFooter() {
  const router = useRouter();
  const pathname = usePathname();

  // Détermine l'onglet actif basé sur le chemin exact
  const isHomeActive = pathname === '/home/clientScreen';
  const isWalletActive = pathname === '/home/client/wallet';
  const isHistoriqueActive = pathname === '/home/client/historique';
  const isSettingActive = pathname === '/home/client/setting';

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.footerTab, isHomeActive ? styles.activeTab : null]}
        onPress={() => router.push('/home/clientScreen')}
      >
        <Ionicons 
          name="home-outline" 
          size={24} 
          color={isHomeActive ? '#2E7D32' : '#718096'} 
        />
        <Text style={[
          styles.footerTabText,
          isHomeActive ? styles.activeTabText : null
        ]}>
          Accueil
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerTab, isWalletActive ? styles.activeTab : null]}
        onPress={() => router.push('/home/client/wallet')}
      >
        <Ionicons 
          name="wallet-outline" 
          size={24} 
          color={isWalletActive ? '#2E7D32' : '#718096'} 
        />
        <Text style={[
          styles.footerTabText,
          isWalletActive ? styles.activeTabText : null
        ]}>
          Wallet
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerTab, isHistoriqueActive ? styles.activeTab : null]}
        onPress={() => router.push('/home/client/historique')}
      >
        <Ionicons 
          name="time-outline" 
          size={24} 
          color={isHistoriqueActive ? '#2E7D32' : '#718096'} 
        />
        <Text style={[
          styles.footerTabText,
          isHistoriqueActive ? styles.activeTabText : null
        ]}>
          Historique
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerTab, isSettingActive ? styles.activeTab : null]}
        onPress={() => router.push('/home/client/setting')}
      >
        <Ionicons 
          name="settings-outline" 
          size={24} 
          color={isSettingActive ? '#2E7D32' : '#718096'} 
        />
        <Text style={[
          styles.footerTabText,
          isSettingActive ? styles.activeTabText : null
        ]}>
          Paramètres
        </Text>
      </TouchableOpacity>
    </View>
  );
}
