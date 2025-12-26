import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '@/styles/livreursettings';
import { API_BASE_URL } from '@/service/config';
import LivreurFooter from './LivreurFooter';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    address: '',
    balance: 0,
    photo: null,
  });
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isKYSModalVisible, setIsKYSModalVisible] = useState(false);
  const [isOrdersModalVisible, setIsOrdersModalVisible] = useState(false);
  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // États pour KYS
  const [idDocument, setIdDocument] = useState(null);
  const [livePhoto, setLivePhoto] = useState(null);
  const [kycStatus, setKycStatus] = useState('non_verifie');
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadUserData();
    fetchLivreurBalance();
    checkKYCStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      const parsedData = userProfileStr ? JSON.parse(userProfileStr) : JSON.parse(userDataStr || '{}');
      const user = userProfileStr ? parsedData.user : parsedData;
      setClientInfo({
        name: user?.name || parsedData?.profile?.name || 'Livreur',
        phone: user?.phone || parsedData?.profile?.phone || 'Non défini',
        address: user?.address || parsedData?.profile?.address || 'Non définie',
        photo: user?.photo || parsedData?.profile?.photo || null,
      });
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  };

  const toggleNotifications = () => setNotificationsEnabled(!notificationsEnabled);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace('/');
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue.');
            }
          },
        },
      ]
    );
  };

  const fetchLivreurBalance = async () => {
    try {
      setIsLoading(true);
      setError('');

      const livreurData = await AsyncStorage.getItem('userProfile');
      if (!livreurData) {
        setError("Aucune donnée livreur trouvée");
        setClientInfo(prev => ({
          ...prev,
          balance: 0,
        }));
        return;
      }

      const parsedData = JSON.parse(livreurData);
      const livreurId = parsedData.id || parsedData.user?.id;

      if (!livreurId) {
        setError("ID livreur non trouvé");
        setClientInfo(prev => ({
          ...prev,
          balance: 0,
        }));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/wallet/${livreurId}/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la récupération du solde.");
      }

      const data = await response.json();
      const balanceValue = data.balance?.balance || data.balance || data.data?.balance || 0;

      setClientInfo(prev => ({
        ...prev,
        balance: balanceValue,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération du solde livreur :", error);
      setError(error.message || "Impossible de charger le solde.");
      setClientInfo(prev => ({
        ...prev,
        balance: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkKYCStatus = async () => {
    try {
      const livreurData = await AsyncStorage.getItem('userProfile');
      if (!livreurData) return;

      const parsedData = JSON.parse(livreurData);
      const livreurId = parsedData.id || parsedData.user?.id;

      if (!livreurId) return;

      const response = await fetch(`${API_BASE_URL}/auth/livreur/${livreurId}/kyc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const kycData = await response.json();
        setKycStatus(kycData.status || 'non_verifie');
      }
    } catch (error) {
      console.error("Erreur vérification statut KYS livreur:", error);
    }
  };

  const handleChangePin = () => setIsPinModalVisible(true);

  const handlePinChangeSubmit = () => {
    if (newPin !== confirmPin) {
      Alert.alert('Erreur', 'Les nouveaux codes PIN ne correspondent pas.');
      return;
    }
    if (newPin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit comporter 4 chiffres.');
      return;
    }
    Alert.alert('Succès', 'Votre code PIN a été changé avec succès.');
    setIsPinModalVisible(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const pickDocument = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'La permission de la galerie est nécessaire');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setIdDocument(result.assets[0]);
        Alert.alert('Succès', 'Document d\'identité sélectionné avec succès');
      }
    } catch (error) {
      console.error('Erreur sélection document:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection du document');
    }
  };

  const takeLivePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'La permission de la caméra est nécessaire');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setLivePhoto(result.assets[0]);
        Alert.alert('Succès', 'Photo en direct capturée avec succès');
      }
    } catch (error) {
      console.error('Erreur capture photo:', error);
      Alert.alert('Erreur', 'Erreur lors de la capture de la photo');
    }
  };

  const changeProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'La permission de la galerie est nécessaire');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setClientInfo(prev => ({ ...prev, photo: result.assets[0].uri }));
        Alert.alert('Succès', 'Photo de profil changée avec succès');
      }
    } catch (error) {
      console.error('Erreur changement photo:', error);
      Alert.alert('Erreur', 'Erreur lors du changement de photo');
    }
  };

  const submitKYC = async () => {
    if (!idDocument) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre pièce d\'identité');
      return;
    }
    if (!livePhoto) {
      Alert.alert('Erreur', 'Veuillez prendre une photo en direct');
      return;
    }

    try {
      setIsSubmittingKYC(true);

      const livreurData = await AsyncStorage.getItem('userProfile');
      if (!livreurData) {
        Alert.alert('Erreur', 'Données livreur non trouvées');
        return;
      }

      const parsedData = JSON.parse(livreurData);
      const livreurId = parsedData.id || parsedData.user?.id;

      if (!livreurId) {
        Alert.alert('Erreur', 'ID livreur non trouvé');
        return;
      }

      const formData = new FormData();

      formData.append('idDocument', {
        uri: idDocument.uri,
        type: 'image/jpeg',
        name: 'id_document.jpg'
      });

      formData.append('livePhoto', {
        uri: livePhoto.uri,
        type: 'image/jpeg',
        name: 'live_photo.jpg'
      });

      formData.append('livreurId', livreurId);
      formData.append('submissionDate', new Date().toISOString());

      const response = await fetch(`${API_BASE_URL}/auth/livreur/${livreurId}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la soumission KYS');
      }

      const result = await response.json();
      setKycStatus('en_cours');

      Alert.alert(
        'Demande soumise',
        'Votre demande de vérification KYS a été soumise avec succès. Vous serez notifié une fois la vérification terminée.',
        [{
          text: 'OK',
          onPress: () => {
            setIsKYSModalVisible(false);
            setIdDocument(null);
            setLivePhoto(null);
          }
        }]
      );

    } catch (error) {
      console.error('Erreur soumission KYS livreur:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la soumission de votre demande KYS. Veuillez réessayer.'
      );
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const getKYCStatusText = () => {
    switch (kycStatus) {
      case 'non_verifie': return 'Non vérifié';
      case 'en_cours': return 'En cours de vérification';
      case 'verifie': return 'Vérifié ✓';
      case 'rejete': return 'Rejeté';
      default: return 'Non vérifié';
    }
  };

  const getKYCStatusColor = () => {
    switch (kycStatus) {
      case 'non_verifie': return '#ff6b6b';
      case 'en_cours': return '#ffa726';
      case 'verifie': return '#4caf50';
      case 'rejete': return '#f44336';
      default: return '#ff6b6b';
    }
  };

  const menuOptions = [
    {
      id: 'profile',
      label: 'Mon Profil',
      icon: <Ionicons name="person-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />,
      onPress: () => setIsProfileModalVisible(true),
    },
    {
      id: 'kyc',
      label: 'Vérification KYS',
      icon: <MaterialIcons name="verified-user" size={22} color={isDarkMode ? '#fff' : '#000'} />,
      onPress: () => setIsKYSModalVisible(true),
    },
    {
      id: 'language',
      label: 'Langue',
      icon: <Ionicons name="language-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />,
      onPress: () => setIsLanguageModalVisible(true),
    },
    {
      id: 'help',
      label: 'Aide & Support',
      icon: <Ionicons name="help-circle-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />,
      onPress: () => setIsHelpModalVisible(true),
    },
    {
      id: 'about',
      label: 'À propos',
      icon: <Ionicons name="information-circle-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />,
      onPress: () => setIsAboutModalVisible(true),
    },
  ];

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#2d2d2d'] : ['#1565C0', '#1565C0']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutHeaderButton, { marginTop: 15 }]}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerText, { marginTop: 30 }]}>Paramètres</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { marginTop: 15 }]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.profileSection, isDarkMode ? styles.darkCard : styles.lightCard]}>
            <View style={styles.avatarContainer}>
              {clientInfo.photo ? (
                <Image source={{ uri: clientInfo.photo }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle" size={60} color={isDarkMode ? '#fff' : '#1976D2'} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, isDarkMode ? styles.darkText : styles.lightText]}>
                {clientInfo.name}
              </Text>
              <Text style={styles.profilePhone}>{clientInfo.phone}</Text>
              <Text style={styles.profileAddress}>{clientInfo.address}</Text>
            </View>
          </View>

          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionButton, isDarkMode ? styles.darkOptionButton : styles.lightOptionButton]}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.iconContainer, isDarkMode ? styles.darkIconContainer : styles.lightIconContainer]}>
                  {option.icon}
                </View>
                <Text style={[styles.optionText, isDarkMode ? styles.darkText : styles.lightText]}>
                  {option.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#fff' : '#666'} />
            </TouchableOpacity>
          ))}

          <View style={[styles.switchContainer, isDarkMode ? styles.darkCard : styles.lightCard]}>
            <View style={styles.switchItem}>
              <View style={styles.switchLeft}>
                <Ionicons name="moon-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.switchText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Mode Sombre
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={[styles.optionButton, isDarkMode ? styles.darkOptionButton : styles.lightOptionButton]}
              onPress={handleChangePin}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.iconContainer, isDarkMode ? styles.darkIconContainer : styles.lightIconContainer]}>
                  <MaterialIcons name="security" size={22} color={isDarkMode ? '#fff' : '#000'} />
                </View>
                <Text style={[styles.optionText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Changer de PIN
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#fff' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={isPinModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
              Changer de PIN
            </Text>
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              placeholder="Ancien PIN"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={currentPin}
              onChangeText={setCurrentPin}
            />
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              placeholder="Nouveau PIN (4 chiffres)"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              placeholder="Confirmer le nouveau PIN"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={confirmPin}
              onChangeText={setConfirmPin}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, isDarkMode ? styles.darkCancelButton : styles.lightCancelButton]}
                onPress={() => {
                  setIsPinModalVisible(false);
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                }}
              >
                <Text style={[styles.buttonText, isDarkMode ? styles.darkButtonText : styles.lightButtonText]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handlePinChangeSubmit}>
                <Text style={styles.submitButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isProfileModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                Mon Profil
              </Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileModalContent}>
              <View style={styles.avatarContainerModal}>
                {clientInfo.photo ? (
                  <Image source={{ uri: clientInfo.photo }} style={styles.profileImageModal} />
                ) : (
                  <Ionicons name="person-circle" size={80} color={isDarkMode ? '#fff' : '#1976D2'} />
                )}
                <TouchableOpacity style={styles.editPhotoButton} onPress={changeProfilePhoto}>
                  <Text style={styles.editPhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfoModal}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Nom complet</Text>
                  <Text style={[styles.infoValue, isDarkMode ? styles.darkText : styles.lightText]}>{clientInfo.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Téléphone</Text>
                  <Text style={[styles.infoValue, isDarkMode ? styles.darkText : styles.lightText]}>{clientInfo.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Adresse</Text>
                  <Text style={[styles.infoValue, isDarkMode ? styles.darkText : styles.lightText]}>{clientInfo.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Email</Text>
                  <Text style={[styles.infoValue, isDarkMode ? styles.darkText : styles.lightText]}>livreur@example.com</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editProfileButton}>
                <Text style={styles.editProfileText}>Modifier le profil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isKYSModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal, styles.kycModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                Vérification KYS
              </Text>
              <TouchableOpacity onPress={() => setIsKYSModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            <View style={styles.kycContent}>
              <View style={styles.kycStatus}>
                <Text style={[styles.kycStatusText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Statut:
                </Text>
                <Text style={[styles.kycStatusValue, { color: getKYCStatusColor() }]}>
                  {getKYCStatusText()}
                </Text>
              </View>

              {/* Afficher le message si le statut est "en_cours" */}
              {(kycStatus === 'en_cours' || kycStatus === 'verifie') && (
                <View style={styles.kycMessage}>
                  <Ionicons
                    name={kycStatus === 'verifie' ? "checkmark-circle" : "time"}
                    size={32}
                    color={getKYCStatusColor()}
                  />
                  <Text style={[
                    styles.kycMessageText,
                    isDarkMode ? styles.darkText : styles.lightText
                  ]}>
                    {kycStatus === 'verifie'
                      ? 'Votre identité a été vérifiée avec succès.'
                      : 'Votre demande de vérification est en cours de traitement.'}
                  </Text>
                  {kycStatus === 'en_cours' && (
                    <Text style={[
                      styles.kycMessageSubText,
                      isDarkMode ? styles.darkText : styles.lightText
                    ]}>
                      Vous ne pouvez pas soumettre de nouveaux documents pendant la vérification.
                    </Text>
                  )}
                </View>
              )}

              {/* Afficher les étapes d'upload seulement si le statut est "non_verifie" ou "rejete" */}
              {(kycStatus === 'non_verifie' || kycStatus === 'rejete') && (
                <>
                  <Text style={[styles.kycDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                    {kycStatus === 'rejete'
                      ? 'Votre précédente vérification a été rejetée. Veuillez soumettre à nouveau vos documents :'
                      : 'Pour compléter votre vérification KYS, veuillez fournir les documents suivants :'}
                  </Text>

                  <View style={styles.kycSteps}>
                    <View style={styles.kycStep}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>1</Text>
                        <Text style={[styles.stepTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                          Pièce d'identité
                        </Text>
                      </View>
                      <Text style={[styles.stepDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                        Carte nationale d'identité, passeport ou permis de conduire
                      </Text>
                      <TouchableOpacity
                        style={[styles.uploadButton, idDocument && styles.uploadButtonSuccess]}
                        onPress={pickDocument}
                      >
                        <Ionicons
                          name={idDocument ? "checkmark-circle" : "document-attach"}
                          size={24}
                          color={idDocument ? "#4caf50" : (isDarkMode ? "#fff" : "#000")}
                        />
                        <Text style={[
                          styles.uploadButtonText,
                          isDarkMode ? styles.darkText : styles.lightText,
                          idDocument && styles.uploadButtonTextSuccess
                        ]}>
                          {idDocument ? 'Document sélectionné' : 'Sélectionner le document'}
                        </Text>
                      </TouchableOpacity>
                      {idDocument && (
                        <Text style={styles.selectedFileText}>
                          Fichier: {idDocument.fileName || 'Image sélectionnée'}
                        </Text>
                      )}
                    </View>

                    <View style={styles.kycStep}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={[styles.stepTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                          Photo en direct
                        </Text>
                      </View>
                      <Text style={[styles.stepDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                        Prenez une photo de vous en temps réel pour vérification
                      </Text>
                      <TouchableOpacity
                        style={[styles.uploadButton, livePhoto && styles.uploadButtonSuccess]}
                        onPress={takeLivePhoto}
                      >
                        <Ionicons
                          name={livePhoto ? "checkmark-circle" : "camera"}
                          size={24}
                          color={livePhoto ? "#4caf50" : (isDarkMode ? "#fff" : "#000")}
                        />
                        <Text style={[
                          styles.uploadButtonText,
                          isDarkMode ? styles.darkText : styles.lightText,
                          livePhoto && styles.uploadButtonTextSuccess
                        ]}>
                          {livePhoto ? 'Photo prise' : 'Prendre une photo'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Bouton de soumission seulement si les documents sont prêts */}
                  {idDocument && livePhoto && (
                    <TouchableOpacity
                      style={[
                        styles.submitKYCButton,
                        isSubmittingKYC && styles.submitKYCButtonDisabled
                      ]}
                      onPress={submitKYC}
                      disabled={isSubmittingKYC}
                    >
                      {isSubmittingKYC ? (
                        <Text style={styles.submitKYCButtonText}>
                          Soumission en cours...
                        </Text>
                      ) : (
                        <Text style={styles.submitKYCButtonText}>
                          {kycStatus === 'rejete' ? 'Soumettre à nouveau' : 'Soumettre la vérification'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isOrdersModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                Mes Livraisons
              </Text>
              <TouchableOpacity onPress={() => setIsOrdersModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, isDarkMode ? styles.darkText : styles.lightText]}>
              Aucune livraison récente.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={isWalletModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                Mon Portefeuille
              </Text>
              <TouchableOpacity onPress={() => setIsWalletModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <View style={styles.walletBalance}>
              <Text style={[styles.balanceLabel, isDarkMode ? styles.darkText : styles.lightText]}>
                Solde disponible
              </Text>

              {isLoading ? (
                <Text style={styles.loadingText}>Chargement du solde...</Text>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchLivreurBalance}
                  >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.balanceAmount}>
                  {(clientInfo.balance || 0).toLocaleString()} FCFA
                </Text>
              )}
            </View>

            {/* Message informatif si le solde est zéro */}
            {!isLoading && !error && (clientInfo.balance === 0 || clientInfo.balance === null) && (
              <View style={styles.zeroBalanceMessage}>
                <Ionicons name="information-circle-outline" size={20} color="#ffa726" />
                <Text style={styles.zeroBalanceText}>
                  Votre solde est actuellement de 0 FCFA
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={isLanguageModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                Langue
              </Text>
              <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, isDarkMode ? styles.darkText : styles.lightText]}>
              Langue actuelle : Français
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={isHelpModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                Aide & Support
              </Text>
              <TouchableOpacity onPress={() => setIsHelpModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, isDarkMode ? styles.darkText : styles.lightText]}>
              Contact : support@app.bf{'\n'}
              Tél : +226 70 00 00 00
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={isAboutModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                À propos
              </Text>
              <TouchableOpacity onPress={() => setIsAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, isDarkMode ? styles.darkText : styles.lightText]}>
              App Livraison v2.0.0{'\n'}
              © 2025 Burkina Tech
            </Text>
          </View>
        </View>
      </Modal>
      
      <LivreurFooter />
    </View>
  );
}