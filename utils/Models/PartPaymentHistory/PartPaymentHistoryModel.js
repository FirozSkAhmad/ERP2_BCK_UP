const Sequelize = require('sequelize')

const PartPaymentHistoryModel = global.DATA.CONNECTION.mysql.define("PartPayments", {
    pp_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_id: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    amount: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    previous_amount: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
        default: null
    },
    date_of_pp_payment: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
        default: null
    },
    editied_date_of_pp_payment: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    deleted:
    {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        default: 'false'
    },
    date_of_deletion:{
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
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
    tableName: "PartPayments"
})

module.exports = PartPaymentHistoryModel