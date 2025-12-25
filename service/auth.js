import { API_BASE_URL } from '@/service/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Login with phone and PIN
  async loginWithPin(userId, pin, location) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin, location }),
      });

      if (!response.ok) throw new Error('Login failed');
      return await response.json();
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Registration failed');
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userId');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
};
