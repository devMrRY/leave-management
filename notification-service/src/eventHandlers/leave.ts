import { logger } from '@myorg/shared';

export const handleLeaveCreated = async (event: any) => {
  const { employeeId, email, name, managerId, startDate, endDate } = event;

  logger.info({ employeeId, email, name, managerId, startDate, endDate }, 'New leave request is created');
};

export const handleLeaveApproved = async (event: any) => {
  const { employeeId, email, name, leaveType, startDate, endDate } = event;
  logger.info({ employeeId, email, name, leaveType, startDate, endDate }, 'Leave request approved');
};

export const handleLeaveRejected = async (event: any) => {
  const { employeeId, email, name, leaveType, startDate, endDate, reason } = event;
  logger.info({ employeeId, email, name, leaveType, startDate, endDate, reason }, 'Leave request rejected');
};