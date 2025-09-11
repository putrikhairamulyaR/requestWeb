// =================================================================
// IMPOR MODUL
// =================================================================
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('cookie-session');



// baru setelah itu pakai app.use

const authRoutes = require('./routes/auth');

// =================================================================
// INISIALISASI APLIKASI
// =================================================================
const app = express();

// =================================================================
// KONFIGURASI VIEW ENGINE (EJS)
// =================================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "../public")));

// =================================================================
// MIDDLEWARE
// =================================================================
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "session",
    keys: [process.env.SESSION_SECRET || "default_secret_key"],
    maxAge: 24 * 60 * 60 * 1000, // 1 hari
  })
);

// =================================================================
// ROUTES
// =================================================================
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/form');
    } else {
        return res.redirect('/auth/login');
    }
});

app.use('/', authRoutes);
// app.use('/form', formRoutes);
// app.use('/admin', adminRoutes);

// =================================================================
// ERROR HANDLING
// =================================================================
app.use((req, res, next) => {
    res.status(404).render('error', { message: 'Halaman tidak ditemukan' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Terjadi kesalahan pada server' });
});

// =================================================================
// EKSPOR APLIKASI
// =================================================================
module.exports = app;
