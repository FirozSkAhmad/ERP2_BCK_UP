const express = require('express')
const ProjectsService = require('../services/projects_service');
const Constants = require('../utils/Constants/response_messages')

const router = express.Router()
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();

router.post('/createNewProject', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {

            const projectsServiceObj = new ProjectsService();
            const message = await projectsServiceObj.createNewProject(req.body)

            res.send({
                "status": 201,
                "message": message,
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a NEW PROJECT",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getProjectNames', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService()
        const data = await projectsServiceObj.getProjectNames()

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getAvailableFilteredProjectNames', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { project_type } = req.query;
        const projectsServiceObj = new ProjectsService()
        const projectNames = await projectsServiceObj.getAvailableFilteredProjectNames(project_type)
        if (!project_type) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("role_type field is missing");
        }

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            projectNames
        })
    }
    catch (err) {
        next(err);
    }
})


router.get('/getFilteredTowerNumbers', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService();
        const { project_name } = req.query
        if (!project_name) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_name.")
        }
        const towerNumbers = await projectsServiceObj.getFilteredTowerNumbers(project_name)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            towerNumbers
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getFilteredFlatNumbers', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService();
        const { project_name, tower_number } = req.query
        if (!project_name || !tower_number) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_name and tower_number.")
        }
        const flatNumbers = await projectsServiceObj.getFilteredFlatNumbers(project_name, tower_number)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            flatNumbers
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getFilteredVillaNumbers', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService();
        const { project_name } = req.query
        if (!project_name) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_name.")
        }
        const villaNumbers = await projectsServiceObj.getFilteredVillaNumbers(project_name)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            villaNumbers
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getFilteredPlotNumbers', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService();
        const { project_name } = req.query
        if (!project_name) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_name.")
        }
        const plotNumbers = await projectsServiceObj.getFilteredPlotNumbers(project_name)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            plotNumbers
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getFilteredPlotNumbersOfFLs', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService();
        const { project_name } = req.query
        if (!project_name) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_name.")
        }
        const plotNumbers = await projectsServiceObj.getFilteredPlotNumbersOfFLs(project_name)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            plotNumbers
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getSqYards', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new ProjectsService();
        const { project_name, plot_number } = req.query
        if (!project_name || !plot_number) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_name/plot_number.")
        }
        const SqYards = await projectsServiceObj.getSqYards(project_name, plot_number)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            SqYards
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getProjectsData', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const { project_type } = req.query
            if (!project_type) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_type.")
            }
            const projectsServiceObj = new ProjectsService()
            const data = await projectsServiceObj.getProjectsData(project_type.toUpperCase())
                .catch(err => {
                    console.log("Error occured", err.message);
                    throw err;
                })

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getProjectsData",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getAvailableProjectsData', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SALES PERSON" || req.aud.split(":")[1] === "CHANNEL PARTNER") {
            const { project_type } = req.query
            if (!project_type) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_type.")
            }
            const projectsServiceObj = new ProjectsService()
            const data = await projectsServiceObj.getAvailableProjectsData(project_type.toUpperCase())

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SALES PERSON and CHANNEL PARTNER has access to getAvailableProjectsData",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/status-count', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const { project_type } = req.query
            if (!project_type) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_type.")
            }
            const projectsServiceObj = new ProjectsService()
            const data = await projectsServiceObj.getStatusCount(project_type.toUpperCase())

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to status-count",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;