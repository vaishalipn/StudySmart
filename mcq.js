let currentQuiz = [];

async function generateQuiz() {

    const pdfFile = document.getElementById("pdfFile").files[0];
    const numQuestions = document.getElementById("numQuestions").value;
    const difficulty = document.getElementById("difficulty").value;

    const output = document.getElementById("quizOutput");

    if (!pdfFile) {
        alert("Please upload a PDF first.");
        return;
    }

    output.innerHTML = `
        <div class="loading">
            🤖 AI is generating quiz...
        </div>
    `;

    const formData = new FormData();

    formData.append("pdf", pdfFile);
    formData.append("numQuestions", numQuestions);
    formData.append("difficulty", difficulty);

    try {

        const response = await fetch(
            "http://localhost:3001/generate-quiz",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (data.error) {

            output.innerHTML =
                `<p style="color:red">${data.error}</p>`;

            return;
        }

        currentQuiz = JSON.parse(data.quiz);

        let html = "";

        currentQuiz.forEach((q, index) => {

            html += `
                <div class="quiz-card">

                    <h3>
                        ${index + 1}. ${q.question}
                    </h3>

                    <div class="options">

                        ${q.options.map(option => `
                            <label class="option">
                                <input
                                    type="radio"
                                    name="q${index}"
                                    value="${option}"
                                >
                                ${option}
                            </label>
                        `).join("")}

                    </div>

                    <div
                        class="answer-box"
                        id="answer-${index}"
                        style="display:none;"
                    >
                        <p>
                            <strong>✅ Correct Answer:</strong>
                            ${q.answer}
                        </p>

                        <p>
                            <strong>📖 Explanation:</strong>
                            ${q.explanation}
                        </p>
                    </div>

                </div>
            `;
        });

        html += `
            <button
                class="submit-btn"
                onclick="submitQuiz()"
            >
                Submit Quiz
            </button>

            <div id="resultBox"></div>
        `;

        output.innerHTML = html;

    } catch (error) {

        console.error(error);

        output.innerHTML =
            "<p style='color:red'>Failed to generate quiz.</p>";
    }
}

function submitQuiz() {

    let score = 0;

    currentQuiz.forEach((q, index) => {

        const selectedAnswer =
            document.querySelector(
                `input[name="q${index}"]:checked`
            );

        if (
            selectedAnswer &&
            selectedAnswer.value === q.answer
        ) {
            score++;
        }

        document.getElementById(
            `answer-${index}`
        ).style.display = "block";
    });

    const percentage =
        Math.round(
            (score / currentQuiz.length) * 100
        );

    let grade = "F";

    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";
    else if (percentage >= 50) grade = "D";

    document.getElementById("resultBox").innerHTML = `
        <div class="result-card">

            <h2>🎉 Quiz Completed</h2>

            <h3>
                Score:
                ${score} / ${currentQuiz.length}
            </h3>

            <h3>
                Percentage:
                ${percentage}%
            </h3>

            <h3>
                Grade:
                ${grade}
            </h3>

        </div>
    `;

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}