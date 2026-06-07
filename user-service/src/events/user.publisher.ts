import { publish, getCircuitBreaker } from "@myorg/shared";

const userPublishAction = async (exchange: string, routingKey: string, payload: any) => {
  return publish(exchange, routingKey, payload);
}

const userBreaker = getCircuitBreaker("user.exchange", userPublishAction);

export const publishUserCreated = async (user: {
  employeeId: string;
  email: string;
  role: string;
  name?: string;
}) => {
  return userBreaker.fire("user.exchange", "user.created", user);
};

export const publishManagerUpdated = async (user: {
  employeeId: string;
  managerId: string;
}) => {
  return userBreaker.fire("user.exchange", "user.managerUpdated", user);
};
