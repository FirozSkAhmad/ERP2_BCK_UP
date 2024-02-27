const fs = require('fs');
const path = require('path');

class MySqlModels {
    constructor() {
        this.models = {}; // Use a property instead of the global object
    }

    async loadModels() {
        try {
            console.log(`Loading models from directory: ${__dirname}`);
            const modelDirectories = await fs.promises.readdir(__dirname);

            for (const directory of modelDirectories) {
                const directoryPath = path.join(__dirname, directory);
                const stat = await fs.promises.stat(directoryPath);

                console.log(`Processing directory: ${directoryPath}`);
                if (stat.isDirectory()) {
                    const files = await fs.promises.readdir(directoryPath);

                    for (const file of files) {
                        console.log(`Found file: ${file}`);
                        if (file.endsWith('.js')) {
                            const modelPath = path.join(directoryPath, file);
                            console.log(`Loading model from file: ${modelPath}`);
                            const model = require(modelPath);
                            if (model && model.name) {
                                console.log('Model loaded:', model.name);
                                this.models[model.name] = model;
                                // await this.models[modelName].sync();
                            } else {
                                console.log(`File ${file} does not export a valid model.`);
                            }
                        }
                    }
                }
            }

            console.log("Loaded models:", Object.keys(this.models));
            if (this.models['receipts'] && this.models['PropertyDetails'] && this.models['commissions'] && this.models['ApartmentProjects'] && this.models['VillaProjects'] && this.models['PoltProjects'] && this.models['FarmLandProjects'] && this.models['TokenOrAdvanceHistories'] && this.models['BlockedProjects']) {
                await this.defineRelationships();
                await this.syncModels();
            } else {
                console.error("Required models not loaded. Cannot define relationships.");
            }

        } catch (err) {
            console.error('Error loading models:', err);
        }
    }

    async defineRelationships() {
        try {
            const { receipts, projects, PropertyDetails, commissions, TokenOrAdvanceHistories, BlockedProjects, users } = this.models;

            if (!receipts || !PropertyDetails || !commissions ||
                !projects || !TokenOrAdvanceHistories || !BlockedProjects || !users) {
                throw new Error("Models not found");
            }

            PropertyDetails.belongsTo(receipts, { foreignKey: 'project_id' });
            projects.belongsTo(receipts, { foreignKey: 'project_id' });
            // projects.belongsTo(PropertyDetails, { foreignKey: 'project_id' });
            TokenOrAdvanceHistories.belongsTo(PropertyDetails, { foreignKey: 'ta_history_id' });
            BlockedProjects.belongsTo(PropertyDetails, { foreignKey: 'blocked_id' });
            users.belongsTo(receipts, { foreignKey: 'commission_holder_id' });
            commissions.belongsTo(receipts, { foreignKey: 'commission_id' });

            console.log("Relationships defined successfully");
        } catch (error) {
            console.error("Error defining relationships:", error);
        }
    }

    async syncModels() {
        try {
            // Sync all models
            for (const modelName in this.models) {
                await this.models[modelName].sync();
            }
            console.log("All models synced successfully");
        } catch (error) {
            console.error("Error syncing models:", error);
        }
    }
}

module.exports = MySqlModels;
