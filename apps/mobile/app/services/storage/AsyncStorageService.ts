import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageService {
  /**
   * Store a value in AsyncStorage
   */
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a value from AsyncStorage
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value from AsyncStorage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all values from AsyncStorage
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Get all keys in AsyncStorage
   */
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }
}
