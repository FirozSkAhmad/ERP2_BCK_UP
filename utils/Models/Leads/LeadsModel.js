const Sequelize = require('sequelize')

const LeadsModel = global.DATA.CONNECTION.mysql.define("leads", {
    lead_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    email_id: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    ph_no: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    location: {
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
    tableName: "leads"
})

module.exports = LeadsModel;