import * as Yup from 'yup';
import Recipient from '../models/Recipient';

class RecipientController {
    async store(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            cpf: Yup.string()
                .required()
                .max(14),
            address: Yup.string().required(),
            number: Yup.number().required(),
            address_line2: Yup.string(),
            city: Yup.string().required(),
            state: Yup.string().required(),
            zipcode: Yup.string()
                .required()
                .max(9),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

        const userExists = await Recipient.findOne({
            where: { cpf: req.body.cpf },
        });

        if (userExists) {
            return res.status(400).json({ error: 'Recipient already exists' });
        }

        const { id, name, cpf } = await Recipient.create(req.body);

        return res.json({
            id,
            name,
            cpf,
        });
    }

    async update(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            address: Yup.string().required(),
            number: Yup.number().required(),
            address_line2: Yup.string().required(),
            city: Yup.string().required(),
            state: Yup.string().required(),
            zipcode: Yup.string()
                .max(9)
                .required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation failed.' });
        }

        let recipient = await Recipient.findByPk(req.params.id);

        if (!recipient) {
            return res
                .status(404)
                .json({ error: 'Recipient does not exists.' });
        }

        recipient = await recipient.update(req.body);

        return res.json(recipient);
    }

    async index(req, res) {
        const { page = 1 } = req.query;

        const recipients = await Recipient.findAll({
            where: { deleted: false },
            order: ['id'],
            attributes: ['id', 'name', 'cpf', 'state', 'city'],
            limit: 20,
            offset: (page - 1) * 20,
        });

        return res.json(recipients);
    }

    async delete(req, res) {
        const recipient = await Recipient.findByPk(req.params.id);

        const recipientExists = await recipient;

        if (!recipientExists) {
            return res.status(400).json({ error: 'Recipient does not exists' });
        }

        recipient.deleted = true;

        await recipient.save();

        return res.json(recipient);
    }
}

export default new RecipientController();
