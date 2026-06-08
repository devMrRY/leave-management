import { HttpClient } from "@myorg/shared";
import { getBaseUrl } from "../shared/config.js";
import { getRequestContext } from "./request-context.js";
import { getCircuitBreaker } from "./getCircuitBreaker.js";

export interface RequestOptions extends RequestInit {
  method: string;
  path: string;
}

const clientCache = new Map<string, HttpClient>();

export async function getServiceClient(service: string) {
  const breaker = getCircuitBreaker(
    service,
    async (options: RequestOptions) => {
      let client = clientCache.get(service);

      if (!client) {
        const baseUrl = await getBaseUrl(service);
        
        client = new HttpClient({
          baseUrl,
          getRequestContext,
        });

        clientCache.set(service, client);
      }
      console.log(getRequestContext(), `Making request to ${service}: ${options.method} ${options.path}`);
      return client!.request(options.method, options.path, options);
    },
    // fallback: return a standardized 503-like response object
    async (_options: RequestOptions) => {
      return {
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ error: "Service Unavailable" }),
      } as any;
    },
  );

  return {
    get: (path: string, options?: RequestOptions) =>
      breaker.fire({ method: "GET", path, ...options }),

    post: (path: string, body?: any, options?: RequestOptions) =>
      breaker.fire({
        method: "POST",
        path,
        ...options,
        headers: { ...options?.headers, "content-type": "application/json" },
        body: body ? JSON.stringify(body) : body,
      }),

    put: (path: string, body?: any, options?: RequestOptions) =>
      breaker.fire({
        method: "PUT",
        path,
        ...options,
        headers: { ...options?.headers, "content-type": "application/json" },
        body: body ? JSON.stringify(body) : body,
      }),

    patch: (path: string, body?: any, options?: RequestOptions) =>
      breaker.fire({
        method: "PATCH",
        path,
        ...options,
        headers: { ...options?.headers, "content-type": "application/json" },
        body: body ? JSON.stringify(body) : body,
      }),

    delete: (path: string, options?: RequestOptions) =>
      breaker.fire({ method: "DELETE", path, ...options }),
  };
}
