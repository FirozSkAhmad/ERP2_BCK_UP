const Sequelize = require('sequelize')

const FarmLandProjectsModel = global.DATA.CONNECTION.mysql.define("FarmLandProjects", {
    project_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'FARM_LAND'
    },
    project_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    plot_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true
    },
    sq_yards: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true
    },
    status: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'AVAILABLE'
    },
    pid: {
        type: Sequelize.DataTypes.STRING(200),
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
    tableName: "FarmLandProjects"
})

module.exports = FarmLandProjectsModel