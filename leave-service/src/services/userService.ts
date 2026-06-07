import { logger } from "@myorg/shared";
import { getServiceClient } from "../utils/getServiceClient";

export const getEmployeeDetails = async (employeeIds: string[]) => {
  try {
    const userClient = await getServiceClient("user-service");
    const response = await userClient.post("/employees", { employeeIds }, {
      headers: {
        "internal-api-key": process.env.INTERNAL_API_KEY || "",
      },
    } as any);
    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        "Failed to fetch employee details from user-service",
      );
      return [];
    }

    const data = await response.json();
    return data.employees || [];
  } catch (error: any) {
    logger.error(
      { error: error?.message },
      "Failed to fetch employee details from user-service",
    );
    return [];
  }
};

export const getEmployeeDetail = async () => {
  try {
    const userClient = await getServiceClient("user-service");
    const response = await userClient.get(`/profile`, {
      headers: {
        "internal-api-key": process.env.INTERNAL_API_KEY || "",
      },
    } as any);
    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        `Failed to fetch details for employee from user-service`,
      );
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error({ error }, `Failed to fetch details from user-service`);
    return null;
  }
};
