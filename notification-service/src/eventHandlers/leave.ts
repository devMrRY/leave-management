export const handleLeaveCreated = async (event: any) => {
  const { employeeId, email, name, managerId, startDate, endDate } = event;

  console.log(`New leave request is created with ${name}, ${managerId}, and ${email}`);
};

export const handleLeaveApproved = async (event: any) => {
  const { employeeId, email, name, leaveType, startDate, endDate } = event;
  console.log(`Leave request approved for ${name}, ${leaveType}, from ${startDate} to ${endDate}`);
};

export const handleLeaveRejected = async (event: any) => {
  const { employeeId, email, name, leaveType, startDate, endDate, reason } = event;
  console.log(`Leave request rejected for ${name}, ${leaveType}, from ${startDate} to ${endDate}. Reason: ${reason}`);
};