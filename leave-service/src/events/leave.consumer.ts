import {
  connectChannel,
  createConsumer,
  runInConsumerSpan,
} from "@myorg/shared";
import {
  handlePopulateUserLeaveBalance,
  handleUpdateManager,
} from "../eventHandlers/populateLeaveBalance.js";

export const startConsumer = async () => {
  const ch = await connectChannel();
  await createConsumer({
    channel: ch,
    exchange: "user.exchange",
    queue: "leave.user.queue",
    routingKey: "user.created",
    handler: async (data) => {
      runInConsumerSpan("populate-user-leave-balance", () =>
        handlePopulateUserLeaveBalance(data),
      );
    },
  });

  await createConsumer({
    channel: ch,
    exchange: "user.exchange",
    queue: "leave.user.queue",
    routingKey: "user.managerUpdated",
    handler: async (data) => {
      runInConsumerSpan("update-manager", () => handleUpdateManager(data));
    },
  });
};
