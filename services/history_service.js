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

    async getPraticularHistoryDetails(userId, receipt_id, projectType) {
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
                        commission_holder_id: userId
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

            return response;
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

    async getCancledCommissions() {
        try {
            const response = await global.DATA.MODELS.rejectedcommissions.findAll().catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View All Cancled Commisions", data);
            return data;
        }
        catch (err) {
            throw err;
        }
    }

    async validateCommission(payload) {
        // Delete from commission table and add in the projects table
        try {
            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                const projectId = payload.project_id;
                const amount = payload.commission_amount;
                const project_name = payload.project_name;

                // Add commission amount to the projects table
                await ProjectsModel.update({
                    commission_amount: amount
                }, {
                    where: {
                        project_id: projectId
                    },
                    transaction: t
                }).catch(err => {
                    console.log("Error while updating the project", err);
                    throw createError.InternalServerError(SQL_ERROR);
                });

                // Delete from commission table
                await CommissionsModel.destroy({
                    where: {
                        project_id: projectId
                    },
                    transaction: t
                }).catch(err => {
                    console.log("Error while delete from commission", err);
                    throw createError.InternalServerError(SQL_ERROR);
                });

                await PayrollModel.create({
                    amount: payload.commission_amount,
                    project_id: projectId,
                    name: project_name,
                    project_type: payload.project_type,
                    tower_number: payload.tower_number,
                    flat_number: payload.flat_number,
                    villa_number: payload.villa_number,
                    plot_number: payload.plot_number,
                    role_type: "COMMISSION",
                    payroll_type: "COMMISSION",
                }).catch(err => {
                    console.log("ERROR while inserting into payroll table", err);
                    throw createError.InternalServerError(SQL_ERROR);
                })
            })
        }
        catch (err) {
            throw err;
        }
    }

    async cancelCommission(payload) {
        try {
            await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                const commission_id = payload.project_id;
                const checkExists = await CommissionsModel.findOne({
                    where: {
                        project_id: commission_id
                    }
                }).catch(err => {
                    console.log("Error while finding commission", err);
                    throw createError.NotFound("Commission with given Id Not Found");
                })

                if (checkExists) {
                    await global.DATA.MODELS.rejectedcommissions.create({
                        project_id: checkExists.project_id,
                        project_name: checkExists.project_name,
                        tower_number: checkExists.tower_number,
                        flat_number: checkExists.flat_number,
                        status: checkExists.status,
                        project_type: checkExists.project_type,
                        villa_number: checkExists.villa_number,
                        plot_number: checkExists.plot_number,
                        pid: checkExists.pid,
                        client_name: checkExists.client_name,
                        client_phone: checkExists.client_phone,
                        sales_person: checkExists.sales_person,
                        amount_received: checkExists.amount_received,
                    }, {
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    await CommissionsModel.destroy({
                        where: {
                            project_id: commission_id
                        },
                        transaction: t
                    }).catch(err => {
                        console.log("error while deleting commission details", err);
                        throw createError.InternalServerError(SQL_ERROR);
                    })

                    return "COMMISSION DELETED SUCCESSFULLY";
                }

            })
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = HistoryService;