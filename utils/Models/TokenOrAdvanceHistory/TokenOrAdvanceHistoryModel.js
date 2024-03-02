const Sequelize = require('sequelize')

const TokenOrAdvanceHistoryModel = global.DATA.CONNECTION.mysql.define("TokenOrAdvanceHistories", {
    ta_history_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    ta_mode_of_payment: {
        type: Sequelize.ENUM('CASH', 'UPI', 'BANK TRANSFER'),
        allowNull: false
    },
    ta_amount: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
    },
    data_of_ta_payment: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
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
    tableName: "TokenOrAdvanceHistory"
})

module.exports = TokenOrAdvanceHistoryModel