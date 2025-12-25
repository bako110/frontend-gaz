import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/service/config';

// ---------------------------------------------
// Interfaces et types
// ---------------------------------------------
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
  data: Record<string, any>;
  timestamp: number;
}

interface NotificationsApiResponse {
  success: boolean;
  notifications?: {
    _id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    data?: Record<string, any>;
  }[];
  message?: string;
}

interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  clientId: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

// ---------------------------------------------
// Fonction utilitaire pour formater les dates
// ---------------------------------------------
const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR');
};

// ---------------------------------------------
// Récupérer l'ID client depuis AsyncStorage
// ---------------------------------------------
const getClientIdFromStorage = async (): Promise<string | null> => {
  try {
    const clientId = await AsyncStorage.getItem('clientId');
    if (clientId) {
      console.log('✅ ID client trouvé:', clientId);
      return clientId;
    }
    console.warn('❌ Aucun ID client trouvé');
    return null;
  } catch (err) {
    console.error('❌ Erreur récupération ID client:', err);
    return null;
  }
};

// ---------------------------------------------
// Hook personnalisé
// ---------------------------------------------
const useNotifications = (): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // ---------------------------------------------
  // Charger l'ID client au montage
  // ---------------------------------------------
  useEffect(() => {
    const loadClientId = async () => {
      const id = await getClientIdFromStorage();
      setClientId(id);
    };
    loadClientId();
  }, []);

  // ---------------------------------------------
  // Récupérer les notifications
  // ---------------------------------------------
  const fetchNotifications = useCallback(async () => {
    let currentClientId = clientId;
    if (!currentClientId) {
      currentClientId = await getClientIdFromStorage();
      if (!currentClientId) {
        setError('ID client non trouvé');
        return;
      }
      setClientId(currentClientId);
    }

    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token manquant');

      const url = `${API_BASE_URL}/notifications/livreur/${currentClientId}`;
      console.log('🔄 Récupération des notifications pour clientId:', currentClientId);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data: NotificationsApiResponse = await response.json();

      if (data.success && data.notifications) {
        const formatted: Notification[] = data.notifications
          .map((notif) => ({
            id: notif._id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            date: formatNotificationDate(notif.createdAt),
            read: notif.read,
            data: notif.data || {},
            timestamp: new Date(notif.createdAt).getTime(),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ ${formatted.length} notifications chargées`);
        setNotifications(formatted);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement des notifications');
      }
    } catch (err: unknown) {
      console.error('❌ Erreur fetchNotifications:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // ---------------------------------------------
  // Marquer une notification comme lue
  // ---------------------------------------------
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Erreur marquage comme lu:', err);
    }
  }, []);

  // ---------------------------------------------
  // Marquer toutes les notifications comme lues
  // ---------------------------------------------
  const markAllAsRead = useCallback(async () => {
    const currentClientId = clientId || (await getClientIdFromStorage());
    if (!currentClientId) {
      console.error('ID client manquant pour markAllAsRead');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/notifications/user/${currentClientId}/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Erreur marquage de toutes les notifications comme lues:', err);
    }
  }, [clientId]);

  // ---------------------------------------------
  // Supprimer une notification
  // ---------------------------------------------
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    }
  }, []);

  // ---------------------------------------------
  // Retour du hook
  // ---------------------------------------------
  return {
    notifications,
    loading,
    error,
    clientId,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default useNotifications;
