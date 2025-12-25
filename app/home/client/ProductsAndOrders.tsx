import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProductsAndOrders() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Produits et Commandes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
