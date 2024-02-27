const Sequelize = require('sequelize')

const VillaProjectsModel = global.DATA.CONNECTION.mysql.define("VillaProjects", {
    project_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'VILLA'
    },
    project_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    villa_number: {
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
    tableName: "VillaProjects"
})

module.exports = VillaProjectsModel