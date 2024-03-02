const Sequelize = require('sequelize')

const PropertyDetailsModel = global.DATA.CONNECTION.mysql.define("PropertyDetails", {
    pd_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    property_price: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    discount_percent: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
    },
    ta_history_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
    },
    blocked_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
    },
    amount_paid_till_now: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
    },
    pending_payment: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
    },
    no_of_part_payments: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    semi_deleted: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    completely_deleted: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    date_of_deletion: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
        default: null
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
    tableName: "PropertyDetails"
})

module.exports = PropertyDetailsModel