import { setDefaultLeaveAllocation, updateManagerInLeaves } from "../services/leaveService";

export const handlePopulateUserLeaveBalance = async (event: any) => {
  const { employeeId, name } = event;
  try {
    await setDefaultLeaveAllocation(employeeId, new Date().getFullYear());
    console.log(`Leave balance initialized for employee ${employeeId} (${name})`);
  } catch (err) {
    console.error(`Error populating leave balance for employee ${employeeId}:`, (err as Error).message);
  }
};

export const handleUpdateManager = async (event: any) => {
  const { employeeId, managerId } = event;
  try {
    await updateManagerInLeaves(employeeId, managerId);
  } catch (err) {
    console.error(`Error updating manager for employee ${employeeId}:`, (err as Error).message);
  }
}