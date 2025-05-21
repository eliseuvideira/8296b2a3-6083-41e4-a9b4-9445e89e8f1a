import { Pool, type Dispatcher } from "undici";

export const HttpClient = (baseUrl: string) => {
  const pool = new Pool(baseUrl);

  return {
    request: async <T>(
      options: Dispatcher.RequestOptions<T>,
    ): Promise<Dispatcher.ResponseData<T>> => {
      const response = await pool.request<T>(options);

      return response;
    },
  };
};

export type HttpClient = {
  request: <T>(
    options: Dispatcher.RequestOptions<T>,
  ) => Promise<Dispatcher.ResponseData<T>>;
};
