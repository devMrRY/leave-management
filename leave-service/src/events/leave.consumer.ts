import { connectConsumer, createConsumer } from "@myorg/shared";
import { handlePopulateUserLeaveBalance, handleUpdateManager } from "../eventHandlers/populateLeaveBalance";

export const startConsumer = async () => {
    const ch = await connectConsumer();
    await createConsumer({
        channel: ch,
        exchange: "user.exchange",
        queue: "leave.user.queue",
        routingKey: "user.created",
        handler: handlePopulateUserLeaveBalance
    });

    await createConsumer({
        channel: ch,
        exchange: "user.exchange",
        queue: "leave.user.queue",
        routingKey: "user.managerUpdated",
        handler: handleUpdateManager,
    });
};

startConsumer();