/// <reference types="vite/client" />

interface StorageResult {
  value?: string;
}

interface Window {
  storage: {
    get(key: string): Promise<StorageResult | null>;
    set(key: string, value: string): Promise<void>;
  };
}
