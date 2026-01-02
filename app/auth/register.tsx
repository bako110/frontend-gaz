import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import regstersStyles from '../../styles/register';
import { API_BASE_URL } from '@/service/config';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [phone, setPhone] = useState('+226');
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState(''); // Nouvel état pour le quartier
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Désactiver le bouton retour physique/geste
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Empêcher le retour - ne rien faire
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription?.remove();
    }, [])
  );

  const getGradientColors = () => {
    switch (userType) {
      case 'distributeur':
        return ['#26C6DA', '#00ACC1'];
      case 'client':
        return ['#2E7D32', '#388E3C'];
      case 'livreur':
        return ['#1565C0', '#1976D2'];
      default:
        return ['#455A64', '#546E7A'];
    }
  };

  const getThemeColors = () => {
    switch (userType) {
      case 'distributeur':
        return {
          primary: '#26C6DA',
          secondary: '#00ACC1',
          text: '#2D3748',
          textLight: '#718096',
          background: '#FFFFFF',
          inputBackground: '#F7FAFC',
          lightBackground: '#E0F7FA',
          border: '#E2E8F0',
          accent: '#26C6DA',
        };
      case 'client':
        return {
          primary: '#2E7D32',
          secondary: '#388E3C',
          text: '#2D3748',
          textLight: '#718096',
          background: '#FFFFFF',
          inputBackground: '#F7FAFC',
          lightBackground: '#E8F5E9',
          border: '#E2E8F0',
          accent: '#2E7D32',
        };
      case 'livreur':
        return {
          primary: '#1565C0',
          secondary: '#1976D2',
          text: '#2D3748',
          textLight: '#718096',
          background: '#FFFFFF',
          inputBackground: '#F7FAFC',
          lightBackground: '#E3F2FD',
          border: '#E2E8F0',
          accent: '#1565C0',
        };
      default:
        return {
          primary: '#455A64',
          secondary: '#546E7A',
          text: '#2D3748',
          textLight: '#718096',
          background: '#FFFFFF',
          inputBackground: '#F7FAFC',
          lightBackground: '#ECEFF1',
          border: '#E2E8F0',
          accent: '#455A64',
        };
    }
  };

  const themeColors = getThemeColors();

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    if (!neighborhood.trim()) {
      newErrors.neighborhood = 'Le quartier est requis';
    } else if (neighborhood.trim().length < 2) {
      newErrors.neighborhood = 'Le quartier doit contenir au moins 2 caractères';
    }
    if (!phone.startsWith('+226') || phone.length !== 12) {
      newErrors.phone = 'Le numéro doit commencer par +226 et faire 12 caractères (ex: +22670123456)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserTypeSelection = (type) => {
    setUserType(type);
    setStep(1);
    setErrors({});
  };

  const handleNext = () => {
    if (!validateInputs()) return;
    setStep(2);
  };

  const handlePinPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setStep(3);
      }
    }
  };

  const handleConfirmPinPress = (num) => {
    if (confirmPin.length < 4) {
      const newConfirmPin = confirmPin + num;
      setConfirmPin(newConfirmPin);
    }
  };

  const handleDeletePin = () => {
    setPin(pin.slice(0, -1));
  };

  const handleDeleteConfirmPin = () => {
    setConfirmPin(confirmPin.slice(0, -1));
  };

  const handleRegister = async () => {
    if (!acceptTerms) {
      Alert.alert('Erreur', 'Vous devez accepter les conditions d\'utilisation et la politique de confidentialité pour continuer.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Erreur', 'Les codes PIN ne correspondent pas.');
      return;
    }
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, pin, userType, neighborhood }), // Ajout du quartier dans l'envoi
      });
      const data = await response.json();
      console.log('Registration response:', data);
      if (!response.ok) {
        if (data.message && data.message.includes("existe déjà")) {
          Alert.alert(
            "Numéro déjà utilisé",
            "Ce numéro est déjà enregistré. Veuillez en saisir un autre.",
            [
              {
                text: "OK",
                onPress: () => {
                  setPhone('+226');
                  setStep(1);
                },
              },
            ]
          );
        } else {
          throw new Error(data.message || "Erreur lors de l'inscription");
        }
      } else {
        Alert.alert('Succès', 'Inscription réussie ! Vous pouvez maintenant vous connecter.');
        router.push({
          pathname: '/auth/login',
          params: { userId: data.user.id }
        });
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handlePhoneChangeAfterError = () => {
    if (validateInputs()) {
      setStep(3);
    }
  };

  const renderPinDots = (value) => {
    return (
      <View style={regstersStyles.pinDotsContainer}>
        {[...Array(4)].map((_, i) => (
          <View
            key={i}
            style={[
              regstersStyles.pinDot,
              {
                backgroundColor: i < value.length ? themeColors.accent : '#E2E8F0',
                transform: [{ scale: i < value.length ? 1.1 : 1 }],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumericKeypad = (onPress, onDelete) => {
    const buttons = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫'],
    ];
    return (
      <View style={regstersStyles.keypadContainer}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={regstersStyles.keypadRow}>
            {row.map((button, buttonIndex) => (
              <TouchableOpacity
                key={buttonIndex}
                style={[
                  regstersStyles.keypadButton,
                  button === '' && regstersStyles.hiddenButton,
                  {
                    backgroundColor: themeColors.lightBackground,
                    borderColor: themeColors.primary,
                  },
                ]}
                onPress={() => (button === '⌫' ? onDelete() : button !== '' && onPress(button))}
                disabled={button === ''}
                activeOpacity={0.7}
              >
                <Text style={[regstersStyles.keypadButtonText, { color: themeColors.primary }]}>
                  {button}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderUserTypeSelection = () => {
  const userTypes = [
    { type: 'distributeur', icon: 'business', label: 'Distributeur', color: '#26C6DA' },
    { type: 'client', icon: 'person', label: 'Client', color: '#2E7D32' },
    { type: 'livreur', icon: 'bicycle', label: 'Livreur', color: '#1565C0' },
  ];

  return (
    <ScrollView contentContainerStyle={regstersStyles.userTypeContainer}>
      <View style={regstersStyles.logoContainer}>
        <Image source={require('@/assets/images/express-gaz.png')} style={[regstersStyles.logo, { width: 140, height: 140, borderRadius: 30 }]} />
      </View>

      <View style={regstersStyles.titleContainer}>
        <Text style={[regstersStyles.mainTitle, { color: '#2D3748' }]}>Bienvenue !</Text>
        <Text style={[regstersStyles.subtitle, { color: '#718096' }]}>
          Sélectionnez votre profil pour commencer
        </Text>
      </View>

      <View style={regstersStyles.userTypeGrid}>
        {userTypes.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={regstersStyles.userTypeCard}
            onPress={() => handleUserTypeSelection(item.type)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[item.color + '20', item.color + '10']}
              style={regstersStyles.userTypeCardGradient}
            >
              <View style={[regstersStyles.userTypeIconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={28} color="#fff" />
              </View>
              <Text style={regstersStyles.userTypeTitle}>{item.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* BOUTON DE CONNEXION SIMPLE ET PROFESSIONNEL */}
      <View style={regstersStyles.loginRedirectContainer}>
        <Text style={[regstersStyles.loginRedirectText, { color: '#718096', fontSize: 15 }]}>
          Vous avez déjà un compte ?
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 12,
            paddingVertical: 14,
            paddingHorizontal: 32,
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: '#2E7D32',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => router.push('/auth/login_with_phone')}
          activeOpacity={0.8}
        >
          <Text style={{ 
            color: '#2E7D32', 
            fontSize: 16, 
            fontWeight: '600',
            textAlign: 'center',
          }}>
            Se connecter
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: step === 0 ? '#FFFFFF' : getGradientColors()[0] }}>
      <StatusBar 
        barStyle={step === 0 ? 'dark-content' : 'light-content'} 
        backgroundColor={step === 0 ? '#FFFFFF' : getGradientColors()[0]} 
      />
      <KeyboardAvoidingView
        style={regstersStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {step === 0 ? (
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {renderUserTypeSelection()}
          </View>
        ) : (
          <LinearGradient colors={getGradientColors()} style={regstersStyles.container}>
            <ScrollView 
              contentContainerStyle={regstersStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={regstersStyles.header}>
                {step !== 0 && (
                  <TouchableOpacity
                    style={regstersStyles.backButton}
                    onPress={() => setStep(step - 1)}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
                <View style={regstersStyles.progressContainer}>
                  <View style={regstersStyles.progressBar}>
                    <View
                      style={[
                        regstersStyles.progressFill,
                        { width: `${(step / 3) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={regstersStyles.stepText}>Étape {step} sur 3</Text>
                </View>
              </View>
              <View style={regstersStyles.contentCard}>
                {step === 1 && (
                  <>
                    <View style={regstersStyles.cardHeader}>
                      <Text style={regstersStyles.cardTitle}>Vos informations</Text>
                      <Text style={regstersStyles.cardSubtitle}>
                        Nous avons besoin de quelques détails pour créer votre compte
                      </Text>
                    </View>
                    <View style={regstersStyles.form}>
                      <View style={[regstersStyles.inputWrapper, errors.name && regstersStyles.inputError, { borderColor: themeColors.primary }]}>
                        <View style={regstersStyles.inputContainer}>
                          <Ionicons name="person-outline" size={20} color={themeColors.primary} />
                          <TextInput
                            style={regstersStyles.input}
                            placeholder="Nom complet"
                            placeholderTextColor={themeColors.textLight}
                            value={name}
                            onChangeText={(text) => {
                              setName(text);
                              if (errors.name) setErrors({...errors, name: null});
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                        {errors.name && <Text style={regstersStyles.errorText}>{errors.name}</Text>}
                      </View>

                      {/* NOUVELLE SECTION QUARTIER */}
                      <View style={[regstersStyles.inputWrapper, errors.neighborhood && regstersStyles.inputError, { borderColor: themeColors.primary }]}>
                        <View style={regstersStyles.inputContainer}>
                          <Ionicons name="location-outline" size={20} color={themeColors.primary} />
                          <TextInput
                            style={regstersStyles.input}
                            placeholder="Votre quartier"
                            placeholderTextColor={themeColors.textLight}
                            value={neighborhood}
                            onChangeText={(text) => {
                              setNeighborhood(text);
                              if (errors.neighborhood) setErrors({...errors, neighborhood: null});
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                        {errors.neighborhood && <Text style={regstersStyles.errorText}>{errors.neighborhood}</Text>}
                      </View>

                      <View style={[regstersStyles.inputWrapper, errors.phone && regstersStyles.inputError, { borderColor: themeColors.primary }]}>
                        <View style={regstersStyles.inputContainer}>
                          <Ionicons name="call-outline" size={20} color={themeColors.primary} />
                          <TextInput
                            style={regstersStyles.input}
                            placeholder="Numéro de téléphone (+226...)"
                            placeholderTextColor={themeColors.textLight}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => {
                              if (text.startsWith('+226') || text === '+226') {
                                setPhone(text);
                              }
                              if (errors.phone) setErrors({ ...errors, phone: null });
                            }}
                            maxLength={12}
                          />
                        </View>
                        {errors.phone && <Text style={regstersStyles.errorText}>{errors.phone}</Text>}
                      </View>
                      <TouchableOpacity
                        style={regstersStyles.primaryButton}
                        onPress={pin.length === 4 ? handlePhoneChangeAfterError : handleNext}
                      >
                        <LinearGradient colors={[themeColors.primary, themeColors.secondary]} style={regstersStyles.buttonGradient}>
                          <>
                            <Text style={regstersStyles.buttonText}>{pin.length === 4 ? "Continuer" : "Suivant"}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                          </>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {step === 2 && (
                  <>
                    <View style={regstersStyles.cardHeader}>
                      <Text style={regstersStyles.cardTitle}>Code de sécurité</Text>
                      <Text style={regstersStyles.cardSubtitle}>
                        Créez un code PIN à 4 chiffres pour sécuriser votre compte
                      </Text>
                    </View>
                    <View style={regstersStyles.pinSection}>
                      {renderPinDots(pin)}
                      {renderNumericKeypad(handlePinPress, handleDeletePin)}
                    </View>
                  </>
                )}
                {step === 3 && (
                  <>
                    <View style={regstersStyles.cardHeader}>
                      <Text style={regstersStyles.cardTitle}>Confirmez le code</Text>
                      <Text style={regstersStyles.cardSubtitle}>
                        Saisissez à nouveau votre code PIN pour le confirmer
                      </Text>
                    </View>
                    <View style={regstersStyles.pinSection}>
                      {renderPinDots(confirmPin)}
                      {renderNumericKeypad(handleConfirmPinPress, handleDeleteConfirmPin)}
                      {confirmPin.length === 4 && (
                        <>
                          <View style={regstersStyles.termsContainer}>
                            <TouchableOpacity
                              style={regstersStyles.checkboxContainer}
                              onPress={() => setAcceptTerms(!acceptTerms)}
                            >
                              <View style={[regstersStyles.checkbox, acceptTerms && regstersStyles.checkboxChecked, acceptTerms && { backgroundColor: themeColors.primary }]}>
                                {acceptTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                              </View>
                              <Text style={regstersStyles.termsText}>
                                J'accepte les{' '}
                                <Text
                                  style={regstersStyles.termsLink}
                                  onPress={() => router.push('/auth/terms')}
                                >
                                  conditions d'utilisation
                                </Text>{' '}
                                et la{' '}
                                <Text
                                  style={regstersStyles.termsLink}
                                  onPress={() => router.push('/auth/privacy')}
                                >
                                  politique de confidentialité
                                </Text>
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={[
                              regstersStyles.primaryButton,
                              (isSubmitting || !acceptTerms) && regstersStyles.disabledButton,
                            ]}
                            onPress={handleRegister}
                            disabled={isSubmitting || !acceptTerms}
                          >
                            <LinearGradient colors={[themeColors.primary, themeColors.secondary]} style={regstersStyles.buttonGradient}>
                              <>
                                {isSubmitting ? (
                                  <>
                                    <Text style={regstersStyles.buttonText}>Envoi en cours...</Text>
                                    <ActivityIndicator size="small" color="#fff" />
                                  </>
                                ) : (
                                  <>
                                    <Text style={regstersStyles.buttonText}>Créer mon compte</Text>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                  </>
                                )}
                              </>
                            </LinearGradient>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </LinearGradient>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}