const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const IndexRoute = require('./routes');
const IndexModel = require('./utils/Models')
const PluginsLoader = require('./utils/Plugins');
const { checkAndNotifyBlockedProjects } = require('./utils/Helpers/scheduler')
const { checkAndAutoPay } = require('./utils/Helpers/auto_pay')
const { roleFinder } = require('./utils/Helpers/role_finder')
const http = require('http'); // Import the HTTP module
const socketIO = require('socket.io'); // Import socket.io

// const activeSessions = {};
// const socketToUserMap = {}; // Mapping to keep track of which socket belongs to which user

class App {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app); // Create an HTTP server
        // Configure Socket.io with CORS
        this.io = socketIO(this.server, {
            cors: {
                origin: '*', // Allow all origins
                methods: ["GET", "POST"], // Allow only these methods for CORS
                allowedHeaders: ["my-custom-header"], // Customize allowed headers
                credentials: true // Allow cookies to be sent from the client
            }
        });
    }

    async StarterFunction() {
        try {
            // Load PLUGINS
            await new PluginsLoader().loadPlugins()
            console.log("PLUGINS loaded")

            // Load MySQL Models
            await new IndexModel().loadModels()
            console.log("MODELS loaded")

            this.app.use(cors({
                origin: '*'
            }))
            this.app.use(bodyParser.json());
            this.app.use(bodyParser.urlencoded({ extended: true }));
            // Inside your App class, add a middleware to attach io to req

            this.app.use((req, res, next) => {
                req.io = this.io;
                next();
            });

            //default route
            this.app.get("/welcome", async (req, res, next) => {
                res.send({
                    "status": 200,
                    "message": "Hi Started Successfully"
                })
            })

            // Use Routes after connection
            await new IndexRoute(this.app, this.io).initialize()

            // Handling Undefined route
            this.app.use(async (req, res, next) => {
                next(DATA.PLUGINS.httperrors.NotFound("URL not found. Please enter valid URL"))
            })

            // Error Handler
            this.app.use((err, req, res, next) => {
                res.status(err.status || 500)
                res.send({
                    "status": err.status || 500,
                    "message": err.message
                })
            })

            // Socket.io events
            this.io.on('connection', (socket) => {
                console.log('A user connected: ' + socket.id);

                // Emit a 'welcome' event to the connected client
                socket.emit('welcome', { message: 'Hi! Welcome to the socket connection!' });


                socket.on('disconnect', () => {
                    console.log('User disconnected: ' + socket.id);
                });

                // You can define more events here
            });



            // Socket.io events
            // this.io.on('connection', (socket) => {
            //     socket.on('login', async ({ email_id, password }) => {
            //         const userKey = email_id; // Use email as the unique key
            //         if (activeSessions[userKey]) {
            //             const { user_name, role_type } = activeSessions[userKey]; // Retrieve the stored user name and role type
            //             socket.emit('login_error', `${user_name}(${role_type}) already logged in.`);
            //             console.log(`${user_name}(${role_type}) already logged in.`);
            //         } else {
            //             try {
            //                 const { user_name, role_type } = await roleFinder(email_id);
            //                 activeSessions[userKey] = { socket_id: socket.id, user_name, role_type }; // Store user details along with socket id
            //                 socketToUserMap[socket.id] = { user_name, role_type, email_id };
            //                 socket.emit('login_success', `${user_name}(${role_type}) logged in successfully.`);
            //                 console.log(`${user_name}(${role_type}) connected`);
            //             } catch (error) {
            //                 socket.emit('login_error', error.message); // Emit an error message to the client
            //                 console.log(`Login error for ${email_id}: ${error.message}`);
            //             }
            //         }
            //     });

            //     socket.on('disconnect', () => {
            //         const userInfo = socketToUserMap[socket.id];
            //         if (userInfo) {
            //             const { user_name, role_type, email_id } = userInfo;
            //             // Use email_id as the key since that's what we use in activeSessions
            //             const userKey = email_id;
            //             // Check if the disconnecting socket is the one in the activeSessions
            //             if (activeSessions[userKey] && activeSessions[userKey].socket_id === socket.id) {
            //                 // Remove the user from both activeSessions and socketToUserMap
            //                 delete activeSessions[userKey];
            //                 delete socketToUserMap[socket.id];
            //                 console.log(`${user_name}(${role_type}) disconnected`);
            //             }
            //         }
            //     });
            // });


            // Initialize and start cron jobs
            checkAndNotifyBlockedProjects();
            console.log("Scheduled tasks are set up and running.");

            // checkAndAutoPay()
            // console.log("Auto Payroll are set up and running.");

        } catch (error) {
            console.error("An error occurred during app initialization:", error);
        }
    }

    async listen() {
        this.server.listen(4200, (err) => {
            if (err) {
                console.log("Error while running the server", err);
            }
            else {
                console.log("Server running on port 4200");
            }
        });
    }
}

module.exports = App;