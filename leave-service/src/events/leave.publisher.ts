import { publish, getCircuitBreaker } from "@myorg/shared";

const leavePublishAction = async (exchange: string, routingKey: string, payload: any) => {
    return publish(exchange, routingKey, payload);
};

const leaveBreaker = getCircuitBreaker("leave.exchange", leavePublishAction);

export const publishLeaveApproved = async (payload: {
    employeeId: string;
    email: string;
    name?: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
}) => {
    return leaveBreaker.fire("leave.exchange", "leave.approved", payload);
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
    return leaveBreaker.fire("leave.exchange", "leave.rejected", payload);
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
    return leaveBreaker.fire("leave.exchange", "leave.created", payload);
};