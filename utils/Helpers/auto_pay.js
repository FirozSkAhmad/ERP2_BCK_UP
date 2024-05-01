const cron = require('node-cron');
const sequelize = require('sequelize');
const { Op } = sequelize;
const PayrollModel = require('../Models/Payroll/PayrollModel');

/**
 * This function retrieves all payroll entries and then creates a new entry for each one.
 */
const autoPayroll = async () => {
    try {

        // Get the current date
        const currentDate = new Date();

        // Format the date as dd-mm-yyyy
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;

        // Retrieve all existing payroll entries
        const payrolls = await PayrollModel.findAll();

        if (payrolls.length == 0) {
            // Throw an error with a detailed message of missing fields
            console.log(`No payroll data found, to make auto pay`);
            return
        }

        // Create new payroll entries based on the existing ones
        for (const payroll of payrolls) {
            await PayrollModel.create({
                name: payroll.name,
                role_type: payroll.role_type,
                incentives: payroll.incentives,
                salary: payroll.salary,
                date_of_pay: formattedDate,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    } catch (err) {
        console.error("Error in managePayroll: ", err.message);
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            throw err;
        } else {
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }
};

/**
 * Schedules the payroll management to run on the 1st of every month at 10:00 AM.
 */
const checkAndAutoPay = () => {
    cron.schedule('0 10 1 * *', autoPayroll, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
}

module.exports = {
    checkAndAutoPay
};