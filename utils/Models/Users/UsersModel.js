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
        allowNull: false
    },
    password: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    emailId: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        unique: 'true'
    },
    role_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: Sequelize.ENUM('NV', 'A', 'R'),
        allowNull: false,
        defaultValue: 'NV'
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
    }
}, {
    tableName: "users"
});

module.exports = UsersModel;