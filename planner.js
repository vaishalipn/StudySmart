async function generatePlan() {
    const outputDiv = document.getElementById("output");
    
    // Get values from inputs
    const className = document.getElementById("class").value;
    const subject = document.getElementById("subject").value;
    const topic = document.getElementById("topic").value;
    const hours = document.getElementById("hours").value;
    const days = document.getElementById("days").value;
    const pdfFile = document.getElementById("pdfFile").files[0];

    outputDiv.innerHTML = "✨ Smart AI is thinking... Please wait.";

    const formData = new FormData();
    formData.append("className", className);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("hours", hours);
    formData.append("days", days);
    if (pdfFile) formData.append("pdf", pdfFile);

    try {
        const response = await fetch("https://studysmart-backend-aec9.onrender.com/generate-plan", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            outputDiv.innerHTML = `<span style="color:red">Error: ${data.error}</span>`;
        } else {
            // --- REPLACE STARTING HERE ---
            
            // This logic converts Gemini's text symbols into real HTML for your CSS to style
            let formattedHtml = data.plan
                .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')             // Fixes Headers
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       // Fixes Bold
                .replace(/^\* (.*?)(\n|$)/gm, '<li>$1</li>')            // Fixes Bullet points
                .replace(/\n/g, '<br>');                                // Fixes Line breaks

            // Wrap lists in a <ul> tag if they exist
            if (formattedHtml.includes('<li>')) {
                formattedHtml = formattedHtml.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            }

            outputDiv.innerHTML = formattedHtml; 
            
            // --- REPLACE ENDING HERE ---
        }
    } catch (err) {
        outputDiv.innerHTML = "❌ Failed to connect to server.";
        console.error(err);
    }
}