const Sequelize = require('sequelize')

const UsersModel = global.DATA.CONNECTION.mysql.define("users", {
    user_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    user_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    email_id: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    role_type: {
        type: Sequelize.DataTypes.ENUM('SUPER ADMIN', 'SALES PERSON', 'MANAGER', 'CHANNEL PARTNER'),
        allowNull: false
    },
    status: {
        type: Sequelize.ENUM('NV', 'A', 'R'),
        allowNull: false,
        defaultValue: 'NV'
    },
    date_of_signUp: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    date_of_validation: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    address: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    contact_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    pancard_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    bank_ac_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    bussiness_experience: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    notifications: {
        type: Sequelize.JSON,
        allowNull: true
    }
}, {
    tableName: "users"
});

module.exports = UsersModel;