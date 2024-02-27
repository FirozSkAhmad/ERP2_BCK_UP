const Sequelize = require('sequelize')

const CommissionsModel = global.DATA.CONNECTION.mysql.define("commissions", {
    commission_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    type_of_commission: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    total_commission: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    commission_recived_till_now: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
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