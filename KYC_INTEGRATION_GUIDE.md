# Guide d'intégration du système KYC

## 📋 Vue d'ensemble

Le système KYC (Know Your Customer) a été implémenté pour garantir que seuls les utilisateurs vérifiés peuvent effectuer des actions sensibles dans l'application. Les utilisateurs non vérifiés peuvent se connecter et consulter l'application, mais ne peuvent pas effectuer d'actions comme passer des commandes, accepter des livraisons, ou gérer des produits.

## 🔧 Architecture

### Backend
- **Middleware**: `middlewares/checkKYC.js`
  - `checkKYCVerified`: Bloque les actions si KYC non vérifié
  - `addKYCInfo`: Ajoute l'info KYC sans bloquer (pour consultation)

### Frontend
- **Composant**: `components/KYCRequiredModal.tsx` - Modal réutilisable
- **Hook**: `hooks/useKYCCheck.ts` - Hook pour vérifier le KYC
- **Utilitaires**: `utils/kycHelper.ts` - Fonctions helper

## 🚀 Utilisation dans vos écrans

### Exemple 1: Client - Passer une commande

```typescript
import React, { useState } from 'react';
import { useKYCCheck } from '../hooks/useKYCCheck';
import KYCRequiredModal from '../components/KYCRequiredModal';

const ClientHomeScreen = () => {
  const { showKYCModal, checkKYCBeforeAction, closeKYCModal } = useKYCCheck();
  const [isKYSModalVisible, setIsKYSModalVisible] = useState(false);

  const handleCreateOrder = async () => {
    // Vérifier le KYC avant de créer la commande
    await checkKYCBeforeAction(async () => {
      // Code pour créer la commande
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          // Si erreur KYC du backend
          if (error.kycRequired) {
            setIsKYSModalVisible(true);
            return;
          }
          throw new Error(error.message);
        }
        
        // Commande créée avec succès
        Alert.alert('Succès', 'Commande créée');
      } catch (error) {
        Alert.alert('Erreur', error.message);
      }
    });
  };

  return (
    <View>
      {/* Votre UI */}
      <TouchableOpacity onPress={handleCreateOrder}>
        <Text>Commander</Text>
      </TouchableOpacity>

      {/* Modal KYC requis */}
      <KYCRequiredModal
        visible={showKYCModal}
        onClose={closeKYCModal}
        onVerifyKYC={() => {
          closeKYCModal();
          setIsKYSModalVisible(true);
        }}
        isDarkMode={isDarkMode}
        message="Vous devez vérifier votre identité pour passer une commande"
      />

      {/* Votre modal KYC existant */}
      <Modal visible={isKYSModalVisible}>
        {/* ... */}
      </Modal>
    </View>
  );
};
```

### Exemple 2: Livreur - Basculer la disponibilité

```typescript
import React from 'react';
import { useKYCCheck } from '../hooks/useKYCCheck';
import KYCRequiredModal from '../components/KYCRequiredModal';

const LivreurHomeScreen = () => {
  const { showKYCModal, checkKYCBeforeAction, closeKYCModal } = useKYCCheck();
  const [isKYSModalVisible, setIsKYSModalVisible] = useState(false);

  const toggleAvailability = async () => {
    await checkKYCBeforeAction(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/livreurs/${livreurId}/availability`,
          { method: 'POST' }
        );
        
        if (!response.ok) {
          const error = await response.json();
          if (error.kycRequired) {
            setIsKYSModalVisible(true);
            return;
          }
          throw new Error(error.message);
        }
        
        // Disponibilité mise à jour
        setIsAvailable(!isAvailable);
      } catch (error) {
        Alert.alert('Erreur', error.message);
      }
    });
  };

  return (
    <View>
      <Switch value={isAvailable} onValueChange={toggleAvailability} />

      <KYCRequiredModal
        visible={showKYCModal}
        onClose={closeKYCModal}
        onVerifyKYC={() => {
          closeKYCModal();
          setIsKYSModalVisible(true);
        }}
        isDarkMode={isDarkMode}
        message="Vous devez vérifier votre identité pour modifier votre disponibilité"
      />
    </View>
  );
};
```

### Exemple 3: Distributeur - Ajouter un produit

```typescript
import React from 'react';
import { useKYCCheck } from '../hooks/useKYCCheck';
import KYCRequiredModal from '../components/KYCRequiredModal';

