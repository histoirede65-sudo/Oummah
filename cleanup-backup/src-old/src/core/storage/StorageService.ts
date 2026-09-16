import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStorage {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<readonly string[]>;
}

export interface StorageServiceContract extends KeyValueStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

/** The only application gateway to persistent device storage. */
export class StorageService implements StorageServiceContract {
  getString(key: string) {
    return AsyncStorage.getItem(key);
  }

  setString(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  }

  remove(key: string) {
    return AsyncStorage.removeItem(key);
  }

  keys() {
    return AsyncStorage.getAllKeys();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.getString(key);
    return value === null ? null : JSON.parse(value) as T;
  }

  set<T>(key: string, value: T) {
    return this.setString(key, JSON.stringify(value));
  }
}

export const storageService: StorageServiceContract = new StorageService();
