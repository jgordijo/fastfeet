import Sequelize, { Model } from 'sequelize';

class Deliveries extends Model {
    static init(sequelize) {
        super.init(
            {
                recipient_id: Sequelize.INTEGER,
                deliveryman_id: Sequelize.INTEGER,
                signature_id: Sequelize.INTEGER,
                product: Sequelize.STRING,
                cancelled_at: Sequelize.DATE,
                start_date: Sequelize.DATE,
                end_date: Sequelize.DATE,
            },
            {
                sequelize,
                tableName: 'deliveries',
            }
        );

        return this;
    }

    static associate(models) {
        this.belongsTo(models.File, { foreignKey: 'signature_id', as: 'signature' });
        this.belongsTo(models.Recipient, { foreignKey: 'recipient_id', as: 'recipient' });
        this.belongsTo(models.Deliveryman, {
            foreignKey: 'deliveryman_id',
            as: 'deliveryman',
        });
    }
}

export default Deliveries;
