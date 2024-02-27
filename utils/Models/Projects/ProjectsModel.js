const Sequelize = require('sequelize')

const ProjectsModel = global.DATA.CONNECTION.mysql.define("projects", {
    project_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    project_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    tower_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true
    },
    flat_number: {
        type: Sequelize.DataTypes.STRING(200),
    },
    villa_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true
    },
    plot_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true
    },
    sq_yards: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true
    },
    pid: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: false
    },
    status: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'AVAILABLE'
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
    tableName: "projects"
})

module.exports = ProjectsModel