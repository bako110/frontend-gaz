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
import { ImagePickerAsset } from 'expo-image-picker';
import { styles } from '@/styles/livreursettings';
import { API_BASE_URL } from '@/service/config';
import LivreurFooter from './LivreurFooter';
import { useTheme } from '@/contexts/ThemeContext';
import HelpSupportModal from '@/components/HelpSupportModal';

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
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
  const [idDocumentFront, setIdDocumentFront] = useState<ImagePickerAsset | null>(null);
  const [idDocumentBack, setIdDocumentBack] = useState<ImagePickerAsset | null>(null);
  const [facePhoto, setFacePhoto] = useState<ImagePickerAsset | null>(null);
  const [kycStatus, setKycStatus] = useState('non_verifie');
  const [kycComments, setKycComments] = useState('');
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [currentKycStep, setCurrentKycStep] = useState(1);
  const [documentFrontQuality, setDocumentFrontQuality] = useState<'analyzing' | 'good' | 'poor' | null>(null);
  const [documentBackQuality, setDocumentBackQuality] = useState<'analyzing' | 'good' | 'poor' | null>(null);
  const [facePhotoQuality, setFacePhotoQuality] = useState<'analyzing' | 'good' | 'poor' | null>(null);

  // États pour l'édition du profil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<ImagePickerAsset | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      const profile = parsedData?.profile || {};
      
      setClientInfo({
        name: user?.name || profile?.name || 'Livreur',
        phone: user?.phone || profile?.phone || 'Non défini',
        address: profile?.address || user?.address || 'Non définie',
        email: profile?.email || user?.email || '',
        photo: user?.photo || profile?.photo || null,
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

      if (!livreurId) {
        console.log('⚠️ checkKYCStatus - livreurId manquant');
        return;
      }

      console.log('🔍 Récupération statut KYC pour livreur:', livreurId);

      const response = await fetch(`${API_BASE_URL}/auth/${livreurId}/kyc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Statut réponse KYC:', response.status);

      if (response.ok) {
        const kycData = await response.json();
        console.log('✅ Statut KYC récupéré:', kycData.status);
        setKycStatus(kycData.status || 'non_verifie');
      } else {
        console.log('⚠️ Erreur récupération KYC, status par défaut: non_verifie');
        setKycStatus('non_verifie');
      }
    } catch (error) {
      console.error("❌ Erreur vérification statut KYS livreur:", error);
      setKycStatus('non_verifie');
    }
  };

  const handleChangePin = () => setIsPinModalVisible(true);

  const handlePinChangeSubmit = async () => {
    if (!currentPin || currentPin.length !== 4) {
      Alert.alert('Erreur', 'Veuillez entrer votre ancien PIN (4 chiffres).');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Erreur', 'Les nouveaux codes PIN ne correspondent pas.');
      return;
    }
    if (newPin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit comporter 4 chiffres.');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/pin/change-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: clientInfo.phone,
          currentPin: currentPin,
          newPin: newPin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', 'Votre code PIN a été changé avec succès.');
        setIsPinModalVisible(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        Alert.alert('Erreur', data.error || 'Erreur lors du changement de PIN.');
      }
    } catch (error) {
      console.error('Erreur changement PIN:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du changement de PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImageQuality = async (imageAsset: ImagePickerAsset): Promise<'good' | 'poor'> => {
    // Analyse basée sur les dimensions et la taille du fichier
    const hasGoodDimensions = (imageAsset.width >= 800 && imageAsset.height >= 600);
    const hasGoodFileSize = !imageAsset.fileSize || imageAsset.fileSize > 100000; // > 100KB
    
    return (hasGoodDimensions && hasGoodFileSize) ? 'good' : 'poor';
  };

  const scanDocumentFront = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'La permission de la caméra est nécessaire');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.9,
      });
      if (!result.canceled && result.assets.length > 0) {
        setIdDocumentFront(result.assets[0]);
        setCurrentKycStep(2);
      }
    } catch (error) {
      console.error('Erreur scan recto:', error);
      Alert.alert('Erreur', 'Erreur lors du scan du recto');
    }
  };

  const scanDocumentBack = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'La permission de la caméra est nécessaire');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.9,
      });
      if (!result.canceled && result.assets.length > 0) {
        setIdDocumentBack(result.assets[0]);
        setCurrentKycStep(3);
      }
    } catch (error) {
      console.error('Erreur scan verso:', error);
      Alert.alert('Erreur', 'Erreur lors du scan du verso');
    }
  };

  const captureFacePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'La permission de la caméra est nécessaire');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled && result.assets.length > 0) {
        setFacePhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur capture visage:', error);
      Alert.alert('Erreur', 'Erreur lors de la capture du visage');
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
        setSelectedPhoto(result.assets[0]);
        Alert.alert('Succès', 'Photo de profil sélectionnée');
      }
    } catch (error) {
      console.error('Erreur changement photo:', error);
      Alert.alert('Erreur', 'Erreur lors du changement de photo');
    }
  };

  const startEditingProfile = () => {
    setEditName(clientInfo.name);
    setEditAddress(clientInfo.address);
    setEditEmail(clientInfo.email);
    setSelectedPhoto(null);
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    try {
      setIsSavingProfile(true);
      
      const livreurData = await AsyncStorage.getItem('userProfile');
      if (!livreurData) {
        Alert.alert('Erreur', 'Données utilisateur non trouvées');
        return;
      }

      const parsedData = JSON.parse(livreurData);
      const userId = parsedData.user?.id || parsedData.id;
      
      if (!userId) {
        Alert.alert('Erreur', 'ID utilisateur non trouvé');
        return;
      }

      const formData = new FormData();
      formData.append('name', editName);
      formData.append('address', editAddress);
      if (editEmail) {
        formData.append('email', editEmail);
      }

      if (selectedPhoto) {
        formData.append('photo', {
          uri: selectedPhoto.uri,
          type: 'image/jpeg',
          name: 'profile_photo.jpg'
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/auth/${userId}/profile`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setClientInfo(prev => ({
          ...prev,
          name: data.user.name,
          address: data.profile?.address || editAddress,
          email: data.profile?.email || editEmail,
          photo: data.user.photo || (selectedPhoto ? selectedPhoto.uri : prev.photo),
        }));

        const updatedProfile = {
          ...parsedData,
          user: {
            ...parsedData.user,
            name: data.user.name,
            photo: data.user.photo,
          },
          profile: {
            ...parsedData.profile,
            address: data.profile?.address || editAddress,
            email: data.profile?.email || editEmail,
          }
        };

        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setIsEditingProfile(false);
        setSelectedPhoto(null);
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde profil:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const submitKYC = async () => {
    if (!idDocumentFront) {
      Alert.alert('Erreur', 'Veuillez scanner le recto de votre pièce d\'identité');
      return;
    }
    if (!idDocumentBack) {
      Alert.alert('Erreur', 'Veuillez scanner le verso de votre pièce d\'identité');
      return;
    }
    if (!facePhoto) {
      Alert.alert('Erreur', 'Veuillez prendre une photo de votre visage');
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

      formData.append('idDocumentFront', {
        uri: idDocumentFront.uri,
        type: 'image/jpeg',
        name: 'id_document_front.jpg'
      } as any);

      formData.append('idDocumentBack', {
        uri: idDocumentBack.uri,
        type: 'image/jpeg',
        name: 'id_document_back.jpg'
      } as any);

      formData.append('facePhoto', {
        uri: facePhoto.uri,
        type: 'image/jpeg',
        name: 'face_photo.jpg'
      } as any);

      formData.append('livreurId', livreurId);
      formData.append('submissionDate', new Date().toISOString());

      const response = await fetch(`${API_BASE_URL}/auth/${livreurId}/kyc`, {
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
        'Votre demande de vérification KYS a été soumise avec succès.',
        [{
          text: 'OK',
          onPress: () => {
            setIsKYSModalVisible(false);
            setIdDocumentFront(null);
            setIdDocumentBack(null);
            setFacePhoto(null);
            setCurrentKycStep(1);
          }
        }]
      );

    } catch (error: any) {
      console.error('Erreur soumission KYS livreur:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue.');
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
      id: 'messaging',
      label: 'Messagerie',
      icon: <Ionicons name="chatbubbles-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />,
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { marginTop: 15 }]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerText, { marginTop: 30 }]}>Paramètres</Text>
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutHeaderButton, { marginTop: 15 }]}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
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
                <Text style={styles.buttonText}>
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
                {isEditingProfile && (
                  <TouchableOpacity style={styles.editPhotoButton} onPress={changeProfilePhoto}>
                    <Text style={styles.editPhotoText}>Changer la photo</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditingProfile ? (
                <View style={styles.profileInfoModal}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Nom complet</Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Votre nom"
                      placeholderTextColor={isDarkMode ? '#888' : '#999'}
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Téléphone</Text>
                    <Text style={[styles.infoValue, isDarkMode ? styles.darkText : styles.lightText]}>{clientInfo.phone}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Adresse</Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                      value={editAddress}
                      onChangeText={setEditAddress}
                      placeholder="Votre adresse"
                      placeholderTextColor={isDarkMode ? '#888' : '#999'}
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, isDarkMode ? styles.darkText : styles.lightText]}>Email</Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholder="Votre email"
                      placeholderTextColor={isDarkMode ? '#888' : '#999'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              ) : (
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
                    <Text style={[styles.infoValue, isDarkMode ? styles.darkText : styles.lightText]}>{clientInfo.email || 'Non défini'}</Text>
                  </View>
                </View>
              )}
              
              {isEditingProfile ? (
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, isDarkMode ? styles.darkCancelButton : styles.lightCancelButton]}
                    onPress={() => setIsEditingProfile(false)}
                  >
                    <Text style={styles.buttonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={saveProfile}
                    disabled={isSavingProfile}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.editProfileButton, { backgroundColor: '#1565C0', padding: 15, borderRadius: 8, marginTop: 20 }]} 
                  onPress={startEditingProfile}
                >
                  <Text style={[styles.editProfileText, { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }]}>
                    Modifier le profil
                  </Text>
                </TouchableOpacity>
              )}
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
            <ScrollView style={styles.kycContent} showsVerticalScrollIndicator={false}>
              <View style={styles.kycStatus}>
                <Text style={[styles.kycStatusText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Statut:
                </Text>
                <Text style={[styles.kycStatusValue, { color: getKYCStatusColor() }]}>
                  {getKYCStatusText()}
                </Text>
              </View>

              {/* Afficher le message si le statut est "en_cours" ou "verifie" */}
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

              {/* Afficher le message de rejet de l'admin */}
              {kycStatus === 'rejete' && (
                <View style={[styles.kycMessage, { backgroundColor: '#ffebee', borderColor: '#f44336' }]}>
                  <Ionicons
                    name="close-circle"
                    size={32}
                    color="#f44336"
                  />
                  <Text style={[
                    styles.kycMessageText,
                    { color: '#d32f2f', fontWeight: 'bold' }
                  ]}>
                    Votre demande de vérification a été rejetée
                  </Text>
                  <View style={styles.rejectionReasonBox}>
                    <Text style={styles.rejectionReasonLabel}>Raison du rejet :</Text>
                    <Text style={styles.rejectionReasonText}>
                      {kycComments || 'Aucune raison fournie'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.kycMessageSubText,
                    { color: '#666', marginTop: 10 }
                  ]}>
                    Veuillez corriger les problèmes mentionnés et soumettre à nouveau vos documents.
                  </Text>
                </View>
              )}

              {(kycStatus === 'non_verifie' || kycStatus === 'rejete') && (
                <>
                  <Text style={[styles.kycDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                    {kycStatus === 'rejete'
                      ? 'Votre précédente vérification a été rejetée. Veuillez soumettre à nouveau vos documents.'
                      : 'Vérifiez votre identité en 3 étapes simples'}
                  </Text>

                  <View style={styles.progressIndicator}>
                    <View style={[styles.progressDot, currentKycStep >= 1 && styles.progressDotActive]}>
                      <Text style={styles.progressDotText}>1</Text>
                    </View>
                    <View style={[styles.progressLine, currentKycStep >= 2 && styles.progressLineActive]} />
                    <View style={[styles.progressDot, currentKycStep >= 2 && styles.progressDotActive]}>
                      <Text style={styles.progressDotText}>2</Text>
                    </View>
                    <View style={[styles.progressLine, currentKycStep >= 3 && styles.progressLineActive]} />
                    <View style={[styles.progressDot, currentKycStep >= 3 && styles.progressDotActive]}>
                      <Text style={styles.progressDotText}>3</Text>
                    </View>
                  </View>

                  {currentKycStep === 1 && (
                    <View style={styles.scanStepContainer}>
                      <View style={styles.scanIconContainer}>
                        <Ionicons name="card-outline" size={80} color="#1565C0" />
                      </View>
                      <Text style={[styles.scanStepTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                        Scanner le recto
                      </Text>
                      <Text style={[styles.scanStepDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                        Placez le recto de votre pièce d'identité dans le cadre et scannez
                      </Text>
                      {idDocumentFront && (
                        <View style={styles.previewContainer}>
                          <Image source={{ uri: idDocumentFront.uri }} style={styles.previewImage} />
                          <TouchableOpacity 
                            style={styles.retakeButton}
                            onPress={() => setIdDocumentFront(null)}
                          >
                            <Ionicons name="refresh" size={20} color="#fff" />
                            <Text style={styles.retakeButtonText}>Reprendre</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.scanButton}
                        onPress={scanDocumentFront}
                      >
                        <Ionicons name="scan" size={24} color="#fff" />
                        <Text style={styles.scanButtonText}>
                          {idDocumentFront ? 'Scanner à nouveau' : 'Scanner le recto'}
                        </Text>
                      </TouchableOpacity>
                      {idDocumentFront && (
                        <TouchableOpacity
                          style={styles.nextButton}
                          onPress={() => setCurrentKycStep(2)}
                        >
                          <Text style={styles.nextButtonText}>Continuer</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {currentKycStep === 2 && (
                    <View style={styles.scanStepContainer}>
                      <View style={styles.scanIconContainer}>
                        <Ionicons name="card" size={80} color="#1565C0" />
                      </View>
                      <Text style={[styles.scanStepTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                        Scanner le verso
                      </Text>
                      <Text style={[styles.scanStepDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                        Retournez votre pièce d'identité et scannez le verso
                      </Text>
                      {idDocumentBack && (
                        <View style={styles.previewContainer}>
                          <Image source={{ uri: idDocumentBack.uri }} style={styles.previewImage} />
                          <TouchableOpacity 
                            style={styles.retakeButton}
                            onPress={() => setIdDocumentBack(null)}
                          >
                            <Ionicons name="refresh" size={20} color="#fff" />
                            <Text style={styles.retakeButtonText}>Reprendre</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.scanButton}
                        onPress={scanDocumentBack}
                      >
                        <Ionicons name="scan" size={24} color="#fff" />
                        <Text style={styles.scanButtonText}>
                          {idDocumentBack ? 'Scanner à nouveau' : 'Scanner le verso'}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.stepNavigation}>
                        <TouchableOpacity
                          style={styles.backStepButton}
                          onPress={() => setCurrentKycStep(1)}
                        >
                          <Ionicons name="arrow-back" size={20} color="#1565C0" />
                          <Text style={styles.backStepButtonText}>Retour</Text>
                        </TouchableOpacity>
                        {idDocumentBack && (
                          <TouchableOpacity
                            style={styles.nextButton}
                            onPress={() => setCurrentKycStep(3)}
                          >
                            <Text style={styles.nextButtonText}>Continuer</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {currentKycStep === 3 && (
                    <View style={styles.scanStepContainer}>
                      <View style={styles.scanIconContainer}>
                        <Ionicons name="person-circle-outline" size={80} color="#1565C0" />
                      </View>
                      <Text style={[styles.scanStepTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                        Photo de votre visage
                      </Text>
                      <Text style={[styles.scanStepDescription, isDarkMode ? styles.darkText : styles.lightText]}>
                        Prenez une photo claire de votre visage pour la vérification
                      </Text>
                      {facePhoto && (
                        <View style={styles.previewContainer}>
                          <Image source={{ uri: facePhoto.uri }} style={styles.previewImageFace} />
                        </View>
                      )}
                      {!facePhoto && (
                        <TouchableOpacity
                          style={styles.scanButton}
                          onPress={captureFacePhoto}
                        >
                          <Ionicons name="camera" size={24} color="#fff" />
                          <Text style={styles.scanButtonText}>Prendre une photo</Text>
                        </TouchableOpacity>
                      )}
                      <View style={styles.stepNavigation}>
                        <TouchableOpacity
                          style={styles.backStepButton}
                          onPress={() => setCurrentKycStep(2)}
                        >
                          <Ionicons name="arrow-back" size={20} color="#1565C0" />
                          <Text style={styles.backStepButtonText}>Retour</Text>
                        </TouchableOpacity>
                        {facePhoto && (
                          <TouchableOpacity
                            style={styles.backStepButton}
                            onPress={() => setFacePhoto(null)}
                          >
                            <Ionicons name="refresh" size={16} color="#1565C0" />
                            <Text style={styles.backStepButtonText}>Reprendre</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {facePhoto && idDocumentFront && idDocumentBack && (
                        <TouchableOpacity
                          style={[styles.submitKYCButton, isSubmittingKYC && styles.submitKYCButtonDisabled]}
                          onPress={submitKYC}
                          disabled={isSubmittingKYC}
                        >
                          <Text style={styles.submitKYCButtonText}>
                            {isSubmittingKYC ? 'Soumission...' : 'Soumettre'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
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

      <HelpSupportModal
        visible={isHelpModalVisible}
        onClose={() => setIsHelpModalVisible(false)}
        isDarkMode={isDarkMode}
        userRole="livreur"
        userModel="Livreur"
      />

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