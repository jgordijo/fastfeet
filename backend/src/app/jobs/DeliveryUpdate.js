import Mail from '../../lib/Mail';

class DeliveryUpdate {
    get key() {
        return 'DeliveryUpdate';
    }

    async handle({ data }) {
        const { delivery } = data;

        console.log('A fila executou!');

        await Mail.sendMail({
            to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}>`,
            subject: 'Encomenda atualizada',
            template: 'update',
            context: {
                delivery: delivery.id,
                recipient: delivery.recipient.name,
                address: delivery.recipient.address,
                number: delivery.recipient.number,
                city: delivery.recipient.city,
                state: delivery.recipient.state,
                product: delivery.product,
            }
        });
    }
}

export default new DeliveryUpdate();
