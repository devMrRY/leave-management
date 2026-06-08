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
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import {
  applyLeaveSchema,
  approveLeaveSchema,
  rejectLeaveSchema,
  leaveIdParamSchema,
  leaveRequestsQuerySchema,
} from '../schemas/leaveSchemas.js';
import { UserRole } from '../shared/constants.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Employee endpoints
router.get(
  '/balance',
  verifyToken,
  getLeaveBalance
);

router.post(
  '/apply',
  verifyToken,
  validateBody(applyLeaveSchema),
  applyForLeave
);

router.get(
  '/history',
  verifyToken,
  validateQuery(leaveRequestsQuerySchema),
  getLeaveHistory
);

// Manager endpoints
router.get(
  '/requests/pending',
  verifyToken,
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateQuery(leaveRequestsQuerySchema),
  getPendingLeaveRequests
);

router.patch(
  '/:leaveId/approve',
  verifyToken,
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateParams(leaveIdParamSchema),
  validateBody(approveLeaveSchema),
  approveLeave
);

router.patch(
  '/:leaveId/reject',
  verifyToken,
  authorizeRoles([UserRole.MANAGER]) as RequestHandler,
  validateParams(leaveIdParamSchema),
  validateBody(rejectLeaveSchema),
  rejectLeave
);

router.patch(
  '/:leaveId/cancel',
  verifyToken,
  validateParams(leaveIdParamSchema),
  cancelLeave
);

export default router;
