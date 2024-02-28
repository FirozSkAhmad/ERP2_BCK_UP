const createError = require('http-errors')
const { SQL_ERROR } = require('../utils/Constants/response_messages')
const { Sequelize } = require('sequelize');
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

    async createReceipt(payload) {
        try {
            const transaction = await DATA.CONNECTION.mysql.transaction();

            // Construct payload identifier based on project type
            let payloadIdentifierCheck = `${payload.project_type}_${payload.project_name}`;
            switch (payload.project_type) {
                case 'APARTMENT':
                    payloadIdentifierCheck += `_${payload.tower_number}_${payload.flat_number}`;
                    break;
                case 'VILLA':
                    payloadIdentifierCheck += `_${payload.villa_number}`;
                    break;
                case 'PLOT':
                    payloadIdentifierCheck += `_${payload.plot_number}`;
                    break;
                case 'FARM_LAND':
                    payloadIdentifierCheck += `_${payload.plot_number}_${payload.sq_yards}`;
                    break;
                default:
                    throw new Error("Provide Correct Project Type");
            }

            let checkProject = await ProjectsModel.findOne({
                where: { pid: payloadIdentifierCheck, status: "AVAILABLE" },
                transaction
            });

            if (!checkProject) {
                throw new Error("Provided Project is not Available to Onboard the Client");
            }

            const checkReceiptAlready = await ReceiptsModel.findOne({
                where: {
                    project_id: checkProject.project_id,
                    receipt_status: "NV"
                },
                transaction
            });

            if (checkReceiptAlready) {
                throw new Error("Receipt already created for current project need to validate by SUPER ADMIN");
            }

            const dateString = new Date().toISOString().slice(0, 10); // Simplified date handling

            let propertyDetail = {
                project_id: checkProject.project_id,
                property_price: payload.property_price || null,
                discount_percent: payload.discount_percent || 0, // Ensuring a default value of 0
                amount_paid_till_now: payload.ta_amount || null,
                pending_payment: null // Initialized here
            };

            // Adjusted to calculate pending_payment based on the presence of property_price and ta_amount
            if (payload.property_price && payload.ta_amount !== undefined) {
                const discountAmount = (payload.property_price * (payload.discount_percent || 0)) / 100;
                const priceAfterDiscount = payload.property_price - discountAmount;
                propertyDetail.pending_payment = priceAfterDiscount - payload.ta_amount;
            }

            // Update the project's status in the ProjectsModel
            await ProjectsModel.update({ status: payload.status }, {
                where: {
                    project_id: checkProject.project_id
                }
            });

            if (['TOKEN', 'ADVANCE'].includes(payload.status)) {
                const tokenOrAdvanceData = {
                    ta_mode_of_payment: payload.ta_mode_of_payment,
                    ta_amount: payload.ta_amount,
                    date_of_ta_payment: dateString
                };
                const tokenOrAdvanceRecord = await TokenOrAdvanceHistoryModel.create(tokenOrAdvanceData, { transaction });
                propertyDetail.ta_history_id = tokenOrAdvanceRecord.id;
            } else if (payload.status === 'BLOCKED') {
                const blockedData = {
                    date_of_blocked: dateString,
                    no_of_days_blocked: payload.no_of_days_blocked,
                    remark: payload.remark || null,
                };
                const blockedRecord = await BlockedProjectsModel.create(blockedData, { transaction });
                propertyDetail.blocked_id = blockedRecord.id;
            }

            await PropertyDetailsModel.create(propertyDetail, { transaction });

            if (!['VALIDATION', 'INCLUDES'].includes(payload.type_of_commission)) {
                throw new Error("Type of commission must be either VALIDATION or INCLUDES");
            }

            const commissionData = {
                type_of_commission: payload.type_of_commission,
                total_commission: payload?.total_commission ? payload.total_commission : null,
                commission_received_till_now: payload?.commission_received_till_now ? payload.commission_received_till_now : null,
            };

            const commissionRecord = await CommissionsModel.create(commissionData, { transaction });

            let receiptData = {
                client_name: payload.client_name,
                client_phn_no: payload.client_phn_no,
                client_adhar_no: payload.client_adhar_no,
                project_id: checkProject.project_id,
                commission_holder_id: payload.commission_holder_id,
                commission_id: commissionRecord.id,
            };

            const receiptRecord = await ReceiptsModel.create(receiptData, { transaction });

            await transaction.commit();
            return receiptRecord;
        } catch (err) {
            if (transaction) await transaction.rollback();
            console.error("Error in createNewProject: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getPendingReceiptsList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "NV"
                },
                include: [{
                    model: projects
                }],
            })

            return ReceiptsData;

        } catch (err) {
            console.error("Error in getPendingReceiptsList: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async validateReceipt(payload, approveOrReject) {
        try {
            const dateString = new Date().toISOString().slice(0, 10); // Use the date string directly in the update

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                if (approveOrReject === "A") {
                    // Approval logic with transaction
                    const dataToUpdate = {
                        property_price: payload.property_price,
                        discount_percent: payload.discount_percent || null,
                    };

                    // Update PropertyDetails table
                    await PropertyDetailsModel.update(dataToUpdate, {
                        where: { project_id: payload.project_id },
                        transaction: t
                    });

                    // Update Commissions table
                    await CommissionsModel.update(
                        { total_commission: payload.total_commission },
                        { where: { commission_id: payload.commission_id }, transaction: t }
                    );

                    if (['TOKEN', 'ADVANCE'].includes(payload.status)) {
                        // Update the project's status in the ProjectsModel
                        await ProjectsModel.update({ status: "PART-PAYMENT" }, {
                            where: { project_id: payload.project_id },
                            transaction: t
                        });
                    }

                    // Update the receipt's status in the ReceiptsModel
                    await ReceiptsModel.update(
                        { receipt_status: "A", date_of_validation: dateString },
                        { where: { receipt_id: payload.receipt_id }, transaction: t }
                    );
                } else if (approveOrReject === "R") {
                    // Rejection logic with transaction for consistency
                    await ReceiptsModel.update(
                        { receipt_status: "R", date_of_validation: dateString },
                        { where: { receipt_id: payload.receipt_id }, transaction: t }
                    );

                    await PropertyDetailsModel.update(
                        { deleted: "true" },
                        { where: { project_id: payload.project_id }, transaction: t }
                    );
                } else {
                    throw new Error("Invalid operation.");
                }
            });

            return approveOrReject === "A" ? "RECEIPT APPROVED SUCCESSFULLY" : "RECEIPT REJECTED SUCCESSFULLY";
        } catch (err) {
            console.error("Error in validateReceipt: ", err.stack || err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred during receipt validation.");
        }
    }


    async getRejectedReceiptsList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll(
                {
                    where: {
                        receipt_status: "R"
                    },
                    include: [{
                        model: projects
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
            const ReceiptsData = await ReceiptsModel.findOne({
                where: {
                    receipt_id: receipt_id
                },
                include: [
                    {
                        model: projects,
                    },
                    {
                        model: PropertyDetails,
                        include: [
                            {
                                model: TokenOrAdvanceHistories,
                            },
                            {
                                model: BlockedProjects,
                            },
                        ]
                    },
                    {
                        model: commissions,
                    }
                ],
            });

            return ReceiptsData;

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

    async getPartPaymentHistoryList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A" // Assuming "A" means "Approved" or similar
                },
                include: [
                    {
                        model: PropertyDetails,
                        where: {
                            no_of_pp_payments: {
                                [Sequelize.Op.gt]: 0 // Ensures no_of_pp_payments is greater than 0
                            }
                        }
                    },
                    {
                        model: Projects,
                    },
                    {
                        model: users,
                    }
                ]
            });

            return ReceiptsData;
        } catch (err) {
            console.error("Error while getting receipts:", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getParticularPartPaymentHistory(payload) {
        try {
            const ParticularPartPaymentHistory = await PartPaymentHistoryModel.findAll({
                where: {
                    project_id: payload.project_id
                }
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

    async editParticularPartPaymentAmount(payload) {
        try {
            // Use findOne to get a single record
            const CheckParticularPartPayment = await PartPaymentHistoryModel.findOne({
                where: {
                    pp_id: payload.pp_id
                }
            });

            if (!CheckParticularPartPayment) {
                throw new Error('No such payment record exists.');
            }

            const ProjectData = await ProjectsModel.findOne({
                where: {
                    project_id: CheckParticularPartPayment.project_id,
                    status: "PART-PAYMENT"
                }
            });

            if (!ProjectData) {
                throw new Error('We can only edit the amount only if the status of project is PART-PAYMENT');
            }

            // Ensure the new amount is positive
            if (payload.new_amount <= 0) {
                throw new Error('New amount must be greater than zero.');
            }

            // Check for same amount submission
            if (payload.new_amount === CheckParticularPartPayment.amount) {
                throw new Error('The new amount is the same as the current amount. Please provide a different amount to update.');
            }

            const dateString = new Date().toISOString().slice(0, 10); // Simplified date handling

            // Update directly with the object, no need to wrap updatedData in another object
            await PartPaymentHistoryModel.update({
                previous_amount: CheckParticularPartPayment.amount, // Assuming your model has this field
                amount: payload.new_amount,
                edited_date_of_pp_payment: dateString, // Correcting typo from 'editied' to 'edited'
            }, {
                where: {
                    pp_id: payload.pp_id
                }
            });

            return 'Successfully updated the particular part payment amount.';
        } catch (err) {
            console.error("Error in editParticularPartPaymentAmount:", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Custom error handling can be adjusted as needed
            throw new Error("An internal server error occurred while updating part payment.");
        }
    }

    async deleteParticularPartPaymentAmount(payload) {
        let transaction;
        try {
            // Start a transaction
            transaction = await DATA.CONNECTION.mysql.transaction();

            const CheckParticularPartPayment = await PartPaymentHistoryModel.findOne({
                where: { pp_id: payload.pp_id },
                transaction: transaction
            });

            if (!CheckParticularPartPayment) {
                throw new Error('No such payment record exists.');
            }

            const ProjectData = await ProjectsModel.findOne({
                where: {
                    project_id: CheckParticularPartPayment.project_id,
                },
                transaction: transaction
            });

            if (!ProjectData) {
                throw new Error('The linked project does not exist.');
            }

            const propertyDetails = await PropertyDetailsModel.findOne({
                where: { project_id: CheckParticularPartPayment.project_id },
                transaction: transaction
            });

            if (!propertyDetails) {
                throw new Error('Property details not found.');
            }

            // Decrement no_of_part_payments and update project status if necessary
            if (propertyDetails.no_of_part_payments === 1) {
                await ProjectsModel.update({ status: "AVAILABLE" }, {
                    where: { project_id: CheckParticularPartPayment.project_id },
                    transaction: transaction
                });
            }

            await propertyDetails.decrement('no_of_part_payments', { by: 1, transaction: transaction });

            const dateString = new Date().toISOString().slice(0, 10); // Simplified date handling

            await PartPaymentHistoryModel.update({
                deleted: 'true',
                date_of_deletion: dateString
            }, {
                where: { pp_id: payload.pp_id },
                transaction: transaction
            });

            // Commit the transaction after all operations are successful
            await transaction.commit();
            return 'Successfully deleted the particular part payment amount.';
        } catch (err) {
            console.error("Error in deleteParticularPartPaymentAmount:", err.message);
            if (transaction) {
                await transaction.rollback(); // Rollback the transaction in case of an error
            }
            throw new Error("An internal server error occurred while updating part payment.");
        }
    }

    async deleteParticularProjectPartPayments(payload) {
        let transaction;
        try {
            // Start a transaction
            transaction = await DATA.CONNECTION.mysql.transaction();

            const ProjectData = await ProjectsModel.findOne({
                where: { project_id: payload.project_id },
                transaction: transaction // Include transaction in the query
            });

            if (!ProjectData) {
                throw new Error("The specified project does not exist.");
            }

            await ProjectsModel.update({ status: "AVAILABLE" }, {
                where: { project_id: payload.project_id },
                transaction: transaction // Include transaction in the query
            });

            const dateString = new Date().toISOString().slice(0, 10); // Ensure dateString is defined

            // Reset the no_of_part_payments for the specified project_id
            await PropertyDetailsModel.update({ no_of_part_payments: 0 }, {
                where: { project_id: payload.project_id },
                transaction: transaction // Use transaction
            });

            // Update PartPaymentHistoryModel to mark payments as deleted
            await PartPaymentHistoryModel.update({
                deleted: 'true',
                date_of_deletion: dateString
            }, {
                where: { project_id: payload.project_id },
                transaction: transaction // Use transaction
            });

            await transaction.commit(); // Commit the transaction
            return 'Successfully deleted the entire part payments.';
        } catch (err) {
            console.error("Error in deleteParticularProjectPartPayments:", err.message);
            if (transaction) await transaction.rollback(); // Rollback the transaction in case of an error
            throw new Error("An internal server error occurred while updating part payment.");
        }
    }

    async getPartPaymentDeletedHistoryList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A" // Assuming "A" means "Approved" or similar
                },
                include: [
                    {
                        model: PropertyDetails,
                        where: {
                            [Sequelize.Op.or]: [
                                { semi_deleted: "true" },
                                { deleted: "true" }
                            ]
                        }
                    },
                    {
                        model: Projects,
                    },
                    {
                        model: users,
                    }
                ]
            });

            return ReceiptsData;
        } catch (err) {
            console.error("Error while getPartPaymentDeletedHistoryList:", err.message);
            // Handle errors appropriately
            throw new Error("An internal server error occurred while fetching part payment deleted history.");
        }
    }

    async getParticularPartPaymentDeletedHistory(payload) {
        try {
            const ParticularPartPaymentHistory = await PartPaymentHistoryModel.findAll({
                where: {
                    project_id: payload.project_id,
                    deleted: 'true'
                }
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

    async getAvailableReceiptProjectNames() {
        try {
            const response = await global.DATA.CONNECTION.mysql.query(`SELECT project_name
            FROM projects
            WHERE project_id NOT IN (SELECT project_id FROM receipts);`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            let uniqueProjectNames = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectNameData = data.filter(item => {
                if (!uniqueProjectNames.has(item.project_name.split('').join(''))) {
                    uniqueProjectNames.add(item.project_name.split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectNameData);
            return uniqueProjectNameData;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = ReceiptServices;