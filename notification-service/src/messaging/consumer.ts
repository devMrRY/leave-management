import { connectConsumer, createConsumer } from "../rabbitMQ/consumer";// shared consumer
import { handleUserCreated } from "../eventHandlers/user";
import { handleLeaveApproved, handleLeaveCreated, handleLeaveRejected } from "../eventHandlers/leave";

export const startConsumer = async () => {
    const ch = await connectConsumer();
    await createConsumer({
        channel: ch,
        exchange: "user.exchange",
        queue: "notification.user.queue",
        routingKey: "user.created",
        handler: handleUserCreated
    });

    await createConsumer({
        channel: ch,
        exchange: "leave.exchange",
        queue: "notification.leave.queue",
        routingKey: "leave.approved",
        handler: handleLeaveApproved
    });

     await createConsumer({
        channel: ch,
        exchange: "leave.exchange",
        queue: "notification.leave.queue",
        routingKey: "leave.rejected",
        handler: handleLeaveRejected
    });

    await createConsumer({
        channel: ch,
        exchange: "leave.exchange",
        queue: "notification.leave.queue",
        routingKey: "leave.created",
        handler: handleLeaveCreated
    });
};

startConsumer();
