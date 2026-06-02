import { connectConsumer, createConsumer } from '../../../user-service/src/shared-config/rabbitMQ/consumer';

(async () => {
  // 1. Connect to RabbitMQ and get a channel
  const channel = await connectConsumer();

  // 2. Set up a consumer for a specific event type (e.g., notifications)
  await createConsumer({
    channel,
    exchange: 'main-exchange', // Shared exchange for all services
    queue: 'notification-service-queue', // Unique queue for this service/instance
    routingKey: 'user.created', // Listen for 'user.created' events
    handler: async (data) => {
      // Handle the event data
      console.log('Notification Service received user.created event:', data);
      // ...send notification, etc.
    }
  });

  // You can set up more consumers for other event types if needed:
  await createConsumer({
    channel,
    exchange: 'main-exchange',
    queue: 'notification-service-queue', // Same queue, or use a different one if you want to separate
    routingKey: 'leave.approved', // Listen for 'leave.approved' events
    handler: async (data) => {
      console.log('Notification Service received leave.approved event:', data);
      // ...send notification, etc.
    }
  });
})();
