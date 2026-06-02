import Joi from 'joi';
import { LeaveType } from '../models/constants.js';

// Apply for leave validation
export const applyLeaveSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(LeaveType))
    .required()
    .messages({
      'string.base': 'Leave type must be a string',
      'any.required': 'Leave type is required',
      'any.only': `Leave type must be one of: ${Object.values(LeaveType).join(', ')}`,
    }),
  startDate: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format',
      'date.min': 'Start date must be equal to or greater than today',
      'any.required': 'Start date is required',
    }),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be greater than or equal to start date',
      'any.required': 'End date is required',
    }),
  reason: Joi.string()
    .trim()
    .min(3)
    .max(500)
    .optional()
    .messages({
      'string.base': 'Reason must be a string',
      'string.min': 'Reason must be at least 3 characters',
      'string.max': 'Reason must not exceed 500 characters',
    }),
});

// Approve/Reject leave validation
export const approveLeaveSchema = Joi.object({
  comment: Joi.string()
    .trim()
    .optional()
    .max(500)
    .messages({
      'string.base': 'Comment must be a string',
      'string.max': 'Comment must not exceed 500 characters',
    }),
});

export const rejectLeaveSchema = Joi.object({
  comment: Joi.string()
    .trim()
    .required()
    .min(3)
    .max(500)
    .messages({
      'string.base': 'Comment must be a string',
      'string.min': 'Comment must be at least 3 characters',
      'string.max': 'Comment must not exceed 500 characters',
      'any.required': 'Rejection comment is required',
    }),
});

// Params validation
export const leaveIdParamSchema = Joi.object({
  leaveId: Joi.string()
    .required()
    .messages({
      'string.base': 'Leave ID must be a string',
      'any.required': 'Leave ID is required',
    }),
});

// Query validation for leave requests
export const leaveRequestsQuerySchema = Joi.object({
  status: Joi.string().optional(),
  employeeId: Joi.string().optional(),
  managerId: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  type: Joi.string()
    .valid(...Object.values(LeaveType))
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
