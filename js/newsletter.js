document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("newsletterForm");
    const emailInput = document.getElementById("newsletterEmail");
    const button = document.getElementById("newsletterButton");
    const message = document.getElementById("newsletterMessage");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Please enter an email address.";
            message.className = "error";
            return;
        }

        button.disabled = true;
        button.textContent = "Subscribing...";
        message.textContent = "";
        message.className = "";

        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer re_4q3ocdRY_27zPnTcuWimXZD9wRhTmXuuh"
                },

                body: JSON.stringify({
                    from: "Newsletters <newsletters@echoedwild.com>",
                    to: [email],
                    subject: "🐾 Welcome to EchoedWild! 🌎",
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;text-align:center;">
                            <img
                                src="https://i.postimg.cc/kBdwXyR8/favicon-removebg-preview.png"
                                alt="EchoedWild"
                                style="width:90px;"
                            >

                            <h1>🐾 Welcome to EchoedWild! 🌎</h1>

                            <p>
                                Thanks for joining the EchoedWild community!
                            </p>

                            <p>
                                You'll receive wildlife profiles,
                                conservation updates, and educational resources.
                            </p>

                            <a
                                href="https://echoedwild.com"
                                style="
                                    display:inline-block;
                                    padding:14px 24px;
                                    background:#2b8c5e;
                                    color:white;
                                    text-decoration:none;
                                    border-radius:30px;
                                    font-weight:bold;
                                "
                            >
                                Visit EchoedWild
                            </a>

                            <p style="margin-top:30px;color:#777;font-size:13px;">
                                © 2026 EchoedWild™
                            </p>
                        </div>
                    `
                })
            });

            const data = await response.json();

            console.log("Resend response:", data);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Resend rejected the request."
                );
            }

            message.textContent =
                "🎉 Success! Check your inbox.";

            message.className = "success";

            emailInput.value = "";

        } catch (error) {

            console.error("Newsletter error:", error);

            message.textContent =
                "❌ " + error.message;

            message.className = "error";

        } finally {

            button.disabled = false;
            button.textContent = "Subscribe";

        }
    });
});