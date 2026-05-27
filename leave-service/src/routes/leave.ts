import express from 'express';
import { getLeaveBalance, updateLeaveBalance, createLeave, getLeavesForUser } from '../controllers/leaveController.js';

const router = express.Router();

// Note: this microservice expects requests to be authorized and include userId in req.userId
router.get('/balance', getLeaveBalance);
router.put('/balance', updateLeaveBalance);
router.post('/', createLeave);
router.get('/:userId/leaves', getLeavesForUser);

export default router;
