import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/service/config';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  livreurId: string;
  deliveryId: string;
  livreurName: string;
  userId: string;
  userName: string;
  userType: 'client' | 'distributeur';
  onRatingSubmitted?: () => void;
}

export default function RatingModal({
  visible,
  onClose,
  livreurId,
  deliveryId,
  livreurName,
  userId,
  userName,
  userType,
  onRatingSubmitted,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [punctuality, setPunctuality] = useState(0);
  const [politeness, setPoliteness] = useState(0);
  const [packageCondition, setPackageCondition] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Erreur', 'Veuillez donner une note');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/livreurs/${livreurId}/ratings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliveryId,
            ratedByUserId: userId,
            ratedByUserType: userType,
            ratedByUserName: userName,
            rating,
            comment: comment.trim(),
            criteria: {
              punctuality: punctuality || undefined,
              politeness: politeness || undefined,
              packageCondition: packageCondition || undefined,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Merci !',
          'Votre évaluation a été enregistrée avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                onRatingSubmitted?.();
                resetForm();
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error(data.message || 'Erreur lors de l\'envoi de la note');
      }
    } catch (error: any) {
      console.error('Erreur soumission note:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer votre évaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setPunctuality(0);
    setPoliteness(0);
    setPackageCondition(0);
  };

  const renderStars = (
    currentRating: number,
    onPress: (value: number) => void,
    label: string
  ) => (
    <View style={styles.criteriaRow}>
      <Text style={styles.criteriaLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            disabled={isSubmitting}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={28}
              color={star <= currentRating ? '#FFA000' : '#CBD5E0'}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Évaluer le livreur</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#2D3748" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.livreurInfo}>
              <Ionicons name="person-circle" size={48} color="#1976D2" />
              <Text style={styles.livreurName}>{livreurName}</Text>
            </View>

            <Text style={styles.sectionTitle}>Note globale *</Text>
            {renderStars(rating, setRating, '')}

            <Text style={styles.sectionTitle}>Critères détaillés (optionnel)</Text>
            {renderStars(punctuality, setPunctuality, 'Ponctualité')}
            {renderStars(politeness, setPoliteness, 'Politesse')}
            {renderStars(packageCondition, setPackageCondition, 'État du colis')}

            <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Partagez votre expérience..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer l'évaluation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  body: {
    padding: 20,
  },
  livreurInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  livreurName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
    marginTop: 16,
  },
  criteriaRow: {
    marginBottom: 16,
  },
  criteriaLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2D3748',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
