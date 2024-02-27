const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const sendgrid = require('@sendgrid/mail')
const UsersModel = require('../models/User')
const { Op } = require('sequelize');

class UserService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async createUser(userdetails) {
        try {
            // If present in the users table: email already exists
            const checkInUsers = await UsersModel.findOne({
                where: {
                    emailId: userdetails.emailId,
                    status: {
                        [Op.or]: ['NV', 'A'] // Match status 'NV' or 'A'
                    }
                }
            }).catch(err => {
                console.log("Error during checking user", err.message)
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            });

            if (checkInUsers) {
                if (checkInUsers.status === "NV") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Given EmailId Already Register, But Might Not Approved Yet !")
                }
                else if (checkInUsers.status === "A") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("USER ALREADY IN USE WITH GIVEN EMAIL ID")

                }
            }

            // User Id not present
            const password = userdetails.password;
            const confirmpassword = userdetails.confirmpassword;

            if (password !== confirmpassword) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("PASSWORDS DOES NOT MATCH")
            }

            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey)

            const userPayload = {
                user_name: userdetails.user_name,
                emailId: userdetails.emailId,
                password: hashedPassword,
                role_type: userdetails.type.toUpperCase(),
                status: "NV",
                address: userdetails.address ? userdetails.address : null,
                contact_no: userdetails.contact_no ? userdetails.contact_no : null,
                pancard_no: userdetails.pancard_no ? userdetails.pancard_no : null,
                bank_ac_no: userdetails.bank_ac_no ? userdetails.bank_ac_no : null,
                bussiness_experience: userdetails.bussiness_experience ? userdetails.bussiness_experience : null
            }

            const newUser = await UsersModel.create(userPayload).catch(err => {
                console.log("Error while adding in user table", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });

            return newUser;
        }
        catch (err) {
            throw err;
        }
    }

    async loginUser(userDetails) {
        try {
            const user = await UsersModel.findOne({
                "where": {
                    emailId: userDetails.emailId
                }
            }).catch(err => {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            if (user) {
                if (user.status === "NV") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Given EmailId Not Approved Yet!")
                }
                else if (user.status === "R") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("logIn Access For Given EmailId DENIED By SUPER ADMIN")

                }
            }

            const userPassword = user.password;

            const isValid = await global.DATA.PLUGINS.bcrypt.compare(userDetails.password, userPassword);
            if (!isValid) {
                throw new global.DATA.PLUGINS.httperrors.Unauthorized("InCorrect Password")
            }

            // Valid email and password
            const tokenPayload = user.id.toString() + ":" + user.role_type

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            const refreshToken = await this.jwtObject.generateRefreshToken(tokenPayload);

            const data = {
                accessToken, refreshToken, "id": user.id, "email": user.emailId, role_type: user.role_type
            }
            return data

        }
        catch (err) {
            throw err;
        }
    }

    sendLinkToEmail(name, emailId, Link) {
        return new Promise((resolve, reject) => {
            const messageBody = {
                to: emailId,
                from: process.env.EMAIL_SENDER,
                subject: "Password Reset Request",
                html: `
                <html>
                    <head>
                        <style>
                            .button {
                                background-color: #4CAF50; /* Green */
                                border: none;
                                color: white;
                                padding: 10px 20px;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 16px;
                            }
                        </style>
                    <head>
                    <body>
                        <h2> Hello ${name}. Welcome to VRC Application </h2>
                        <p>You recently requested to reset your password for your VRC account. Use the below button to reset it. <span>
                        <b>This password reset link is only valid for the next 15 minutes.</b>
                        </span></p>
                        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.
                        </p>

                        <p>
                            <a href = ${Link}> <button class = "button" > RESET YOUR PASSWORD </button> </a>
                        </p>    
                        <p>
                            Thanks, <br>
                            FINDEMY Team
                        </p>
                    </body>
                </html>
                `
            }
            sendgrid.setApiKey(process.env.EMAIL_API_KEY);
            sendgrid.send(messageBody).then(message => {
                console.log("Email Sent to the Mail");
                resolve("EMAIL SENT")
            }).catch(err => {
                console.log("Eror occured during email sending", err.message);
                reject("EMAIL NOT SENT")
            })
        })
    }

    async sendPasswordResetRequest(emailid) {
        try {

            if (!emailid) {
                return "EMAIL CANNOT BE EMPTY"
            }

            // check user exists or not
            const user = await global.DATA.MODELS.users.findOne({
                "where": {
                    emailId: emailid
                }
            }).catch(err => {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            if (!user) {
                throw new global.DATA.PLUGINS.httperrors.NotFound("User Not Registered")
            }

            // Valid email and password
            const tokenPayload = user.id.toString();

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            const Link = `${process.env.RESET_BASE_URL}/${accessToken}`
            console.log(Link);

            const response = await this.sendLinkToEmail(user.name, emailid, Link);
            return response;
        }
        catch (err) {
            throw err;
        }
    }

    async changePassword(token, password) {
        try {
            let userId = null;
            await global.DATA.PLUGINS.jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRETKEY, (err, decoded) => {
                if (err) {
                    return "INVALID LINK/LINK EXPIRED"
                } else {
                    // Access the decoded data
                    console.log('Decoded JWT data:', decoded);
                    userId = decoded.aud;
                    console.log('User ID:', userId);
                }
            });
            const newPassword = password;
            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(newPassword, randomkey)

            await global.DATA.MODELS.users.update({
                password: hashedPassword
            }, {
                where: {
                    id: userId
                }
            }).catch(err => {
                console.log("Error while updating the password", err.message);
                throw err;
            })

            return "Password Updated Successfully"

        }
        catch (err) {
            throw err;
        }
    }
}
module.exports = UserService;