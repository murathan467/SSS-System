async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const notification = document.getElementById('notification');

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.user) {
            // Giriş başarılı, token ve kullanıcıyı kaydet
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Kullanıcı paneline yönlendir (örnek)
            window.location.href = '../sayfa/sayfa.html';
        } else {
            notification.textContent = data.error || 'Giriş başarısız!';
            notification.style.display = 'block';
        }
    } catch (err) {
        notification.textContent = 'Sunucu hatası!';
        notification.style.display = 'block';
    }
}

// Form submit olayını bağla
document.getElementById('loginForm').addEventListener('submit', handleLogin);
