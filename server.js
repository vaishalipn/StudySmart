const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Groq = require("groq-sdk");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage()
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


/* =====================================================
   STUDY PLANNER
===================================================== */

app.post(
    "/generate-plan",
    upload.single("pdf"),
    async (req, res) => {

        console.log("\n🔥 GENERATE PLAN REQUEST RECEIVED");

        try {

            const className = req.body.className;
            const subject = req.body.subject;
            const topic = req.body.topic;
            const hours = req.body.hours;
            const days = req.body.days;

            console.log("📋 FORM DATA:", {
                className,
                subject,
                topic,
                hours,
                days
            });

            const prompt = `
Create a detailed study plan.

Class: ${className}
Subject: ${subject}
Topic: ${topic}
Study Hours Per Day: ${hours}
Duration: ${days} days

Requirements:
- Use Day-wise format.
- Mention daily goals.
- Include revision sessions.
- Make it practical and easy to follow.
- Divide study time realistically.
- Include breaks where appropriate.
- Keep the plan clear and easy to understand.
`;

            console.log("🚀 Sending request to Groq...");

            const completion =
                await groq.chat.completions.create({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });

            console.log("✅ Groq response received");

            const plan =
                completion.choices?.[0]?.message?.content;

            if (!plan) {
                throw new Error("Groq returned an empty response.");
            }

            console.log("✅ Study plan generated successfully");

            res.json({
                plan: plan
            });

        } catch (error) {

            console.error("\n========== PLANNER ERROR ==========");
            console.error("Message:", error.message);
            console.error("Status:", error.status);
            console.error("Code:", error.code);
            console.error("Type:", error.type);
            console.error("Full Error:", error);
            console.error("===================================\n");

            res.status(500).json({
                error: error.message || "Failed to generate plan."
            });
        }
    }
);


/* =====================================================
   AI NOTES
===================================================== */

app.post(
    "/generate-notes",
    upload.single("pdf"),
    async (req, res) => {

        console.log("\n🔥 GENERATE NOTES REQUEST RECEIVED");

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Please upload a PDF."
                });
            }

            console.log("📄 PDF received:", req.file.originalname);

            const pdfData =
                await pdfParse(req.file.buffer);

            let pdfText = pdfData.text;

            if (pdfText.length > 6000) {
                pdfText = pdfText.substring(0, 6000);
            }

            const prompt = `
Generate professional study notes from the following content.

${pdfText}

Requirements:
- Use headings.
- Use bullet points.
- Highlight important concepts.
- Make notes exam-oriented.
- Keep the explanation clear and easy to understand.
`;

            console.log("🚀 Sending notes request to Groq...");

            const completion =
                await groq.chat.completions.create({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });

            console.log("✅ Groq notes response received");

            const notes =
                completion.choices?.[0]?.message?.content;

            if (!notes) {
                throw new Error("Groq returned an empty response.");
            }

            res.json({
                notes: notes
            });

        } catch (error) {

            console.error("\n========== NOTES ERROR ==========");
            console.error("Message:", error.message);
            console.error("Status:", error.status);
            console.error("Code:", error.code);
            console.error("Type:", error.type);
            console.error("Full Error:", error);
            console.error("=================================\n");

            res.status(500).json({
                error: error.message || "Failed to generate notes."
            });
        }
    }
);


/* =====================================================
   QUIZ GENERATOR
===================================================== */

app.post(
    "/generate-quiz",
    upload.single("pdf"),
    async (req, res) => {

        console.log("\n🔥 GENERATE QUIZ REQUEST RECEIVED");

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Please upload a PDF."
                });
            }

            const numQuestions =
                req.body.numQuestions || 10;

            const difficulty =
                req.body.difficulty || "Medium";

            console.log("📄 PDF received:", req.file.originalname);
            console.log("📝 Number of questions:", numQuestions);
            console.log("🎯 Difficulty:", difficulty);

            const pdfData =
                await pdfParse(req.file.buffer);

            let pdfText = pdfData.text;

            if (pdfText.length > 5000) {
                pdfText = pdfText.substring(0, 5000);
            }

            const prompt = `
Generate ${numQuestions} MCQs from the study material.

Difficulty: ${difficulty}

Study Material:
${pdfText}

Return ONLY valid JSON.

Format:

[
 {
   "question":"What is AI?",
   "options":[
      "Option A",
      "Option B",
      "Option C",
      "Option D"
   ],
   "answer":"Option B",
   "explanation":"Reason why Option B is correct"
 }
]

Rules:
- Generate exactly ${numQuestions} questions.
- 4 options per question.
- One correct answer.
- Explanation for every answer.
- Return JSON only.
`;

            console.log("🚀 Sending quiz request to Groq...");

            const completion =
                await groq.chat.completions.create({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });

            console.log("✅ Groq quiz response received");

            const quiz =
                completion.choices?.[0]?.message?.content;

            if (!quiz) {
                throw new Error("Groq returned an empty response.");
            }

            res.json({
                quiz: quiz
            });

        } catch (error) {

            console.error("\n========== QUIZ ERROR ==========");
            console.error("Message:", error.message);
            console.error("Status:", error.status);
            console.error("Code:", error.code);
            console.error("Type:", error.type);
            console.error("Full Error:", error);
            console.error("================================\n");

            res.status(500).json({
                error: error.message || "Failed to generate quiz."
            });
        }
    }
);


/* =====================================================
   TEST ROUTE
===================================================== */

app.get("/", (req, res) => {
    res.send("🚀 StudySmart backend is running!");
});


/* =====================================================
   START SERVER
===================================================== */

app.listen(3001, () => {
    console.log("========================================");
    console.log("🚀 StudySmart Server Started");
    console.log("🌐 http://localhost:3001");
    console.log("========================================");
});