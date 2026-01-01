import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.95,
    maxWidth: 600,
    height: '95%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
  },
  lightModalContainer: {
    backgroundColor: '#fff',
  },
  darkModalContainer: {
    backgroundColor: '#1e1e1e',
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  contactSection: {
    padding: 15,
    borderBottomWidth: 1,
  },
  lightContactSection: {
    backgroundColor: '#f5f5f5',
    borderBottomColor: '#e0e0e0',
  },
  darkContactSection: {
    backgroundColor: '#2a2a2a',
    borderBottomColor: '#333',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  contactRowLast: {
    marginBottom: 0,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lightContactText: {
    color: '#666',
  },
  darkContactText: {
    color: '#ccc',
  },
  messageSection: {
    flex: 1,
    padding: 15,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  lightConversationHeader: {
    borderBottomColor: '#e0e0e0',
  },
  darkConversationHeader: {
    borderBottomColor: '#333',
  },
  conversationIcon: {
    marginRight: 8,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  lightConversationTitle: {
    color: '#000',
  },
  darkConversationTitle: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  lightLoadingText: {
    color: '#666',
  },
  darkLoadingText: {
    color: '#ccc',
  },
  messagesScrollView: {
    flex: 1,
    marginBottom: 12,
  },
  emptyMessageContainer: {
    padding: 30,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 10,
  },
  lightEmptyMessageContainer: {
    backgroundColor: '#f9f9f9',
  },
  darkEmptyMessageContainer: {
    backgroundColor: '#2a2a2a',
  },
  emptyMessageText: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  lightEmptyMessageText: {
    color: '#666',
  },
  darkEmptyMessageText: {
    color: '#ccc',
  },
  messageBubble: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 15,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adminMessage: {
    backgroundColor: '#2E7D32',
    alignSelf: 'flex-start',
  },
  userMessageLight: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
  },
  userMessageDark: {
    backgroundColor: '#3a3a3a',
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageIcon: {
    marginRight: 5,
  },
  messageSenderName: {
    fontWeight: '700',
    fontSize: 13,
  },
  adminSenderName: {
    color: '#fff',
  },
  userSenderName: {
    color: '#2E7D32',
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  adminMessageContent: {
    color: '#fff',
  },
  userMessageContentLight: {
    color: '#1a1a1a',
  },
  userMessageContentDark: {
    color: '#fff',
  },
  messageTimestamp: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  adminTimestamp: {
    color: 'rgba(255,255,255,0.8)',
  },
  userTimestampLight: {
    color: '#666',
  },
  userTimestampDark: {
    color: '#aaa',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    padding: 8,
    borderWidth: 2,
  },
  lightInputContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  darkInputContainer: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    maxHeight: 100,
    fontSize: 15,
  },
  lightTextInput: {
    color: '#000',
  },
  darkTextInput: {
    color: '#fff',
  },
  sendButton: {
    padding: 12,
    borderRadius: 25,
    marginLeft: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: '#2E7D32',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
