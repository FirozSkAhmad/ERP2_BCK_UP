const Sequelize = require('sequelize')

const BlockedProjectsModel = global.DATA.CONNECTION.mysql.define("BlockedProjects", {
    blocked_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    date_of_blocked: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    no_of_days_blocked: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    remark: {
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
    tableName: "BlockedProjects"
})

module.exports = BlockedProjectsModel