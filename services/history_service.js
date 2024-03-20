const createError = require("http-errors");
const { Sequelize } = require("sequelize");
const { SQL_ERROR } = require("../utils/Constants/response_messages");
const UsersModel = require('../utils/Models/Users/UsersModel')
const CommissionsModel = require('../utils/Models/Commission/CommissionsModel')
const ReceiptsModel = require('../utils/Models/Receipts/ReceiptsModel')
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel')
const PropertyDetailsModel = require('../utils/Models/PropertyDetails/PropertyDetailsModel')
const PayrollModel = require('../utils/Models/Payroll/PayrollModel')

class HistoryService {
    constructor() {

    }

    async getHistory(userId) {
        try {
            const response = await ReceiptsModel.findAll(
                {
                    where: {
                        receipt_status: "A",
                        commission_holder_id: userId
                    },
                    attributes: ['receipt_id', 'client_name'],
                    include: [{
                        model: ProjectsModel,
                        attributes: ['project_id', 'project_type'],
                    }, {
                        model: CommissionsModel,
                        attributes: ['total_commission', 'commission_recived_till_now'],
                    }]
                }
            )

            return response;
        }
        catch (err) {
            console.error("Error in getHistory: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getPraticularHistoryDetails(commissionHolderId, receipt_id, projectType) {
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
                        commission_holder_id: commissionHolderId
                    },
                    attributes: ['receipt_id', 'client_name', 'client_phn_no', 'client_adhar_no'],
                    include: [{
                        model: UsersModel,
                        attributes: [['user_id', 'sales_person_id'], ['user_name', 'sales_person_name']],
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
            if (!response) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("no details with the given combination of filters");

            }

            return response
        }
        catch (err) {
            console.error("Error in getPraticularHistoryDetails: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getCommissionHolderslist(role_type) {
        try {
            if (!['SALES PERSON', 'CHANNEL PARTNER']) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Incorrect role_type it should be either 'SALES PERSON' or 'CHANNEL PARTNER'");

            }
            const response = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A"
                },
                attributes: [],
                include: [{
                    model: UsersModel,
                    where: { role_type },
                    attributes: [
                        ['user_id', 'commission_holder_id'],
                        ['user_name', 'commission_holder_name']
                    ],
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
        catch (err) {
            console.error("Error in getCommissionHolderslist ", err.message);

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
}

module.exports = HistoryService;