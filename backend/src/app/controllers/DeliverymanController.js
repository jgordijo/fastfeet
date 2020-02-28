import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
    async store(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string()
                .email()
                .required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

        const deliverymanExists = await Deliveryman.findOne({
            where: { email: req.body.email },
        });

        if (deliverymanExists) {
            return res.status(400).json({ error: 'Deliveryman already exists;' });
        }

        const { id, name, email } = await Deliveryman.create(req.body);

        return res.json({
            id,
            name,
            email,
        });
    }

    async update(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

        const { email } = req.body;

        const deliveryman = await Deliveryman.findByPk(req.userId);

        if (email && email !== deliveryman.email) {
            const deliverymanExists = await Deliveryman.findOne({
                where: { email: req.body.email },
            });

            if (deliverymanExists) {
                return res.status(400).json({ error: 'Deliveryman already exists.' });
            }
        }

        const { id, name } = await deliveryman.update(req.body);

        return res.json({
            id,
            name,
            email,
        });
    }

    async index(req, res) {
        const { page = 1 } = req.query;

        const deliverymen = await Deliveryman.findAll({
            where: { deleted: false },
            attributes: ['id', 'name', 'email', 'avatar_id'],
            limit: 20,
            offset: (page - 1) * 20,
            include: [
                {
                    model: File,
                    as: 'avatar',
                    attributes: ['name', 'path', 'url'],
                },
            ],
        });

        return res.json(deliverymen);
    }

    async delete(req, res) {
        const deliveryman = await Deliveryman.findByPk(req.params.id);

        const deliverymanExists = await deliveryman;

        if (!deliverymanExists) {
            return res.status(400).json({ error: 'Deliveryman does not exists' });
        }

        deliveryman.deleted = true;

        await deliveryman.save();

        return res.json(deliveryman);
    }

    async storeAvatar(req, res) {
        const { originalname: name, filename: path } = req.file;
        const avatar = await File.create({
            name,
            path,
        });

        const deliveryman = await Deliveryman.findByPk(req.params.id);

        const avatar_id = avatar.id;

        deliveryman.avatar_id = avatar_id;

        deliveryman.save();

        return res.json(avatar);
    }
}

export default new DeliverymanController();
