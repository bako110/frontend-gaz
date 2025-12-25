import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function DistributorFooter() {
  const router = useRouter();
  const pathname = usePathname();

  // Détermine l'onglet actif basé sur le chemin exact
  const isHomeActive = pathname === '/home/distributeurScreen' || pathname.endsWith('distributeurScreen');
  const isOrdersActive = pathname === '/home/distributeur/new-order';
  const isWalletActive = pathname === '/home/distributeur/wallet';
  const isSettingActive = pathname === '/home/distributeur/setting';

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.footerTab, isHomeActive ? styles.activeTab : null]}
        onPress={() => router.replace('/home/distributeurScreen')}
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
        activeOpacity={0.6}
        style={[styles.footerTab, isOrdersActive ? styles.activeTab : null]}
        onPress={() => router.replace('/home/distributeur/new-order')}
      >
        <Ionicons 
          name="add-circle-outline" 
          size={24} 
          color={isOrdersActive ? '#2E7D32' : '#718096'} 
        />
        <Text style={[
          styles.footerTabText,
          isOrdersActive ? styles.activeTabText : null
        ]}>
          Commandes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.footerTab, isWalletActive ? styles.activeTab : null]}
        onPress={() => router.replace('/home/distributeur/wallet')}
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
        activeOpacity={0.6}
        style={[styles.footerTab, isSettingActive ? styles.activeTab : null]}
        onPress={() => router.replace('/home/distributeur/setting')}
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

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 18,
    elevation: 2,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  footerTabText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
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
