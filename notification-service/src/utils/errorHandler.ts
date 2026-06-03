import { logger } from "@myorg/shared";

export const handleCrash = (error: Error) => {
    logger.error({ error }, 'Uncaught Exception / Unhandled Rejection:');
    setTimeout(() => {
        process.exit(1);
    }, 500);
};