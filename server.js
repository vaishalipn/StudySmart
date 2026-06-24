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

/* ===========================
   STUDY PLANNER
=========================== */

app.post(
    "/generate-plan",
    upload.single("pdf"),
    async (req, res) => {

        try {

            const className = req.body.className;
            const subject = req.body.subject;
            const topic = req.body.topic;
            const hours = req.body.hours;
            const days = req.body.days;

            console.log(req.body);

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
`;

        const completion =
            await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

        const plan =
            completion.choices[0].message.content;

        res.json({ plan });

    } catch (error) {

        console.error("PLANNER ERROR:", error);

        res.status(500).json({
            error: "Failed to generate plan."
        });
    }
});

/* ===========================
   AI NOTES
=========================== */

app.post(
    "/generate-notes",
    upload.single("pdf"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Please upload a PDF."
                });
            }

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
- Use headings
- Use bullet points
- Highlight important concepts
- Make notes exam-oriented
`;

            const completion =
                await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });

            const notes =
                completion.choices[0].message.content;

            res.json({ notes });

        } catch (error) {

            console.error("NOTES ERROR:", error);

            res.status(500).json({
                error: "Failed to generate notes."
            });
        }
    }
);

/* ===========================
   QUIZ GENERATOR
=========================== */

app.post(
    "/generate-quiz",
    upload.single("pdf"),
    async (req, res) => {

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

            const pdfData =
                await pdfParse(req.file.buffer);

            let pdfText = pdfData.text;

if(pdfText.length > 5000){
    pdfText = pdfText.substring(0,5000);
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

            const completion =
                await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });

            const quiz =
                completion.choices[0].message.content;

            res.json({ quiz });

        } catch (error) {

            console.error("QUIZ ERROR:", error);

            res.status(500).json({
                error: "Failed to generate quiz."
            });
        }
    }
);

/* ===========================
   START SERVER
=========================== */

app.listen(3001, () => {
    console.log(
        "🚀 Server running at http://localhost:3001"
    );
});