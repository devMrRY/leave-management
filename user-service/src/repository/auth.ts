import { randomUUID } from "crypto";
import User from "../models/User.js";
import { CreateUserDTO, GetUserParams, UserLean } from "../interfaces/auth.js";

export const getUser = async ({
  email,
  username,
}: GetUserParams): Promise<UserLean | null> => {
  const query: any = { isDeleted: false };
  if (email && username) {
    query.$or = [{ email }, { username }];
  } else if (email) {
    query.email = email;
  } else if (username) {
    query.username = username;
  }
  const user = await User.findOne(query).select("-password").lean();
  return user as UserLean | null;
};

export const findByEmail = async (email: string): Promise<UserLean | null> => {
  const user = await User.findOne({ email, isDeleted: false }).lean();
  return user as UserLean | null;
};

export const findByEmployeeId = async (
  employeeId: string,
): Promise<UserLean | null> => {
  const user = await User.findOne({ employeeId, isDeleted: false })
    .select("-password -_id -isDeleted")
    .lean();
  return user as UserLean | null;
};

export const updateByEmail = async ({
  email,
  managerId,
  newManagerId,
}: {
  email: string;
  managerId: string;
  newManagerId: string;
}): Promise<UserLean | null> => {
  const user = await User.findOneAndUpdate(
    { email, managerId, isDeleted: false },
    { managerId: newManagerId },
    { new: true },
  )
    .select("-password -_id -isDeleted")
    .lean();
  return user as UserLean | null;
};

export const getTeamList = async (
  managerId: string,
  employeeIds: string[],
): Promise<UserLean[]> => {
  const query = { managerId, isDeleted: false } as any;
  if (employeeIds.length > 0) {
    query.employeeId = { $in: employeeIds };
  }
  const users = await User.find(query)
    .select("employeeId managerId username name email role -_id")
    .lean();
  return users as UserLean[];
};

export const deleteByEmployeeId = async (
  employeeId: string,
  managerId: string,
) => {
  return await User.findOneAndUpdate(
    { employeeId, managerId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
};

export const createUser = async (payload: CreateUserDTO): Promise<UserLean> => {
  const toCreate = {
    employeeId: randomUUID(),
    username: payload.username,
    email: payload.email,
    role: payload.role,
    password: payload.password,
    managerId: payload.managerId || null,
    name: payload.name,
  } as any;
  const created = await User.create(toCreate);
  return created.toObject() as UserLean;
};
