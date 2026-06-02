import express, { RequestHandler } from 'express';
import {
  getLeaveBalance,
  applyForLeave,
  getPendingLeaveRequests,
  approveLeave,
  rejectLeave,
  getLeaveHistory,
  cancelLeave,
} from '../controllers/leaveController.js';
import { authorizeRoles } from '../middleware/verifyRoles.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import {
  applyLeaveSchema,
  approveLeaveSchema,
  rejectLeaveSchema,
  leaveIdParamSchema,
  leaveRequestsQuerySchema,
} from '../schemas/leaveSchemas';
import { UserRole } from '../shared/constants.js';

const router = express.Router();

// Employee endpoints
router.get(
  '/balance',
  getLeaveBalance
);

router.post(
  '/apply',
  validateBody(applyLeaveSchema),
  applyForLeave
);

router.get(
  '/history',
  validateQuery(leaveRequestsQuerySchema),
  getLeaveHistory
);

// Manager endpoints
router.get(
  '/requests/pending',
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateQuery(leaveRequestsQuerySchema),
  getPendingLeaveRequests
);

router.patch(
  '/:leaveId/approve',
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateParams(leaveIdParamSchema),
  validateBody(approveLeaveSchema),
  approveLeave
);

router.patch(
  '/:leaveId/reject',
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateParams(leaveIdParamSchema),
  validateBody(rejectLeaveSchema),
  rejectLeave
);

router.patch(
  '/:leaveId/cancel',
  validateParams(leaveIdParamSchema),
  cancelLeave
);

export default router;
