import {
  connectChannel,
  createConsumer,
  runInConsumerSpan,
} from "@myorg/shared";
import { handleUserCreated } from "../eventHandlers/user";
import {
  handleLeaveApproved,
  handleLeaveCreated,
  handleLeaveRejected,
} from "../eventHandlers/leave";

export const startConsumer = async () => {
  const ch = await connectChannel();
  await createConsumer({
    channel: ch,
    exchange: "user.exchange",
    queue: "notification.user.queue",
    routingKey: "user.created",
    handler: async (data) => {
      runInConsumerSpan("process.user.creted", () => handleUserCreated(data));
    },
  });

  await createConsumer({
    channel: ch,
    exchange: "leave.exchange",
    queue: "notification.leave.queue",
    routingKey: "leave.approved",
    handler: async (data) => {
      runInConsumerSpan("process.leave.approved", () =>
        handleLeaveApproved(data),
      );
    },
  });

  await createConsumer({
    channel: ch,
    exchange: "leave.exchange",
    queue: "notification.leave.queue",
    routingKey: "leave.rejected",
    handler: async (data) => {
      runInConsumerSpan("process.leave.rejected", () =>
        handleLeaveRejected(data),
      );
    },
  });

  await createConsumer({
    channel: ch,
    exchange: "leave.exchange",
    queue: "notification.leave.queue",
    routingKey: "leave.created",
    handler: async (data) => {
      runInConsumerSpan("process.leave.created", () =>
        handleLeaveCreated(data),
      );
    },
  });
};
