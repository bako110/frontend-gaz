import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/service/config';

const { width } = Dimensions.get('window');

const SearchSystem = ({ visible, onClose, onProductSelect, clientLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [filterStock, setFilterStock] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState([]);

  const brands = [
    { id: 'all', label: 'Toutes' },
    { id: 'oryx', label: 'Oryx' },
    { id: 'pegaz', label: 'Pegaz' },
    { id: 'totale', label: 'Total' },
    { id: 'shell', label: 'Shell' },
    { id: 'autre', label: 'Autres' },
  ];

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedBrand, selectedNeighborhood, filterStock, products]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/distributeurs/all-products`);
      const data = await response.json();

      if (data.success && data.products?.length) {
        // Normalisation des produits selon la structure API
        const productsList = data.products.map(p => ({
          _id: p._id || `prod-${Date.now()}-${Math.random()}`,
          name: p.name || 'Produit sans nom',
          type: p.fuelType || '',
          price: Number(p.price || 0),
          stock: Number(p.stock || 0),
          minStock: Number(p.minStock || 0),
          sales: Number(p.sales || 0),
          image: p.image,
          distributorId: p.distributorId,
          distributorName: p.distributorName || 'Distributeur',
          zone: p.zone,
          lastLocation: p.lastLocation || null,
          neighborhood: p.neighborhood || '', // Utilise directement le champ neighborhood du backend
        }));

        setProducts(productsList);
        setFilteredProducts(productsList);
        
        // Extraire les quartiers UNIQUES depuis le champ neighborhood du backend
        const uniqueNeighborhoods = [...new Set(productsList
          .map(p => p.neighborhood)
          .filter(hood => hood && hood.trim() !== '')
        )].sort();
        
        setNeighborhoods([
          { id: 'all', label: 'Tous les quartiers' },
          ...uniqueNeighborhoods.map(hood => ({ 
            id: hood, 
            label: hood 
          }))
        ]);
      } else {
        setProducts([]);
        setFilteredProducts([]);
        setNeighborhoods([{ id: 'all', label: 'Tous les quartiers' }]);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      setProducts([]);
      setFilteredProducts([]);
      setNeighborhoods([{ id: 'all', label: 'Tous les quartiers' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filtre par marque/type
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => {
        const productType = (p.type || '').toLowerCase().trim();
        const productName = (p.name || '').toLowerCase().trim();
        const selectedBrandLower = selectedBrand.toLowerCase();
        
        if (selectedBrand === 'autre') {
          // Exclut les marques principales
          const mainBrands = ['oryx', 'pegaz', 'total', 'shell'];
          return !mainBrands.some(b => 
            productType.includes(b) || productName.includes(b)
          );
        }
        
        return productType.includes(selectedBrandLower) || 
               productName.includes(selectedBrandLower);
      });
    }

    // Filtre par quartier (utilise directement le champ neighborhood)
    if (selectedNeighborhood !== 'all') {
      filtered = filtered.filter(p => {
        const productNeighborhood = (p.neighborhood || '').toLowerCase().trim();
        return productNeighborhood === selectedNeighborhood.toLowerCase();
      });
    }

    // Filtre par stock
    if (filterStock) {
      filtered = filtered.filter(p => (p.stock || 0) > 0);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase();
        const type = (p.fuelType || '').toLowerCase();
        const distributor = (p.distributorName || '').toLowerCase();
        const zone = (p.zone || '').toLowerCase();
        const neighborhood = (p.neighborhood || '').toLowerCase(); // Recherche aussi dans neighborhood
        
        return name.includes(query) || 
               type.includes(query) ||
               distributor.includes(query) || 
               zone.includes(query) ||
               neighborhood.includes(query);
      });
    }

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (product) => {
    onProductSelect(product);
    onClose();
  };

  const getProductImage = (product) => {
  return require('@/assets/images/express-gaz.png');
};
  const ProductCard = ({ product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleProductSelect(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getProductImage(product)}
          style={styles.image}
          defaultSource={require('@/assets/images/express-gaz.png')}
        />
        
        {/* Badge rupture de stock */}
        {(product.stock || 0) === 0 && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Rupture</Text>
          </View>
        )}
        
        {/* Badge type/marque */}
        {product.type && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{product.type}</Text>
          </View>
        )}

        {/* Badge quartier */}
        {product.neighborhood && (
          <View style={styles.neighborhoodBadge}>
            <Ionicons name="location" size={10} color="#fff" />
            <Text style={styles.neighborhoodBadgeText}>{product.neighborhood}</Text>
          </View>
        )}

        {/* Badge stock faible */}
        {product.stock > 0 && product.stock <= product.minStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="warning" size={12} color="#fff" />
            <Text style={styles.lowStockText}>Stock bas</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text style={styles.price}>
          {(product.price || 0).toLocaleString('fr-FR')} FCFA
        </Text>
        
        {/* Distributeur */}
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={12} color="#6B7280" />
          <Text style={styles.infoText} numberOfLines={1}>
            {product.distributorName}
          </Text>
        </View>

        {/* Quartier */}
        {product.neighborhood && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>
              {product.neighborhood}
            </Text>
          </View>
        )}
        
        {/* Stock disponible */}
        {(product.stock || 0) > 0 && (
          <View style={styles.stockIndicator}>
            <View style={[
              styles.stockDot,
              product.stock <= product.minStock && styles.stockDotWarning
            ]} />
            <Text style={[
              styles.stockText,
              product.stock <= product.minStock && styles.stockTextWarning
            ]}>
              {product.stock} en stock
            </Text>
          </View>
        )}

        {/* Ventes */}
        {product.sales > 0 && (
          <View style={styles.salesBadge}>
            <Ionicons name="trending-up" size={10} color="#6B7280" />
            <Text style={styles.salesText}>{product.sales} ventes</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit, marque, quartier..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Filtres */}
        <View style={styles.filtersSection}>
          {/* Filtre par marque */}
          <Text style={styles.filterLabel}>Marque</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {brands.map(brand => (
              <TouchableOpacity
                key={brand.id}
                style={[
                  styles.filterChip,
                  selectedBrand === brand.id && styles.filterChipActive
                ]}
                onPress={() => setSelectedBrand(brand.id)}
              >
                <Text style={[
                  styles.filterText,
                  selectedBrand === brand.id && styles.filterTextActive
                ]}>
                  {brand.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filtre par quartier - Liste horizontale des quartiers du backend */}
          <Text style={styles.filterLabel}>Quartier</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {neighborhoods.map(hood => (
              <TouchableOpacity
                key={hood.id}
                style={[
                  styles.filterChip,
                  selectedNeighborhood === hood.id && styles.filterChipActive
                ]}
                onPress={() => setSelectedNeighborhood(hood.id)}
              >
                <Text style={[
                  styles.filterText,
                  selectedNeighborhood === hood.id && styles.filterTextActive
                ]}>
                  {hood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Filtre stock */}
          <View style={styles.stockFilterContainer}>
            <TouchableOpacity
              style={styles.stockFilter}
              onPress={() => setFilterStock(!filterStock)}
            >
              <Ionicons 
                name={filterStock ? "checkbox" : "square-outline"} 
                size={20} 
                color={filterStock ? "#2E7D32" : "#666"} 
              />
              <Text style={[
                styles.stockFilterText,
                filterStock && styles.stockFilterTextActive
              ]}>
                En stock uniquement
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Résultats */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </Text>
          {(searchQuery || selectedBrand !== 'all' || selectedNeighborhood !== 'all' || filterStock) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedBrand('all');
                setSelectedNeighborhood('all');
                setFilterStock(false);
              }}
              style={styles.resetBtn}
            >
              <Ionicons name="refresh" size={16} color="#2E7D32" />
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Liste des produits */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Chargement des produits...</Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => <ProductCard product={item} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim() || selectedBrand !== 'all' || selectedNeighborhood !== 'all'
                ? 'Essayez avec d\'autres mots-clés ou ajustez les filtres'
                : 'Aucun produit disponible pour le moment'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  stockFilterContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  stockFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  stockFilterText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  stockFilterTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  neighborhoodBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 100,
  },
  neighborhoodBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 4,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(251, 146, 60, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lowStockText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    minHeight: 38,
    lineHeight: 19,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  stockDotWarning: {
    backgroundColor: '#F59E0B',
  },
  stockText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  stockTextWarning: {
    color: '#F59E0B',
  },
  salesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  salesText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SearchSystem;