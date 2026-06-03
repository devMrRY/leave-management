
import { logger } from "@myorg/shared";
import { getServiceClient } from "../utils/getServiceClient";

export const getEmployeeDetails = async (employeeIds: string[]) => {
    try {
        const userClient = await getServiceClient('user-service');
        const response = await userClient.post('/employees',
            { employeeIds },
        );
        logger.info({ status: response.status, statusText: response.statusText }, 'Received response from user-service for employee details');

        if (!response.ok) {
            logger.error({ status: response.status, statusText: response.statusText }, 'Failed to fetch employee details from user-service');
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        logger.error({ error: error?.message }, 'Failed to fetch employee details from user-service');
        return [];
    }
}

export const getEmployeeDetail = async (employeeId: string) => {
    try {
        const userClient = await getServiceClient('user-service');
        const response = await userClient.get(`/${encodeURIComponent(employeeId)}`);
        if (!response.ok) {
            logger.error({ status: response.status, statusText: response.statusText }, `Failed to fetch details for employee ${employeeId} from user-service`);
            return null;
        }
        const data = await response.json();
        logger.info({ data: JSON.stringify(data) }, `Fetched details for employee ${employeeId} from user-service`);
        return data;
    } catch (error) {
        logger.error({ error }, `Failed to fetch details for employee ${employeeId} from user-service`);
        return null;
    }
}