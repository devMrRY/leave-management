import { HttpClient } from "@myorg/shared";
import { getBaseUrl } from "../shared/config";
import { getRequestContext } from "./request-context";
import { getCircuitBreaker, RequestOptions } from "./getCircuitBreaker";

const clientCache = new Map<string, HttpClient>();

export async function getServiceClient(service: string) {
    let client = clientCache.get(service);

    if (!client) {
        const baseUrl = await getBaseUrl(service);

        client = new HttpClient({
            baseUrl,
            getRequestContext,
        });

        clientCache.set(service, client);
    }

    const breaker = getCircuitBreaker(service, async (options: RequestOptions) => {
        return client!.request(options.method, options.path, options);
    });

    return {
        get: (path: string, options?: RequestOptions) =>
            breaker.fire({ method: "GET", path, ...options }),

        post: (path: string, body?: any, options?: RequestOptions) =>
            breaker.fire({ method: "POST", path, ...options, headers: { ...options?.headers, "content-type": "application/json" }, body: JSON.stringify(body) }),

        put: (path: string, body?: any, options?: RequestOptions) =>
            breaker.fire({ method: "PUT", path, ...options, headers: { ...options?.headers, "content-type": "application/json" }, body: JSON.stringify(body) }),

        patch: (path: string, body?: any, options?: RequestOptions) =>
            breaker.fire({ method: "PATCH", path, ...options, headers: { ...options?.headers, "content-type": "application/json" }, body: JSON.stringify(body) }),


        delete: (path: string, options?: RequestOptions) =>
            breaker.fire({ method: "DELETE", path, ...options }),
    };
}