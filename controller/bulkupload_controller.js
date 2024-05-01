const express = require('express');
const router = express.Router();
const JwtHelper = require('../utils/Helpers/jwt_helper');
const jwtHelperObj = new JwtHelper();
const BulkUploadService = require('../services/bulkupload_service');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to verify if the uploaded file is a CSV
function isCsvFile(file) {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const mimeType = file.mimetype;
    return fileExtension === 'csv' && mimeType === 'text/csv';
}

router.post("/bulkUpload", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => {
    try {
        const userRole = req.aud.split(":")[1];
        if (["SUPER ADMIN", "MANAGER"].includes(userRole)) {
            if (!req.file || !isCsvFile(req.file)) {
                return res.status(400).json({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
            }

            const { project_type } = req.body;
            if (!project_type) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("required project_type")
            }
            const bulkUploadServiceObj = new BulkUploadService(req.io);
            const result = await bulkUploadServiceObj.processCsvFile(req.file.buffer, project_type.toUpperCase());
            res.json(result);
        } else {
            res.status(401).json({
                "status": 401,
                "message": "Only Super Admin and Manager have access to upload the data.",
            });
        }
    } catch (err) {
        console.error("Error while uploading the projects:", err.message);
        next(err);
    }
});

module.exports = router;
