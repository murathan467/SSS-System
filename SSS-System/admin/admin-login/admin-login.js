document.getElementById("adminLoginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.user.userType === "admin") {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "../panel/panel.html"; // doğru yolu ver
} else {
            showNotification("Sadece admin kullanıcı girişi yapabilir.");
        }
    } catch (err) {
        showNotification("Giriş sırasında bir hata oluştu.");
    }
});

function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.textContent = message;
    notif.style.display = "block";
    setTimeout(() => {
        notif.style.display = "none";
    }, 3000);
}
