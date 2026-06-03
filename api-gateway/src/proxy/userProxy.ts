import { createServiceProxy } from "./createProxy";

export const userProxy = createServiceProxy({
  serviceName: "user-service",
  pathRewrite: {
    "^/api/users": "",
  },
});