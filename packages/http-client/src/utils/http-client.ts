import { Pool, RetryAgent, type Dispatcher } from "undici";

export class HttpClient {
  private readonly pool: Pool;
  private readonly agent: RetryAgent;

  constructor(baseUrl: string) {
    this.pool = new Pool(baseUrl);
    this.agent = new RetryAgent(this.pool);
  }

  public async request<T>(
    options: Dispatcher.RequestOptions<T>,
  ): Promise<Dispatcher.ResponseData<T>> {
    const response = await this.agent.request<T>(options);

    return response;
  }
}
