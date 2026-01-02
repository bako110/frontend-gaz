import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KYCRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onVerifyKYC: () => void;
  isDarkMode?: boolean;
  message?: string;
}

/**
 * Modal réutilisable pour informer l'utilisateur qu'il doit vérifier son KYC
 * Affiché quand l'utilisateur tente une action qui nécessite un KYC vérifié
 */
const KYCRequiredModal: React.FC<KYCRequiredModalProps> = ({
  visible,
  onClose,
  onVerifyKYC,
  isDarkMode = false,
  message = "Vous devez vérifier votre identité pour effectuer cette action"
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          isDarkMode ? styles.darkModal : styles.lightModal
        ]}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#FF9800" />
          </View>

          <Text style={[
            styles.title,
            isDarkMode ? styles.darkText : styles.lightText
          ]}>
            Vérification KYC requise
          </Text>

          <Text style={[
            styles.message,
            isDarkMode ? styles.darkSubText : styles.lightSubText
          ]}>
            {message}
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              La vérification KYC est obligatoire pour garantir la sécurité de tous les utilisateurs
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.verifyButton]}
              onPress={onVerifyKYC}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>Vérifier mon identité</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                isDarkMode ? styles.darkCancelButton : styles.lightCancelButton
              ]}
              onPress={onClose}
            >
              <Text style={[
                styles.cancelButtonText,
                isDarkMode ? styles.darkText : styles.lightText
              ]}>
                Plus tard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  lightModal: {
    backgroundColor: '#fff',
  },
  darkModal: {
    backgroundColor: '#1E1E1E',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  lightSubText: {
    color: '#666',
  },
  darkSubText: {
    color: '#aaa',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
  },
  lightCancelButton: {
    borderColor: '#ddd',
  },
  darkCancelButton: {
    borderColor: '#444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default KYCRequiredModal;
