import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/service/config';

type ResetPinStep = 'phone' | 'verification' | 'newPin' | 'confirmation';

export default function ResetPinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<ResetPinStep>('phone');
  const [phone, setPhone] = useState('+226 ');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const themeColors = {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#00d2ff',
    error: '#ff6b6b',
    success: '#4ecdc4'
  };

  // 📱 Étape 1: Vérification du numéro
  const handlePhoneSubmit = async () => {
    if (phone.length !== 13 || !phone.startsWith('+226')) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro valide (+226 suivi de 9 chiffres)');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pin/send-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du code');
      }
      setStep('verification');
      startCountdown(60);
      Alert.alert('Code envoyé', 'Un code de vérification a été envoyé à votre numéro');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le code');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔢 Étape 2: Vérification du code
  const handleVerificationSubmit = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code de 6 chiffres');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pin/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode }),
      });
      if (!response.ok) {
        throw new Error('Code de vérification incorrect');
      }
      setStep('newPin');
      Alert.alert('Code validé', 'Vous pouvez maintenant créer votre nouveau PIN');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Code incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔐 Étape 3: Création du nouveau PIN
  const handleNewPinSubmit = async () => {
    const cleanPhone = phone.replace(/\s+/g, ''); // Supprime tous les espaces

    if (newPin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert('Erreur', 'Les PIN doivent contenir 4 chiffres');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Erreur', 'Les PIN ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pin/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, newPin }), // ← utiliser cleanPhone
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Impossible de réinitialiser le PIN');
      }

      setStep('confirmation');
      Alert.alert('Succès', 'Votre PIN a été réinitialisé avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de réinitialiser le PIN');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Étape 4: Confirmation et redirection
  const handleConfirmation = () => {
    router.replace('/auth/login_with_phone');
  };

  // ⏱️ Gestion du countdown pour le renvoi de code
  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    setVerificationCode('');
    handlePhoneSubmit();
  };

  // 🎯 Rendu des étapes
  const renderStepIndicator = () => {
    const steps = [
      { key: 'phone', label: 'Numéro' },
      { key: 'verification', label: 'Vérification' },
      { key: 'newPin', label: 'Nouveau PIN' },
      { key: 'confirmation', label: 'Confirmation' }
    ];
    return (
      <View style={styles.stepContainer}>
        {steps.map((stepItem, index) => (
          <View key={stepItem.key} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              step === stepItem.key && styles.stepCircleActive,
              ['confirmation'].includes(step) && styles.stepCircleCompleted
            ]}>
              <Text style={[
                styles.stepNumber,
                (step === stepItem.key || ['confirmation'].includes(step)) && styles.stepNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              step === stepItem.key && styles.stepLabelActive
            ]}>
              {stepItem.label}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                ['verification', 'newPin', 'confirmation'].includes(step) && index < 1 && styles.stepLineActive,
                ['newPin', 'confirmation'].includes(step) && index < 2 && styles.stepLineActive,
                ['confirmation'].includes(step) && index < 3 && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Réinitialisation du PIN</Text>
      <Text style={styles.subtitle}>
        Entrez votre numéro de téléphone pour recevoir un code de vérification
      </Text>
      <View style={styles.inputContainer}>
        <Ionicons name="call" size={20} color={themeColors.accent} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          keyboardType="phone-pad"
          maxLength={13}
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      </View>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePhoneSubmit}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#777', '#555'] : [themeColors.accent, '#3a7bd5']}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Envoyer le code</Text>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>
        Entrez le code de vérification envoyé au {phone}
      </Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed" size={20} color={themeColors.accent} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Code de vérification (6 chiffres)"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          keyboardType="number-pad"
          maxLength={6}
          value={verificationCode}
          onChangeText={setVerificationCode}
          autoFocus
        />
      </View>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleVerificationSubmit}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#777', '#555'] : [themeColors.accent, '#3a7bd5']}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Vérifier le code</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
        onPress={handleResendCode}
        disabled={countdown > 0}
      >
        <Text style={styles.resendText}>
          {countdown > 0 ? `Renvoyer le code (${countdown}s)` : 'Renvoyer le code'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewPinStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Nouveau PIN</Text>
      <Text style={styles.subtitle}>
        Créez votre nouveau code PIN à 4 chiffres
      </Text>
      <View style={styles.pinInputsContainer}>
        <View style={styles.pinInputWrapper}>
          <Text style={styles.pinLabel}>Nouveau PIN</Text>
          <View style={styles.pinInputContainer}>
            <Ionicons name="key" size={20} color={themeColors.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.pinInput}
              placeholder="****"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />
          </View>
        </View>
        <View style={styles.pinInputWrapper}>
          <Text style={styles.pinLabel}>Confirmer PIN</Text>
          <View style={styles.pinInputContainer}>
            <Ionicons name="key" size={20} color={themeColors.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.pinInput}
              placeholder="****"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleNewPinSubmit}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#777', '#555'] : [themeColors.accent, '#3a7bd5']}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Réinitialiser le PIN</Text>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={themeColors.success} />
        </View>
        <Text style={styles.successTitle}>PIN Réinitialisé !</Text>
        <Text style={styles.successSubtitle}>
          Votre code PIN a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau PIN.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleConfirmation}
      >
        <LinearGradient
          colors={[themeColors.success, '#00b894']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
          <Ionicons name="log-in" size={18} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <LinearGradient
            colors={[themeColors.primary, themeColors.secondary]}
            style={styles.gradient}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Réinitialisation PIN</Text>
              </View>
              
              {renderStepIndicator()}
              
              <View style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.cardGradient}
                >
                  {step === 'phone' && renderPhoneStep()}
                  {step === 'verification' && renderVerificationStep()}
                  {step === 'newPin' && renderNewPinStep()}
                  {step === 'confirmation' && renderConfirmationStep()}
                </LinearGradient>
              </View>
              
              {/* Espacement fixe en bas pour éviter le chevauchement */}
              <View style={styles.bottomSpacing} />
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // Espacement ajusté selon la plateforme
  },
  bottomSpacing: {
    height: Platform.OS === 'ios' ? 40 : 30, // Espace fixe en bas
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#00d2ff',
  },
  stepCircleCompleted: {
    backgroundColor: '#4ecdc4',
  },
  stepNumber: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#00d2ff',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#00d2ff',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  cardGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepContent: {
    minHeight: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  pinInputsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  pinInputWrapper: {
    gap: 8,
  },
  pinLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  pinInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  button: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#00d2ff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4ecdc4',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
});