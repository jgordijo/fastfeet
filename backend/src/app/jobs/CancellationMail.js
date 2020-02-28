import Mail from '../../lib/Mail';

class CancellationMail {
    get key() {
        return 'CancellationMail';
    }

    async handle({ data }) {
        const { delivery } = data;

        console.log('A fila executou!');

        await Mail.sendMail({
            to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}>`,
            subject: 'Encomenda cancelada',
            template: 'cancellation',
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

export default new CancellationMail();
