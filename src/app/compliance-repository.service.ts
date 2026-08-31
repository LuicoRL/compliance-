import { Injectable } from '@angular/core';
import { ComplianceApplication } from './compliance.models';

@Injectable({ providedIn: 'root' })
export class ComplianceRepositoryService {
  private readonly databaseName = 'compliance-portal-demo';
  private readonly storeName = 'applications';

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(this.storeName)) {
          request.result.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(application: ComplianceApplication): Promise<void> {
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.objectStore(this.storeName).put(application);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }

  async getAll(): Promise<ComplianceApplication[]> {
    const database = await this.openDatabase();
    const applications = await new Promise<ComplianceApplication[]>((resolve, reject) => {
      const request = database.transaction(this.storeName).objectStore(this.storeName).getAll();
      request.onsuccess = () => resolve(request.result as ComplianceApplication[]);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return applications.map(application => ({
      ...application,
      baseDocumentationReviewed: application.baseDocumentationReviewed ?? false,
      followUpFormsEnabled: application.followUpFormsEnabled ?? false,
      documents: application.documents ?? []
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