const DistributorProductScreen = () => {
  const { showKYCModal, checkKYCBeforeAction, closeKYCModal } = useKYCCheck();
  const [isKYSModalVisible, setIsKYSModalVisible] = useState(false);

  const handleAddProduct = async () => {
    await checkKYCBeforeAction(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/distributors/${distributorId}/products`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          if (error.kycRequired) {
            setIsKYSModalVisible(true);
            return;
          }
          throw new Error(error.message);
        }
        
        Alert.alert('Succès', 'Produit ajouté');
      } catch (error) {
        Alert.alert('Erreur', error.message);
      }
    });
  };

  return (
    <View>
      <TouchableOpacity onPress={handleAddProduct}>
        <Text>Ajouter un produit</Text>
      </TouchableOpacity>

      <KYCRequiredModal
        visible={showKYCModal}
        onClose={closeKYCModal}
        onVerifyKYC={() => {
          closeKYCModal();
          setIsKYSModalVisible(true);
        }}
        isDarkMode={isDarkMode}
        message="Vous devez vérifier votre identité pour ajouter des produits"
      />
    </View>
  );
};
```

## 🔒 Routes backend protégées

### Client
- ✅ `POST /orders` - Créer une commande
- ✅ `PATCH /wallet/:id/wallettransaction` - Recharge ou retrait d'argent

### Livreur
- ✅ `POST /livreurs/:livreurId/availability` - Basculer disponibilité
- ✅ `PATCH /wallet/:id/wallettransaction` - Recharge ou retrait d'argent

### Distributeur
- ✅ `POST /distributors/assign` - Assigner une livraison
- ✅ `POST /distributors/:distributorId/products` - Ajouter un produit
- ✅ `PUT /distributors/:distributorId/products/:productId` - Modifier un produit
- ✅ `DELETE /distributors/:distributorId/products/:productId` - Supprimer un produit
- ✅ `PATCH /distributors/:distributorId/products/:productId/stock` - Mettre à jour le stock
- ✅ `PATCH /wallet/:id/wallettransaction` - Recharge ou retrait d'argent

### 💰 Transactions financières (TOUS les utilisateurs)
- ✅ `PATCH /wallet/:id/wallettransaction` - **Retraits et dépôts d'argent - KYC OBLIGATOIRE**

## 📝 Gestion des erreurs backend

Le backend retourne une erreur 403 avec ce format quand le KYC n'est pas vérifié:

```json
{
  "message": "Votre KYC doit être vérifié pour effectuer cette action",
  "kycStatus": "non_verifie",
  "kycRequired": true,
  "action": "verify_kyc"
}
```

Vous pouvez détecter cette erreur avec:

```typescript
import { isKYCError, showKYCErrorAlert } from '../utils/kycHelper';

try {
  // Votre requête API
} catch (error) {
  if (isKYCError(error)) {
    // Afficher le modal KYC
    setIsKYSModalVisible(true);
  } else {
    Alert.alert('Erreur', error.message);
  }
}
```

## 🎨 Personnalisation du modal

Le composant `KYCRequiredModal` accepte ces props:

```typescript
interface KYCRequiredModalProps {
  visible: boolean;           // Afficher/masquer le modal
  onClose: () => void;        // Callback pour fermer le modal
  onVerifyKYC: () => void;    // Callback pour ouvrir le modal KYC
  isDarkMode?: boolean;       // Mode sombre
  message?: string;           // Message personnalisé
}
```

## ✅ Checklist d'intégration

Pour chaque écran avec des actions sensibles:

1. [ ] Importer `useKYCCheck` et `KYCRequiredModal`
2. [ ] Utiliser `checkKYCBeforeAction` pour envelopper vos actions
3. [ ] Ajouter le composant `KYCRequiredModal` dans votre JSX
4. [ ] Gérer les erreurs KYC du backend avec `isKYCError`
5. [ ] Tester avec un utilisateur non vérifié

## 🧪 Tests

Pour tester le système:

1. Créez un nouvel utilisateur (KYC = non_verifie par défaut)
2. Connectez-vous avec cet utilisateur
3. Essayez d'effectuer une action protégée
4. Le modal KYC devrait s'afficher
5. Soumettez le KYC
6. Attendez la vérification (ou modifiez manuellement en DB pour test)
7. Réessayez l'action - elle devrait fonctionner

## 🔄 Statuts KYC

- `non_verifie`: Utilisateur n'a pas soumis de documents
- `en_cours`: Documents soumis, en attente de vérification
- `verifie`: KYC vérifié ✅
- `rejete`: KYC rejeté, doit soumettre à nouveau

Seul le statut `verifie` permet d'effectuer des actions sensibles.
