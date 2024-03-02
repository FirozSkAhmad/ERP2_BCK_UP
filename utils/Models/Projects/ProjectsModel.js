const Sequelize = require('sequelize')

const ProjectsModel = global.DATA.CONNECTION.mysql.define("projects", {
    project_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_type: {
        type: Sequelize.DataTypes.ENUM('APARTMENT', 'VILLA', 'PLOT', 'FARM_LAND'),
        allowNull: false
    },
    project_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    tower_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true,
        default: null
    },
    flat_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true,
        default: null
    },
    villa_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true,
        default: null
    },
    plot_number: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true,
        default: null
    },
    sq_yards: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: true,
        default: null
    },
    pid: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: false
    },
    status: {
        type: Sequelize.DataTypes.ENUM('AVAILABLE', 'TOKEN', 'ADVANCE', 'PART PAYMENT', 'BLOCK', 'SOLD'),
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