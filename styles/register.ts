import { StyleSheet, Dimensions, Platform } from 'react-native';
const { width } = Dimensions.get('window');

const regstersStyles = {
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
    justifyContent: 'center',
  },
  progressBar: {
    width: '50%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  stepText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.8,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 20,
    marginTop: 15,
    marginBottom: 20,
    minHeight: 400,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputError: {
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
    marginLeft: 8,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 10,
    marginTop: 3,
    marginLeft: 12,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  userTypeContainer: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  userTypeGrid: {
    flex: 1,
    justifyContent: 'center',
  },
  userTypeCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userTypeCardGradient: {
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  userTypeDescription: {
    fontSize: 11,
    color: '#718096',
    marginLeft: 0,
    marginTop: 8,
  },
  pinSection: {
    alignItems: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  keypadContainer: {
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  keypadButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hiddenButton: {
    opacity: 0,
  },
  keypadButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  termsContainer: {
    marginVertical: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  termsText: {
    fontSize: 10,
    color: '#718096',
    flex: 1,
    flexWrap: 'wrap',
  },
  termsLink: {
    color: '#1565C0',
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // bouton de connexion
  loginRedirectContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },

loginRedirectText: {
  color: 'white',
  marginBottom: 10,
  fontSize: 14,
},

loginButton: {
  width: '100%',
  maxWidth: 300,
  borderRadius: 8,
  overflow: 'hidden',
  marginBottom: 20,
},

loginButtonGradient: {
  paddingVertical: 12,
  paddingHorizontal: 30,
  alignItems: 'center',
  justifyContent: 'center',
},

loginButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
},

};

export default regstersStyles;
