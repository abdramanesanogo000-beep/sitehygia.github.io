// Génère le secret A2F de l'admin. Usage : node scripts/generer-secret-a2f.js
// Le secret affiché doit être ajouté dans Render (ADMIN_TOTP_SECRET) et dans l'application
// d'authentification du téléphone, puis effacé de l'écran. Ne jamais le committer.
const crypto = require('crypto');

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const octets = crypto.randomBytes(20);
let bits = '';
for (const o of octets) bits += o.toString(2).padStart(8, '0');
let secret = '';
for (let i = 0; i < bits.length; i += 5) secret += BASE32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];

const uri = `otpauth://totp/Hygia:admin?secret=${secret}&issuer=Hygia&algorithm=SHA1&digits=6&period=30`;

console.log('\nSecret A2F (à saisir dans Google Authenticator > "Saisir une clé de configuration") :\n');
console.log('  ' + secret.match(/.{1,4}/g).join(' '));
console.log('\nNom du compte : Hygia admin   |   Type : basé sur le temps');
console.log('\nVariable Render :  ADMIN_TOTP_SECRET=' + secret);
console.log('\nLien otpauth (optionnel, pour générer un QR code hors ligne) :\n  ' + uri + '\n');
