import { randomUUID } from "crypto";
import User, { UserRole } from "../models/User.js";

export const getUser = async ({
  email,
  username,
}: {
  email: string;
  username: string;
}) => {
  const query = {
    $or: [{ email }, { username }],
  };
  const user = await User.findOne(query).lean();
  return user;
};

export const createUser = async ({
  username,
  email,
  role,
  password,
  managerId,
  name,
}: any) => {
  const payload = {
    employeeId: randomUUID(),
    username,
    email,
    role,
    password,
    managerId: managerId || null,
    name,
  };
  return await User.create(payload);
};
