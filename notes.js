async function generateNotes() {

    const outputDiv = document.getElementById("notes-output");

    const subject = document.getElementById("subject").value;
    const topic = document.getElementById("topic").value;
    const pdfFile = document.getElementById("notesSource").files[0];

    if (!subject || !topic) {
        alert("Please enter both Subject and Topic!");
        return;
    }

    if (!pdfFile) {
        alert("Please upload a PDF!");
        return;
    }

    outputDiv.innerHTML = `
        <div class="loading-message">
            ✨ AI Professor is preparing your notes...
        </div>
    `;

    const formData = new FormData();

    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("pdf", pdfFile);

    try {

        console.log("🚀 Sending notes request to Render...");

        const response = await fetch(
            "https://studysmart-backend-aec9.onrender.com/generate-notes",
            {
                method: "POST",
                body: formData
            }
        );

        console.log("📡 Response status:", response.status);

        const text = await response.text();

        console.log("📦 Server response:", text);

        let data;

        try {
            data = JSON.parse(text);
        } catch (error) {

            outputDiv.innerHTML = `
                <div class="error-message">
                    ❌ Server returned an unexpected response.
                    <br><br>
                    Status: ${response.status}
                </div>
            `;

            return;
        }

        if (!response.ok || data.error) {

            outputDiv.innerHTML = `
                <div class="error-message">
                    ❌ ${data.error || "Something went wrong."}
                </div>
            `;

            return;
        }

        if (!data.notes) {

            outputDiv.innerHTML = `
                <div class="error-message">
                    ❌ No notes were returned from the server.
                </div>
            `;

            return;
        }

        console.log("✅ Notes received successfully");

        outputDiv.innerHTML = formatNotes(data.notes);

    } catch (error) {

        console.error("❌ FETCH ERROR:", error);

        outputDiv.innerHTML = `
            <div class="error-message">
                ❌ Could not connect to the StudySmart server.
                <br><br>
                Please try again.
            </div>
        `;
    }
}


/* =====================================================
   FORMAT AI NOTES
===================================================== */

function formatNotes(text) {

    // Prevent raw HTML
    text = escapeHTML(text);

    text = text.replace(/\r\n/g, "\n");

    const lines = text.split("\n");

    let html = "";
    let i = 0;

    while (i < lines.length) {

        let line = lines[i].trim();

        // Empty line
        if (!line) {
            i++;
            continue;
        }


        /* =========================
           TABLE
        ========================= */

        if (
            line.includes("|") &&
            i + 1 < lines.length &&
            isTableSeparator(lines[i + 1])
        ) {

            const headers = parseTableRow(line);

            i += 2;

            let rows = [];

            while (
                i < lines.length &&
                lines[i].trim() &&
                lines[i].includes("|")
            ) {

                rows.push(parseTableRow(lines[i]));

                i++;
            }

            html += `
                <div class="notes-table-wrapper">

                    <table class="notes-table">

                        <thead>

                            <tr>
                                ${headers
                                    .map(header => `
                                        <th>
                                            ${formatInline(header)}
                                        </th>
                                    `)
                                    .join("")}
                            </tr>

                        </thead>

                        <tbody>

                            ${rows.map(row => `
                                <tr>
                                    ${row
                                        .map(cell => `
                                            <td>
                                                ${formatInline(cell)}
                                            </td>
                                        `)
                                        .join("")}
                                </tr>
                            `).join("")}

                        </tbody>

                    </table>

                </div>
            `;

            continue;
        }


        /* =========================
           HEADINGS
        ========================= */

        if (/^#{1,6}\s+/.test(line)) {

            const match =
                line.match(/^(#{1,6})\s+(.*)$/);

            const level =
                Math.min(match[1].length, 4);

            const heading =
                match[2];

            html += `
                <h${level} class="notes-heading">
                    ${formatInline(heading)}
                </h${level}>
            `;

            i++;

            continue;
        }


        /* =========================
           HORIZONTAL LINE
        ========================= */

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {

            html += `
                <hr class="notes-divider">
            `;

            i++;

            continue;
        }


        /* =========================
           BULLET LIST
        ========================= */

        if (/^[-*•]\s+/.test(line)) {

            html += `
                <ul class="notes-list">
            `;

            while (
                i < lines.length &&
                /^[-*•]\s+/.test(lines[i].trim())
            ) {

                const item =
                    lines[i]
                        .trim()
                        .replace(/^[-*•]\s+/, "");

                html += `
                    <li>
                        ${formatInline(item)}
                    </li>
                `;

                i++;
            }

            html += `
                </ul>
            `;

            continue;
        }


        /* =========================
           NUMBERED LIST
        ========================= */

        if (/^\d+[.)]\s+/.test(line)) {

            html += `
                <ol class="notes-list">
            `;

            while (
                i < lines.length &&
                /^\d+[.)]\s+/.test(lines[i].trim())
            ) {

                const item =
                    lines[i]
                        .trim()
                        .replace(/^\d+[.)]\s+/, "");

                html += `
                    <li>
                        ${formatInline(item)}
                    </li>
                `;

                i++;
            }

            html += `
                </ol>
            `;

            continue;
        }


        /* =========================
           NORMAL PARAGRAPH
        ========================= */

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

            paragraph +=
                " " + lines[i].trim();

            i++;
        }

        html += `
            <p class="notes-paragraph">
                ${formatInline(paragraph)}
            </p>
        `;
    }

    return html;
}


/* =====================================================
   INLINE FORMATTING
===================================================== */

function formatInline(text) {

    // Bold
    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic
    text = text.replace(
        /(?<!\*)\*([^*]+)\*(?!\*)/g,
        "<em>$1</em>"
    );

    // Inline code
    text = text.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    return text;
}


/* =====================================================
   TABLE FUNCTIONS
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

    return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/
        .test(line);
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}