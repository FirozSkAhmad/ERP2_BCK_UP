const Sequelize = require('sequelize')

const PayrollModel = global.DATA.CONNECTION.mysql.define("payroll", {
    payroll_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    role_type: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    incentives: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    salary: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    date_of_pay: {
        type: Sequelize.STRING(100),
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
    tableName: "payroll"
})

module.exports = PayrollModel;