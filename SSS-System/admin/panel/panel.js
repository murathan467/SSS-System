// DOM yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    // Tab click eventleri
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => showTab(tab.dataset.tab));
    });

    // Modal kapatma butonları
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Form submit eventleri
    document.getElementById('answerForm').addEventListener('submit', answerQuestion);
    document.getElementById('editForm').addEventListener('submit', updateFAQ);
    document.getElementById('addFaqForm').addEventListener('submit', addFAQ);

    // İlk tab'ı yükle
    loadPendingQuestions();
});

// Sekme değiştirme
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));

    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'pending') loadPendingQuestions();
    if (tabName === 'faqs') loadFAQs();
    if (tabName === 'users') loadUsers();
}

// Bekleyen soruları yükle
async function loadPendingQuestions() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/pending-questions', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
      
        if (!response.ok) throw new Error('API hatası');
        const data = await response.json();
        pendingQuestions = data;

        const tbody = document.querySelector('#pendingTable tbody');
        tbody.innerHTML = '';
        pendingQuestions.forEach(q => {
            tbody.innerHTML += `
                <tr>
                    <td>${q.title}</td>
                    <td>${q.category_id}</td>
                    <td>${new Date(q.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-approve" onclick="openAnswerModal(${q.id}, '${q.title.replace(/'/g, "\\'")}')">Cevapla</button>
                        <button class="btn btn-reject" onclick="rejectQuestion(${q.id})">Reddet</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading pending questions:', error);
        alert('Bekleyen sorular yüklenirken hata oluştu');
    }
}

// Cevap modalını aç
function openAnswerModal(id, questionText) {
    document.getElementById('questionText').textContent =`Soru: ${questionText}`;
   // document.getElementById('questionDetail').textContent = '';
    document.getElementById('questionId').value = id;
    document.getElementById('answerText').value = '';
    document.getElementById('answerModal').style.display = 'block';
}
// Soruyu cevapla ve yayınla

async function answerQuestion(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('questionId').value);
    const answer = document.getElementById('answerText').value;
    const token = localStorage.getItem('token');

    const res = await fetch(`http://localhost:3000/api/pending-questions/${id}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ answer })
    });
    if (!res.ok) throw new Error('Cevap gönderilemedi');
    alert('Soru başarıyla cevaplandı ve yayınlandı!');
    document.getElementById('answerModal').style.display = 'none';
    loadPendingQuestions();
    loadFAQs();
}

// Soruyu reddet
async function rejectQuestion(id) {
    if (!confirm('Bu soruyu reddetmek istediğinize emin misiniz?')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/api/pending-questions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Reddetme başarısız');
        alert('Soru reddedildi.');
        loadPendingQuestions();
    } catch (error) {
        console.error('Error rejecting question:', error);
        alert('Soru reddedilirken hata oluştu');
    }
}

// SSS'leri yükle
async function loadFAQs() {
    try {
        const response = await fetch('http://localhost:3000/api/faqs');
        if (!response.ok) throw new Error('API hatası');
        const data = await response.json();
        const faqs = Array.isArray(data) ? data : []; // Hatalı veri gelirse boş dizi kullan

        const tbody = document.querySelector('#faqTable tbody');
        tbody.innerHTML = '';
        faqs.forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td>${f.question}</td>
                    <td>${f.category || f.category_id}</td>
                    <td>
                        <button class="btn btn-edit" onclick="openEditModal(${f.id})">Düzenle</button>
                        <button class="btn btn-reject" onclick="deleteFAQ(${f.id})">Sil</button>
                    </td>
                </tr>
            `;
        });
        window.faqs = faqs;
    } catch (error) {
        console.error('Error loading FAQs:', error);
        alert('SSS listesi yüklenirken hata oluştu');
    }
}

// Düzenle modalını aç
function openEditModal(id) {
    const faq = faqs.find(f => f.id === id);
    if (!faq) return;

    document.getElementById('editId').value = id;
    document.getElementById('editQuestion').value = faq.question;
    document.getElementById('editAnswer').value = faq.answer;
    document.getElementById('editCategory').value = faq.category;
    document.getElementById('editModal').style.display = 'block';
}

// SSS güncelle
async function updateFAQ(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const question = document.getElementById('editQuestion').value;
    const answer = document.getElementById('editAnswer').value;
    const category = document.getElementById('editCategory').value;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`http://localhost:3000/api/admin/faqs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ question, answer, category })
        });
        if (!res.ok) throw new Error('Güncelleme başarısız');
        alert('SSS başarıyla güncellendi!');
        document.getElementById('editModal').style.display = 'none';
        loadFAQs();
    } catch (error) {
        console.error('Error updating FAQ:', error);
        alert('Güncelleme sırasında hata oluştu');
    }
}

// SSS sil
async function deleteFAQ(id) {
    const token = localStorage.getItem('token');
    if (!confirm('Bu SSS kaydını silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/admin/faqs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Silme başarısız');
        alert('SSS kaydı silindi.');
        loadFAQs();
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        alert('SSS silinirken hata oluştu');
    }
}

// Yeni SSS ekle
async function addFAQ(event) {
    event.preventDefault();
    const question = document.getElementById('newQuestion').value;
    const answer = document.getElementById('newAnswer').value;
    const category = document.getElementById('newCategory').value;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch('http://localhost:3000/api/admin/faqs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ question, answer, category })
        });
        if (!res.ok) throw new Error('Ekleme başarısız');
        alert('Yeni SSS başarıyla eklendi!');
        event.target.reset();
        loadFAQs();
    } catch (error) {
        console.error('Error adding FAQ:', error);
        alert('SSS eklenirken hata oluştu');
    }
}

// Kullanıcıları yükle
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('API hatası');
        const data = await res.json();
        const users = Array.isArray(data) ? data : (data.users || []); // Dizi değilse düzelt

        const tbody = document.querySelector('#userTable tbody');
        tbody.innerHTML = '';
        users.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.user_type}</td>
                    <td>${new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Kullanıcı listesi yüklenirken hata oluştu');
    }
}