import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File from '../models/File';
import Deliveries from '../models/Deliveries';
import { Op } from 'sequelize';
import { setHours, setMinutes, setSeconds, isBefore, isAfter, format } from 'date-fns';
import DeliveryCreate from '../jobs/DeliveryCreate';
import DeliveryUpdate from '../jobs/DeliveryUpdate';
import Queue from '../../lib/Queue';

class DeliveriesController {
    async index(req, res) {
        const { page = 1 } = req.query;

        const deliveryman_id = req.params.id;

        const deliveries = await Deliveries.findAll({
            where: {
                deliveryman_id: { [Op.eq]: deliveryman_id },
                end_date: null,
                cancelled_at: null
            },
            order: ['id'],
            attributes: ['id', 'recipient_id', 'product'],
            limit: 20,
            offset: (page - 1) * 20,
        });

        return res.json(deliveries);
    }

    async showDelivered(req, res) {
        const { page = 1 } = req.query;

        const deliveryman_id = req.params.id;

        const deliveries = await Deliveries.findAll({
            where: {
                deliveryman_id: { [Op.eq]: deliveryman_id },
                end_date: { [Op.ne]: null }
            },
            order: ['end_date'],
            attributes: ['id', 'recipient_id', 'product', 'end_date', 'signature_id'],
            include: [
                {
                    model: File,
                    as: 'signature',
                    attributes: ['name', 'path', 'url'],
                },
            ],
            limit: 20,
            offset: (page - 1) * 20,
        });

        return res.json(deliveries);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            product: Yup.string().required(),
            recipient_id: Yup.number().required(),
            deliveryman_id: Yup.number().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

        const { recipient_id, deliveryman_id } = req.body;

        /*
        *
        * Check if recipient_id exists
        *
        */

        const recipient = await Recipient.findOne({
            where: { id: recipient_id },
            attributes: ['name'],
        });

        if (!recipient) {
            return res.status(401).json({ error: 'Recipient does not exists.' });
        }

        /*
        *
        * Check if deliveryman_id exists
        *
        */

        const deliveryman = await Deliveryman.findByPk(deliveryman_id, {
            where: { deleted: false },
            attributes: ['name', 'email'],
        });

        if (!deliveryman) {
            return res.status(401).json({ error: 'Deliveryman does not exists. ' })
        }

        const { id } = await Deliveries.create(req.body);

        const delivery = await Deliveries.findByPk(id, {
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

        await Queue.add(DeliveryCreate.key, { delivery });

        return res.json(delivery);

    }

    async update(req, res) {
        const schema = Yup.object().shape({
            product: Yup.string().required(),
            recipient_id: Yup.number().required(),
            deliveryman_id: Yup.number().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

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

        const { recipient_id, deliveryman_id } = await req.body;

        /*
        *
        * Check if recipient_id exists
        *
        */

        const recipient = await Recipient.findOne({
            where: { id: recipient_id },
            attributes: ['name'],
        });

        if (!recipient) {
            return res.status(401).json({ error: 'Recipient does not exists.' });
        }

        /*
        *
        * Check if deliveryman_id exists
        *
        */
        const deliveryman = await Deliveryman.findByPk(deliveryman_id, {
            where: { deleted: false },
            attributes: ['name', 'email'],
        });

        if (!deliveryman) {
            return res.status(401).json({ error: 'Deliveryman does not exists. ' })
        }

        /*
        *
        * Check if isn't cancelled, in route or delivered
        *
        */

        if (delivery.start_date !== null || delivery.end_date !== null || delivery.cancelled_at !== null) {
            return res
                .status(401)
                .json({ error: 'You cannot update a delivery that is in route, cancelled or already delivered.' });
        }


        await delivery.update(req.body);



        await Queue.add(DeliveryUpdate.key, { delivery });

        return res.json(delivery);

    }

    async withdrawl(req, res) {
        const delivery_id = req.params.deliveryId;
        const deliveryman_id = req.params.id;

        const today = new Date();

        const startDay = setSeconds(setMinutes(setHours(today, 8), 0), 0);
        const endDay = setSeconds(setMinutes(setHours(today, 18), 0), 0);

        const totalDeliveries = await Deliveries.count({
            where: {
                deliveryman_id: { [Op.eq]: deliveryman_id },
                start_date: { [Op.between]: [startDay, endDay] }
            }
        });

        if (totalDeliveries >=5) {
            return res.status(401).json({ error: 'You can only withdrawl 5 orders per day' });
        }


        const delivery = await Deliveries.findByPk(delivery_id, {
            attributes: ['deliveryman_id', 'start_date', 'id', 'end_date', 'cancelled_at'],
        });



        if (!delivery) {
            return res.status(404).json({ error: 'Delivery does not exists.' });
        }

        if (delivery.deliveryman_id != deliveryman_id) {
            return res
                .status(401)
                .json({ error: 'You cannot withdrawl a delivery that is not yours.' });
        }

        if (delivery.start_date !== null || delivery.end_date !== null || delivery.cancelled_at !== null) {
            return res
                .status(401)
                .json({ error: 'You cannot withdrawl a delivery that is in route, already delivered or cancelled.' })
        }

        if (isBefore(today, startDay) || isAfter(today, endDay)) {
            return res.status(401).json({
                error:
                    'You can only withdrawl deliveries between 08h00 and 18h00',
            });
        }

        delivery.start_date = today;

        await delivery.save();

        return res.json(delivery);

    }

    async delivered(req, res) {
        const delivery_id = req.params.deliveryId;
        const deliveryman_id = req.params.id;

        const delivery = await Deliveries.findByPk(delivery_id, {
            attributes: ['deliveryman_id', 'start_date', 'id', 'end_date', 'cancelled_at'],
            include: [
                {
                    model: File,
                    as: 'signature',
                    attributes: ['name', 'path', 'url'],
                },
            ]
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery does not exists.' });
        }

        if (delivery.deliveryman_id != deliveryman_id) {
            return res
                .status(401)
                .json({ error: 'You cannot mark as delivered a delivery that is yours.' });
        }

        if (delivery.start_date === null || delivery.end_date !== null || delivery.cancelled_at !== null) {
            return res
                .status(401)
                .json({ error: 'You cannot mark as delivered a delivery that wasnt withdrawn, already delivered or cancelled.' })
        }

        const { originalname: name, filename: path } = req.file;
        const signature = await File.create({
            name,
            path,
        });

        const signature_id = signature.id;

        delivery.signature_id = signature_id;

        delivery.end_date = new Date();

        await delivery.save();

        return res.json(delivery);
    }
}

export default new DeliveriesController();
