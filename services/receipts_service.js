const createError = require('http-errors')
const { SQL_ERROR } = require('../utils/Constants/response_messages')
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;
const _ = require('lodash');
const UsersModel = require('../utils/Models/Users/UsersModel');
const ReceiptsModel = require('../utils/Models/Receipts/ReceiptsModel');
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel');
const CommissionsModel = require('../utils/Models/Commission/CommissionsModel');
const PropertyDetailsModel = require('../utils/Models/PropertyDetails/PropertyDetailsModel');
const TokenOrAdvanceHistoryModel = require('../utils/Models/TokenOrAdvanceHistory/TokenOrAdvanceHistoryModel');
const BlockedProjectsModel = require('../utils/Models/BlockedProjects/BlockedProjectsModel');
const PartPaymentHistoryModel = require('../utils/Models/PartPaymentHistory/PartPaymentHistoryModel');
const Constants = require('../utils/Constants/response_messages')


class ReceiptServices {
    constructor() {

    }

    async createReceipt(payload, commission_holder_id, role_type) {
        let transaction;
        try {
            transaction = await DATA.CONNECTION.mysql.transaction();

            // Validate project type and construct identifier
            let payloadIdentifierCheck = this.constructPayloadIdentifier(payload);

            // Check if project is available
            let checkProject = await ProjectsModel.findOne({
                where: { pid: payloadIdentifierCheck, status: "AVAILABLE" },
                transaction
            });
            if (!checkProject) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Provided Project is not Available to Onboard the Client");
            }

            // Check if a receipt for the project already exists
            const checkReceiptAlready = await ReceiptsModel.findOne({
                where: { project_id: checkProject.project_id },
                include: [{
                    model: PropertyDetailsModel,
                    where: {
                        completely_deleted: false
                    },
                }],
                transaction
            });
            if (checkReceiptAlready) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Receipt already created for current project");
            }

