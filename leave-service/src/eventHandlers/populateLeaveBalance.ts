import { setDefaultLeaveAllocation, updateManagerInLeaves } from "../services/leaveService";
import { logger } from "@myorg/shared";

export const handlePopulateUserLeaveBalance = async (event: any) => {
  const { employeeId, name } = event;
  try {
    await setDefaultLeaveAllocation(employeeId, new Date().getFullYear());
    logger.info(`Leave balance initialized for employee ${employeeId} (${name})`);
  } catch (err) {
    logger.error({error: err}, `Error populating leave balance for employee ${employeeId}:`);
  }
};

export const handleUpdateManager = async (event: any) => {
  const { employeeId, managerId } = event;
  try {
    await updateManagerInLeaves(employeeId, managerId);
  } catch (err) {
    logger.error({error: err}, `Error updating manager for employee ${employeeId}:`);
  }
}