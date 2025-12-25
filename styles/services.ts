import { StyleSheet, Dimensions, Platform } from "react-native";
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  // Conteneur principal
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },

  // Style pour le ScrollView
  scrollView: {
    paddingBottom: 90,
  },

  // En-tête de la page
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    overflow: "hidden",
  },

  // Contenu de l'en-tête
  headerContent: {
    marginBottom: 20,
  },

  // Titre de l'en-tête
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 6,
  },

  // Sous-titre de l'en-tête
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "400",
  },

  // Avatar dans l'en-tête
  headerAvatar: {
    alignSelf: "flex-end",
  },

  // Contenu principal
  content: {
    paddingHorizontal: 24,
  },

  // Titre de section
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    marginTop: 10,
  },

  // Ligne de services
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  // Carte de service
  serviceCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  // Dégradé de la carte de service
  serviceCardGradient: {
    padding: 20,
    height: 180,
    justifyContent: "flex-end",
  },

  // Conteneur de l'icône de service
  serviceIconContainer: {
    position: "absolute",
    top: 15,
    right: 15,
  },

  // Titre de service
  serviceTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  // Description de service
  serviceDescription: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 14,
    lineHeight: 20,
  },

  // Liste des témoignages
  testimonialsList: {
    paddingVertical: 10,
  },

  // Carte de témoignage
  testimonialCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    width: width * 0.8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },

  // Avatar du témoignage
  testimonialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  // Contenu du témoignage
  testimonialContent: {},

  // Nom du témoin
  testimonialName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },

  // Conteneur des étoiles
  starsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },

  // Commentaire du témoignage
  testimonialComment: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
  },

  // Bouton flottant
  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#4D96FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },

  // Dégradé du bouton flottant
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;
