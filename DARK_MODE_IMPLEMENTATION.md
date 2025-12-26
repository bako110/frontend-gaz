# Implémentation du Mode Sombre - Guide

## ✅ Infrastructure mise en place

### 1. ThemeContext créé (`contexts/ThemeContext.tsx`)
- Contexte global pour gérer le mode sombre
- Sauvegarde automatique dans AsyncStorage
- Hook `useTheme()` disponible partout

### 2. ThemeProvider intégré (`app/_layout.tsx`)
- Enveloppe toute l'application
- Le contexte est accessible dans tous les écrans

## 📋 Comment appliquer le mode sombre à un écran

### Étape 1: Importer le hook
```typescript
import { useTheme } from '@/contexts/ThemeContext';
```

### Étape 2: Utiliser le hook dans le composant
```typescript
export default function MonEcran() {
  const { isDarkMode } = useTheme();
  // ... reste du code
}
```

### Étape 3: Appliquer les styles conditionnels
```typescript
// Pour les conteneurs
<View style={[styles.container, isDarkMode && styles.darkContainer]}>

// Pour le texte
<Text style={[styles.text, isDarkMode && styles.darkText]}>

// Pour les cartes
<View style={[styles.card, isDarkMode && styles.darkCard]}>

// Pour la StatusBar
<StatusBar 
  barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
  backgroundColor={isDarkMode ? '#1a1a1a' : '#1565C0'} 
/>

// Pour les LinearGradient
<LinearGradient 
  colors={isDarkMode ? ['#1a1a1a', '#2d2d2d'] : ['#1565C0', '#1565C0']} 
/>
```

### Étape 4: Ajouter les styles dark dans le StyleSheet
```typescript
const styles = StyleSheet.create({
  // Styles normaux
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
  },
  
  // Styles dark
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  darkText: {
    color: '#fff',
  },
  darkCard: {
    backgroundColor: '#2d2d2d',
  },
});
```

## 🎨 Palette de couleurs

### Mode Clair
- Fond principal: `#fff`
- Fond secondaire: `#f5f5f5`
- Texte: `#000`, `#333`, `#666`
- Accent: `#1565C0`

### Mode Sombre
- Fond principal: `#1a1a1a`
- Fond secondaire: `#2d2d2d`
- Texte: `#fff`, `#e0e0e0`, `#a0a0a0`
- Accent: `#1565C0` (reste le même)

## 📱 Écrans à mettre à jour

### ✅ Livreur (Complété)
- [x] settings.tsx - Utilise déjà le contexte

### ⏳ Livreur (À faire)
- [ ] livreurScreen.tsx
- [ ] wallet.tsx
- [ ] historique.tsx

### ⏳ Client (À faire)
- [ ] clientScreen.tsx
- [ ] setting.tsx
- [ ] wallet.tsx
- [ ] historique.tsx
- [ ] ProductsAndOrders.tsx
- [ ] adresses.tsx
- [ ] factures.tsx
- [ ] support.tsx

### ⏳ Distributeur (À faire)
- [ ] distributeurScreen.tsx
- [ ] setting.tsx
- [ ] wallet.tsx
- [ ] new-order.tsx
- [ ] drivers.tsx
- [ ] reports.tsx
- [ ] geolocalisation.tsx

## 🔧 Toggle du mode sombre

Le toggle est déjà disponible dans:
- `app/home/livreur/settings.tsx` - Section "Mode Sombre"

Pour ajouter le toggle dans les autres écrans de paramètres:
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { isDarkMode, toggleDarkMode } = useTheme();

<Switch
  value={isDarkMode}
  onValueChange={toggleDarkMode}
  trackColor={{ false: '#767577', true: '#81b0ff' }}
  thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
/>
```
