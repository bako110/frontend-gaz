import { ScrollView, Text, View, Linking, TouchableOpacity, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Politique de Confidentialité – Ebutan</Text>
        <Text style={styles.subtitle}>Dernière mise à jour : 8 septembre 2025</Text>
      </View>

      {/* Introduction */}
      <View style={styles.section}>
        <Text style={styles.introText}>
          La présente politique définit les règles de collecte, d'utilisation, de protection et de partage des données personnelles des utilisateurs de l'application{' '}
          <Text style={styles.highlight}>Ebutan</Text>, conformément aux normes internationales (ISO/IEC 27001, RGPD) et aux lois nationales en vigueur.
        </Text>
      </View>

      {/* Section 1: Collecte et Utilisation des Données */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Collecte et Utilisation des Données</Text>
        <Text style={styles.sectionText}>
          Ebutan recueille uniquement les informations nécessaires au bon fonctionnement de l'application : identité, coordonnées, localisation, transactions, moyens de paiement.
        </Text>
        <Text style={styles.sectionText}>Ces données sont utilisées pour :</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Faciliter les commandes, livraisons et paiements</Text>
          <Text style={styles.listItem}>• Assurer la traçabilité et la sécurité des opérations</Text>
          <Text style={styles.listItem}>• Améliorer la qualité des services et l'expérience utilisateur</Text>
        </View>
        <Text style={styles.sectionText}>
          Aucune donnée n'est vendue ni transmise à des tiers sans le consentement explicite de l'utilisateur, sauf obligation légale.
        </Text>
      </View>

      {/* Section 2: Protection et Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Protection et Sécurité</Text>
        <Text style={styles.sectionText}>
          Les données sont stockées et protégées via des systèmes conformes aux normes ISO/IEC 27001. Les transactions financières sont sécurisées par des protocoles de chiffrement. Chaque acteur (client, livreur, dépôt, investisseur) doit passer par une procédure KYC pour garantir transparence et fiabilité.
        </Text>
      </View>

      {/* Section 3: Droits des Utilisateurs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Droits des Utilisateurs</Text>
        <Text style={styles.sectionText}>Chaque utilisateur dispose des droits suivants :</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Accès à ses données personnelles</Text>
          <Text style={styles.listItem}>• Rectification de ses informations</Text>
          <Text style={styles.listItem}>• Suppression de son compte et de ses données</Text>
          <Text style={styles.listItem}>• Opposition au traitement de ses données dans certains cas</Text>
        </View>
        <Text style={styles.sectionText}>
          Pour toute demande, un support dédié est disponible via l'application.
        </Text>
      </View>

      {/* Section 4: Bon Usage et Responsabilités */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Bon Usage et Responsabilités</Text>
        <Text style={styles.sectionText}>Chaque utilisateur s'engage à :</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Fournir des informations exactes et à jour</Text>
          <Text style={styles.listItem}>• Ne pas utiliser l'application à des fins frauduleuses ou illégales</Text>
          <Text style={styles.listItem}>• Respecter les autres acteurs (clients, livreurs, dépôts)</Text>
          <Text style={styles.listItem}>• Protéger ses identifiants d'accès et éviter tout partage non autorisé</Text>
        </View>
      </View>

      {/* Section 5: Avantages d'un Bon Usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Avantages d'un Bon Usage</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Accès rapide, sûr et fiable au gaz domestique</Text>
          <Text style={styles.listItem}>• Récompenses de fidélité et bonus communautaires</Text>
          <Text style={styles.listItem}>• Sécurité renforcée dans les paiements et la livraison</Text>
          <Text style={styles.listItem}>• Opportunités de revenus pour les livreurs, dépôts et investisseurs</Text>
        </View>
      </View>

      {/* Section 6: Risques et Pièges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Risques et Pièges d'une Mauvaise Utilisation</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Suspension ou suppression du compte</Text>
          <Text style={styles.listItem}>• Perte des avantages et bonus</Text>
          <Text style={styles.listItem}>• Pénalités financières en cas de fraude</Text>
          <Text style={styles.listItem}>• Responsabilité légale en cas d'usage abusif ou illicite</Text>
        </View>
      </View>

      {/* Section 7: Engagement d'Ebutan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Engagement d'Ebutan</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Protéger les données personnelles de ses utilisateurs</Text>
          <Text style={styles.listItem}>• Garantir un environnement numérique fiable et inclusif</Text>
          <Text style={styles.listItem}>• Assurer une transparence totale dans les transactions</Text>
          <Text style={styles.listItem}>• Mettre en place des mises à jour régulières pour améliorer la sécurité et l'expérience utilisateur</Text>
        </View>
      </View>

      {/* Section 8: Wallet de l'Application */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Wallet de l'Application</Text>
        <Text style={styles.sectionText}>
          Chaque utilisateur dispose d'un wallet personnel sécurisé :
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Utilisé uniquement pour les transactions liées aux commandes de gaz</Text>
          <Text style={styles.listItem}>• Recevoir des rémunérations légitimes (livreurs, dépôts, investisseurs)</Text>
          <Text style={styles.listItem}>• Percevoir des bonus de fidélité et dividendes communautaires</Text>
          <Text style={styles.listItem}>• Interdit pour blanchiment d'argent, financement illégal ou activités frauduleuses</Text>
        </View>
        <Text style={styles.sectionText}>
          Toute opération suspecte fera l'objet d'une vérification KYC/AML et pourra entraîner la suspension du compte et un signalement aux autorités compétentes.
        </Text>
      </View>

      {/* Section 9: Bon Usage Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Bon Usage et Responsabilités</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Utiliser le wallet de manière responsable et légale</Text>
          <Text style={styles.listItem}>• Ne pas partager ses identifiants d'accès</Text>
          <Text style={styles.listItem}>• Signaler toute activité suspecte</Text>
          <Text style={styles.listItem}>• Respecter les règles établies par l'application</Text>
        </View>
      </View>

      {/* Section 10: Avantages Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Avantages d'un Bon Usage</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Accès rapide, sécurisé et transparent au gaz domestique</Text>
          <Text style={styles.listItem}>• Rémunérations et bonus de fidélité automatiques</Text>
          <Text style={styles.listItem}>• Sécurité renforcée pour les fonds et transactions</Text>
          <Text style={styles.listItem}>• Opportunités de revenus supplémentaires grâce au système communautaire</Text>
        </View>
      </View>

      {/* Section 11: Risques Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Risques d'une Mauvaise Utilisation</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Blocage immédiat du wallet et du compte</Text>
          <Text style={styles.listItem}>• Perte des avantages et bonus</Text>
          <Text style={styles.listItem}>• Signalement aux autorités compétentes</Text>
          <Text style={styles.listItem}>• Poursuites judiciaires en cas d'activités frauduleuses (blanchiment, corruption, fraude)</Text>
        </View>
      </View>

      {/* Lien vers les CGU */}
      <TouchableOpacity style={styles.linkContainer} onPress={() => Linking.openURL('https://votre-site.com/terms')}>
        <Text style={styles.linkText}>Lire nos Conditions Générales d'Utilisation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 10,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    textAlign: 'justify',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  list: {
    paddingLeft: 15,
    marginVertical: 8,
  },
  listItem: {
    fontSize: 16,
    color: '#34495e',
    marginVertical: 4,
    lineHeight: 22,
  },
  linkContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
