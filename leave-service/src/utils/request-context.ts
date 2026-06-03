import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  userId?: string;
  role?: string;
  authorization?: string;
  correlationId?: string;
}

export const requestContext =
  new AsyncLocalStorage<RequestContext>();

export function getRequestContext() {
  return requestContext.getStore();
}