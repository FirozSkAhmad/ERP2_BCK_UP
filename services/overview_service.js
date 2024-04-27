const ReceiptsModel = require('../utils/Models/Receipts/ReceiptsModel')
const PropertyDetailsModel = require('../utils/Models/PropertyDetails/PropertyDetailsModel')
const PayrollModel = require('../utils/Models/Payroll/PayrollModel')
const CommissionsModel = require('../utils/Models/Commission/CommissionsModel')
const MiscellaneousModel = require('../utils/Models/Miscellaneous/MiscellaneousModel')

class OverviewService {
    constructor() {

    }

    async getOverview() {
        try {
            // Fetch income data and calculate total income
            const incomeData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: 'A'
                },
                include: [{
                    model: PropertyDetailsModel,
                    where: {
                        completely_deleted: false
                    },
                    attributes: ['amount_paid_till_now'],
                }],
            });

            const totalIncome = incomeData.reduce((acc, cur) => {
                return acc + cur.PropertyDetail.amount_paid_till_now;
            }, 0);

            // Fetch salary data and calculate total expenses from salaries and incentives
            const salariesData = await PayrollModel.findAll({
                attributes: ['incentives', 'salary'],
            });

            const salaryExpenses = salariesData.reduce((acc, cur) => {
                return acc + cur.incentives + cur.salary;
            }, 0);

            // Fetch miscellaneous expenses
            const miscellaneousData = await MiscellaneousModel.findAll({
                attributes: ['amount'],
            });

            const miscellaneousExpenses = miscellaneousData.reduce((acc, cur) => {
                return acc + cur.amount;
            }, 0);

            // Fetch commission data and calculate total commissions
            const commissionsData = await CommissionsModel.findAll({
                attributes: ['commission_recived_till_now'],
            });

            const commissionExpenses = commissionsData.reduce((acc, cur) => {
                return acc + cur.commission_recived_till_now;
            }, 0);

            // Sum up all expenses
            const totalExpenses = salaryExpenses + miscellaneousExpenses + commissionExpenses;

            const totalBalance = totalIncome - totalExpenses;

            // Prepare the final data object
            const data = {
                income: totalIncome,
                expenses: totalExpenses,
                balance: totalBalance
            };

            // Return the final data object
            return data;

        }
        catch (err) {
            console.error("Error in getLeads ", err.message);

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

module.exports = OverviewService;