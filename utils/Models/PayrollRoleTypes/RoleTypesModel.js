const Sequelize = require('sequelize')

const RoleTypesModel =  global.DATA.CONNECTION.mysql.define("payroll_roletypes",{
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    roleType: {
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
},{
    tableName:"payroll_roletypes"
}
);

module.exports = RoleTypesModel;