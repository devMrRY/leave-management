import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const PEPPER = process.env.PEPPER || "";

export const hashPassword = async (plain: string) => {
  const salted = plain + PEPPER;
  return await bcrypt.hash(salted, SALT_ROUNDS);
};

export const comparePassword = async (plain: string, hashed: string) => {
  const salted = plain + PEPPER;
  return await bcrypt.compare(salted, hashed);
};

export default {
  hashPassword,
  comparePassword,
};
