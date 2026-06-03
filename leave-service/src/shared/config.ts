import { logger, serviceRegistry } from "@myorg/shared";

export const getBaseUrl = async (serviceName: string): Promise<string> => {
    const url = await serviceRegistry.discover(serviceName).catch((error) => 
        logger.error({error}, `Failed to discover service '${serviceName}' from registry`)
    );
    if (!url) {
        throw new Error(`Base URL for service '${serviceName}' is not defined`);
    }
    return url;
};