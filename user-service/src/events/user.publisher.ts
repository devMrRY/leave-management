import { publish } from "@myorg/shared";

export const publishUserCreated = async (user: {
    employeeId: string;
    email: string;
    role: string;
    name?: string;
}) => {
    return publish("user.exchange", "user.created", user);
};


export const publishManagerUpdated = async (user: {
    employeeId: string;
    managerId: string;
}) => {
    return publish("user.exchange", "user.managerUpdated", user);
};

