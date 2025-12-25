import { API_BASE_URL } from '@/service/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔹 Récupérer l'ID du distributeur depuis AsyncStorage
async function getDistributorId() {
  const profile = await AsyncStorage.getItem('userProfile');
  if (!profile) return null;

  try {
    const parsed = JSON.parse(profile);
    return parsed?.profile?._id || null; // Utiliser _id ici
  } catch (err) {
    console.error("Erreur parsing userProfile:", err);
    return null;
  }
}

export const ProductService = {
  // ====================
  // Récupérer tous les produits
  // ====================
  async getAllProducts() {
    try {
      const distributorId = await getDistributorId();
      if (!distributorId) return [];

      const response = await fetch(`${API_BASE_URL}/distributeurs/${distributorId}/products`);
      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur fetch getAllProducts:", errText);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur ProductService.getAllProducts:", error);
      return [];
    }
  },

  // ====================
  // Ajouter un produit
  // ====================
  async addProduct(product) {
    try {
      const distributorId = await getDistributorId();
      if (!distributorId) throw new Error('Distributeur non connecté');

      const requiredFields = ['name', 'stock', 'minStock', 'price', 'type'];
      for (let field of requiredFields) {
        if (!product[field] && product[field] !== 0) {
          throw new Error(`Le champ ${field} est requis.`);
        }
      }

      const response = await fetch(`${API_BASE_URL}/distributeurs/${distributorId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          stock: parseInt(product.stock),
          minStock: parseInt(product.minStock),
          price: parseInt(product.price),
          sales: product.sales || 0,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur fetch addProduct:", errText);
        throw new Error("Erreur lors de l'ajout du produit");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur ProductService.addProduct:", error);
      throw error;
    }
  },

  // ====================
  // Mettre à jour un produit
  // ====================
  async updateProduct(productId, updates) {
    try {
      const distributorId = await getDistributorId();
      if (!distributorId) throw new Error('Distributeur non connecté');

      const response = await fetch(`${API_BASE_URL}/distributeurs/${distributorId}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur fetch updateProduct:", errText);
        throw new Error("Erreur lors de la mise à jour du produit");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur ProductService.updateProduct:", error);
      throw error;
    }
  },

  // ====================
  // Supprimer un produit
  // ====================
  async deleteProduct(productId) {
    try {
      const distributorId = await getDistributorId();
      if (!distributorId) throw new Error('Distributeur non connecté');

      const response = await fetch(`${API_BASE_URL}/distributeurs/${distributorId}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur fetch deleteProduct:", errText);
        throw new Error("Erreur lors de la suppression du produit");
      }

      return true;
    } catch (error) {
      console.error("Erreur ProductService.deleteProduct:", error);
      throw error;
    }
  },

  // ====================
  // Mettre à jour le stock
  // ====================
  async updateStock(productId, newStock, gasType) {
    try {
      const distributorId = await getDistributorId();
      if (!distributorId) throw new Error('Distributeur non connecté');

      // 🔹 On envoie le body sous forme d'objet
      const response = await fetch(`${API_BASE_URL}/distributeurs/${distributorId}/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: parseInt(newStock), type: gasType }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur fetch updateStock:", errText);
        throw new Error("Erreur lors de la mise à jour du stock");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur ProductService.updateStock:", error);
      throw error;
    }
  },
};
