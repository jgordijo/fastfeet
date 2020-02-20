import Sequelize, { Model } from 'sequelize';

class Recipient extends Model {
    static init(sequelize) {
        super.init(
            {
                name: Sequelize.STRING,
                cpf: Sequelize.STRING(14),
                address: Sequelize.STRING,
                number: Sequelize.INTEGER,
                address_line2: Sequelize.STRING,
                city: Sequelize.STRING,
                state: Sequelize.STRING,
                zipcode: Sequelize.STRING(9),
            },
            {
                sequelize,
            }
        );

        return this;
    }
}

export default Recipient;
