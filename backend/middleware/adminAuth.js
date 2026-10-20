const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

// Support de ADMIN_PASSWORD (en clair, hashé au démarrage) ou ADMIN_PASSWORD_HASH déjà généré
let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
if (process.env.ADMIN_PASSWORD) {
    ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
}

// ===========================================
// A2F (TOTP, RFC 6238) — compatible Google Authenticator, Microsoft Authenticator, etc.
// ===========================================
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(texte) {
    let bits = '';
    for (const c of texte.replace(/[\s=]/g, '').toUpperCase()) {
        const valeur = BASE32.indexOf(c);
        if (valeur < 0) throw new Error('Secret A2F invalide (base32 attendu).');
        bits += valeur.toString(2).padStart(5, '0');
    }
    const octets = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) octets.push(parseInt(bits.slice(i, i + 8), 2));
    return Buffer.from(octets);
}

let TOTP_SECRET = null;
try {
    if (process.env.ADMIN_TOTP_SECRET) TOTP_SECRET = base32Decode(process.env.ADMIN_TOTP_SECRET);
} catch (error) {
    console.error(error.message);
}

function genererCodeTotp(secret, compteur) {
    const tampon = Buffer.alloc(8);
    tampon.writeBigUInt64BE(BigInt(compteur));
    const hmac = crypto.createHmac('sha1', secret).update(tampon).digest();
    const decalage = hmac[hmac.length - 1] & 0x0f;
    const nombre = (hmac.readUInt32BE(decalage) & 0x7fffffff) % 1000000;
    return String(nombre).padStart(6, '0');
}

// Dernier pas de temps accepté : un même code ne peut pas être réutilisé (anti-rejeu)
let dernierCompteurUtilise = 0;

function verifierCodeA2F(code) {
    const saisie = String(code || '').replace(/\s/g, '');
    if (!TOTP_SECRET || !/^\d{6}$/.test(saisie)) return false;

    const compteurActuel = Math.floor(Date.now() / 30000);
    // Tolérance de ±30 s pour les horloges de téléphone légèrement décalées
    for (const ecart of [-1, 0, 1]) {
        const compteur = compteurActuel + ecart;
        if (compteur <= dernierCompteurUtilise) continue;
        const attendu = Buffer.from(genererCodeTotp(TOTP_SECRET, compteur));
        if (crypto.timingSafeEqual(attendu, Buffer.from(saisie))) {
            dernierCompteurUtilise = compteur;
            return true;
        }
    }
    return false;
}

function signAdminToken() {
    if (!JWT_SECRET) throw new Error('JWT_SECRET non configuré.');
    return jwt.sign({ role: 'admin', a2f: true }, JWT_SECRET, { expiresIn: '2h' });
}

async function verifierAdmin(req, res, next) {
    try {
        if (!JWT_SECRET) {
            console.error('JWT_SECRET manquant');
            return res.status(500).json({ succes: false, erreur: 'Configuration serveur incomplète.' });
        }

        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ succes: false, erreur: 'Authentification admin requise.' });
        }

        const payload = jwt.verify(token, JWT_SECRET);
        // Les anciens tokens émis sans A2F sont refusés
        if (payload.role !== 'admin' || payload.a2f !== true) {
            return res.status(403).json({ succes: false, erreur: 'Accès réservé aux administrateurs.' });
        }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ succes: false, erreur: 'Session admin expirée. Reconnectez-vous.' });
        }
        return res.status(401).json({ succes: false, erreur: 'Authentification admin invalide.' });
    }
}

async function verifierMotDePasseAdmin(password) {
    if (!ADMIN_PASSWORD_HASH) return false;
    return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

// Sans secret A2F configuré, la connexion admin est bloquée (fail closed)
function configAdminValide() {
    return Boolean(JWT_SECRET && ADMIN_PASSWORD_HASH && TOTP_SECRET);
}

module.exports = { signAdminToken, verifierAdmin, verifierMotDePasseAdmin, verifierCodeA2F, configAdminValide, genererCodeTotp, base32Decode };
