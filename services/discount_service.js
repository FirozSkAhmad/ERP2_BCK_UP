const createError = require("http-errors");
const { Sequelize } = require("sequelize");
const { SQL_ERROR } = require("../utils/Constants/response_messages");
const UsersModel = require('../utils/Models/Users/UsersModel')
const CommissionsModel = require('../utils/Models/Commission/CommissionsModel')
const ReceiptsModel = require('../utils/Models/Receipts/ReceiptsModel')
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel')
const PropertyDetailsModel = require('../utils/Models/PropertyDetails/PropertyDetailsModel')
const PayrollModel = require('../utils/Models/Payroll/PayrollModel');
const TokenOrAdvanceHistoryModel = require('../utils/Models/TokenOrAdvanceHistory/TokenOrAdvanceHistoryModel');
const BlockedProjectsModel = require('../utils/Models/BlockedProjects/BlockedProjectsModel');

class DiscountService {
    constructor() {

    }

    async getDiscountsList() {
        try {
            const response = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A",
                },
                attributes: ['receipt_id', 'client_name', 'client_phn_no'],
                include: [{
                    model: PropertyDetailsModel,
                    attributes: ['discount_percent'],
                }, {
                    model: ProjectsModel,
                    attributes: ['project_id', 'project_name', 'project_type'],
                }]
            });

            return response;
        }
        catch (err) {
            console.error("Error in getDiscountsList ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getPraticularDiscountDetails(receipt_id, projectType) {
        try {

            if (!['APARTMENT', 'VILLA', 'PLOT', 'FARM_LAND'].includes(projectType)) {
                throw new new global.DATA.PLUGINS.httperrors.BadRequest(`incorrect projectType: ${projectType}, it should one of the value in ['APARTMENT', 'VILLA', 'PLOT', 'FARM_LAND']`);
            }

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
                        // include: [
                        //     {
                        //         model: TokenOrAdvanceHistoryModel,
                        //         attributes: {
                        //             exclude: ['ta_history_id', 'createdAt', 'updatedAt']
                        //         },
                        //     },
                        //     {
                        //         model: BlockedProjectsModel,
                        //         attributes: {
                        //             exclude: ['blocked_id', 'createdAt', 'updatedAt']
                        //         },
                        //     },
                        // ]
                    }, {
                        model: CommissionsModel,
                        attributes: ['type_of_commission'],
                    }]
                }
            )

            return response;
        }
        catch (err) {
            console.error("Error in getPraticularCommissionDetails", err.message);

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

module.exports = DiscountService;