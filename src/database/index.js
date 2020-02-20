import Sequelize from 'sequelize';

import Recipient from '../app/models/Recipient';

import User from '../app/models/User';

import databaseConfig from '../config/database';

const models = [Recipient, User];

class Database {
    constructor() {
        this.init();
    }

    init() {
        this.connection = new Sequelize(databaseConfig);

        models.map(model => model.init(this.connection));
    }
}

export default new Database();
