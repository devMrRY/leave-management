import { connectConsumer, createConsumer } from "@myorg/shared"; // shared consumer
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { handleUserCreated } from "../eventHandlers/user";
import { handleLeaveApproved, handleLeaveCreated, handleLeaveRejected } from "../eventHandlers/leave";

const tracer = trace.getTracer('notification-service');

export const startConsumer = async () => {
    const ch = await connectConsumer();
    await createConsumer({
        channel: ch,
        exchange: "user.exchange",
        queue: "notification.user.queue",
        routingKey: "user.created",
        handler: async (data) => {
            await tracer.startActiveSpan('process.user.created', async (span) => {
                span.setAttribute('messaging.system', 'rabbitmq');
                span.setAttribute('messaging.destination', 'user.exchange');
                span.setAttribute('messaging.rabbitmq.routing_key', 'user.created');
                try {
                    await handleUserCreated(data);
                    span.setStatus({ code: SpanStatusCode.OK });
                } catch (err) {
                    span.recordException(err as Error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error)?.message });
                    throw err;
                }
            });
        }
    });

    await createConsumer({
        channel: ch,
        exchange: "leave.exchange",
        queue: "notification.leave.queue",
        routingKey: "leave.approved",
        handler: async (data) => {
            await tracer.startActiveSpan('process.leave.approved', async (span) => {
                span.setAttribute('messaging.system', 'rabbitmq');
                span.setAttribute('messaging.destination', 'leave.exchange');
                span.setAttribute('messaging.rabbitmq.routing_key', 'leave.approved');
                try {
                    await handleLeaveApproved(data);
                    span.setStatus({ code: SpanStatusCode.OK });
                } catch (err) {
                    span.recordException(err as Error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error)?.message });
                    throw err;
                }
            });
        }
    });

    await createConsumer({
        channel: ch,
        exchange: "leave.exchange",
        queue: "notification.leave.queue",
        routingKey: "leave.rejected",
        handler: async (data) => {
            await tracer.startActiveSpan('process.leave.rejected', async (span) => {
                span.setAttribute('messaging.system', 'rabbitmq');
                span.setAttribute('messaging.destination', 'leave.exchange');
                span.setAttribute('messaging.rabbitmq.routing_key', 'leave.rejected');
                try {
                    await handleLeaveRejected(data);
                    span.setStatus({ code: SpanStatusCode.OK });
                } catch (err) {
                    span.recordException(err as Error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error)?.message });
                    throw err;
                }
            });
        }
    });

    await createConsumer({
        channel: ch,
        exchange: "leave.exchange",
        queue: "notification.leave.queue",
        routingKey: "leave.created",
        handler: async (data) => {
            await tracer.startActiveSpan('process.leave.created', async (span) => {
                span.setAttribute('messaging.system', 'rabbitmq');
                span.setAttribute('messaging.destination', 'leave.exchange');
                span.setAttribute('messaging.rabbitmq.routing_key', 'leave.created');
                try {
                    await handleLeaveCreated(data);
                    span.setStatus({ code: SpanStatusCode.OK });
                } catch (err) {
                    span.recordException(err as Error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error)?.message });
                    throw err;
                }
            });
        }
    });
};

startConsumer();
