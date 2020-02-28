import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import RecipientController from './app/controllers/RecipientController';
import SessionController from './app/controllers/SessionController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliveriesController from './app/controllers/DeliveriesController';
import DeliveryProblemsController from './app/controllers/DeliveryProblemsController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.get('/deliveryman/:id/deliveries', DeliveriesController.index);
routes.get('/deliveryman/:id/delivered', DeliveriesController.showDelivered);
routes.put('/deliveryman/:id/deliveries/withdrawl/:deliveryId', DeliveriesController.withdrawl);
routes.put('/deliveryman/:id/delivered/:deliveryId', upload.single('signature'), DeliveriesController.delivered);
routes.post('/deliveryman/:id/deliveries/problems/:deliveryId', DeliveryProblemsController.create);

routes.use(authMiddleware);

routes.get('/recipients', RecipientController.index);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete)

routes.put('/users/:id', UserController.update);
routes.delete('/users/:id', UserController.delete);

routes.get('/deliverymen', DeliverymanController.index);
routes.post('/deliverymen', DeliverymanController.store);
routes.put('/deliverymen/:id', DeliverymanController.update);
routes.delete('/deliverymen/:id', DeliverymanController.delete);
routes.put('/deliverymen/avatar/:id', upload.single('avatar'), DeliverymanController.storeAvatar);

routes.post('/deliveries', DeliveriesController.store);
routes.put('/deliveries/:id', DeliveriesController.update);

routes.get('/deliveries/problems', DeliveryProblemsController.allProblems);
routes.get('/deliveries/problems/:id', DeliveryProblemsController.problems);
routes.delete('/deliveries/problems/:id/cancel-delivery', DeliveryProblemsController.remove);

export default routes;
