import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/clientScreen';
import { API_BASE_URL } from '@/service/config';

const { width, height } = Dimensions.get('window');

// Constantes pour les statuts des commandes
const ORDER_STATUS = {
  PENDING: 'en_attente',
  CONFIRMED: 'confirme',
  IN_DELIVERY: 'en_livraison',
  DELIVERED: 'livre',
  CANCELLED: 'annule',
};

export default function OrderModal({
  visible,
  onClose,
  selectedProduct,
  clientInfo,
  onOrderSuccess,
  fetchUserCredit,
}) {
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState('normal');
  const [delivery, setDelivery] = useState('non');

  const handleOrder = async () => {
    if (!selectedProduct) {
      Alert.alert("Erreur", "Aucun produit sélectionné.");
      return;
    }
    if (!clientInfo._id) {
      Alert.alert("Erreur", "ID utilisateur manquant. Veuillez vous reconnecter.");
      return;
    }
    if (!selectedProduct.distributorId || selectedProduct.distributorId === 'inconnu') {
      Alert.alert("Erreur", "ID distributeur manquant. Veuillez sélectionner un autre produit.");
      return;
    }

    const productPrice = (selectedProduct.price || 0) * quantity;
    const deliveryFee = delivery === 'oui' ? (selectedProduct.deliveryFee || 0) : 0;
    const total = productPrice + deliveryFee;

    if (total > (clientInfo.credit || 0)) {
      Alert.alert(
        'Solde insuffisant',
        `Votre solde actuel (${(clientInfo.credit || 0).toLocaleString()} FCFA) est insuffisant pour cette commande (${total.toLocaleString()} FCFA).`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirmer la commande',
      `
        Produit: ${selectedProduct.name} (${selectedProduct.type})
        Quantité: ${quantity}
        Prix produit: ${productPrice.toLocaleString()} FCFA
        Frais livraison: ${deliveryFee.toLocaleString()} FCFA
        Total: ${total.toLocaleString()} FCFA
        Distributeur: ${selectedProduct.distributorName}
        Priorité: ${priority === 'normal' ? 'Normale' : priority === 'high' ? 'Haute' : 'Urgente'}
        Adresse: ${clientInfo.address}
        Livraison: ${delivery === 'oui' ? 'Oui' : 'Non'}
      `,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const commandeData = {
                userId: clientInfo._id,
                distributorId: selectedProduct.distributorId,
                product: {
                  name: selectedProduct.name,
                  type: selectedProduct.type,
                  quantity,
                  price: selectedProduct.price,
                },
                productPrice,
                deliveryFee,
                total,
                delivery: delivery === 'oui',
                address: clientInfo.address,
                clientName: clientInfo.name,
                clientPhone: clientInfo.phone,
                priority,
                status: ORDER_STATUS.PENDING,
              };

              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(commandeData),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
              }

              const data = await response.json();
              if (data.success) {
                // Réinitialiser les états
                setQuantity(1);
                setPriority('normal');
                setDelivery('non');
                
                // Fermer le modal
                onClose();
                
                // Appeler le callback de succès
                if (onOrderSuccess) {
                  onOrderSuccess({
                    product: selectedProduct,
                    quantity,
                    total,
                    newOrder: {
                      id: data.order?._id || `CMD${Date.now() + Math.floor(Math.random() * 10000)}`,
                      date: new Date().toLocaleString('fr-FR'),
                      produit: `${selectedProduct.name} (${selectedProduct.type})`,
                      quantite: quantity,
                      productPrice,
                      deliveryFee,
                      total,
                      statut: ORDER_STATUS.PENDING,
                      priority,
                      distributorName: selectedProduct.distributorName,
                      address: clientInfo.address,
                      type: selectedProduct.type,
                      delivery: delivery === 'oui',
                    }
                  });
                }

                Alert.alert('Succès', 'Votre commande a été passée avec succès !');
                
                // Recharger le crédit utilisateur
                if (fetchUserCredit) {
                  await fetchUserCredit();
                }
              } else {
                Alert.alert('Erreur', data.message || 'Échec de la commande.');
              }
            } catch (error) {
              console.error("❌ Erreur lors de la commande :", error);
              Alert.alert('Erreur', error.message || 'Impossible de passer la commande. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  };

  const resetModal = () => {
    setQuantity(1);
    setPriority('normal');
    setDelivery('non');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      onShow={resetModal}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
          {selectedProduct && (
            <>
              <View style={[styles.modalHeader, { marginBottom: 12 }]}>
                <Text style={[styles.modalTitle, { fontSize: 16 }]} numberOfLines={1}>
                  Commander {selectedProduct.name}
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Image
                    source={require('@/assets/images/express-gaz.png')}
                    style={[styles.modalProductImage, { width: 60, height: 60 }]}
                  />
                  <Text style={[styles.modalProductName, { fontSize: 16, marginBottom: 4 }]} numberOfLines={1}>
                    {selectedProduct.name}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={[styles.modalProductPrice, { fontSize: 16 }]}>
                      {selectedProduct.price?.toLocaleString() || 0} FCFA
                    </Text>
                    {selectedProduct.stock !== undefined && (
                      <Text style={[styles.modalProductDesc, { fontSize: 12, marginLeft: 10 }]}>
                        · Stock: {selectedProduct.stock}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.modalProductDistributor, { fontSize: 12 }]} numberOfLines={1}>
                    {selectedProduct.distributorName}
                  </Text>
                </View>
                {(selectedProduct.distance != null || selectedProduct.deliveryFee != null) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    {selectedProduct.distance != null && (
                      <Text style={{ fontSize: 12, color: '#718096' }}>
                        {selectedProduct.distance.toFixed(2)} km
                      </Text>
                    )}
                    {selectedProduct.deliveryFee != null && (
                      <Text style={{ fontSize: 12, color: '#718096' }}>
                        Livraison: {selectedProduct.deliveryFee.toLocaleString()} FCFA
                      </Text>
                    )}
                  </View>
                )}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Quantité:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      style={[styles.quantityButton, { width: 32, height: 32 }]}
                      onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#2E7D32" />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.quantityInput, {
                        width: 50,
                        height: 32,
                        fontSize: 14,
                        marginHorizontal: 8
                      }]}
                      value={quantity.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        setQuantity(Math.max(1, Math.min(num, selectedProduct.stock || 999)));
                      }}
                      keyboardType="numeric"
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={[styles.quantityButton, { width: 32, height: 32 }]}
                      onPress={() => setQuantity(Math.min(quantity + 1, selectedProduct.stock || 999))}
                    >
                      <Ionicons name="add" size={16} color="#2E7D32" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Priorité:</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {['normal', 'high', 'urgent'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          {
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: priority === level ? '#2E7D32' : '#E2E8F0',
                            backgroundColor: priority === level ? '#2E7D32' : '#fff',
                            flex: 1,
                            marginHorizontal: 2
                          }
                        ]}
                        onPress={() => setPriority(level)}
                      >
                        <Text style={{
                          color: priority === level ? '#fff' : '#4A5568',
                          fontSize: 12,
                          textAlign: 'center'
                        }}>
                          {level === 'normal' ? 'Normale' : level === 'high' ? 'Haute' : 'Urgente'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Livraison:</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {['oui', 'non'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: 6,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            backgroundColor: delivery === option ? '#2E7D32' : '#fff',
                            borderRadius: 6,
                            marginRight: option === 'oui' ? 4 : 0
                          }
                        ]}
                        onPress={() => setDelivery(option)}
                      >
                        <Text style={{
                          color: delivery === option ? '#fff' : '#4A5568',
                          fontSize: 12,
                          textAlign: 'center'
                        }}>
                          {option === 'oui' ? 'Oui' : 'Non'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#F7FAFC',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '500' }}>Total:</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2E7D32' }}>
                      {(
                        (selectedProduct.price || 0) * quantity +
                        (delivery === 'oui' ? (selectedProduct.deliveryFee || 0) : 0)
                      ).toLocaleString()} FCFA
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: '#718096',
                    marginTop: 4,
                    textAlign: 'right'
                  }}>
                    {delivery === 'oui' ? 'Livraison incluse' : 'À retirer sur place'}
                  </Text>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#718096' }}>
                      Votre solde: {(clientInfo.credit || 0).toLocaleString()} FCFA
                    </Text>
                    {((selectedProduct.price || 0) * quantity + (delivery === 'oui' ? (selectedProduct.deliveryFee || 0) : 0)) > (clientInfo.credit || 0) && (
                      <Text style={{ fontSize: 12, color: '#E53935', fontWeight: '500' }}>
                        Solde insuffisant
                      </Text>
                    )}
                  </View>
                </View>
              </ScrollView>
              <View style={{ marginTop: 'auto' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: ((selectedProduct.price || 0) * quantity + (delivery === 'oui' ? (selectedProduct.deliveryFee || 0) : 0)) > (clientInfo.credit || 0)
                      ? '#CCCCCC'
                      : '#2E7D32',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={handleOrder}
                  disabled={((selectedProduct.price || 0) * quantity + (delivery === 'oui' ? (selectedProduct.deliveryFee || 0) : 0)) > (clientInfo.credit || 0)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                    {((selectedProduct.price || 0) * quantity + (delivery === 'oui' ? (selectedProduct.deliveryFee || 0) : 0)) > (clientInfo.credit || 0)
                      ? 'Solde insuffisant'
                      : 'Confirmer la commande'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}