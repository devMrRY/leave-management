import { logger, serviceRegistry } from "@myorg/shared";
import { AppError } from "../utils/customError";

export const getBaseUrl = async (serviceName: string): Promise<string> => {
    const url = await serviceRegistry.discover(serviceName);
    if (!url) {
        logger.warn(`Base URL for service '${serviceName}' is not defined`);
        throw new AppError(500, `Base URL for service '${serviceName}' is not defined`);
    }
    return url;
};