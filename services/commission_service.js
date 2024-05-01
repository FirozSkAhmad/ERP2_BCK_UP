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

class CommissionService {
    constructor(io) {
        this.io = io;
    }

    async getCommissionHoldersList(commissionFilter) {
        try {
            // Define a base query structure
            let commissionWhereCondition = {
                [Sequelize.Op.not]: { // Use Sequelize.Op.not for negation
                    total_commission: { [Sequelize.Op.col]: 'commission_recived_till_now' } // Check for total_commission not equal to commission_recived_till_now
                }
            };

            let usersWhereCondition = {
                role_type: 'CHANNEL PARTNER'
            };

            // Modify the where condition based on the filter provided
            if (commissionFilter !== "CP COMMISSION") {
                commissionWhereCondition.type_of_commission = commissionFilter;
                usersWhereCondition.role_type = 'SALES PERSON';
            }

            // Dynamically adjust user attributes based on commissionFilter
            let userAttributes;
            if (commissionFilter === "CP COMMISSION") {
                userAttributes = [
                    ['user_id', 'channel_partner_id'],
                    ['user_name', 'channel_partner_name']
                ];
            } else {
                userAttributes = [
                    ['user_id', 'sales_person_id'],
                    ['user_name', 'sales_person_name']
                ];
            }

            let projectsWhereCondition = {}

            if (commissionFilter === "SOLD") {
                projectsWhereCondition.status = "SOLD";
            }

            const response = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A",
                },
                attributes: ['receipt_id'], // Assuming you need at least one attribute from the ReceiptsModel to satisfy the Sequelize query structure
                include: [{
                    model: ProjectsModel,
                    where: projectsWhereCondition,
                    attributes: [],
                }, {
                    model: UsersModel,
                    where: usersWhereCondition,
                    attributes: userAttributes,
                    distinct: true, // This might help with ensuring uniqueness, but depends on SQL dialect and specific use case
                }, {
                    model: CommissionsModel,
                    where: commissionWhereCondition,
                    attributes: [], // Intentionally exclude attributes but apply the condition
                    // required: false // This makes the inclusion a LEFT OUTER JOIN, which may or may not fit your needs
                }],
                // group: ['user.user_id'], // Group by to ensure uniqueness, adjust as necessary
                raw: true
            });

            let result;
            if (commissionFilter === "CP COMMISSION") {
                const uniqueChannelPartners = new Map();
                response.forEach(item => {
                    if (!uniqueChannelPartners.has(item['user.channel_partner_id'])) {
                        uniqueChannelPartners.set(item['user.channel_partner_id'], {
                            channel_partner_id: item['user.channel_partner_id'],
                            channel_partner_name: item['user.channel_partner_name']
                        });
                    }
                });
                result = Array.from(uniqueChannelPartners.values());
            } else {
                const uniqueSalesPersons = new Map();
                response.forEach(item => {
                    if (!uniqueSalesPersons.has(item['user.sales_person_id'])) {
                        uniqueSalesPersons.set(item['user.sales_person_id'], {
                            sales_person_id: item['user.sales_person_id'],
                            sales_person_name: item['user.sales_person_name']
                        });
                    }
                });
                result = Array.from(uniqueSalesPersons.values());
            }

            return result;

        }
        catch (err) {
            console.error("Error in getCommissions: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getPraticularCommissionHolderHistory(commission_holder_id, commissionFilter) {
        try {
            // Define a base query structure
            let commissionWhereCondition = {
                [Sequelize.Op.not]: { // Use Sequelize.Op.not for negation
                    total_commission: { [Sequelize.Op.col]: 'commission_recived_till_now' } // Check for total_commission not equal to commission_recived_till_now
                }
            };


            // Modify the where condition based on the filter provided
            if (commissionFilter !== "CP COMMISSION") {
                commissionWhereCondition.type_of_commission = commissionFilter;
            }

            let projectsWhereCondition = {}

            if (commissionFilter === "SOLD") {
                projectsWhereCondition.status = "SOLD";
            }

            const response = await ReceiptsModel.findAll({
                where: {
                    commission_holder_id,
                    receipt_status: "A",
                },
                attributes: ['receipt_id', 'client_name'],
                include: [{
                    model: ProjectsModel,
                    where: projectsWhereCondition,
                    attributes: ['project_id', 'project_type'],
                }, {
                    model: CommissionsModel,
                    where: commissionWhereCondition,
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

    async getPraticularCommissionDetails(receipt_id, projectType) {
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
                    attributes: ['receipt_id', 'client_name', 'client_phn_no', 'client_adhar_no', 'date_of_onboard'],
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
                        include: [
                            {
                                model: TokenOrAdvanceHistoryModel,
                                attributes: {
                                    exclude: ['ta_history_id', 'createdAt', 'updatedAt']
                                },
                            },
                            {
                                model: BlockedProjectsModel,
                                attributes: {
                                    exclude: ['blocked_id', 'createdAt', 'updatedAt']
                                },
                            },
                        ]
                    }, {
                        model: CommissionsModel,
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        },
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
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async payCommission(commission_id, commission_amount) {
        let transaction;
        try {
            if (commission_id === undefined || commission_id === null) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Required commission_id in req.body.");
            }

            transaction = await global.DATA.CONNECTION.mysql.transaction();

            // Fetch the current commission
            const commission = await CommissionsModel.findOne({
                where: {
                    commission_id
                }
            });

            if (!commission) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest(`Commission not found with the given commission_id:${commission_id}.`);
            }

            // Check if the new commission received till now exceeds total commission
            const newCommissionReceivedTillNow = commission.commission_recived_till_now + parseInt(commission_amount, 10);
            if (newCommissionReceivedTillNow > commission.total_commission) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Commission received exceeds the total commission.");
            }

            // Update commission
            await CommissionsModel.update({ commission_recived_till_now: newCommissionReceivedTillNow }, {
                where: {
                    commission_id
                },
                transaction // Include the transaction object to ensure this operation is part of the transaction
            });

            await transaction.commit();
            // Emit an event after paying commission
            this.io.emit('new-payCommission', { message: `New Commission paid successfully. Please refresh the page to see the updates.` });


            return "COMMISSION PAY SUCCESSFULLY PROCESSED";;
        } catch (err) {
            console.error("Error in payCommission: ", err.message);
            if (transaction) await transaction.rollback();
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }


    async getCancledCommissions() {
        try {
            const response = await global.DATA.MODELS.rejectedcommissions.findAll().catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            return data;
        }
        catch (err) {
            console.error("Error in getCancledCommissions: ", err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
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
            console.error("Error in validateCommission: ", err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
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
            console.error("Error in cancelCommission: ", err.message);
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

module.exports = CommissionService;