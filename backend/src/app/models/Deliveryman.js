import Sequelize, { Model } from 'sequelize';

class Deliveryman extends Model {
    static init(sequelize) {
        super.init(
            {
                name: Sequelize.STRING,
                email: Sequelize.STRING,
                deleted: Sequelize.BOOLEAN,
                avatar_id: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'deliverymen',
            }
        );

        return this;
    }

    static associate(models) {
        this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
    }
}

export default Deliveryman;
