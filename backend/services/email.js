const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Hygia <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://abdramanesanogo000-beep.github.io/sitehygia.github.io';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const emailActif = !!RESEND_API_KEY;

function formaterPrixFCFA(montant) {
    return Number(montant).toLocaleString('fr-FR') + ' FCFA';
}

async function envoyerEmail(options) {
    if (!emailActif) {
        console.log('📧 Email non envoyé (RESEND_API_KEY manquant) :', options.subject);
        return { succes: false, raison: 'Clé Resend non configurée' };
    }

    try {
        const { error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        });

        if (error) {
            console.error('❌ Erreur envoi email Resend :', error);
            return { succes: false, raison: error.message };
        }

        console.log('✅ Email envoyé à', options.to, '-', options.subject);
        return { succes: true };
    } catch (error) {
        console.error('❌ Erreur envoi email :', error.message);
        return { succes: false, raison: error.message };
    }
}

// Échappe les données saisies par le client avant de les insérer dans le HTML
function esc(valeur) {
    return String(valeur ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const POLICE = "'Segoe UI',Helvetica,Arial,sans-serif";

// Gabarit commun : mise en page en tableaux (compatible Gmail, Outlook, mobile)
function gabaritEmail({ titre, apercu, contenu }) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titre)}</title>
</head>
<body style="margin:0;padding:0;background:#F2F6FB;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F6FB;">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
      <tr><td style="padding:0 4px 18px;font-family:${POLICE};">
        <span style="font-size:22px;font-weight:800;letter-spacing:3px;color:#0C447C;">HYGIA</span>
        <span style="font-size:12px;color:#7A8CA3;padding-left:8px;">Matériel médical professionnel</span>
      </td></tr>
      <tr><td style="background:#FFFFFF;border-radius:14px;border-top:4px solid #185FA5;padding:36px 32px;font-family:${POLICE};color:#1F2D3D;">
        ${contenu}
      </td></tr>
      <tr><td style="padding:22px 8px 0;text-align:center;font-family:${POLICE};font-size:12px;line-height:1.6;color:#8A9AB0;">
        Hygia — Bamako, Mali<br>
        <a href="${FRONTEND_URL}" style="color:#185FA5;text-decoration:none;">Visiter la boutique</a>
        &nbsp;·&nbsp;
        <a href="${FRONTEND_URL}/contact.html" style="color:#185FA5;text-decoration:none;">Nous contacter</a><br>
        Vous recevez cet email suite à une action sur votre compte ou une commande Hygia.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function boutonEmail(lien, libelle) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;"><tr>
      <td style="background:#185FA5;border-radius:8px;">
        <a href="${lien}" style="display:inline-block;padding:14px 30px;font-family:${POLICE};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">${libelle}</a>
      </td></tr></table>`;
}

async function envoyerEmailBienvenue(utilisateur) {
    const { nom, email } = utilisateur;
    const prenom = String(nom || '').trim().split(/\s+/)[0] || 'et bienvenue';

    const sujet = 'Votre compte Hygia est prêt';

    const texte = `Bonjour ${prenom},

Votre compte Hygia a bien été créé.

Avec votre compte, vous pouvez :
- commander plus rapidement, vos coordonnées sont mémorisées ;
- suivre chaque commande, de la confirmation à la livraison ;
- cumuler des points fidélité à chaque achat.

Identifiant : ${email}

Découvrir le catalogue : ${FRONTEND_URL}/catalogue.html

L'équipe Hygia`;

    const avantage = (titre, detail) => `
      <tr>
        <td width="14" valign="top" style="padding:6px 0;"><div style="width:8px;height:8px;border-radius:50%;background:#FFC94A;margin-top:6px;"></div></td>
        <td style="padding:6px 0 6px 10px;font-size:14px;line-height:1.55;color:#44546A;"><strong style="color:#1F2D3D;">${titre}</strong><br>${detail}</td>
      </tr>`;

    const contenu = `
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0C447C;">Bienvenue, ${esc(prenom)}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#44546A;">Votre compte Hygia a bien été créé. Vous avez désormais accès à notre catalogue de matériel médical et à votre espace client.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${avantage('Commande rapide', 'Vos coordonnées sont mémorisées pour vos prochains achats.')}
          ${avantage('Suivi en temps réel', 'Suivez chaque commande, de la confirmation à la livraison.')}
          ${avantage('Points fidélité', 'Chaque achat vous rapporte des points.')}
        </table>
        ${boutonEmail(`${FRONTEND_URL}/catalogue.html`, 'Découvrir le catalogue')}
        <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E6ECF3;font-size:13px;line-height:1.6;color:#7A8CA3;">Identifiant de connexion : <strong style="color:#1F2D3D;">${esc(email)}</strong><br>Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.</p>`;

    const html = gabaritEmail({ titre: sujet, apercu: 'Votre compte est prêt. Commandez et suivez vos livraisons en toute simplicité.', contenu });

    return envoyerEmail({ to: email, subject: sujet, text: texte, html });
}

