const Sequelize = require('sequelize')

const ApartmentProjectsModel = global.DATA.CONNECTION.mysql.define("ApartmentProjects", {
    project_id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    project_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'APARTMENT'
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
    tableName: "ApartmentProjects"
})

module.exports = ApartmentProjectsModel