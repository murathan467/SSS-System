document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, userType })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message);
            setTimeout(() => window.location.href = '/frontend/login/login.html', 2000);
        } else {
            showNotification(result.error || 'Bir hata oluştu', true);
        }
    } catch (err) {
        showNotification('Sunucuya bağlanılamadı', true);
    }
});

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = isError ? '#e74c3c' : '#27ae60';
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 3000);
}
