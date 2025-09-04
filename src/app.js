// =================================================================
// IMPOR MODUL
// =================================================================
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');


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

// =================================================================
// MIDDLEWARE
// =================================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    secret: "1234", // sebaiknya pakai process.env.SESSION_SECRET
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

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