            if (!['TOKEN', 'ADVANCE', 'BLOCK'].includes(payload.status.toUpperCase())) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Type of commission must be 'TOKEN', 'ADVANCE', 'BLOCK'");
            }

            // Validate payload for missing fields based on status
            this.validatePayloadForStatus(payload);

            // Update the project's status in the ProjectsModel
            await ProjectsModel.update({ status: payload.status.toUpperCase() }, {
                where: {
                    project_id: checkProject.project_id
                },
                transaction
            });

            // Perform operations based on payload status
            const pd_id = await this.handleStatusRelatedOperations(payload, checkProject.project_id, transaction);

            if (!['VALIDATION', 'SOLD'].includes(payload.type_of_commission.toUpperCase())) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Type of commission must be either VALIDATION or SOLD");
            }
            const commissionData = {
                project_id: checkProject.project_id,
                type_of_commission: role_type == "CHANNEL PARTNER" ? 'VALIDATION' : payload.type_of_commission.toUpperCase(),
                total_commission: payload.total_commission || null,
                commission_received_till_now: payload.commission_received_till_now || null,
            };

            const commissionRecord = await CommissionsModel.create(commissionData, { transaction });
            const dateString = new Date().toISOString().slice(0, 10);

            let receiptData = {
                client_name: payload.client_name,
                client_phn_no: payload.client_phn_no,
                client_adhar_no: payload.client_adhar_no,
                project_id: checkProject.project_id,
                pd_id,
                commission_holder_id,
                commission_id: commissionRecord.commission_id,
                date_of_onboard: dateString
            };

            const receiptRecord = await ReceiptsModel.create(receiptData, { transaction });

            await transaction.commit();
            return { message: "Receipt created successfully", receipt_id: receiptRecord.receipt_id };
        } catch (err) {
            console.error("Error in createReceipt: ", err.message);

            if (transaction) await transaction.rollback();
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    constructPayloadIdentifier(payload) {
        let identifier = `${payload.project_type.toUpperCase()}_${payload.project_name}`;
        switch (payload.project_type.toUpperCase()) {
            case 'APARTMENT':
                identifier += `_${payload.tower_number}_${payload.flat_number}`;
                break;
            case 'VILLA':
                identifier += `_${payload.villa_number}`;
                break;
            case 'PLOT':
            case 'FARM_LAND':
                identifier += `_${payload.plot_number}`;
                if (payload.project_type === 'FARM_LAND') {
                    identifier += `_${payload.sq_yards}`;
                }
                break;
            default:
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid Project Type");
        }
        return identifier;
    }

    validatePayloadForStatus(payload) {
        const requiredFields = [];
        if (['TOKEN', 'ADVANCE'].includes(payload.status.toUpperCase())) {
            requiredFields.push('ta_mode_of_payment', 'ta_amount');
        } else if (payload.status.toUpperCase() === 'BLOCK') {
            requiredFields.push('no_of_days_blocked');
        }

        const missingFields = requiredFields.filter(field => !payload[field]);
        if (missingFields.length > 0) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields for status ${payload.status}: ${missingFields.join(', ')}`);
        }
    }

    async handleStatusRelatedOperations(payload, projectId, transaction) {
        const dateString = new Date().toISOString().slice(0, 10);

        // Handling based on status
        let taHistoryId = null, blockedId = null;
        if (['TOKEN', 'ADVANCE'].includes(payload.status.toUpperCase())) {
            const tokenOrAdvanceData = {
                project_id: projectId,
                ta_mode_of_payment: payload.ta_mode_of_payment.toUpperCase(),
                ta_amount: payload.ta_amount,
                data_of_ta_payment: dateString
            };
            const tokenOrAdvanceRecord = await TokenOrAdvanceHistoryModel.create(tokenOrAdvanceData, { transaction });
            taHistoryId = tokenOrAdvanceRecord.ta_history_id;
        } else if (payload.status.toUpperCase() === 'BLOCK') {
            const blockedData = {
                project_id: projectId,
                date_of_blocked: dateString,
                no_of_days_blocked: payload.no_of_days_blocked,
                remark: payload.remark || null,
            };
            const blockedRecord = await BlockedProjectsModel.create(blockedData, { transaction });
            blockedId = blockedRecord.blocked_id;
        }

        // Assuming property details and commissions are always created or updated:
        const propertyDetails = {
            project_id: projectId,
            property_price: payload.property_price || null,
            discount_percent: payload.discount_percent || 0,
            amount_paid_till_now: payload.ta_amount || null,
            pending_payment: this.calculatePendingPayment(payload),
            ta_history_id: taHistoryId, // from TOKEN or ADVANCE handling
            blocked_id: blockedId, // from BLOCKED handling
        };

        const PropertyDetails = await PropertyDetailsModel.create(propertyDetails, { transaction });
        return PropertyDetails.pd_id;
    }

    calculatePendingPayment(payload) {
        if (payload.property_price && payload.ta_amount !== undefined) {
            const discountAmount = (payload.property_price * (payload.discount_percent || 0)) / 100;
            const priceAfterDiscount = payload.property_price - discountAmount;
            return priceAfterDiscount - payload.ta_amount;
        }
        return null; // Default to null if necessary values are not provided
    }

    async getPendingReceiptsList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "NV"
                },
                attributes: ['receipt_id'], // Fetch receipt_id
                include: [{
                    model: ProjectsModel,
                    attributes: ['project_id', 'project_name', 'project_type'], // Include project details
                }],
            });

            // Transform data to flatten the structure
            // const transformedData = ReceiptsData.map(receipt => {
            //     return {
            //         receipt_id: receipt.receipt_id,
            //         project_id: receipt.project.project_id,
            //         project_name: receipt.project.project_name,
            //         project_type: receipt.project.project_type
            //     };
            // });

            return ReceiptsData;

        } catch (err) {
            console.error("Error in getPendingReceiptsList: ", err.message);

            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async validateReceipt(payload, approveOrReject) {
        try {
            // Validate required fields for approval
            if (approveOrReject === "APPROVE") {
                this.validateApprovalPayload(payload);
            }
            const dateString = new Date().toISOString().slice(0, 10); // Use the date string directly in the update

            const receiptData = await ReceiptsModel.findOne(
                {
                    where: { receipt_id: payload.receipt_id },
                    include: [{
                        model: PropertyDetailsModel,
                        attributes: ['ta_history_id', 'blocked_id'], // Include project details
                    }],
                },
            );

            if (!receiptData) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid Receipt ID");
            }

            let ta_amount
            if (receiptData.PropertyDetail.ta_history_id !== null) {
                const taData = await TokenOrAdvanceHistoryModel.findByPk(receiptData.PropertyDetail.ta_history_id);
                ta_amount = taData.ta_amount
            }

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                if (approveOrReject === "APPROVE") {
                    const dataToCalculatePendingPayment = {
                        property_price: payload.property_price,
                        ta_amount: ta_amount || 0,
                        discount_percent: payload.discount_percent
                    }

                    // Approval logic with transaction
                    const dataToUpdate = {
                        property_price: payload.property_price,
                        discount_percent: payload.discount_percent,
                        pending_payment: this.calculatePendingPayment(dataToCalculatePendingPayment),
                    };

                    // Update PropertyDetails table
                    await PropertyDetailsModel.update(dataToUpdate, {
                        where: { pd_id: receiptData.pd_id },
                        transaction: t
                    });

                    // Update Commissions table
                    await CommissionsModel.update(
                        { total_commission: payload.total_commission },
                        { where: { commission_id: receiptData.commission_id }, transaction: t }
                    );

                    await ProjectsModel.update(
                        { status: "PART PAYMENT" }, // New status to set
                        {
                            where: {
                                project_id: receiptData.project_id,
                                // Ensure the current status is either 'TOKEN' or 'ADVANCE'
                                status: {
                                    [Op.or]: ['TOKEN', 'ADVANCE']
                                }
                            },
                            transaction: t
                        }
                    );

                    // Update the receipt's status in the ReceiptsModel
                    await ReceiptsModel.update(
                        { receipt_status: "A", date_of_validation: dateString },
                        { where: { receipt_id: payload.receipt_id }, transaction: t }
                    );
                } else if (approveOrReject === "REJECT") {
                    // Rejection logic with transaction for consistency
                    await ReceiptsModel.update(
                        { receipt_status: "R", date_of_validation: dateString },
                        { where: { receipt_id: payload.receipt_id }, transaction: t }
                    );

                    await ProjectsModel.update(
                        { status: "AVAILABLE" },
                        {
                            where: {
                                project_id: receiptData.project_id,
                            },
                            transaction: t
                        }
                    );

                    await PropertyDetailsModel.update(
                        { completely_deleted: true },
                        { where: { pd_id: receiptData.pd_id }, transaction: t }
                    );
                } else {
                    throw new Error("Invalid operation.");
                }
            });

            return approveOrReject === "APPROVE" ? "RECEIPT APPROVED SUCCESSFULLY" : "RECEIPT REJECTED SUCCESSFULLY";
        } catch (err) {
            console.error("Error in getPendingReceiptsList: ", err.message);

            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    validateApprovalPayload(payload) {
        const requiredFields = ['property_price', 'discount_percent', 'total_commission'];
        const missingFields = requiredFields.filter(field => payload[field] === undefined);
        if (missingFields.length > 0) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }

    async getRejectedReceiptsList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll(
                {
                    where: {
                        receipt_status: "R"
                    },
                    attributes: ['receipt_id'], // Fetch receipt_id
                    include: [{
                        model: ProjectsModel,
                        attributes: ['project_id', 'project_name', 'project_type'], // Include project details
                    }],
                }
            )

            return ReceiptsData;

        } catch (err) {
            console.error("Error in getRejectedReceiptsList: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getParticularReceiptData(receipt_id) {
        try {
            const ReceiptData = await ReceiptsModel.findOne({
                where: {
                    receipt_id: receipt_id
                },
                attributes: ['receipt_id', 'client_name', 'client_phn_no', 'client_adhar_no', 'date_of_onboard', 'date_of_validation'],
                include: [
                    {
                        model: UsersModel,
                        attributes: ['user_id', 'user_name', 'role_type'],

                    },
                    {
                        model: ProjectsModel,
                        attributes: {
                            exclude: ['pid', 'createdAt', 'updatedAt']
                        }

                    },
                    {
                        model: PropertyDetailsModel,
                        attributes: {
                            exclude: ['no_of_part_payments', 'semi_deleted', 'completely_deleted', 'date_of_deletion', 'createdAt', 'updatedAt']
                        },
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
                    },
                    {
                        model: CommissionsModel,
                        attributes: {
                            exclude: ['commission_id', 'createdAt', 'updatedAt']
                        },
                    }
                ],
            });

            return ReceiptData;

        } catch (err) {
            console.error("Error in getParticularReceiptData: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getList(statusFilter) {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A",
                },
                attributes: ['receipt_id', 'client_name'], // Assuming you want to fetch 'client_name' from ReceiptsModel
                include: [
                    {
                        model: PropertyDetailsModel,
                        where: {
                            no_of_part_payments: {
                                [Sequelize.Op.gt]: 0 // Ensures no_of_part_payments is greater than 0
                            }
                        },
                        attributes: [], // No attributes included from PropertyDetailsModel
                    },
                    {
                        model: ProjectsModel,
                        attributes: ['project_id', 'project_name', 'status'],
                        where: {
                            status: statusFilter
                        },
                    }
                ]
            });

            return ReceiptsData;

        } catch (err) {
            console.error("Error while getPartPaymentHistoryList:", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getParticularPartPaymentHistoryList(project_id) {
        try {
            const ParticularPartPaymentHistory = await PartPaymentHistoryModel.findAll({
                where: {
                    project_id
                },
                attributes: ['pp_id', 'project_id', 'amount', 'date_of_pp_payment']
            });

            return ParticularPartPaymentHistory;
        } catch (err) {
            console.error("Error while getParticularPartPaymentHistory:", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getParticularPartPaymentHistoryDetails(receipt_id, pp_id) {
        try {
            const ReceiptData = await ReceiptsModel.findOne({
                where: {
                    receipt_id
                },
                attributes: ['receipt_id', 'client_name', 'client_phn_no', 'client_adhar_no', 'date_of_onboard', 'date_of_validation'],
                include: [
                    {
                        model: UsersModel,
                        attributes: ['user_id', 'user_name', 'role_type'],

                    },
                    {
                        model: ProjectsModel,
                        attributes: {
                            exclude: ['pid', 'createdAt', 'updatedAt']
                        }

                    },
                    {
                        model: PropertyDetailsModel,
                        attributes: {
                            exclude: ['no_of_part_payments', 'semi_deleted', 'completely_deleted', 'date_of_deletion', 'createdAt', 'updatedAt']
                        },
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
                    },
                    {
                        model: CommissionsModel,
                        attributes: {
                            exclude: ['commission_id', 'createdAt', 'updatedAt']
                        },
                    }
                ],
            });

            const ppData = await PartPaymentHistoryModel.findOne({ where: { pp_id }, attributes: ['pp_id', 'amount', 'date_of_pp_payment', 'date_of_deletion'] })

            const partPaymentData = _.omit(ppData.toJSON(), ['_previousDataValues', '_options', '_changed']); // Add any other keys you want to omit
            return { ReceiptData, partPaymentData }
        } catch (err) {
            console.error("Error while getParticularPartPaymentHistoryDetails", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async editParticularPartPaymentAmount(payload) {
        let transaction;
        try {
            // Start a transaction
            transaction = await DATA.CONNECTION.mysql.transaction();
            if (!payload.pp_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('pp_id is required.');
            }
            if (!payload.pd_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('pd_id is required.');
            }
            if (!payload.new_amount) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('new_amount is required.');
            }
            // Use findOne to get a single record
            const CheckParticularPartPayment = await PartPaymentHistoryModel.findOne({
                where: {
                    pp_id: payload.pp_id
                }
            });

            if (!CheckParticularPartPayment) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('No such payment record exists.');
            }

            const ProjectData = await ProjectsModel.findOne({
                where: {
                    project_id: CheckParticularPartPayment.project_id,
                    status: "PART PAYMENT"
                }
            });

            if (!ProjectData) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('We can only edit the amount only if the status of project is PART PAYMENT');
            }

            // Ensure the new amount is positive
            if (payload.new_amount <= 0) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('New amount must be greater than zero.');
            }

            // Check for same amount submission
            if (payload.new_amount === CheckParticularPartPayment.amount) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('The new amount is the same as the current amount. Please provide a different amount to update.');
            }

            const dateString = new Date().toISOString().slice(0, 10); // Simplified date handling

            const propertyDetails = await PropertyDetailsModel.findByPk(payload.pd_id)

            let newAmountPaidTillNow;
            let newPendingPayment;
            if (payload.new_amount > CheckParticularPartPayment.amount) {
                newAmountPaidTillNow = propertyDetails.amount_paid_till_now + (payload.new_amount - CheckParticularPartPayment.amount)
                newPendingPayment = propertyDetails.pending_payment - (payload.new_amount - CheckParticularPartPayment.amount)
            } else if (payload.new_amount < CheckParticularPartPayment.amount) {
                newAmountPaidTillNow = propertyDetails.amount_paid_till_now - (CheckParticularPartPayment.amount - payload.new_amount)
                newPendingPayment = propertyDetails.pending_payment + (CheckParticularPartPayment.amount - payload.new_amount)
            }

            await PropertyDetailsModel.update({
                amount_paid_till_now: newAmountPaidTillNow,
                pending_payment: newPendingPayment,
            }, {
                where: { pd_id: payload.pd_id },
                transaction: transaction
            });
            // Update directly with the object, no need to wrap updatedData in another object
            await PartPaymentHistoryModel.update({
                previous_amount: CheckParticularPartPayment.amount, // Assuming your model has this field
                amount: payload.new_amount,
                edited_date_of_pp_payment: dateString, // Correcting typo from 'editied' to 'edited'
            }, {
                where: {
                    pp_id: payload.pp_id
                },
                transaction: transaction
            });
            // Commit the transaction after all operations are successful
            await transaction.commit();
            return 'Successfully updated the particular part payment amount.';
        } catch (err) {
            console.error("Error in editParticularPartPaymentAmount:", err.message);
            if (transaction) {
                await transaction.rollback(); // Rollback the transaction in case of an error
            }
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Custom error handling can be adjusted as needed
            throw new Error("An internal server error occurred while updating part payment.");
        }
    }

    async deleteParticularPartPaymentAmount(pp_id, pd_id) {
        let transaction;
        try {
            // Start a transaction
            transaction = await DATA.CONNECTION.mysql.transaction();

            // Optimized: Combine initial check with fetching amount
            const partPaymentDetails = await PartPaymentHistoryModel.findOne({
                where: { pp_id }, // Ensure payload.pp_id is used correctly
                transaction: transaction
            });

            if (!partPaymentDetails) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('No such payment record exists.');
            }

            const project_id = partPaymentDetails.project_id;

            // Check if the linked project exists
            const projectExists = await ProjectsModel.count({
                where: { project_id },
                transaction: transaction
            }) === 1;

            if (!projectExists) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest('The linked project does not exist.');
            }

            await PropertyDetailsModel.update({
                // Directly decrement no_of_part_payments by 1
                no_of_part_payments: Sequelize.literal('no_of_part_payments - 1'),
                // Use Sequelize.literal for expressions involving existing values
                amount_paid_till_now: Sequelize.literal(`amount_paid_till_now - ${partPaymentDetails.amount}`),
                pending_payment: Sequelize.literal(`pending_payment + ${partPaymentDetails.amount}`),
                // Set semi_deleted directly
                semi_deleted: true
            }, {
                where: { pd_id }, // Assuming pd_id is correctly provided
                transaction: transaction
            });


            const dateString = new Date().toISOString().slice(0, 10); // Simplified date handling

            // Conditional project status update without loading project details
            if (await PropertyDetailsModel.findOne({ where: { pd_id }, transaction: transaction }).no_of_part_payments === 0) {
                await ProjectsModel.update({ status: "AVAILABLE" }, {
                    where: { project_id },
                    transaction: transaction
                });
                await PropertyDetailsModel.update({ completely_deleted: true, date_of_deletion: dateString }, {
                    where: { pd_id },
                    transaction: transaction
                });
            }

            // Mark Part Payment as Deleted
            await PartPaymentHistoryModel.update({
                deleted: true,
                date_of_deletion: dateString
                // date_of_deletion: Sequelize.fn('NOW') // Use database server time for consistency
            }, {
                where: { pp_id },
                transaction: transaction
            });

            // Commit the transaction
            await transaction.commit();
            return 'Successfully deleted the particular part payment amount.';
        } catch (err) {
            console.error("Error in deleteParticularPartPaymentAmount:", err.message);
            if (transaction) {
                await transaction.rollback();
            }
            throw new Error("An internal server error occurred while updating part payment.");
        }
    }

    async deleteParticularProjectPartPayments(project_id) {
        let transaction;
        try {
            // Start a transaction
            transaction = await DATA.CONNECTION.mysql.transaction();

            const ProjectData = await ProjectsModel.findOne({
                where: { project_id },
                transaction: transaction // Include transaction in the query
            });

            if (!ProjectData) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("The specified project does not exist.");
            }

            await ProjectsModel.update({
                status: "AVAILABLE",
                previous_status: project.status

            }, {
                where: { project_id },
                transaction: transaction // Include transaction in the query
            });

            const dateString = new Date().toISOString().slice(0, 10); // Ensure dateString is defined

            // Update PartPaymentHistoryModel to mark payments as deleted
            await PartPaymentHistoryModel.update({
                deleted: true,
                date_of_deletion: dateString
            }, {
                where: { project_id },
                transaction: transaction // Use transaction
            });

            await PropertyDetailsModel.update({ completely_deleted: true, date_of_deletion: dateString }, {
                where: { pd_id: payload.pd_id },
                transaction: transaction
            });

            await transaction.commit(); // Commit the transaction
            return 'Successfully deleted the entire part payments.';
        } catch (err) {
            console.error("Error in deleteParticularProjectPartPayments:", err.message);
            if (transaction) await transaction.rollback(); // Rollback the transaction in case of an error
            throw new Error("An internal server error occurred while updating part payment.");
        }
    }

    async getDeletedHistoryList(deletedFilter, statusFilter) {
        try {
            let propertyDetailsWhere = {};
            let projectsWhere = {}

            // Dynamically set conditions based on filters
            if (deletedFilter === "SEMI DELETED" && statusFilter == "PART PAYMENT") {
                propertyDetailsWhere.semi_deleted = true;
                projectsWhere.status = statusFilter;
            } else if (deletedFilter === "COMPLETELY DELETED" && statusFilter == "PART PAYMENT") {
                propertyDetailsWhere.completely_deleted = true;
                projectsWhere.previous_status = statusFilter;
            } else if (statusFilter == "SOLD") {
                propertyDetailsWhere.completely_deleted = true;
                projectsWhere.previous_status = statusFilter;
            }

            // Execute the query with the dynamic condition
            const ReceiptsData = await ReceiptsModel.findAll({
                where: { receipt_status: "A" },
                attributes: ['receipt_id', 'client_name'],
                include: [
                    {
                        model: PropertyDetailsModel,
                        where: propertyDetailsWhere,
                        attributes: [], // No attributes included from PropertyDetailsModel
                    },
                    {
                        model: ProjectsModel,
                        attributes: ['project_id', 'project_name', 'status'],
                        where: projectsWhere,
                    }
                ]
            });

            return ReceiptsData;

        } catch (err) {
            console.error("Error while getPartPaymentDeletedHistoryList", err.message);
            // Handle errors appropriately
            throw new Error("An internal server error occurred while fetching part payment deleted history.");
        }
    }

    async getParticularPartPaymentDeletedHistoryList(project_id) {
        try {
            const ParticularPartPaymentHistory = await PartPaymentHistoryModel.findAll({
                where: {
                    project_id,
                    deleted: true
                },
                attributes: ['pp_id', 'project_id', 'amount', 'date_of_pp_payment']
            });

            return ParticularPartPaymentHistory;
        } catch (err) {
            console.error("Error while getParticularPartPaymentDeletedHistory:", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }
}

module.exports = ReceiptServices;