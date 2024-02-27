const createError = require('http-errors')
const { SQL_ERROR } = require('../utils/Constants/response_messages')
const { Sequelize } = require('sequelize');
const ReceiptsModel = require('../utils/Models/Receipts/ReceiptsModel');
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel');
const CommissionsModel = require('../utils/Models/Commission/CommissionsModel');
const PropertyDetailsModel = require('../utils/Models/PropertyDetails/PropertyDetailsModel');
const TokenOrAdvanceHistoryModel = require('../utils/Models/TokenOrAdvanceHistory/TokenOrAdvanceHistoryModel');
const BlockedProjectsModel = require('../utils/Models/BlockedProjects/BlockedProjectsModel');
const Constants = require('../utils/Constants/response_messages')


class ReceiptServices {
    constructor() {
        // Assuming DATA, and models like ReceiptsModel, ProjectsModel are available in the context
    }

    async getPartPaymentsList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A" // Assuming "A" means "Approved" or similar
                },
                include: [
                    {
                        model: Projects, // Adjust model references as needed
                        where: { status: "PART-PAYMENT" }
                    },
                    {
                        model: PropertyDetails, // Adjust model references as needed
                        include: [
                            {
                                model: TokenOrAdvanceHistories,
                            }
                        ]
                    },
                    {
                        model: Users, // Adjust model references as needed
                    }
                ],
            });

            return ReceiptsData;

        } catch (err) {
            console.error("Error in getPartPaymentsList: ", err.message);
            throw new Error("An error occurred while fetching part payments list.");
        }
    }

    async payPartPayment(payload) {
        let transaction;
        try {
            transaction = await DATA.CONNECTION.mysql.transaction();

            if (payload.status === "AVAILABLE") {
                await this.handleAvailableStatus(payload, transaction);
            } else {
                const currentDetails = await PropertyDetailsModel.findOne({
                    where: {
                        project_id: payload.project_id,
                    },
                    include: [
                        {
                            model: BlockedProjects,
                        }
                    ],
                    transaction: transaction
                });


                if (!currentDetails) throw new Error("Property details not found.");

                switch (payload.status) {
                    case "BLOCKED":
                        await this.handleBlockedStatus(payload, currentDetails, transaction);
                        break;
                    case "SOLD":
                        await this.handleSoldStatus(payload, currentDetails, transaction);
                        break;
                    case "PART-PAYMENT":
                        await this.handlePartPaymentStatus(payload, currentDetails, transaction);
                        break;
                    default:
                        console.log(`Unhandled status: ${payload.status}`);
                        break;
                }
            }

            await transaction.commit();
            return "PAYMENT SUCCESSFULLY PROCESSED";

        } catch (err) {
            if (transaction) await transaction.rollback();
            console.error("Error in payPartPayment: ", err.message);
            throw new Error("An error occurred while processing part payment.");
        }
    }

    async handleBlockedStatus(payload, currentDetails, transaction) {
        const updateDetails = this.calculateBlockedDetails(payload, currentDetails);

        if (updateDetails.extraDays === 0) {
            throw new Error("Required Extra days value to increase block days.");
        }

        await BlockedProjectsModel.update(updateDetails.updates, {
            where: { blocked_id: currentDetails.blocked_id },
            transaction: transaction
        });
    }

    async handleSoldStatus(payload, currentDetails, transaction) {
        const updateDetails = this.calculatePaymentDetails(payload, currentDetails);

        if (updateDetails.newPendingPayment !== 0) {
            throw new Error("To change status to SOLD, remaining payment should be zero.");
        }

        await PropertyDetailsModel.update(updateDetails.updates, {
            where: { project_id: payload.project_id },
            transaction: transaction
        });

        await ProjectsModel.update({ status: "SOLD" }, {
            where: { project_id: payload.project_id },
            transaction: transaction
        });
    }

    async handlePartPaymentStatus(payload, currentDetails, transaction) {
        const updateDetails = this.calculatePaymentDetails(payload, currentDetails);

        if (currentDetails.status !== payload.status) {
            await ProjectsModel.update({ status: "PART-PAYMENT" }, {
                where: { project_id: currentDetails.project_id },
                transaction: transaction
            });
        }

        await PropertyDetailsModel.update(updateDetails.updates, {
            where: { project_id: payload.project_id },
            transaction: transaction
        });
    }

    async handleAvailableStatus(payload, transaction) {
        await ProjectsModel.update({ status: "AVAILABLE" }, {
            where: { project_id: payload.project_id },
            transaction: transaction
        });

        await PropertyDetailsModel.update({ deleted: "true" }, {
            where: { project_id: payload.project_id },
            transaction: transaction
        });
    }

    calculateBlockedDetails(payload, currentDetails) {
        const extraDays = payload.added_extra_days
        const newNoOfDaysBlocked = currentDetails.no_of_days_blocked + extraDays;
        const newRemark = payload.remark;

        return {
            updates: {
                no_of_days_blocked: newNoOfDaysBlocked,
                remark: newRemark
            },
            extraDays
        };
    }

    calculatePaymentDetails(payload, currentDetails) {
        // Assuming payload.property_price and payload.discount_percent are validated and sanitized
        const discountAmount = (payload.property_price * (payload.discount_percent || 0)) / 100;
        const priceAfterDiscount = payload.property_price - discountAmount;
        const newAmountPaidTillNow = (currentDetails.amount_paid_till_now || 0) + payload.amount;
        const newPendingPayment = priceAfterDiscount - newAmountPaidTillNow;

        let updates = {
            amount_paid_till_now: newAmountPaidTillNow,
            pending_payment: newPendingPayment,
            no_of_part_payments: (currentDetails.no_of_part_payments || 0) + 1
        };

        // Only update property_price and discount_percent if they are different from the current values
        if (currentDetails.property_price !== payload.property_price || currentDetails.discount_percent !== payload.discount_percent) {
            updates = {
                ...updates,
                property_price: payload.property_price,
                discount_percent: payload.discount_percent || 0,
            };
        }

        return {
            updates,
            newPendingPayment
        };
    }


    async getBlockedList() {
        try {
            const ReceiptsData = await ReceiptsModel.findAll({
                where: {
                    receipt_status: "A" // Assuming "A" means "Approved" or similar
                },
                include: [
                    {
                        model: Projects, // Adjust model references as needed
                        where: { status: "BLOCKED" }
                    },
                    {
                        model: PropertyDetails, // Adjust model references as needed
                        include: [
                            {
                                model: BlockedProjects,
                            }
                        ]
                    },
                    {
                        model: Users, // Adjust model references as needed
                    }
                ],
            });

            return ReceiptsData;

        } catch (err) {
            console.error("Error in getPartPaymentsList: ", err.message);
            throw new Error("An error occurred while fetching part payments list.");
        }
    }
}

module.exports = ReceiptServices;
