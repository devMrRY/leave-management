import { createServiceProxy } from "./createProxy";

export const leaveProxy = createServiceProxy({
  serviceName: "leave-service",
  pathRewrite: {
    "^/api/leaves": "",
  },
});