import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SkyRanchDB extends DBSchema {
  animals: {
    key: string;
    value: any;
    indexes: { 'by-updated': Date };
  };
  'pending-sync': {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      table: string;
      data: any;
      timestamp: Date;
    };
  };
  'health-records': {
    key: string;
    value: any;
  };
  'breeding-records': {
    key: string;
    value: any;
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: Date;
      expiresAt: Date;
    };
  };
}

class OfflineStorageService {
  private db: IDBPDatabase<SkyRanchDB> | null = null;
  private readonly DB_NAME = 'skyranch-offline';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<SkyRanchDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Animals store
        if (!db.objectStoreNames.contains('animals')) {
          const animalStore = db.createObjectStore('animals', { keyPath: 'id' });
          animalStore.createIndex('by-updated', 'updatedAt');
        }

        // Pending sync operations
        if (!db.objectStoreNames.contains('pending-sync')) {
          db.createObjectStore('pending-sync', { keyPath: 'id' });
        }

        // Health records
        if (!db.objectStoreNames.contains('health-records')) {
          db.createObjectStore('health-records', { keyPath: 'id' });
        }

        // Breeding records
        if (!db.objectStoreNames.contains('breeding-records')) {
          db.createObjectStore('breeding-records', { keyPath: 'id' });
        }

        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      },
    });

    console.log('📦 Offline storage initialized');
  }

  // Animals
  async saveAnimal(animal: any): Promise<void> {
    await this.initialize();
    await this.db!.put('animals', { ...animal, updatedAt: new Date() });
  }

  async getAnimal(id: string): Promise<any> {
    await this.initialize();
    return this.db!.get('animals', id);
  }

  async getAllAnimals(): Promise<any[]> {
    await this.initialize();
    return this.db!.getAll('animals');
  }

  async deleteAnimal(id: string): Promise<void> {
    await this.initialize();
    await this.db!.delete('animals', id);
  }

  // Pending sync operations
  async addPendingSync(operation: {
    type: 'create' | 'update' | 'delete';
    table: string;
    data: any;
  }): Promise<void> {
    await this.initialize();
    const id = `${operation.table}-${operation.type}-${Date.now()}-${Math.random()}`;
    await this.db!.put('pending-sync', {
      id,
      ...operation,
      timestamp: new Date(),
    });
    console.log('📝 Added pending sync operation:', id);
  }

  async getPendingSyncOperations(): Promise<any[]> {
    await this.initialize();
    return this.db!.getAll('pending-sync');
  }

  async removePendingSync(id: string): Promise<void> {
    await this.initialize();
    await this.db!.delete('pending-sync', id);
  }

  async clearPendingSync(): Promise<void> {
    await this.initialize();
    const tx = this.db!.transaction('pending-sync', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  // Cache management
  async setCache(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    await this.initialize();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
    await this.db!.put('cache', {
      key,
      data,
      timestamp: now,
      expiresAt,
    });
  }

  async getCache(key: string): Promise<any | null> {
    await this.initialize();
    const cached = await this.db!.get('cache', key);
    if (!cached) return null;

    const now = new Date();
    if (now > cached.expiresAt) {
      await this.db!.delete('cache', key);
      return null;
    }

    return cached.data;
  }

  async clearExpiredCache(): Promise<void> {
    await this.initialize();
    const all = await this.db!.getAll('cache');
    const now = new Date();
    const tx = this.db!.transaction('cache', 'readwrite');
    
    for (const item of all) {
      if (now > item.expiresAt) {
        await tx.store.delete(item.key);
      }
    }
    
    await tx.done;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await this.initialize();
    const stores = ['animals', 'pending-sync', 'health-records', 'breeding-records', 'cache'] as const;

    for (const storeName of stores) {
      const tx = this.db!.transaction(storeName, 'readwrite');
      await tx.store.clear();
      await tx.done;
    }
    
    console.log('🗑️ Cleared all offline storage');
  }
}

export const offlineStorage = new OfflineStorageService();
