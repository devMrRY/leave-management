import { logger } from "@myorg/shared";
import User from "../models/User.js";
import { hashPassword } from "../utils/authUtils.js";

// Stable seed IDs
const MANAGER_ID = "11111111-1111-1111-1111-111111111111";
const EMPLOYEE_ID = "22222222-2222-2222-2222-222222222222";

export const seedUsers = async () => {
  const managerPassword = await hashPassword("manager123");
  const employeePassword = await hashPassword("employee123");

  const seedData = [
    {
      name: "Admin Manager",
      email: "manager@company.com",
      username: "manager_admin",
      employeeId: MANAGER_ID,
      role: "MANAGER",
      password: managerPassword,
    },
    {
      name: "John Employee",
      email: "employee@company.com",
      username: "john_employee",
      employeeId: EMPLOYEE_ID,
      role: "EMPLOYEE",
      password: employeePassword,
    },
  ];

  await Promise.all(
    seedData.map((user) =>
      User.updateOne(
        { email: user.email },
        { $setOnInsert: user },
        { upsert: true }
      )
    )
  );

  logger.info("🌱 Seed complete: MANAGER + EMPLOYEE with passwords");
};