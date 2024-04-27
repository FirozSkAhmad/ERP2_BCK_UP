const createHttpError = require("http-errors");
const { Sequelize } = require("sequelize");
const { SQL_ERROR } = require("../utils/Constants/response_messages");

class IncomeService {
    constructor() {

    }

    async getIncome() {
        try {
            const IncomeData = await global.DATA.CONNECTION.mysql.query(`select sum(amount_received) as total_income from income`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("error getting total income:", err.message);
                throw createHttpError.InternalServerError(SQL_ERROR);
            })

            return IncomeData[0].total_income

        } catch (err) {
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }
}

module.exports = IncomeService;