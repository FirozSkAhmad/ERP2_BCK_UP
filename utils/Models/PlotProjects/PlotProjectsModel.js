const Sequelize = require('sequelize')

const PoltProjectsModel = global.DATA.CONNECTION.mysql.define("PoltProjects", {
    project_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'PLOT'
    },
    project_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    plot_number: {
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
    tableName: "PoltProjects"
})

module.exports = PoltProjectsModel