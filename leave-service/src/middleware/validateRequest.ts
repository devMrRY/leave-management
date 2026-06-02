import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

/**
 * Middleware to validate request body
 */
export const validateBody = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }

    req.body = value;
    next();
  };
};

/**
 * Middleware to validate request params
 */
export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware to validate request query
 */
export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }

    req.query = value as any;
    next();
  };
};
