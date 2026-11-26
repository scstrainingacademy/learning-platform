import { Router } from 'express';
import {
  createMockInterview, deleteMockInterview, listAdminMockInterviews,
  listPublishedMockInterviews, updateMockInterview,
} from './controller.js';
import { requireAdminRoles } from '../admin-auth/controller.js';

const router = Router();

router.get('/admin', requireAdminRoles('owner', 'course_manager'), listAdminMockInterviews);
router.get('/', listPublishedMockInterviews);
router.post('/', requireAdminRoles('owner', 'course_manager'), createMockInterview);
router.patch('/:id', requireAdminRoles('owner', 'course_manager'), updateMockInterview);
router.delete('/:id', requireAdminRoles('owner', 'course_manager'), deleteMockInterview);

export default router;
