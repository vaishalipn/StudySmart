
/* =====================================================
   STUDYSMART - AI STUDY PLANNER
===================================================== */

async function generatePlan() {
    const outputDiv = document.getElementById("output");

    const className = document.getElementById("class").value;
    const subject = document.getElementById("subject").value;
    const topic = document.getElementById("topic").value;
    const hours = document.getElementById("hours").value;
    const days = document.getElementById("days").value;
    const pdfFile = document.getElementById("pdfFile").files[0];

    // Validate required fields
    if (!className || !subject || !topic || !hours || !days) {
        outputDiv.innerHTML = `
            <div class="error-message">
                Please fill all the required fields.
            </div>
        `;
        return;
    }

    // Show loading message
    outputDiv.innerHTML = `
        <div class="loading-message">
            ✨ Smart AI is creating your personalized study plan...
        </div>
    `;

    const formData = new FormData();

    formData.append("className", className);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("hours", hours);
    formData.append("days", days);

    if (pdfFile) {
        formData.append("pdf", pdfFile);
    }

    try {
        console.log("Sending request to Render backend...");

        const response = await fetch(
            "https://studysmart-backend-aec9.onrender.com/generate-plan",
            {
                method: "POST",
                body: formData
            }
        );

        console.log("Response status:", response.status);

        const text = await response.text();

        console.log("Server response:", text);

        let data;

        try {
            data = JSON.parse(text);
        } catch (error) {
            outputDiv.innerHTML = `
                <div class="error-message">
                    Server returned an unexpected response.
                    <br><br>
                    Status: ${response.status}
                </div>
            `;
            return;
        }

        if (!response.ok || data.error) {
            outputDiv.innerHTML = `
                <div class="error-message">
                    ❌ ${escapeHTML(data.error || "Something went wrong.")}
                </div>
            `;
            return;
        }

        if (!data.plan) {
            outputDiv.innerHTML = `
                <div class="error-message">
                    ❌ No study plan was returned.
                </div>
            `;
            return;
        }

        console.log("Study plan received");

        outputDiv.innerHTML = formatAIResponse(data.plan);

    } catch (error) {
        console.error("FETCH ERROR:", error);

        outputDiv.innerHTML = `
            <div class="error-message">
                ❌ Could not connect to the StudySmart server.
                <br>
                Please try again.
            </div>
        `;
    }
}


/* =====================================================
   NORMALIZE AI RESPONSE
   Fix escaped newlines and HTML line breaks
===================================================== */

function normalizeAIText(text) {
    if (typeof text !== "string") {
        text = String(text ?? "");
    }

    // Convert escaped newline characters into real newlines.
    // Handles AI output containing literal \n or \r\n.
    text = text
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\n");

    // Convert actual HTML <br> tags into newlines
    text = text.replace(/<br\s*\/?>/gi, "\n");

    // Convert escaped HTML break tags such as &lt;br&gt;
    text = text.replace(
        /&lt;br\s*\/?&gt;/gi,
        "\n"
    );

    // Normalize Windows and old Mac line endings
    text = text.replace(/\r\n?/g, "\n");

    // Remove unwanted control characters
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

    return text.trim();
}


/* =====================================================
   FORMAT AI RESPONSE
===================================================== */

function formatAIResponse(rawText) {
    // Normalize first, before escaping HTML
    const normalizedText = normalizeAIText(rawText);

    // Escape HTML to prevent raw HTML from the AI
    const safeText = escapeHTML(normalizedText);

    const lines = safeText.split("\n");

    let html = "";
    let i = 0;

    while (i < lines.length) {
        let line = lines[i].trim();

        // Skip empty lines
        if (!line) {
            i++;
            continue;
        }

        /* =========================================
           MARKDOWN TABLE
        ========================================= */

        if (
            line.includes("|") &&
            i + 1 < lines.length &&
            isTableSeparator(lines[i + 1])
        ) {
            const headers = parseTableRow(line);

            i += 2;

            const rows = [];

            while (
                i < lines.length &&
                lines[i].trim() &&
                lines[i].includes("|")
            ) {
                rows.push(parseTableRow(lines[i]));
                i++;
            }

            // Render table with horizontally scrollable wrapper
            html += `
                <div class="table-wrapper">
                    <table class="study-table">
                        <thead>
                            <tr>
                                ${headers.map(header => `
                                    <th>
                                        ${formatInline(header)}
                                    </th>
                                `).join("")}
                            </tr>
                        </thead>

                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    ${headers.map((_, index) => `
                                        <td>
                                            ${formatInline(row[index] || "")}
                                        </td>
                                    `).join("")}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;

            continue;
        }

        /* =========================================
           HEADINGS
        ========================================= */

        if (/^#{1,6}\s+/.test(line)) {
            const match = line.match(/^(#{1,6})\s+(.*)$/);

            const level = Math.min(match[1].length, 4);
            const heading = match[2];

            html += `
                <h${level} class="ai-heading">
                    ${formatInline(heading)}
                </h${level}>
            `;

            i++;
            continue;
        }

        /* =========================================
           HORIZONTAL DIVIDER
        ========================================= */

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
            html += `<hr class="ai-divider">`;

            i++;
            continue;
        }

        /* =========================================
           BULLET LIST
        ========================================= */

        if (/^[-*•]\s+/.test(line)) {
            html += `<ul class="ai-list">`;

            while (
                i < lines.length &&
                /^[-*•]\s+/.test(lines[i].trim())
            ) {
                const item = lines[i]
                    .trim()
                    .replace(/^[-*•]\s+/, "");

                html += `
                    <li>${formatInline(item)}</li>
                `;

                i++;
            }

            html += `</ul>`;

            continue;
        }

        /* =========================================
           NUMBERED LIST
        ========================================= */

        if (/^\d+[.)]\s+/.test(line)) {
            html += `<ol class="ai-list">`;

            while (
                i < lines.length &&
                /^\d+[.)]\s+/.test(lines[i].trim())
            ) {
                const item = lines[i]
                    .trim()
                    .replace(/^\d+[.)]\s+/, "");

                html += `
                    <li>${formatInline(item)}</li>
                `;

                i++;
            }

            html += `</ol>`;

            continue;
        }

        /* =========================================
           NORMAL PARAGRAPH
        ========================================= */

        let paragraph = line;

        i++;

        while (
            i < lines.length &&
            lines[i].trim() &&
            !/^#{1,6}\s+/.test(lines[i].trim()) &&
            !/^[-*•]\s+/.test(lines[i].trim()) &&
            !/^\d+[.)]\s+/.test(lines[i].trim()) &&
            !lines[i].includes("|") &&
            !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
        ) {
            paragraph += " " + lines[i].trim();
            i++;
        }

        html += `
            <p class="ai-paragraph">
                ${formatInline(paragraph)}
            </p>
        `;
    }

    return html;
}


/* =====================================================
   FORMAT INLINE MARKDOWN
===================================================== */

function formatInline(text) {
    // Bold text: **text**
    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic text: *text*
    text = text.replace(
        /(?<!\*)\*([^*]+)\*(?!\*)/g,
        "<em>$1</em>"
    );

    // Inline code: `code`
    text = text.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    return text;
}


/* =====================================================
   TABLE HELPERS
===================================================== */

function parseTableRow(row) {
    row = row.trim();

    if (row.startsWith("|")) {
        row = row.substring(1);
    }

    if (row.endsWith("|")) {
        row = row.substring(0, row.length - 1);
    }

    return row
        .split("|")
        .map(cell => cell.trim());
}


function isTableSeparator(line) {
    line = line.trim();

    return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line);
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}