import {Stage} from "./Stage";
import {useEffect, useState} from "react";
import {DEFAULT_INITIAL, StageBase, InitialData, DEFAULT_MESSAGE} from "@chub-ai/stages-ts";
import { RelationshipStage } from "./RelationshipManager";

import InitData from './assets/test-init.json';

export interface TestStageRunnerProps<StageType extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType>, InitStateType, ChatStateType, MessageStateType, ConfigType> {
    factory: (data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) => StageType;
}

/**
 * Enhanced test runner with comprehensive affection system tests
 */
export const TestStageRunner = <StageType extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType>,
    InitStateType, ChatStateType, MessageStateType, ConfigType>({ factory }: TestStageRunnerProps<StageType, InitStateType, ChatStateType, MessageStateType, ConfigType>) => {

    // @ts-ignore
    const [stage, _setStage] = useState(new Stage({...DEFAULT_INITIAL, ...InitData}));
    const [node, setNode] = useState(new Date());
    const [testResults, setTestResults] = useState<string[]>([]);

    function refresh() {
        setNode(new Date());
    }

    function logTest(message: string) {
        console.info(`[TEST] ${message}`);
        setTestResults(prev => [...prev, message]);
    }

    function assert(condition: boolean, message: string) {
        if (!condition) {
            console.error(`[TEST FAILED] ${message}`);
            logTest(`❌ FAILED: ${message}`);
        } else {
            console.log(`[TEST PASSED] ${message}`);
            logTest(`✓ PASSED: ${message}`);
        }
    }

    /**
     * Test 1: Base message bonus applies to all messages
     */
    async function testBaseMessageBonus() {
        logTest("TEST 1: Base message bonus (+2) applies to neutral messages");

        const response = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "Hello, how are you?",
            isBot: false
        });

        // @ts-ignore
        const newAffection = response.messageState?.affection ?? 0;
        assert(newAffection === 2, `Neutral message should have +2 affection, got ${newAffection}`);
    }

    /**
     * Test 2: Single keyword category - compliments
     */
    async function testComplimentKeyword() {
        logTest("\nTEST 2: Compliment keyword triggers (+5) + base (+2) = +7");

        // Reset stage
        // @ts-ignore
        stage.currentMessageState = {
            affection: 0,
            relationshipStage: RelationshipStage.STRANGERS,
            stageDirections: '',
            analysisHistory: []
        };

        const response = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "You're so beautiful!",
            isBot: false
        });

        const newAffection = response.messageState?.affection ?? 0;
        assert(newAffection === 7, `Compliment should give +7 affection (5+2), got ${newAffection}`);
    }

    /**
     * Test 3: Multiple keyword categories in one message
     */
    async function testMultipleKeywords() {
        logTest("\nTEST 3: Multiple keyword matches stack (compliment +5 + vulnerability +10 + base +2 = +17)");

        // Reset stage
        // @ts-ignore
        stage.currentMessageState = {
            affection: 0,
            relationshipStage: RelationshipStage.STRANGERS,
            stageDirections: '',
            analysisHistory: []
        };

        const response = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "I'm scared to admit this, but you're amazing and I appreciate you so much.",
            isBot: false
        });

        const newAffection = response.messageState?.affection ?? 0;
        const expected = 5 + 10 + 2; // 17
        assert(newAffection === expected, `Multiple keywords should stack to ${expected}, got ${newAffection}`);
    }

    /**
     * Test 4: Rude keywords (negative delta)
     */
    async function testRudeKeywords() {
        logTest("\nTEST 4: Rude keywords apply negative delta (rude -5 + base +2 = -3)");

        // Reset to starting affection
        // @ts-ignore
        stage.currentMessageState = {
            affection: 10,
            relationshipStage: RelationshipStage.ACQUAINTANCES,
            stageDirections: '',
            analysisHistory: []
        };

        const response = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "You're stupid, shut up!",
            isBot: false
        });

        const newAffection = response.messageState?.affection ?? 0;
        const expected = 10 + (-5) + 2; // 7
        assert(newAffection === expected, `Rude message should result in ${expected} affection, got ${newAffection}`);
    }

    /**
     * Test 5: Affection is clamped to [0, 250]
     */
    async function testAffectionClamping() {
        logTest("\nTEST 5: Affection clamped between 0 and 250");

        // Test min clamp (below 0)
        // @ts-ignore
        stage.currentMessageState = {
            affection: 2,
            relationshipStage: RelationshipStage.ACQUAINTANCES,
            stageDirections: '',
            analysisHistory: []
        };

        const response1 = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "I hate you, go away!",
            isBot: false
        });

        const clampedMin = response1.messageState?.affection ?? 0;
        assert(clampedMin === 0, `Affection should clamp to 0, got ${clampedMin}`);

        // Test max clamp (above 250)
        // @ts-ignore
        stage.currentMessageState = {
            affection: 245,
            relationshipStage: RelationshipStage.ROMANCE,
            stageDirections: '',
            analysisHistory: []
        };

        const response2 = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "I love you so much, you're perfect and amazing!",
            isBot: false
        });

        const clampedMax = response2.messageState?.affection ?? 0;
        assert(clampedMax === 250, `Affection should clamp to 250, got ${clampedMax}`);
    }

    /**
     * Test 6: Stage transitions at thresholds
     */
    async function testStageTransitions() {
        logTest("\nTEST 6: Stage transitions at affection thresholds");

        const transitions = [
            { affection: 0, expectedStage: RelationshipStage.STRANGERS },
            { affection: 45, expectedStage: RelationshipStage.ACQUAINTANCES },
            { affection: 89, expectedStage: RelationshipStage.FRIENDS },
            { affection: 115, expectedStage: RelationshipStage.GOOD_FRIENDS },
            { affection: 141, expectedStage: RelationshipStage.CLOSE_FRIENDS },
            { affection: 176, expectedStage: RelationshipStage.ROMANTIC_TENSION },
            { affection: 225, expectedStage: RelationshipStage.ROMANCE }
        ];

        for (const t of transitions) {
            // @ts-ignore
            stage.currentMessageState = {
                affection: t.affection,
                relationshipStage: RelationshipStage.STRANGERS,
                stageDirections: '',
                analysisHistory: []
            };

            const response = await stage.beforePrompt({
                ...DEFAULT_MESSAGE,
                anonymizedId: "0",
                content: "Hello",
                isBot: false
            });

            const newStage = response.messageState?.relationshipStage ?? 'UNKNOWN';
            assert(newStage === t.expectedStage, `Affection ${t.affection} should be stage ${t.expectedStage}, got ${newStage}`);
        }
    }

    /**
     * Test 7: Stage directions are provided
     */
    async function testStageDirections() {
        logTest("\nTEST 7: Stage directions are provided in beforePrompt response");

        // @ts-ignore
        stage.currentMessageState = {
            affection: 50,
            relationshipStage: RelationshipStage.ACQUAINTANCES,
            stageDirections: '',
            analysisHistory: []
        };

        const response = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "How do you feel?",
            isBot: false
        });

        const directions = response.stageDirections ?? '';
        assert(
            directions.length > 0 && directions.includes("warming up"),
            `Stage directions should be provided and contain text, got: "${directions}"`
        );
    }

    /**
     * Test 8: Bot messages are skipped
     */
    async function testBotMessageSkipped() {
        logTest("\nTEST 8: Bot messages are skipped (no analysis)");

        // @ts-ignore
        stage.currentMessageState = {
            affection: 50,
            relationshipStage: RelationshipStage.ACQUAINTANCES,
            stageDirections: '',
            analysisHistory: []
        };

        const affectionBefore = 50;
        const response = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "I'm so glad we met!",
            isBot: true // Bot message
        });

        const affectionAfter = response.messageState?.affection ?? 0;
        assert(affectionAfter === affectionBefore, `Bot message should not change affection (${affectionBefore} → ${affectionAfter})`);
    }

    /**
     * Test 9: Analysis history is recorded
     */
    async function testAnalysisHistory() {
        logTest("\nTEST 9: Analysis history is recorded for debugging");

        // @ts-ignore
        stage.currentMessageState = {
            affection: 0,
            relationshipStage: RelationshipStage.STRANGERS,
            stageDirections: '',
            analysisHistory: []
        };

        await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "You're amazing!",
            isBot: false
        });

        // @ts-ignore
        const history = stage.currentMessageState.analysisHistory;
        assert(history.length === 1, `History should have 1 entry, got ${history.length}`);
        assert(history[0].totalAffectionDelta === 7, `First entry delta should be 7, got ${history[0].totalAffectionDelta}`);
    }

    /**
     * Test 10: Case insensitivity
     */
    async function testCaseInsensitivity() {
        logTest("\nTEST 10: Keywords are case-insensitive");

        // Test 1: all uppercase
        // @ts-ignore
        stage.currentMessageState = {
            affection: 0,
            relationshipStage: RelationshipStage.STRANGERS,
            stageDirections: '',
            analysisHistory: []
        };

        const response1 = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "YOU'RE BEAUTIFUL AND AMAZING!",
            isBot: false
        });

        const affection1 = response1.messageState?.affection ?? 0;

        // Test 2: normal case
        // @ts-ignore
        stage.currentMessageState = {
            affection: 0,
            relationshipStage: RelationshipStage.STRANGERS,
            stageDirections: '',
            analysisHistory: []
        };

        const response2 = await stage.beforePrompt({
            ...DEFAULT_MESSAGE,
            anonymizedId: "0",
            content: "You're beautiful and amazing!",
            isBot: false
        });

        const affection2 = response2.messageState?.affection ?? 0;

        assert(affection1 === affection2, `Case should not matter: UPPERCASE (${affection1}) vs Normal (${affection2})`);
    }

    /**
     * Test 11: Render produces valid React element
     */
    async function testRender() {
        logTest("\nTEST 11: Render produces valid output");

        try {
            const element = stage.render();
            assert(element !== null && element !== undefined, "Render should return a valid React element");
        } catch (e) {
            assert(false, `Render threw error: ${e}`);
        }
    }

    /**
     * Main test runner
     */
    async function runAllTests() {
        console.info("\n========================================");
        console.info("🧪 AFFECTION SYSTEM TEST SUITE");
        console.info("========================================\n");

        try {
            await testBaseMessageBonus();
            await testComplimentKeyword();
            await testMultipleKeywords();
            await testRudeKeywords();
            await testAffectionClamping();
            await testStageTransitions();
            await testStageDirections();
            await testBotMessageSkipped();
            await testAnalysisHistory();
            await testCaseInsensitivity();
            await testRender();

            console.info("\n========================================");
            console.info("✅ All tests completed!");
            console.info("========================================\n");
        } catch (e) {
            console.error(`Test suite error: ${e}`);
        }
    }

    useEffect(() => {
        stage.load().then((res) => {
            console.info(`[Stage Load] Success: ${res.success}`);
            if(!res.success || res.error != null) {
                console.error(`[Stage Load] Error: ${res.error}`);
            } else {
                runAllTests().then(() => {
                    refresh();
                    console.info("[Test Runner] Ready for manual testing");
                });
            }
        });
    }, []);

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            gap: '20px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            fontFamily: 'monospace',
            boxSizing: 'border-box'
        }}>
            {/* Stage Render */}
            <div style={{
                flex: 1,
                minWidth: '300px',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff'
            }}>
                {stage == null ? (
                    <div style={{ padding: '20px' }}>Stage loading...</div>
                ) : (
                    stage.render()
                )}
            </div>

            {/* Test Results */}
            <div style={{
                flex: 1,
                minWidth: '300px',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'auto',
                backgroundColor: '#fff',
                padding: '20px'
            }}>
                <h3 style={{ marginTop: 0 }}>Test Results ({testResults.length})</h3>
                {testResults.length === 0 ? (
                    <div style={{ color: '#999' }}>Running tests...</div>
                ) : (
                    <div>
                        {testResults.map((result, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '8px',
                                    marginBottom: '4px',
                                    backgroundColor: result.includes('PASSED') ? '#d1fae5' :
                                                   result.includes('FAILED') ? '#fee2e2' : '#f0f0f0',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: result.includes('PASSED') ? '#065f46' :
                                          result.includes('FAILED') ? '#7f1d1d' : '#333'
                                }}
                            >
                                {result}
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: 'none' }}>{String(node)}</div>
            </div>
        </div>
    );
}