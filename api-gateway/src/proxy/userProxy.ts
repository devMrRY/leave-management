import { createServiceProxy } from "./createProxy.js";

export const userProxy = createServiceProxy({
  serviceName: "user-service",
  pathRewrite: {
    "^/api/users": "",
  },
});