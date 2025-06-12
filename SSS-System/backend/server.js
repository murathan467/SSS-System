const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('./db');
const { authenticateToken, isAdmin } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// frontend klasörünü /frontend yolu ile statik servis yap
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// admin klasörünü /admin yolu ile statik servis yap
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Ana sayfa (kullanıcı giriş sayfası)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login/login.html'));
});

// Kullanıcı kayıt
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    // Gelen userType varsa student ise user yap, yoksa user yap
    let userType = 'user';
    if (req.body.userType && req.body.userType === 'student') {
        userType = 'user';
    } else if (req.body.userType) {
        userType = req.body.userType;
    }

    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (name, email, password_hash, user_type) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, userType]
        );

        res.json({ message: 'Kayıt başarılı' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});


// Kullanıcı giriş
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Geçersiz e-posta' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Geçersiz parola' });
        }

        const token = jwt.sign({ id: user.id, userType: user.user_type }, 'secret');

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                userType: user.user_type
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// SSS'leri getir
app.get('/api/faqs', async (req, res) => {
    const { category, search } = req.query;

    try {
        let sql = `SELECT f.id, f.question, f.answer, f.detail, c.name as category FROM faqs f
                   JOIN categories c ON f.category_id = c.id`;
        const params = [];
        const conditions = [];

        if (category && category !== 'all') {
            conditions.push('c.name = ?');
            params.push(category);
        }

        if (search) {
            conditions.push('(f.question LIKE ? OR f.answer LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Soru gönder
app.post('/api/questions', async (req, res) => {
    const { title, category, detail, email } = req.body;

    try {
        // category_id almak için
        const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
        if (catRows.length === 0) {
            return res.status(400).json({ error: 'Geçersiz kategori' });
        }
        const categoryId = catRows[0].id;

        await pool.query(
            `INSERT INTO pending_questions (title, detail, email, category_id, approved, created_at)
             VALUES (?, ?, ?, ?, false, NOW())`,
            [title, detail, email, categoryId]
        );

        res.json({ message: 'Soru gönderildi, onay bekliyor' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin: bekleyen sorular
app.get('/api/admin/pending', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pending_questions WHERE approved = false ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin: soruyu onayla
app.put('/api/admin/approve/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const [rows] = await pool.query('SELECT * FROM pending_questions WHERE id = ? AND approved = false', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Soru bulunamadı veya zaten onaylanmış' });
        }
        const question = rows[0];

        await pool.query('UPDATE pending_questions SET approved = true WHERE id = ?', [id]);
        await pool.query(
            `INSERT INTO faqs (question, answer, category_id, approved, created_at)
             VALUES (?, ?, ?, true, NOW())`,
            [question.title, 'Henüz cevaplanmadı.', question.category_id]
        );

        res.json({ message: 'Soru onaylandı' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin: yeni SSS ekle
app.post('/api/admin/faqs', authenticateToken, isAdmin, async (req, res) => {
    const { question, answer, category } = req.body;
    if (!question || !answer || !category) return res.status(400).json({ error: 'Tüm alanları doldurun.' });

    try {
        const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
        if (catRows.length === 0) return res.status(400).json({ error: 'Geçersiz kategori.' });

        const categoryId = catRows[0].id;

        await pool.query(
            'INSERT INTO faqs (question, answer, category_id) VALUES (?, ?, ?)',
            [question, answer, categoryId]
        );

        res.json({ message: 'Yeni SSS eklendi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin: SSS düzenle
app.put('/api/admin/faqs/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { question, answer, category } = req.body;
    if (!question || !answer || !category) return res.status(400).json({ error: 'Tüm alanları doldurun.' });

    try {
        const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
        if (catRows.length === 0) return res.status(400).json({ error: 'Geçersiz kategori.' });

        const categoryId = catRows[0].id;

        const [result] = await pool.query(
            'UPDATE faqs SET question = ?, answer = ?, category_id = ? WHERE id = ?',
            [question, answer, categoryId, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'SSS bulunamadı.' });

        res.json({ message: 'SSS güncellendi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin: kullanıcıları listele
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, user_type, created_at FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Test bağlantısı
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS time');
        res.json({ success: true, serverTime: rows[0].time });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Veritabanı bağlantı hatası' });
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server çalışıyor http://localhost:${PORT}`);
});

// Kullanıcıdan gelen soruyu pending_questions tablosuna ekle
app.post('/api/pending-questions', async (req, res) => {
    const { title, detail, category, email } = req.body;
    try {
        // Kategori adı geldiyse ID'yi bul
        const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [category]);
        if (catRows.length === 0) {
            return res.status(400).json({ error: 'Geçersiz kategori' });
        }
        const categoryId = catRows[0].id;

        await pool.query(
            'INSERT INTO pending_questions (title, detail, category_id, email, approved, created_at) VALUES (?, ?, ?, ?, false, NOW())',
            [title, detail, categoryId, email]
        );
        res.json({ message: 'Soru gönderildi, onay bekliyor.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Soru kaydedilemedi.' });
    }
});

// Admin: Bekleyen soruları listele
app.get('/api/pending-questions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pending_questions WHERE approved = FALSE ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sorular getirilemedi.' });
    }
});

// Admin: Soru onayla (SSS'ye ekle)
app.post('/api/pending-questions/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { answer } = req.body; // Admin panelinden gelen cevap
        const [rows] = await pool.query('SELECT * FROM pending_questions WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Soru bulunamadı' });
        const question = rows[0];

        // Detay bilgisini de ekle!
        await pool.query(
            'INSERT INTO faqs (question, answer, category_id, detail) VALUES (?, ?, ?, ?)',
            [question.title, answer || '', question.category_id, question.detail || null]
        );

        await pool.query('DELETE FROM pending_questions WHERE id = ?', [req.params.id]);
        res.json({ message: 'Soru onaylandı ve SSS\'ye eklendi.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Onay işlemi başarısız.' });
    }
});

// Admin: Soru reddet (sil)
app.delete('/api/pending-questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM pending_questions WHERE id = ?', [req.params.id]);
        res.json({ message: 'Soru reddedildi ve silindi.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Silme işlemi başarısız.' });
    }
});

// Admin: SSS sil
app.delete('/api/admin/faqs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [result] = await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'SSS bulunamadı.' });
        }
        res.json({ message: 'SSS silindi.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Silme işlemi başarısız.' });
    }
});
