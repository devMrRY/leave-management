import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const getEmployeesByIdsSchema = Joi.object({
  employeeIds: Joi.array().items(Joi.string()).min(1).optional(),
});

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  managerId: Joi.string().optional().allow(null, ""),
  role: Joi.string().valid("EMPLOYEE", "MANAGER"),
});

export const updateManagerIdSchema = Joi.object({
  email: Joi.string().email().required(),
  managerId: Joi.string().required(),
});
