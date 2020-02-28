import * as Yup from 'yup';
import DeliveryProblems from '../models/DeliveryProblems';
import Deliveries from '../models/Deliveries';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';
import { Op } from 'sequelize';

class DeliveryProblemsController {

    async problems(req, res) {
        const delivery = req.params.id;

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery does not exists.' });
        }

        const deliveries = await DeliveryProblems.findAll({
            where: {
                delivery_id: { [Op.eq]: delivery },
            },
            order: ['updated_at'],
            attributes: ['id', 'delivery_id', 'updated_at'],
        });

        return res.json(deliveries);
    }

    async allProblems(req, res) {
        const { page = 1 } = req.query;

        const deliveries = await DeliveryProblems.findAll({
            where: {
                delivery_id: { [Op.ne]: null },
            },
            order: ['updated_at'],
            attributes: ['id', 'delivery_id', 'updated_at'],
            limit: 20,
            offset: (page - 1) * 20,
        });

        return res.json(deliveries);
    }

    async remove(req, res) {
        const delivery = await Deliveries.findByPk(req.params.id, {
            include: [
                {
                    model: Deliveryman,
                    as: 'deliveryman',
                    attributes: ['name', 'email'],
                },
                {
                    model: Recipient,
                    as: 'recipient',
                    attributes: ['name', 'address', 'number', 'city', 'state']
                },
            ],
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery does not exists.' });
        }

        if (delivery.end_date != null || delivery.cancelled_at != null) {
            return res
                .status(401)
                .json({ error: 'You cannot cancel a delivery that is already cancelled or delivered.' });
        }



        delivery.cancelled_at = new Date();

        await delivery.save();

        await Queue.add(CancellationMail.key, { delivery });

        return res.json(delivery);

    }

    async create(req, res) {
        const schema = Yup.object().shape({
            description: Yup.string().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

        const deliveryman = req.params.id;

        const delivery = await Deliveries.findByPk(req.params.deliveryId, {

            attributes: ['id', 'start_date', 'end_date', 'cancelled_at', 'deliveryman_id', 'product'],
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery does not exists.' });
        }

        if (deliveryman != delivery.deliveryman_id) {
            return res.status(401).json({ error: 'You cannot create a problem for a delivery that is not yours.' });
        }

        if (delivery.end_date != null || delivery.cancelled_at != null) {
            return res
                .status(401)
                .json({ error: 'You cannot create a problem for a delivery that was already delivered or cancelled' });
        }

        const description = req.body.description;

        const problem = await DeliveryProblems.create({
            delivery_id: delivery.id,
            description,
        });

        return res.json(problem);
    }

}

export default new DeliveryProblemsController();
