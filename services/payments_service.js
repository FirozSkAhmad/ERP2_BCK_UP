const createError = require('http-errors')
const { SQL_ERROR } = require('../utils/Constants/response_messages')
const { Sequelize } = require('sequelize');
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
        // Assuming DATA, and models like ReceiptsModel, ProjectsModel are available in the context
    }

    async getPaymentsList(statusFilter) {
        try {
            // Common attributes for all queries
            const commonAttributes = {
                where: { receipt_status: "A" }, // Assuming "A" means "Approved"
                attributes: ['receipt_id', 'client_name'],
                include: [
                    // {
                    //     model: UsersModel, // Adjust model references as needed
                    //     attributes: [['user_name', 'client_name']], // Alias user_name as client_name
                    // }
                ],
            };

            // Adding specific conditions based on the list type
            if (statusFilter === 'BLOCK') {
                commonAttributes.include.push({
                    model: ProjectsModel, // Adjust model references as needed
                    where: { status: statusFilter },
                    attributes: ['project_id', 'project_name', 'project_type'],
                });
                commonAttributes.include.push({
                    model: PropertyDetailsModel, // Adjust model references as needed
                    include: [{
                        model: BlockedProjectsModel,
                        attributes: ['date_of_blocked', 'no_of_days_blocked'],
                    }],
                });
            } else if (statusFilter === 'PART PAYMENT') {
                commonAttributes.include.push({
                    model: ProjectsModel, // Adjust model references as needed
                    where: { status: statusFilter },
                    attributes: ['project_id', 'project_name', 'project_type'],
                });
                commonAttributes.include.push({
                    model: PropertyDetailsModel, // Adjust model references as needed
                    attributes: ['pending_payment'],
                });
            } else {
                throw new Error("Invalid list type specified");
            }

            // Execute query with dynamically constructed attributes
            const ReceiptsData = await ReceiptsModel.findAll(commonAttributes);
            return ReceiptsData;

        } catch (err) {
            console.error(`Error while getting ${statusFilter} list:`, err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    // async getPartPaymentsList() {
    //     try {
    //         const ReceiptsData = await ReceiptsModel.findAll({
    //             where: {
    //                 receipt_status: "A" // Assuming "A" means "Approved" or similar
    //             },
    //             attributes: ['receipt_id'],
    //             include: [
    //                 {
    //                     model: ProjectsModel, // Adjust model references as needed
    //                     where: { status: "PART PAYMENT" },
    //                     attributes: ['project_id', 'project_name', 'project_type'],
    //                 },
    //                 {
    //                     model: PropertyDetailsModel, // Adjust model references as needed
    //                     attributes: ['pending_payment'],
    //                 },
    //                 {
    //                     model: UsersModel, // Adjust model references as needed
    //                     attributes: ['user_name'],
    //                 }
    //             ],
    //         });

    //         return ReceiptsData;
    //     } catch (err) {
    //         console.error("Error while getPartPaymentsList:", err.message);

    //         // If it's a known error, rethrow it for the router to handle
    //         if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
    //             throw err;
    //         }
    //         // Log and throw a generic server error for unknown errors
    //         throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
    //     }
    // }

    async payPartPayment(payload) {
        let transaction;
        try {
            if (payload.project_id === undefined || payload.project_id === null) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Required project_id in req.body.");
            }
            transaction = await DATA.CONNECTION.mysql.transaction();

            if (payload.status === "AVAILABLE") {
                await this.handleAvailableStatus(payload, transaction);
            } else {
                const currentDetails = await PropertyDetailsModel.findOne({
                    where: {
                        pd_id: payload.pd_id,
                        completely_deleted: false
                    },
                    include: [
                        {
                            model: TokenOrAdvanceHistoryModel,
                        },
                        {
                            model: BlockedProjectsModel,
                        }
                    ],
                    transaction: transaction
                });


                if (!currentDetails) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Property details not found.");
                }

                switch (payload.status.toUpperCase()) {
                    case "BLOCK":
                        // Handle the logic for when the status is BLOCKED
                        await this.handleBlockedStatus(payload, currentDetails, transaction);
                        break;
                    case "SOLD":
                        // Handle the logic for when the status is SOLD
                        await this.handleSoldStatus(payload, currentDetails, transaction);
                        break;
                    case "PART PAYMENT":
                        // Handle the logic for when the status is PART PAYMENT
                        await this.handlePartPaymentStatus(payload, currentDetails, transaction);
                        break;
                    default:
                        // Throw an error if the status is not recognized
                        throw new global.DATA.PLUGINS.httperrors.BadRequest(`Unhandled status: ${payload.status}`);
                }
            }

            await transaction.commit();
            return "PAYMENT SUCCESSFULLY PROCESSED";

        } catch (err) {
            console.error("Error in payPartPayment: ", err.message);
            if (transaction) await transaction.rollback();
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async handleBlockedStatus(payload, currentDetails, transaction) {

        if (payload.added_extra_days === undefined || payload.added_extra_days === null) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("Required Extra days value to increase block days.");
        }

        const updateDetails = this.calculateBlockedDetails(payload, currentDetails);

        await BlockedProjectsModel.update(updateDetails.updates, {
            where: { blocked_id: currentDetails.blocked_id },
            transaction: transaction
        });
    }

    async handleSoldStatus(payload, currentDetails, transaction) {
        const updateDetails = this.calculatePaymentDetails(payload, currentDetails);

        if (updateDetails.newPendingPayment !== 0) {
            throw global.DATA.PLUGINS.httperrors.BadRequest("To change status to SOLD, remaining payment should be zero.");
        }

        await PartPaymentHistoryModel.create(updateDetails.updates.ppUpdates, {
            transaction: transaction
        });

        await PropertyDetailsModel.update(updateDetails.updates.pdUpdates, {
            where: { pd_id: payload.pd_id },
            transaction: transaction
        });

        await ProjectsModel.update({ status: "SOLD" }, {
            where: { project_id: payload.project_id },
            transaction: transaction
        });
    }

    async handlePartPaymentStatus(payload, currentDetails, transaction) {
        const updateDetails = this.calculatePaymentDetails(payload, currentDetails);

        if (currentDetails.status !== payload.status.toUpperCase()) {
            await ProjectsModel.update({ status: "PART PAYMENT" }, {
                where: { project_id: currentDetails.project_id },
                transaction: transaction
            });
        }

        await PartPaymentHistoryModel.create(updateDetails.updates.ppUpdates, {
            transaction: transaction
        });


        await PropertyDetailsModel.update(updateDetails.updates.pdUpdates, {
            where: { pd_id: payload.pd_id },
            transaction: transaction
        });
    }

    async handleAvailableStatus(payload, transaction) {
        //Fetch the current status
        const project = await ProjectsModel.findOne({
            where: { project_id: payload.project_id },
            transaction: transaction,
        });

        // Check if project exists
        if (!project) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest('Project not found');
        }

        // Update the project with the new status and set the previous status
        await ProjectsModel.update({
            status: "AVAILABLE",
            previous_status: project.status
        }, {
            where: { project_id: payload.project_id },
            transaction: transaction,
        });

        const dateString = new Date().toISOString().slice(0, 10); // Ensure dateString is defined
        // Update PartPaymentHistoryModel to mark payments as deleted
        await PartPaymentHistoryModel.update({
            deleted: true,
            date_of_deletion: dateString
        }, {
            where: { project_id: payload.project_id },
            transaction: transaction // Use transaction
        });

        await PropertyDetailsModel.update({ completely_deleted: true, date_of_deletion: dateString }, {
            where: { pd_id: payload.pd_id },
            transaction: transaction
        });
    }

    calculateBlockedDetails(payload, currentDetails) {
        const extraDays = payload.added_extra_days
        const newNoOfDaysBlocked = currentDetails.BlockedProject.no_of_days_blocked + extraDays;
        const newRemark = payload.remark || null;

        return {
            updates: {
                no_of_days_blocked: newNoOfDaysBlocked,
                remark: newRemark
            }
        };
    }

    calculatePaymentDetails(payload, currentDetails) {

        if (payload.property_price === undefined || payload.property_price === null || payload.amount === undefined || payload.amount === null || payload.discount_percent === undefined) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("Missing required fields");
        }

        // Destructure for easier access to properties
        const {
            property_price: propertyPrice,
            discount_percent: discountPercent = 0, // Default to 0 if not provided
            amount,
            project_id: projectId,
        } = payload;

        const {
            amount_paid_till_now: amountPaidTillNow = 0,
            no_of_part_payments: noOfPartPayments = 0,
            property_price: currentPropertyPrice,
            discount_percent: currentDiscountPercent = 0,
        } = currentDetails;

        // Calculate discount amount and final price after applying the discount
        const discountAmount = (parseInt(propertyPrice, 10) * parseInt(discountPercent, 10) / 100);
        const priceAfterDiscount = parseInt(propertyPrice, 10) - discountAmount;

        console.log("priceAfterDiscount",priceAfterDiscount)

        // Update the amount paid till now and calculate new pending payment
        const newAmountPaidTillNow = amountPaidTillNow + parseInt(amount, 10);
        const newPendingPayment = priceAfterDiscount - newAmountPaidTillNow;
        console.log("newPendingPayment",newPendingPayment)

        // Create date string for the payment
        const dateString = new Date().toISOString().slice(0, 10);

        // Prepare updates for payment details and part payments
        let updates = {
            pdUpdates: {
                amount_paid_till_now: newAmountPaidTillNow,
                pending_payment: newPendingPayment,
                no_of_part_payments: noOfPartPayments + 1,
                // Update property_price and discount_percent only if they are different
                ...(currentPropertyPrice !== propertyPrice || currentDiscountPercent !== discountPercent) && {
                    property_price: propertyPrice,
                    discount_percent: discountPercent,
                },
            },
            ppUpdates: {
                project_id: projectId,
                amount: amount,
                date_of_pp_payment: dateString,
            },
        };

        return {
            updates,
            newPendingPayment,
        };
    }

    // async getBlockedList() {
    //     try {
    //         const ReceiptsData = await ReceiptsModel.findAll({
    //             where: {
    //                 receipt_status: "A" // Assuming "A" means "Approved" or similar
    //             },
    //             include: [
    //                 {
    //                     model: ProjectsModel, // Adjust model references as needed
    //                     where: { status: "BLOCKED" },
    //                     attributes: ['project_id', 'project_name', 'project_type'],
    //                 },
    //                 {
    //                     model: PropertyDetailsModel, // Adjust model references as needed
    //                     include: [
    //                         {
    //                             model: BlockedProjectsModel,
    //                             attributes: ['date_of_blocked', 'no_of_days_blocked'],
    //                         }
    //                     ]
    //                 },
    //                 {
    //                     model: Users,
    //                     attributes: ['user_name'],
    //                 }
    //             ],
    //         });

    //         return ReceiptsData;

    //     } catch (err) {
    //         console.error("Error while getBlockedList:", err.message);

    //         // If it's a known error, rethrow it for the router to handle
    //         if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
    //             throw err;
    //         }
    //         // Log and throw a generic server error for unknown errors
    //         throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
    //     }
    // }
}

module.exports = ReceiptServices;
