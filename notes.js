async function generateNotes() {
    const outputDiv = document.getElementById("notes-output");
    
    // Get values from your ai-notes.html inputs
    const subject = document.getElementById("subject").value;
    const topic = document.getElementById("topic").value;
    const pdfFile = document.getElementById("notesSource").files[0];

    if (!subject || !topic) {
        alert("Please enter both Subject and Topic!");
        return;
    }

    outputDiv.innerHTML = "✨ AI Professor is drafting your notes... Please wait.";

    // We use FormData exactly like your planner does
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("topic", topic);
    if (pdfFile) formData.append("pdf", pdfFile);

    try {
        // IMPORTANT: We use the same localhost port your planner uses
        // Note: You might need to add a '/generate-notes' route to your server.js
        const response = await fetch("https://studysmart-backend-aec9.onrender.com/generate-notes", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            outputDiv.innerHTML = `<span style="color:red">Error: ${data.error}</span>`;
        } else {
            // Using your exact formatting logic from planner.js
            let formattedHtml = (data.notes || data.plan) // Adjust based on what your server returns
                .replace(/### (.*?)(\n|$)/g, '<h3 style="color:#2563eb;">$1</h3>') 
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       
                .replace(/^\* (.*?)(\n|$)/gm, '<li>$1</li>')            
                .replace(/\n/g, '<br>');                                

            if (formattedHtml.includes('<li>')) {
                formattedHtml = formattedHtml.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            }

            outputDiv.innerHTML = formattedHtml; 
        }
    } catch (err) {
        outputDiv.innerHTML = "❌ Failed to connect to server. Is your backend running on port 3001?";
        console.error(err);
    }
}