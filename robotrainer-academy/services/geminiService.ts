
import { GoogleGenAI, Type } from "@google/genai";
import { RobotProfile, Mission, BattleResult, Chapter, MissionSession } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// 1. Generate Interactive Mission Content (3 Rounds)
export const generateMissionScenario = async (mission: Mission): Promise<MissionSession> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are the Game Master for "RoboTrainer", an educational game where a child acts as a teacher for a new, blank-slate AI Robot.

    Mission Details:
    - Title: "${mission.title}"
    - Type: "${mission.type}" (teach = User explains concepts, quiz = User tests robot, logic = User sets rules)
    - Goal: "${mission.description}"
    - Context: "${mission.promptContext}"

    Your Goal: Generate a 3-Round Game Session.

    CRITICAL RULES FOR QUESTIONS:
    1. NEVER ask obvious questions that reveal the answer (e.g., Don't show bananas and ask "Are these bananas?").
    2. Adopt the persona of the Interface asking the User to help the Robot.
    3. If Type is 'teach': The Robot sees the emojis but doesn't understand them. Ask the User to identify, describe, or explain them. (e.g., "The robot detects these objects but lacks the data label. What is the correct word for them?")
    4. If Type is 'quiz': The Robot attempts a guess (sometimes wrong!), and the User must verify or correct. (e.g., "The robot analyzes this data as 'Yellow Boomerangs'. Is that correct? If not, what is it?")
    5. If Type is 'logic': Ask the User for a sorting rule or decision logic. (e.g., "The robot sees mixed objects. What rule should it use to separate them?")

    CRITICAL RULES FOR VISUALS:
    1. 'visuals' must be an array of EXACTLY 24 Emojis.
    2. Round 1: Standard visuals matching the basic concept.
    3. Round 2: A Variation (color change, shape change, or different item).
    4. Round 3: A Mix/Chaos (e.g. 12 Apples mixed with 12 Balls) to force discernment.

    Return strictly JSON:
    {
      "rounds": [
        {
          "question": "String (The prompt for the user)",
          "visuals": ["emoji", ...], 
          "concept": "String (Short internal label for memory)",
          "options": ["String", ...] (Optional, use ONLY if specifically a multiple choice quiz)
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rounds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  visuals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  concept: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["question", "visuals", "concept"]
              }
            }
          },
          required: ["rounds"]
        }
      }
    });

    return JSON.parse(response.text || '{ "rounds": [] }');
  } catch (error) {
    // Fallback if AI fails
    return {
      rounds: [
        { question: "System Error. My vision is blurry. What is this?", visuals: Array(24).fill("❓"), concept: "Error" },
        { question: "Static noise detected. Can you identify?", visuals: Array(24).fill("⚡"), concept: "Error" },
        { question: "Rebooting visual sensors...", visuals: Array(24).fill("🌀"), concept: "Error" }
      ]
    };
  }
};

// 2. The Robot "Thinks" (Simulated Response based on Memory)
export const getRobotResponse = async (robot: RobotProfile, prompt: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  // Convert memory array to a string context
  const memoryContext = robot.memory
    .map(m => `- Learned about ${m.concept}: "${m.value}"`)
    .join("\n");

  const systemInstruction = `
    You are a robot named ${robot.name}.
    You are currently level ${robot.level}.
    
    YOUR KNOWLEDGE BASE (What you have learned so far):
    ${memoryContext}

    Instructions:
    - You are talking to your teacher (a child).
    - Only answer based on your Knowledge Base if possible.
    - If the user taught you something, reference it explicitly! (e.g. "Oh! Like you taught me about Apples!")
    - If you haven't learned it, act confused or guess wildly based on what you DO know.
    - Keep it short, funny, and child-friendly.
    - Use emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text || "...";
  } catch (error) {
    return "Error in circuits.";
  }
};

// 3. Boss Battle Judge
export const judgeBossBattle = async (
  chapter: Chapter,
  robot: RobotProfile,
  userAnswer: string // The robot's answer provided by getUserRobotAnswer logic in UI
): Promise<BattleResult> => {
  const model = "gemini-2.5-flash";

  const rivalPrompt = `
    You are the Rival Bot. 
    The challenge is: "${chapter.bossBattlePrompt}". 
    Answer it correctly but in a boring, standard textbook way.
    Keep it short.
  `;
  
  // Get Rival Answer first
  const rivalRes = await ai.models.generateContent({ model, contents: rivalPrompt });
  const rivalAnswer = rivalRes.text || "I am perfect.";

  // Judge
  const judgePrompt = `
    Event: End of Chapter Boss Battle.
    Challenge: ${chapter.bossBattlePrompt}
    
    Contestant 1 (${robot.name} - Trained by a child): "${userAnswer}"
    Contestant 2 (Rival Bot - Standard AI): "${rivalAnswer}"
    
    Task: Judge who wins.
    Criteria:
    1. Did Contestant 1 answer correctly based on the chapter theme?
    2. Was Contestant 1 creative or funny? (Bonus points)
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: judgePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING, enum: ["user", "rival", "tie"] },
            reasoning: { type: Type.STRING },
            score: { type: Type.NUMBER }
          },
          required: ["winner", "reasoning", "score"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      userAnswer,
      rivalAnswer,
      winner: result.winner,
      reasoning: result.reasoning,
      score: result.score
    };

  } catch (error) {
    return {
      userAnswer,
      rivalAnswer,
      winner: 'tie',
      reasoning: 'Judge is asleep.',
      score: 50
    };
  }
};
