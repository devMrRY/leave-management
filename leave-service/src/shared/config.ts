import { logger, serviceRegistry } from "@myorg/shared";

export const getBaseUrl = async (serviceName: string): Promise<string> => {
    const url = await serviceRegistry.discover(serviceName);
    if (!url) {
        logger.warn(`Base URL for service '${serviceName}' is not defined`);
        throw new Error(`Base URL for service '${serviceName}' is not defined`);
    }
    return url;
};