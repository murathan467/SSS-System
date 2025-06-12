// Örnek: sayfa.js
document.getElementById('askForm').addEventListener('submit', handleAskQuestion);

async function handleAskQuestion(event) {
    event.preventDefault();
    const title = document.getElementById('questionTitle').value;
   // const detail = document.getElementById('questionDetail').value;
    const category = document.getElementById('questionCategory').value;
    const email = document.getElementById('questionEmail').value;

    const response = await fetch('http://localhost:3000/api/pending-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, detail:'', category, email })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Sorunuz gönderildi, onay bekliyor.');
        event.target.reset();
    } else {
        alert(data.error || 'Bir hata oluştu.');
    }
}

// Sayfa gösterme
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    if (pageId === 'faq') {
        loadFAQ();
    }
}

// SSS listesini yükle
async function loadFAQ(faqs) {
    const faqList = document.getElementById('faqList');
    faqList.innerHTML = '';
    try {
        if (!faqs) {
            const response = await fetch('http://localhost:3000/api/faqs');
            if (!response.ok) throw new Error('API hatası');
            faqs = await response.json();
        }
        faqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.onclick = () => showQuestionDetail(faq);

            const categoryNames = {
                'academic': 'Akademik',
                'registration': 'Kayıt',
                'campus': 'Kampüs',
                'other': 'Diğer'
            };

            faqItem.innerHTML = `
                <div class="faq-question">${faq.question}</div>
                <div style="margin-top: 10px;">
                    <span class="faq-category">${categoryNames[faq.category] || faq.category}</span>
                </div>
            `;
            faqList.appendChild(faqItem);
        });
    } catch (error) {
        faqList.innerHTML = '<div style="color:red;">SSS yüklenemedi.</div>';
    }
}

// Soru detayını göster
function showQuestionDetail(faq) {
    const categoryNames = {
        'academic': 'Akademik',
        'registration': 'Kayıt',
        'campus': 'Kampüs',
        'other': 'Diğer'
    };
    document.getElementById('questionContent').innerHTML = `
        <div class="question-detail">
            <h2>${faq.question}</h2>
            <div style="margin: 15px 0;">
                <span class="faq-category">${categoryNames[faq.category]}</span>
            </div>
               <div class="detail-box" style="margin-bottom:10px;">
                <strong>Soru Detayı:</strong>
                <div style="white-space: pre-line; color:#444;">${faq.detail ? faq.detail : 'Detay yok.'}</div>
            </div>
            <div class="answer-box">
                <h3>Cevap:</h3>
                <div style="white-space: pre-line; margin-top: 10px;">${faq.answer}</div>
            </div>
        </div>
    `;
    showPage('question-detail');
}

// SSS arama
async function searchFAQ() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    try {
        const response = await fetch('http://localhost:3000/api/faqs?search=' + encodeURIComponent(searchTerm));
        if (!response.ok) throw new Error('API hatası');
        const faqs = await response.json();
        loadFAQ(faqs);
    } catch (error) {
        showNotification('Arama sırasında hata oluştu.');
    }
}

// Kategori filtresi
async function filterFAQ(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    try {
        let url = 'http://localhost:3000/api/faqs';
        if (category && category !== 'all') {
            url += '?category=' + encodeURIComponent(category);
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('API hatası');
        const faqs = await response.json();
        loadFAQ(faqs);
    } catch (error) {
        showNotification('Filtreleme sırasında hata oluştu.');
    }
}

// Bildirim göster
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Sayfa yüklendiğinde SSS'leri yükle
window.onload = function() {
    loadFAQ();
};

