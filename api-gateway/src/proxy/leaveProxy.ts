import { createServiceProxy } from "./createProxy.js";

export const leaveProxy = createServiceProxy({
  serviceName: "leave-service",
  pathRewrite: {
    "^/api/leaves": "",
  },
});