async function envoyerEmailRecapCommande(commande) {
    const { client, numero, articles, total, modePaiement, date } = commande;
    const email = client?.email;

    if (!email) {
        console.log('📧 Email de récap non envoyé : aucun email client.');
        return { succes: false, raison: 'Email client manquant' };
    }

    const estLivraison = String(modePaiement || '').toLowerCase().includes('livraison');
    const fraisLivraison = Number(commande.fraisLivraison) || 0;
    const reduction = Number(commande.reductionPartenaire) || 0;
    const sousTotal = articles.reduce((s, a) => s + (a.sousTotal || a.prix * a.quantite), 0);
    const lienSuivi = `${FRONTEND_URL}/commande-detail.html?numero=${encodeURIComponent(numero)}`;
    const libellePaiement = estLivraison ? 'Paiement à la livraison' : `Paiement en ligne (${modePaiement})`;
    const messagePaiement = estLivraison
        ? `Préparez ${formaterPrixFCFA(total)} pour le livreur à la réception.`
        : 'Votre commande sera préparée dès la confirmation de votre paiement.';

    // L'email part à la création de la commande, avant un éventuel paiement en ligne : on parle de commande « reçue »
    const sujet = `Commande ${numero} reçue — Hygia`;

    const dateFormatee = new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const prenom = String(client.nom || '').trim().split(/\s+/)[0];

    const lignes = articles.map(a =>
        `- ${a.nom} x${a.quantite} : ${formaterPrixFCFA(a.sousTotal || a.prix * a.quantite)}`
    ).join('\n');

    const texte = `Bonjour ${prenom},

Merci pour votre commande. Nous l'avons bien reçue.

Commande : ${numero}
Date     : ${dateFormatee}
Paiement : ${libellePaiement}

${lignes}

Sous-total : ${formaterPrixFCFA(sousTotal)}${reduction ? `\nRéduction  : -${formaterPrixFCFA(reduction)}` : ''}
Livraison  : ${fraisLivraison ? formaterPrixFCFA(fraisLivraison) : 'Offerte'}
Total      : ${formaterPrixFCFA(total)}

${messagePaiement}

Livraison à :
${client.nom}
${client.adresse}${client.commune ? ', ' + client.commune : ''}
${client.telephone}

Suivre ma commande : ${lienSuivi}

L'équipe Hygia`;

    const ligneMontant = (libelle, valeur, couleur = '#44546A') => `
      <tr>
        <td style="padding:5px 0;font-size:14px;color:#7A8CA3;">${libelle}</td>
        <td align="right" style="padding:5px 0;font-size:14px;color:${couleur};">${valeur}</td>
      </tr>`;

    const lignesHtml = articles.map(a => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #E6ECF3;font-size:14px;line-height:1.45;color:#1F2D3D;">
          ${esc(a.nom)}<br><span style="font-size:13px;color:#7A8CA3;">Quantité : ${Number(a.quantite)}</span>
        </td>
        <td align="right" valign="top" style="padding:14px 0 14px 12px;border-bottom:1px solid #E6ECF3;font-size:14px;font-weight:600;color:#1F2D3D;white-space:nowrap;">${formaterPrixFCFA(a.sousTotal || a.prix * a.quantite)}</td>
      </tr>`).join('');

    const contenu = `
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#185FA5;">Commande reçue</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0C447C;">Merci${prenom ? ', ' + esc(prenom) : ''}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#44546A;">Nous avons bien reçu votre commande. Vous serez informé par email à chaque étape de sa préparation et de sa livraison.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F9FD;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;font-size:13px;color:#7A8CA3;">Numéro<br><strong style="font-size:16px;color:#0C447C;letter-spacing:.5px;">${esc(numero)}</strong></td>
            <td align="right" style="padding:16px 18px;font-size:13px;color:#7A8CA3;">Date<br><strong style="font-size:14px;color:#1F2D3D;">${dateFormatee}</strong></td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          ${lignesHtml}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          ${ligneMontant('Sous-total', formaterPrixFCFA(sousTotal))}
          ${reduction ? ligneMontant('Réduction', '-' + formaterPrixFCFA(reduction), '#1E8E5A') : ''}
          ${ligneMontant('Livraison', fraisLivraison ? formaterPrixFCFA(fraisLivraison) : 'Offerte')}
          <tr>
            <td style="padding:14px 0 0;border-top:1px solid #E6ECF3;font-size:16px;font-weight:700;color:#1F2D3D;">Total</td>
            <td align="right" style="padding:14px 0 0;border-top:1px solid #E6ECF3;font-size:20px;font-weight:800;color:#8B2FC9;">${formaterPrixFCFA(total)}</td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#FFF9E8;border-left:4px solid #FFC94A;border-radius:6px;">
          <tr><td style="padding:14px 16px;font-size:14px;line-height:1.55;color:#5C4A12;"><strong>${esc(libellePaiement)}</strong><br>${esc(messagePaiement)}</td></tr>
        </table>

        <p style="margin:24px 0 6px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#7A8CA3;">Livraison</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#44546A;">
          <strong style="color:#1F2D3D;">${esc(client.nom)}</strong><br>
          ${esc(client.adresse)}${client.commune ? ', ' + esc(client.commune) : ''}<br>
          ${esc(client.telephone)}<br>
          <span style="color:#7A8CA3;">Délai estimé : 24 à 48h à Bamako</span>
        </p>

        ${boutonEmail(lienSuivi, 'Suivre ma commande')}`;

    const html = gabaritEmail({ titre: sujet, apercu: `Commande ${numero} — Total ${formaterPrixFCFA(total)}. Merci pour votre confiance.`, contenu });

    return envoyerEmail({ to: email, subject: sujet, text: texte, html });
}

async function envoyerEmailReinitialisationMotDePasse(email, nom, token) {
    const lien = `${FRONTEND_URL}/reinitialiser-mot-de-passe.html?token=${token}`;

    const sujet = 'Réinitialisation de votre mot de passe — Hygia';

    const texte = `Bonjour ${nom},

Vous avez demandé à réinitialiser votre mot de passe Hygia.

Cliquez sur ce lien pour choisir un nouveau mot de passe :
${lien}

Ce lien est valable 1 heure. Passé ce délai, vous devrez refaire une demande.

Si vous n'avez pas fait cette demande, ignorez cet email.

L'équipe Hygia`;

    const prenom = String(nom || '').trim().split(/\s+/)[0];

    const contenu = `
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#185FA5;">Sécurité du compte</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0C447C;">Réinitialisez votre mot de passe</h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#44546A;">Bonjour${prenom ? ' ' + esc(prenom) : ''}, nous avons reçu une demande de réinitialisation du mot de passe de votre compte Hygia. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
        ${boutonEmail(esc(lien), 'Choisir un nouveau mot de passe')}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#FFF9E8;border-left:4px solid #FFC94A;border-radius:6px;">
          <tr><td style="padding:14px 16px;font-size:14px;line-height:1.55;color:#5C4A12;">Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu'une fois.</td></tr>
        </table>
        <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E6ECF3;font-size:13px;line-height:1.6;color:#7A8CA3;">Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email : votre mot de passe actuel reste inchangé.<br>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${esc(lien)}" style="color:#185FA5;word-break:break-all;">${esc(lien)}</a></p>`;

    const html = gabaritEmail({ titre: sujet, apercu: 'Votre lien de réinitialisation, valable 1 heure.', contenu });

    return envoyerEmail({ to: email, subject: sujet, text: texte, html });
}

// Message, étape de suivi et couleur affichés pour chaque statut de commande
const INFOS_STATUT = {
    'Confirmée':       { etape: 2, couleur: '#185FA5', message: 'Votre commande est confirmée. Nous la préparons avec soin.' },
    'Payé non livré':  { etape: 2, couleur: '#185FA5', message: 'Votre paiement est confirmé. Nous préparons votre commande.' },
    'En livraison':    { etape: 3, couleur: '#8B2FC9', message: 'Votre colis a été remis au livreur. Il vous contactera par téléphone avant de passer.' },
    'Livrée':          { etape: 4, couleur: '#1E8E5A', message: 'Votre commande a été livrée. Merci pour votre confiance.' },
    'Payé livré':      { etape: 4, couleur: '#1E8E5A', message: 'Votre commande a été livrée. Merci pour votre confiance.' },
    'Annulée':         { etape: 0, couleur: '#C0392B', message: 'Votre commande a été annulée. Contactez-nous si vous pensez qu\'il s\'agit d\'une erreur.' },
    'Paiement échoué': { etape: 0, couleur: '#C0392B', message: 'Le paiement de votre commande n\'a pas abouti. Vous pouvez repasser commande ou nous contacter.' }
};

function suiviEmailHtml(etape, couleur) {
    const etapes = ['Reçue', 'Confirmée', 'En livraison', 'Livrée'];
    const cellules = etapes.map((libelle, i) => {
        const fait = i < etape;
        return `<td width="25%" align="center" style="padding:0 3px;">
            <div style="height:6px;border-radius:3px;background:${fait ? couleur : '#E4E9F0'};"></div>
            <div style="padding-top:8px;font-size:12px;font-weight:${fait ? '600' : '400'};color:${fait ? '#1F2D3D' : '#9AA8BA'};">${libelle}</div>
          </td>`;
    }).join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr>${cellules}</tr></table>`;
}

async function envoyerEmailNotificationStatutCommande(commande, ancienStatut) {
    const { nom, email } = commande.client || {};
    if (!email) return { succes: false, raison: 'Email client manquant' };

    const statut = commande.statut || 'En attente';
    const infos = INFOS_STATUT[statut] || { etape: 1, couleur: '#185FA5', message: 'Votre commande a été mise à jour.' };
    const prenom = String(nom || '').trim().split(/\s+/)[0];
    const lienSuivi = `${FRONTEND_URL}/commande-detail.html?numero=${encodeURIComponent(commande.numero)}`;

    const sujet = `Commande ${commande.numero} : ${statut.toLowerCase()} — Hygia`;

    const texte = `Bonjour${prenom ? ' ' + prenom : ''},

Votre commande ${commande.numero} est maintenant : ${statut}.
${infos.message}
${ancienStatut ? `\nStatut précédent : ${ancienStatut}` : ''}
Total : ${formaterPrixFCFA(commande.total)}

Suivre ma commande : ${lienSuivi}

L'équipe Hygia`;

    const contenu = `
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#185FA5;">Suivi de commande</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0C447C;">Commande <span style="color:${infos.couleur};">${esc(statut.toLowerCase())}</span></h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#44546A;">Bonjour${prenom ? ' ' + esc(prenom) : ''}, ${esc(infos.message.charAt(0).toLowerCase() + infos.message.slice(1))}</p>
        ${infos.etape > 0 ? suiviEmailHtml(infos.etape, infos.couleur) : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#F5F9FD;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;font-size:13px;color:#7A8CA3;">Numéro<br><strong style="font-size:16px;color:#0C447C;letter-spacing:.5px;">${esc(commande.numero)}</strong></td>
            <td align="right" style="padding:16px 18px;font-size:13px;color:#7A8CA3;">Total<br><strong style="font-size:16px;color:#8B2FC9;">${formaterPrixFCFA(commande.total)}</strong></td>
          </tr>
        </table>
        ${boutonEmail(lienSuivi, 'Suivre ma commande')}
        <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E6ECF3;font-size:13px;line-height:1.6;color:#7A8CA3;">Une question sur votre commande ? <a href="${FRONTEND_URL}/contact.html" style="color:#185FA5;text-decoration:none;">Contactez-nous</a> en indiquant votre numéro de commande.</p>`;

    const html = gabaritEmail({ titre: sujet, apercu: `${commande.numero} — ${infos.message}`, contenu });

    return envoyerEmail({ to: email, subject: sujet, text: texte, html });
}

module.exports = {
    envoyerEmailBienvenue,
    envoyerEmailRecapCommande,
    envoyerEmailReinitialisationMotDePasse,
    envoyerEmailNotificationStatutCommande,
    emailActif
};
