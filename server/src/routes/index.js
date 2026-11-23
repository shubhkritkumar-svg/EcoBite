import { Router } from 'express';
import userRoutes from './user.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import menuRoutes from './menu.routes.js';
import orderRoutes from './order.routes.js';
import rewardRoutes from './reward.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu-items', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/rewards', rewardRoutes);
router.use('/admin', adminRoutes);

export default router;
