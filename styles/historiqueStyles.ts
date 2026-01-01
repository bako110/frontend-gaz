import { StyleSheet } from 'react-native';

// Styles pour la section de notation dans historique.tsx
export const ratingStyles = StyleSheet.create({
  ratingSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  ratingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  ratingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F57C00',
  },
  ratingSectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  rateButton: {
    backgroundColor: '#FFA000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
