import { publish } from "@myorg/shared";

export const publishLeaveApproved = async (payload: {
    employeeId: string;
    email: string;
    name?: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
}) => {
    return publish("leave.exchange", "leave.approved", payload);
};

export const publishLeaveRejected = async (payload: {
    employeeId: string;
    email: string;
    name?: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    reason: string;
}) => {
    return publish("leave.exchange", "leave.rejected", payload);
};

export const publishLeaveCreated = async (payload: {
    employeeId: string;
    email: string;
    name?: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    managerId?: string;
}) => {
    return publish("leave.exchange", "leave.created", payload);
};