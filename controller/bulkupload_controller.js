const express = require('express')
const router = express.Router()
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const BulkUploadService = require('../services/bulkupload_service')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/bulkUpload", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            try {
                if (!req.file || !isCsvFile(req.file)) {
                    return res.status(400).send({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
                }

                const { project_type } = req.body

                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processCsvFile(req.file.buffer, project_type);
                res.send(result)
            }
            catch (err) {
                next(err);
            }
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin AND Manager has access to upload the data",
            })
        }
    }
    catch (err) {
        console.log("error while uploading the projects", err);
        next(err);
    }
})

module.exports = router;