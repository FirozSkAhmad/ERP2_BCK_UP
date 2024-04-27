const cron = require('node-cron');
const sequelize = require('sequelize');
const { Op } = sequelize;
const ReceiptsModel = require('../Models/Receipts/ReceiptsModel');
const ProjectsModel = require('../Models/Projects/ProjectsModel');  // Ensure this path is correct
const PropertyDetailsModel = require('../Models/PropertyDetails/PropertyDetailsModel');  // Ensure this path is correct
const BlockedProjectsModel = require('../Models/BlockedProjects/BlockedProjectsModel');  // Ensure this path is correct
// const sendEmail = require('../path/to/your/mailingFunction');  // Path to your mailing function

const calculateDaysLeft = (dateOfBlocked, noOfDaysBlocked) => {
    const endDate = new Date(dateOfBlocked);
    endDate.setDate(endDate.getDate() + parseInt(noOfDaysBlocked));
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(dateOfBlocked, noOfDaysBlocked)
    return diffDays;
};

const checkAndNotifyBlockedProjects = () => {
    // Cron job scheduled to run at 10:00 AM every day (India Time)
    cron.schedule('0 10 * * *', async () => {
        try {
            const attributes = {
                where: { receipt_status: "A" }, // Assuming "A" means "Approved"
                attributes: ['receipt_id', 'client_name'],
                include: [
                    {
                        model: ProjectsModel, // Adjust model references as needed
                        where: { status: 'BLOCK' },
                        attributes: ['project_id', 'project_name', 'project_type'],
                    }, {
                        model: PropertyDetailsModel, // Adjust model references as needed
                        include: [{
                            model: BlockedProjectsModel,
                            attributes: ['date_of_blocked', 'no_of_days_blocked'],
                        }],
                    }
                ],
            };
            
            const receipts = await ReceiptsModel.findAll(attributes);

            receipts.forEach(receipt => {
                const plainReceipt = receipt.get({ plain: true }); // Convert each receipt to a plain object
                // console.log(JSON.stringify(plainReceipt, null, 2)); // This will log the receipt in a JSON-like structure
                const daysLeft = calculateDaysLeft(plainReceipt.PropertyDetail.BlockedProject.date_of_blocked, plainReceipt.PropertyDetail.BlockedProject.no_of_days_blocked);
                if (daysLeft < 5) {
                    const message = `Alert: Only ${daysLeft} days left for receipt: ${receipt.receipt_id}.`;
                    console.log(message);
                    // await sendEmail(receipt.client_email, message);  // Using client's email from data
                }
            });
        } catch (error) {
            console.error('Error processing daily blocked projects checks:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
};

module.exports = {
    checkAndNotifyBlockedProjects
};
