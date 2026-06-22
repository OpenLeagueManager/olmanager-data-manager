declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options?: { eager?: boolean }): Record<string, T>;
  }
}

export {};
