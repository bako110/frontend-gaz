import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/service/config';
import { socketService } from '@/service/socketService';
import { styles } from '@/styles/helpSupportModal';

interface Message {
  _id: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  userRole: 'distributeur' | 'client' | 'livreur';
  userModel: 'Distributor' | 'Client' | 'Livreur';
}

export default function HelpSupportModal({ 
  visible, 
  onClose, 
  isDarkMode, 
  userRole, 
  userModel 
}: HelpSupportModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      initializeSocketAndLoadMessages();
    } else {
      // Nettoyer les listeners quand le modal se ferme
      socketService.removeAllListeners();
    }
  }, [visible]);

  const initializeSocketAndLoadMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (!userProfileStr) return;

      const parsedData = JSON.parse(userProfileStr);
      const uid = parsedData.id || parsedData.user?.id;
      const uname = parsedData.user?.name || parsedData.name || 'Utilisateur';
      
      if (!uid) return;

      setUserId(uid);
      setUserName(uname);

      // Connexion Socket.io
      console.log('🔌 Connexion Socket.io avec userId:', uid);
      socketService.connect(uid);

      // Écouter les nouveaux messages
      socketService.onMessageReceived((message) => {
        console.log('📨 Nouveau message reçu via Socket.io:', message);
        setMessages((prev) => {
          // Vérifier si le message existe déjà
          const exists = prev.some(m => m._id === message._id);
          if (exists) {
            console.log('⚠️ Message déjà présent, skip');
            return prev;
          }
          console.log('✅ Ajout du nouveau message à la liste');
          return [...prev, message];
        });
        scrollToBottom();
      });

      // Écouter les confirmations d'envoi
      socketService.onMessageSent((message) => {
        console.log('✅ Message envoyé confirmé:', message);
        setMessages((prev) => {
          // Vérifier si le message existe déjà
          const exists = prev.some(m => m._id === message._id);
          if (exists) {
            console.log('⚠️ Message déjà présent, skip');
            return prev;
          }
          return [...prev, message];
        });
        scrollToBottom();
      });

      // Écouter les erreurs
      socketService.onMessageError((error) => {
        console.error('❌ Erreur message:', error);
        Alert.alert('Erreur', error.error || 'Erreur lors de l\'envoi du message');
      });

      // Charger les messages existants via HTTP (une seule fois)
      const response = await fetch(`${API_BASE_URL}/messages/admin/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
        setAdminInfo(data.admin || null);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const sendMessageToAdmin = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message');
      return;
    }

    if (!userId) {
      Alert.alert('Erreur', 'ID utilisateur non trouvé');
      return;
    }

    try {
      setIsSendingMessage(true);
      console.log('📤 Envoi message via Socket.io');

      // Envoyer via Socket.io au lieu de HTTP
      socketService.sendMessage({
        userId: userId,
        userRole: userRole,
        userModel: userModel,
        userName: userName,
        receiverId: 'admin',
        content: newMessage.trim(),
      });

      setNewMessage('');
      setIsSendingMessage(false);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du message');
      setIsSendingMessage(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isDarkMode ? styles.darkModalContainer : styles.lightModalContainer]}>
          {/* Header avec dégradé */}
          <LinearGradient
            colors={
              userRole === 'livreur'
                ? (isDarkMode ? ['#1565C0', '#0D47A1'] : ['#1565C0', '#1976D2'])
                : (isDarkMode ? ['#2E7D32', '#1B5E20'] : ['#2E7D32', '#388E3C'])
            }
            style={styles.headerGradient}
          >
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubbles" size={26} color="#fff" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>
                Messagerie
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Contact Info */}
          <View style={[styles.contactSection, isDarkMode ? styles.darkContactSection : styles.lightContactSection]}>
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={16} color={userRole === 'livreur' ? '#1565C0' : '#2E7D32'} style={styles.contactIcon} />
              <Text style={[styles.contactText, isDarkMode ? styles.darkContactText : styles.lightContactText]}>
                support@app.bf
              </Text>
            </View>
            <View style={[styles.contactRow, styles.contactRowLast]}>
              <Ionicons name="call" size={16} color={userRole === 'livreur' ? '#1565C0' : '#2E7D32'} style={styles.contactIcon} />
              <Text style={[styles.contactText, isDarkMode ? styles.darkContactText : styles.lightContactText]}>
                +226 70 00 00 00
              </Text>
            </View>
          </View>

          {/* Messagerie Section */}
          <View style={styles.messageSection}>
            <View style={[styles.conversationHeader, isDarkMode ? styles.darkConversationHeader : styles.lightConversationHeader]}>
              <Ionicons name="person-circle" size={20} color={userRole === 'livreur' ? '#1565C0' : '#2E7D32'} style={styles.conversationIcon} />
              <Text style={[styles.conversationTitle, isDarkMode ? styles.darkConversationTitle : styles.lightConversationTitle]}>
                Conversation avec l'Admin
              </Text>
            </View>

            {isLoadingMessages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={userRole === 'livreur' ? '#1565C0' : '#2E7D32'} />
                <Text style={[styles.loadingText, isDarkMode ? styles.darkLoadingText : styles.lightLoadingText]}>Chargement...</Text>
              </View>
            ) : (
              <>
                {/* Messages List */}
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.messagesScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.length === 0 ? (
                    <View style={[styles.emptyMessageContainer, isDarkMode ? styles.darkEmptyMessageContainer : styles.lightEmptyMessageContainer]}>
                      <Ionicons name="chatbubbles-outline" size={50} color={userRole === 'livreur' ? '#1565C0' : '#2E7D32'} />
                      <Text style={[styles.emptyMessageText, isDarkMode ? styles.darkEmptyMessageText : styles.lightEmptyMessageText]}>
                        Aucun message pour le moment.{'\n'}Commencez la conversation !
                      </Text>
                    </View>
                  ) : (
                    messages.map((msg, index) => (
                      <View
                        key={index}
                        style={[
                          styles.messageBubble,
                          msg.senderRole === 'admin' 
                            ? styles.adminMessage 
                            : (isDarkMode ? styles.userMessageDark : styles.userMessageLight)
                        ]}
                      >
                        <View style={styles.messageHeader}>
                          <Ionicons 
                            name={msg.senderRole === 'admin' ? 'shield-checkmark' : 'person'} 
                            size={14} 
                            color={msg.senderRole === 'admin' ? '#fff' : '#2E7D32'}
                            style={styles.messageIcon}
                          />
                          <Text style={[
                            styles.messageSenderName,
                            msg.senderRole === 'admin' ? styles.adminSenderName : styles.userSenderName
                          ]}>
                            {msg.senderName}
                          </Text>
                        </View>
                        <Text style={[
                          styles.messageContent,
                          msg.senderRole === 'admin' 
                            ? styles.adminMessageContent 
                            : (isDarkMode ? styles.userMessageContentDark : styles.userMessageContentLight)
                        ]}>
                          {msg.content}
                        </Text>
                        <Text style={[
                          styles.messageTimestamp,
                          msg.senderRole === 'admin' 
                            ? styles.adminTimestamp 
                            : (isDarkMode ? styles.userTimestampDark : styles.userTimestampLight)
                        ]}>
                          {new Date(msg.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Input Section */}
                <View style={[styles.inputContainer, isDarkMode ? styles.darkInputContainer : styles.lightInputContainer]}>
                  <TextInput
                    style={[styles.textInput, isDarkMode ? styles.darkTextInput : styles.lightTextInput]}
                    placeholder="Écrivez votre message..."
                    placeholderTextColor={isDarkMode ? '#888' : '#999'}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    onPress={sendMessageToAdmin}
                    disabled={isSendingMessage || !newMessage.trim()}
                    style={[
                      styles.sendButton,
                      isSendingMessage || !newMessage.trim() ? styles.sendButtonDisabled : styles.sendButtonActive
                    ]}
                  >
                    {isSendingMessage ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
