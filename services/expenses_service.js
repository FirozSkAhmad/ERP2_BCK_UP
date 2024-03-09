const createError = require("http-errors");
const { Sequelize } = require("sequelize");
const { SQL_ERROR } = require("../utils/Constants/response_messages");
const UsersModel = require('../utils/Models/Users/UsersModel')
const CommissionsModel = require('../utils/Models/Commission/CommissionsModel')
const ReceiptsModel = require('../utils/Models/Receipts/ReceiptsModel')
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel')
const PropertyDetailsModel = require('../utils/Models/PropertyDetails/PropertyDetailsModel')
const PayrollModel = require('../utils/Models/Payroll/PayrollModel');
const MiscellaneousModel = require('../utils/Models/Miscellaneous/MiscellaneousModel');

class ExpensesService {
    constructor() {

    }

    async getExpenses(expensesFilter) {
        try {
            if (expensesFilter == "COMMISSIONS") {
                const response = await ReceiptsModel.findAll({
                    where: {
                        receipt_status: "A"
                    },
                    attributes: [],
                    include: [{
                        model: UsersModel,
                        attributes: [
                            ['user_id', 'commission_holder_id'],
                            ['user_name', 'commission_holder_name']
                        ],
                    }, {
                        model: CommissionsModel,
                        where: {
                            commission_recived_till_now: {
                                [Sequelize.Op.gt]: 0 // Using the greater than (gt) operator to check for values greater than 0
                            }
                        },
                        attributes: [],
                    }],
                    group: ['user.user_id'], // Group by to ensure uniqueness, adjust as necessary
                    raw: true
                });

                const result = response.map(item => ({
                    commission_holder_id: item['user.commission_holder_id'],
                    commission_holder_name: item['user.commission_holder_name']
                }));

                return result;
            }
            else if (expensesFilter == "SALARY") {
                const response = await PayrollModel.findAll(
                    {
                        where: {
                            salary: {
                                [Sequelize.Op.gt]: 0
                            }
                        },
                        attributes: {
                            exclude: ['payroll_id', 'createdAt', 'updatedAt']
                        }
                    }
                );

                return response;
            }
            else if (expensesFilter == "MISCELLANEOUS") {
                const response = await MiscellaneousModel.findAll(
                    {
                        where: {
                            amount: {
                                [Sequelize.Op.gt]: 0
                            }
                        },
                        attributes: {
                            exclude: ['miscellaneous_id', 'createdAt', 'updatedAt']
                        }
                    }
                );

                return response;
            }

        }
        catch (err) {
            console.error("Error in getExpenses: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getPraticularCommissionHolderHistory(commission_holder_id) {
        try {
            const response = await ReceiptsModel.findAll({
                where: {
                    commission_holder_id,
                    receipt_status: "A",
                },
                attributes: ['receipt_id', 'client_name'],
                include: [{
                    model: ProjectsModel,
                    attributes: ['project_id', 'project_type'],
                }, {
                    model: CommissionsModel,
                    where: {
                        commission_recived_till_now: {
                            [Sequelize.Op.gt]: 0
                        }
                    },
                    attributes: ['total_commission', 'commission_recived_till_now'],
                }],
            });

            return response;

        }
        catch (err) {
            console.error("Error in getPraticularCommissionHolderHistory: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getPraticularCommisionDetails(receipt_id, projectType) {
        try {
            const excludeFields = {
                APARTMENT: ['villa_number', 'plot_number', 'sq_yards', 'project_id', 'pid', 'previous_status', 'createdAt', 'updatedAt'],
                VILLA: ['tower_number', 'flat_number', 'plot_number', 'sq_yards', 'project_id', 'pid', 'previous_status', 'createdAt', 'updatedAt'],
                PLOT: ['tower_number', 'flat_number', 'villa_number', 'sq_yards', 'project_id', 'pid', 'previous_status', 'createdAt', 'updatedAt'],
                FARM_LAND: ['tower_number', 'flat_number', 'villa_number', 'project_id', 'pid', 'previous_status', 'createdAt', 'updatedAt']
            };

            // Get the list of fields to exclude for the given project type
            const fieldsToExclude = excludeFields[projectType.toUpperCase()] || [];

            const response = await ReceiptsModel.findOne(
                {
                    where: {
                        receipt_id,
                        receipt_status: "A",
                    },
                    attributes: ['receipt_id', 'client_name', 'client_phn_no', 'client_adhar_no'],
                    include: [{
                        model: UsersModel,
                        attributes: [['user_id', 'commission_holder_id'], ['user_name', 'commission_holder_name']],
                    }, {
                        model: ProjectsModel,
                        attributes: {
                            exclude: fieldsToExclude
                        }
                    }, {
                        model: PropertyDetailsModel,
                        attributes: ['property_price', 'discount_percent'],
                    }, {
                        model: CommissionsModel,
                        attributes: ['type_of_commission', 'total_commission', 'commission_recived_till_now'],
                    }]
                }
            )

            return response;
        }
        catch (err) {
            console.error("Error in getPraticularCommisionDetails: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }
}

module.exports = ExpensesService;