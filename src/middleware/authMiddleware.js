const { verifyUserToken } = require('../services/userServices');

function protectRoute(req, res, next) {
    // Ambil token dari header Authorization (cara standar)
   
    const token = req.session.token;

    if (!token) {
        // Jika frontend adalah EJS, redirect ke login
        return res.redirect('/auth/login');
        // Jika API, kirim error 401 Unauthorized
        //return res.status(401).json({ message: "Akses ditolak. Token tidak ada." });
    }

    const user = verifyUserToken(token);
    if (!user) {
        // Token tidak valid atau kedaluwarsa
        return res.redirect('/auth/login');
        //return res.status(403).json({ message: "Token tidak valid." }); // 403 Forbidden
    }

    // Jika token valid, simpan info user di 'req' dan lanjutkan ke controller
    req.user = user; 
    next();
}

module.exports = protectRoute;