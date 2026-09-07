document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("newsletterForm");
    const emailInput = document.getElementById("newsletterEmail");
    const button = document.getElementById("newsletterButton");
    const message = document.getElementById("newsletterMessage");

    if (!form || !emailInput || !button || !message) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Please enter your email address.";
            message.className = "error";
            return;
        }

        button.disabled = true;
        button.textContent = "Subscribing...";
        message.textContent = "";
        message.className = "";

        try {
            const response = await fetch(
                "https://newsletter.echoedwild.com",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to subscribe right now."
                );
            }

            message.textContent =
                "🎉 You're subscribed! Check your inbox.";

            message.className = "success";

            emailInput.value = "";

        } catch (error) {
            console.error("Newsletter error:", error);

            message.textContent =
                "❌ " +
                (error.message ||
                "Something went wrong. Please try again.");

            message.className = "error";

        } finally {
            button.disabled = false;
            button.textContent = "Subscribe";
        }
    });
});