const Sequelize = require('sequelize')

const ReceiptsModel = global.DATA.CONNECTION.mysql.define("receipts", {
    receipt_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    client_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    client_phn_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    client_adhar_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    project_id: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
    },
    commission_holder_id: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
    },
    receipt_status: {
        type: Sequelize.ENUM('NV', 'A', 'R'),
        allowNull: false,
        defaultValue: 'NV'
    },
    commission_id: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    date_of_validation: {
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
    },
}, {
    tableName: "receipts"
})

module.exports = ReceiptsModel