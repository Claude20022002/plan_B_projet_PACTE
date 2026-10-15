/**
 * GameEngine.test.js - Senior Software Engineer
 * Unit tests to verify industrial simulation logic.
 */
const gameEngine = require('../services/GameEngine');

function testSimulation() {
    console.log("--- STARTING REACTIK V2 ENGINE TESTS ---");

    // Test 1: Initial State calculation
    const initialState = { delai: 15, stock: 500, partMarche: 0 };
    const improvement = { bonusDelai: 5, bonusStock: 100 };
    
    const nextState = gameEngine.calculateImprovement(initialState, improvement.bonusDelai, improvement.bonusStock);
    
    if (nextState.delai === 10 && nextState.stock === 400) {
        console.log("✅ Test 1 Passed: Improvement calculation is correct.");
    } else {
        console.error("❌ Test 1 Failed: Expected {delai:10, stock:400}, got", nextState);
    }

    // Test 2: Floor values (No negative stocks/delays)
    const extremeState = gameEngine.calculateImprovement(nextState, 20, 1000);
    if (extremeState.delai === 1 && extremeState.stock === 0) {
        console.log("✅ Test 2 Passed: Minimum floor values enforced.");
    } else {
        console.error("❌ Test 2 Failed: Values went below floor.", extremeState);
    }

    // Test 3: Score Formula
    const scoreState = { delai: 5, stock: 200, partMarche: 20 };
    const score = gameEngine.calculateFinalScore(scoreState);
    // Formula: (20 * 1000) / (5 + 2) = 20000 / 7 = 2857
    if (score === 2857) {
        console.log("✅ Test 3 Passed: Final score calculation is accurate.");
    } else {
        console.error("❌ Test 3 Failed: Expected score 2857, got", score);
    }

    console.log("--- ENGINE TESTS COMPLETED ---");
}

testSimulation();
