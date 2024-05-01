// const cron = require('node-cron');
// const sequelize = require('sequelize');
// const { Op } = sequelize;
// const ReceiptsModel = require('../Models/Receipts/ReceiptsModel');
// const ProjectsModel = require('../Models/Projects/ProjectsModel');  // Ensure this path is correct
// const PropertyDetailsModel = require('../Models/PropertyDetails/PropertyDetailsModel');  // Ensure this path is correct
// const BlockedProjectsModel = require('../Models/BlockedProjects/BlockedProjectsModel');  // Ensure this path is correct
// // const sendEmail = require('../path/to/your/mailingFunction');  // Path to your mailing function

// const calculateDaysLeft = (dateOfBlocked, noOfDaysBlocked) => {
//     const endDate = new Date(dateOfBlocked);
//     endDate.setDate(endDate.getDate() + parseInt(noOfDaysBlocked));
//     const today = new Date();
//     const diffTime = endDate - today;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     console.log(dateOfBlocked, noOfDaysBlocked)
//     return diffDays;
// };

// const checkAndNotifyBlockedProjects = () => {
//     // Cron job scheduled to run at 10:00 AM every day (India Time)
//     cron.schedule('0 10 * * *', async () => {
//         try {
//             const attributes = {
//                 where: { receipt_status: "A" }, // Assuming "A" means "Approved"
//                 attributes: ['receipt_id', 'client_name'],
//                 include: [
//                     {
//                         model: ProjectsModel, // Adjust model references as needed
//                         where: { status: 'BLOCK' },
//                         attributes: ['project_id', 'project_name', 'project_type'],
//                     }, {
//                         model: PropertyDetailsModel, // Adjust model references as needed
//                         include: [{
//                             model: BlockedProjectsModel,
//                             attributes: ['date_of_blocked', 'no_of_days_blocked'],
//                         }],
//                     }
//                 ],
//             };

//             const receipts = await ReceiptsModel.findAll(attributes);

//             receipts.forEach(receipt => {
//                 const plainReceipt = receipt.get({ plain: true }); // Convert each receipt to a plain object
//                 // console.log(JSON.stringify(plainReceipt, null, 2)); // This will log the receipt in a JSON-like structure
//                 const daysLeft = calculateDaysLeft(plainReceipt.PropertyDetail.BlockedProject.date_of_blocked, plainReceipt.PropertyDetail.BlockedProject.no_of_days_blocked);
//                 if (daysLeft < 5) {
//                     const message = `Alert: Only ${daysLeft} days left for receipt: ${receipt.receipt_id}.`;
//                     console.log(message);
//                     // await sendEmail(receipt.client_email, message);  // Using client's email from data
//                 }
//             });
//         } catch (error) {
//             console.error('Error processing daily blocked projects checks:', error);
//         }
//     }, {
//         scheduled: true,
//         timezone: "Asia/Kolkata"
//     });
// };

// module.exports = {
//     checkAndNotifyBlockedProjects
// };


const cron = require('node-cron');
const sequelize = require('sequelize');
const nodemailer = require('nodemailer');
const { Readable } = require('stream');
const { createObjectCsvStringifier } = require('csv-writer');
const ReceiptsModel = require('../Models/Receipts/ReceiptsModel');
const ProjectsModel = require('../Models/Projects/ProjectsModel');
const PropertyDetailsModel = require('../Models/PropertyDetails/PropertyDetailsModel');
const BlockedProjectsModel = require('../Models/BlockedProjects/BlockedProjectsModel');
const UsersModel = require('../Models/Users/UsersModel');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER_EMAIL_ID,
        pass: process.env.SENDER_PASSWORD
    }
});

