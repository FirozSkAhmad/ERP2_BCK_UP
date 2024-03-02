const Sequelize = require('sequelize')

const CommissionsModel = global.DATA.CONNECTION.mysql.define("commissions", {
    commission_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    type_of_commission: {
        type: Sequelize.ENUM('VALIDATION', 'SOLD'),
        allowNull: false
    },
    total_commission: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    commission_recived_till_now: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: "commissions"
})

module.exports = CommissionsModel