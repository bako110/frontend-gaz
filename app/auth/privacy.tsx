import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native';

export default function PrivacyPolicyScreen() {
  const [consentGiven, setConsentGiven] = useState(false);

  const handleConsent = () => {
    setConsentGiven(true);
    Alert.alert("Merci", "Votre consentement a été enregistré.");
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainTitle}>
        Politique de Confidentialité et d’Utilisation Responsable – Application Ebutan
      </Text>
      <Text style={styles.lastUpdated}>Dernière mise à jour : 08/09/2025</Text>

      <Text style={styles.intro}>
        La présente politique définit les règles de collecte, d’utilisation, de protection et de partage des données personnelles des utilisateurs de l’application Ebutan, conformément aux normes internationales (ISO/IEC 27001, RGPD) et aux lois nationales en vigueur.
      </Text>

      {/* 1. Collecte et Utilisation des Données */}
      <Text style={styles.sectionTitle}>1. Collecte et Utilisation des Données</Text>
      <Text style={styles.sectionText}>
        Ebutan recueille uniquement les informations nécessaires au bon fonctionnement de l’application : identité, coordonnées, localisation, transactions, moyens de paiement.
      </Text>
      <Text style={styles.sectionText}>Ces données sont utilisées pour :</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Faciliter les commandes, livraisons et paiements</Text>
        <Text style={styles.listItem}>• Assurer la traçabilité et la sécurité des opérations</Text>
        <Text style={styles.listItem}>• Améliorer la qualité des services et l’expérience utilisateur</Text>
        <Text style={styles.listItem}>• Personnaliser les offres et recommandations (avec consentement)</Text>
      </View>
      <Text style={styles.sectionText}>
        Aucune donnée n’est vendue ni transmise à des tiers sans le consentement explicite de l’utilisateur, sauf obligation légale.
      </Text>

      {/* 2. Protection et Sécurité */}
      <Text style={styles.sectionTitle}>2. Protection et Sécurité</Text>
      <Text style={styles.sectionText}>
        Les données sont stockées et protégées via des systèmes conformes aux normes ISO/IEC 27001. Les transactions financières sont sécurisées par des protocoles de chiffrement (TLS 1.3, AES-256). Chaque acteur (client, livreur, dépôt, investisseur) doit passer par une procédure KYC pour garantir transparence et fiabilité.
      </Text>
      <Text style={styles.sectionText}>
        Nous réalisons des audits de sécurité trimestriels et formons régulièrement nos équipes à la cybersécurité.
      </Text>

      {/* 3. Droits des Utilisateurs */}
      <Text style={styles.sectionTitle}>3. Droits des Utilisateurs</Text>
      <Text style={styles.sectionText}>Chaque utilisateur dispose des droits suivants :</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Accès à ses données personnelles</Text>
        <Text style={styles.listItem}>• Rectification de ses informations</Text>
        <Text style={styles.listItem}>• Suppression de son compte et de ses données</Text>
        <Text style={styles.listItem}>• Opposition au traitement de ses données dans certains cas</Text>
        <Text style={styles.listItem}>• Portabilité des données</Text>
      </View>
      <Text style={styles.sectionText}>
        Pour exercer ces droits, contactez notre{' '}
        <Text style={styles.link} onPress={() => openLink('mailto:support@ebutan.bf')}>Délégué à la Protection des Données (DPO)</Text>.
      </Text>

      {/* 4. Bon Usage et Responsabilités */}
      <Text style={styles.sectionTitle}>4. Bon Usage et Responsabilités</Text>
      <Text style={styles.sectionText}>Chaque utilisateur s’engage à :</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Fournir des informations exactes et à jour</Text>
        <Text style={styles.listItem}>• Ne pas utiliser l’application à des fins frauduleuses ou illégales</Text>
        <Text style={styles.listItem}>• Respecter les autres acteurs (clients, livreurs, dépôts)</Text>
        <Text style={styles.listItem}>• Protéger ses identifiants d’accès et éviter tout partage non autorisé</Text>
      </View>

      {/* 5. Cookies et Préférences */}
      <Text style={styles.sectionTitle}>5. Gestion des Cookies et Préférences</Text>
      <Text style={styles.sectionText}>
        Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences à tout moment dans les paramètres de l’application.
      </Text>

      {/* 6. Engagement RSE et Éthique */}
      <Text style={styles.sectionTitle}>6. Engagement RSE et Éthique</Text>
      <Text style={styles.sectionText}>
        Ebutan s’engage à promouvoir une économie circulaire, à réduire son empreinte carbone et à soutenir les communautés locales via des programmes de formation et d’inclusion numérique.
      </Text>

      {/* 7. Mises à jour de la Politique */}
      <Text style={styles.sectionTitle}>7. Mises à jour de la Politique</Text>
      <Text style={styles.sectionText}>
        Cette politique est révisée annuellement ou en cas de changement réglementaire majeur. Les utilisateurs sont notifiés par email et via l’application.
      </Text>

      {/* 8. Consentement */}
      <Text style={styles.sectionTitle}>8. Consentement</Text>
      <Text style={styles.sectionText}>
        En utilisant Ebutan, vous acceptez les termes de cette politique. Vous pouvez révoquer votre consentement à tout moment.
      </Text>
      <TouchableOpacity style={styles.consentButton} onPress={handleConsent}>
        <Text style={styles.consentButtonText}>Je donne mon consentement</Text>
      </TouchableOpacity>

      {/* 9. FAQ */}
      <Text style={styles.sectionTitle}>9. Questions Fréquentes</Text>
      <Text style={styles.sectionText}>
        <Text style={styles.link} onPress={() => openLink('https://ebutan.bf/faq')}>Consultez notre FAQ détaillée</Text> pour plus d’informations.
      </Text>

      {/* 10. Contact */}
      <Text style={styles.sectionTitle}>10. Contact</Text>
      <Text style={styles.sectionText}>
        Pour toute question :{' '}
        <Text style={styles.link} onPress={() => openLink('mailto:support@ebutan.bf')}>support@ebutan.bf</Text> ou via l’application.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
    color: '#444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#222',
  },
  sectionText: {
    fontSize: 16,
    marginVertical: 5,
    lineHeight: 24,
    color: '#444',
  },
  list: {
    paddingLeft: 15,
    marginVertical: 5,
  },
  listItem: {
    fontSize: 16,
    marginVertical: 3,
    color: '#444',
  },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  consentButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 15,
  },
  consentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
