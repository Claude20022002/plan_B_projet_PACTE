/**
 * game.controller.js - Senior Software Engineer
 * Manages HTTP requests for Reactik simulation.
 */
const SimulationService = require('../services/SimulationService');

exports.getGameState = async (req, res) => {
    try {
        const { equipeId } = req.params;
        const state = await SimulationService.getCurrentState(equipeId);
        res.status(200).json(state);
    } catch (err) {
        res.status(404).json({ error: "Game state not found." });
    }
};

exports.submitAction = async (req, res) => {
    try {
        const { equipeId, userId, type, payload, version } = req.body;
        const result = await SimulationService.processAction(equipeId, userId, type, payload, version);
        res.status(200).json(result);
    } catch (err) {
        if (err.message === 'CONCURRENCY_ERROR') {
            return res.status(409).json({ error: "Conflict: Data modified by teammate." });
        }
        res.status(500).json({ error: err.message });
    }
};
