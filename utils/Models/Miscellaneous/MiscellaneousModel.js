const Sequelize = require('sequelize')

const MiscellaneousModel = global.DATA.CONNECTION.mysql.define("miscellaneous", {
    miscellaneous_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    reason: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
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
    tableName: "miscellaneous"
})

module.exports = MiscellaneousModel;