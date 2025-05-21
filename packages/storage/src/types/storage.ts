export type Storage = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<void>;
};
