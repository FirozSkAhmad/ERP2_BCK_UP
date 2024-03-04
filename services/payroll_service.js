const PayrollModel = require('../utils/Models/Payroll/PayrollModel')
const RoleTypesModel = require('../utils/Models/PayrollRoleTypes/RoleTypesModel')

class PayrollService {
    constructor() {

    }

    async addNewPayRoll(payrollDetails) {
        try {
            this.validateRequiredFields(payrollDetails);
            await PayrollModel.create({
                ...payrollDetails
            })

            return "Added Payroll Successfully";

        }
        catch (err) {
            console.error("Error in addNewPayRoll: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    validateRequiredFields(data) {
        const requiredFields = ['name', 'role_type', 'incentives', 'salary'];

        // Identify missing fields
        const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));

        if (missingFields.length > 0) {
            // Throw an error with a detailed message of missing fields
            throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }

    // async editPayRollDetails(payroll_id, payrollDetails) {
    //     try {
    //         if (!payroll_id) {
    //             throw new global.DATA.PLUGINS.httperrors.InternalServerError("Payroll Id cannot be empty");
    //         }

    //         const data = await global.DATA.MODELS.payroll.update({
    //             ...payrollDetails
    //         }, {
    //             where: {
    //                 id: payroll_id
    //             }
    //         }).catch(err => {
    //             console.log("Error while updating payroll details", err);
    //             throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
    //         })
    //     }
    //     catch (err) {
    //         throw err;
    //     }
    // }

    // async getPayRollDetails() {
    //     try {
    //         const data = await global.DATA.MODELS.payroll.findAll().catch(err => {
    //             console.log("Error while fetching payroll data", err);
    //             throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
    //         });
    //         return data;
    //     }
    //     catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // }

    // async deletePayRollDetails() {

    // }

    // async getExpenses() {
    //     try {
    //         const expenseData = await global.DATA.CONNECTION.mysql.query(`select SUM(amount) as total_expense from payroll`, {
    //             type: Sequelize.QueryTypes.SELECT
    //         }).catch(err => {
    //             console.log("error in getting expenses:", err.message);
    //             throw createHttpError.InternalServerError(Constants.SQL_ERROR);
    //         })
    //         return expenseData[0].total_expense
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    async getRoleTypes() {
        try {
            // Fetch all entries with only the 'role_type' attribute
            const roleTypes = await RoleTypesModel.findAll({
                attributes: ['role_type']
            });
            // Return the fetched role types
            return roleTypes;
        }
        catch (err) {
            console.error("Error in getRoleTypes: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async addRoleType(role_type) {
        try {
            await RoleTypesModel.create({ role_type })

            return "Added Role Type Successfully";
        }
        catch (err) {
            console.error("Error in addRoleType: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    // async deletePayrollRole(id) {
    //     try {
    //         const data = await global.DATA.MODELS.roletypesmodel.destroy({
    //             where: {
    //                 id: id
    //             }
    //         }).catch(err => {
    //             console.log("Error while deleting payroll role name details", err);
    //             throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
    //         })
    //         return data;
    //     }
    //     catch (err) {
    //         throw err;
    //     }
    // }
}

module.exports = PayrollService;