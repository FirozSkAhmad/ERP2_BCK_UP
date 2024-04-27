const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const IndexRoute = require('./routes');
const IndexModel = require('./utils/Models')
const PluginsLoader = require('./utils/Plugins');
const { checkAndNotifyBlockedProjects } = require('./utils/Helpers/scheduler')
const http = require('http'); // Import the HTTP module
const socketIO = require('socket.io'); // Import socket.io

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
                console.log('A user connected');

                // Emit a 'welcome' event to the connected client
                socket.emit('welcome', { message: 'Hi! Welcome to the socket connection!' });


                socket.on('disconnect', () => {
                    console.log('User disconnected');
                });

                // You can define more events here
            });

            // Initialize and start cron jobs
            checkAndNotifyBlockedProjects();
            console.log("Scheduled tasks are set up and running.");
            
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