// Function to convert a string to a readable stream
const stringToStream = (string) => {
    const stream = new Readable();
    stream.push(string);
    stream.push(null); // Indicates end of the stream
    return stream;
};

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.SENDER_EMAIL_ID,
        to: to,
        subject: subject,
        text: text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}: ${error}`);
    }
};

const sendEmailWithCsvAttachment = async (to, records) => {
    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'receiptId', title: 'Receipt ID' },
            { id: 'clientName', title: 'Client Name' },
            { id: 'clientPhone', title: 'Client Phone' },
            { id: 'clientEmail', title: 'Client Email' },
            { id: 'projectId', title: 'Project ID' },
            { id: 'projectName', title: 'Project Name' },
            { id: 'projectType', title: 'Project Type' },
            { id: 'dateOfBlocked', title: 'Date of Blocked' },
            { id: 'noOfDaysBlocked', title: 'No of Days Blocked' },
            { id: 'noOfDaysLeft', title: 'No of Days Left' },
        ]
    });

    let csvContent = csvStringifier.getHeaderString();
    csvContent += csvStringifier.stringifyRecords(records);

    const csvStream = stringToStream(csvContent);

    const mailOptions = {
        from: process.env.SENDER_EMAIL_ID,
        to: to,
        subject: 'Report on Blocked Projects',
        text: 'Please find attached the latest report on blocked projects.',
        attachments: [{
            filename: 'BlockedProjectsReport.csv',
            content: csvStream
        }]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email with CSV attachment sent successfully to ${to}`);
    } catch (error) {
        console.error(`Failed to send email with CSV attachment to ${to}: ${error}`);
    }
};

const calculateDaysLeft = (dateOfBlocked, noOfDaysBlocked) => {
    const endDate = new Date(dateOfBlocked);
    endDate.setDate(endDate.getDate() + parseInt(noOfDaysBlocked));
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const checkAndNotifyBlockedProjects = () => {
    cron.schedule('31 11 * * *', async () => {
        try {
            const attributes = {
                where: { receipt_status: "A" }, // Assuming "A" means "Approved"
                attributes: ['receipt_id', 'client_name', 'client_phn_no', 'client_emailId'],
                include: [
                    {
                        model: ProjectsModel,
                        where: { status: 'BLOCK' },
                        attributes: ['project_id', 'project_name', 'project_type'],
                    }, {
                        model: PropertyDetailsModel,
                        include: [{
                            model: BlockedProjectsModel,
                            attributes: ['date_of_blocked', 'no_of_days_blocked'],
                        }],
                    }
                ],
            };

            const receipts = await ReceiptsModel.findAll(attributes);
            const filteredReceipts = [];

            for (const receipt of receipts) {
                const plainReceipt = receipt.get({ plain: true });
                const daysLeft = calculateDaysLeft(plainReceipt.PropertyDetail.BlockedProject.date_of_blocked, plainReceipt.PropertyDetail.BlockedProject.no_of_days_blocked);

                if (daysLeft < 5) {
                    const message = `Alert: Only ${daysLeft} days left for receipt: ${receipt.receipt_id}.`;
                    console.log(message);
                    await sendEmail(receipt.client_emailId, 'Urgent: Project Expiry Notice', message);
                    filteredReceipts.push({
                        receiptId: plainReceipt.receipt_id,
                        clientName: plainReceipt.client_name,
                        clientPhone: plainReceipt.client_phn_no,
                        clientEmail: plainReceipt.client_emailId,
                        projectId: plainReceipt.project.project_id,
                        projectName: plainReceipt.project.project_name,
                        projectType: plainReceipt.project.project_type,
                        dateOfBlocked: plainReceipt.PropertyDetail.BlockedProject.date_of_blocked,
                        noOfDaysBlocked: plainReceipt.PropertyDetail.BlockedProject.no_of_days_blocked,
                        noOfDaysLeft: daysLeft
                    });
                }
            }

            if (filteredReceipts.length > 0) {
                const superAdmins = await UsersModel.findAll({
                    where: { role_type: 'SUPER ADMIN' },
                    attributes: ['email_id']
                });

                for (const admin of superAdmins) {
                    await sendEmailWithCsvAttachment(admin.email_id, filteredReceipts);
                }
            }
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


