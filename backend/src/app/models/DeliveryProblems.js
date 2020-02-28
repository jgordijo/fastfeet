import Sequelize, { Model } from 'sequelize';

class DeliveryProblems extends Model {
    static init(sequelize) {
        super.init(
            {
                delivery_id: Sequelize.INTEGER,
                description: Sequelize.STRING,
            },
            {
                sequelize,
                tableName: 'delivery_problems',
            }
        );

        return this;
    }

    static associate(models) {
        this.belongsTo(models.Deliveries, { foreignKey: 'delivery_id', as: 'delivery' });
    }
}

export default DeliveryProblems;
