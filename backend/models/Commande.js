const mongoose = require('mongoose');
const Compteur = require('./Compteur');

const commandeSchema = new mongoose.Schema({
    numero: {
        type: String,
        unique: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    client: {
        nom: {
            type: String,
            required: true,
            trim: true
        },
        telephone: {
            type: String,
            required: true,
            trim: true
        },
        adresse: {
            type: String,
            required: true,
            trim: true
        },
        commune: {
            type: String,
            default: '',
            trim: true
        },
        email: {
            type: String,
            default: '',
            trim: true
        }
    },
    // Compte client connecté au moment de la commande (indépendant de l'email saisi)
    utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        default: null,
        index: true
    },
    articles: [
        {
            id: Number,
            nom: String,
            prix: Number,
            quantite: Number,
            sousTotal: Number
        }
    ],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    fraisLivraison: {
        type: Number,
        default: 0,
        min: 0
    },
    modePaiement: {
        type: String,
        required: true,
        trim: true
    },
    statut: {
        type: String,
        enum: [
            'En attente',
            'En attente paiement',
            'Confirmée',
            'Paiement échoué',
            'Payé non livré',
            'Payé livré',
            'En livraison',
            'Livrée',
            'Annulée'
        ],
        default: 'En attente'
    },
    transaction_id: {
        type: String,
        default: ''
    },
    // LigdiCash : identifiant marchand envoyé dans custom_data, et token de la facture (sert à appeler confirm)
    ligdicash_transaction_id: {
        type: String,
        default: '',
        index: true
    },
    ligdicash_token: {
        type: String,
        default: '',
        select: false
    },
    // Moneroo transaction ID (historique)
    moneroo_transaction_id: {
        type: String,
        default: ''
    },
    // Jɛmɛnipay session ID (en commentaire)
    jemeni_session_id: {
        type: String,
        default: ''
    },
    // PayTech token (en commentaire)
    paytech_token: {
        type: String,
        default: ''
    },
    xpay_reference: {
        type: String,
        default: ''
    },
    montant_paye: {
        type: Number,
        default: 0
    },
    paiement_confirme: {
        type: Boolean,
        default: false
    },
    // Clé secrète remise au client pour consulter sa commande sans compte
    cle_suivi: {
        type: String,
        select: false
    },
    notes: {
        type: String,
        default: '',
        trim: true
    },
    codePromoPartenaire: {
        type: String,
        default: '',
        trim: true,
        uppercase: true
    },
    reductionPartenaire: {
        type: Number,
        default: 0
    }
});

// Génération du numéro de commande avant sauvegarde
commandeSchema.pre('save', async function (next) {
    if (!this.isNew || this.numero) {
        return next();
    }

    try {
        const year = new Date().getFullYear();
        const idCompteur = `commande-${year}`;

        // Première utilisation du compteur : on repart du dernier numéro existant de l'année
        if (!(await Compteur.exists({ _id: idCompteur }))) {
            const derniere = await this.constructor
                .findOne({ numero: new RegExp(`^YMS-${year}\\d+$`) })
                .sort({ numero: -1 })
                .select('numero');
            const dernierNumero = derniere ? parseInt(derniere.numero.slice(8), 10) || 0 : 0;
            await Compteur.updateOne({ _id: idCompteur }, { $max: { seq: dernierNumero } }, { upsert: true })
                .catch(err => { if (err.code !== 11000) throw err; });
        }

        const { seq } = await Compteur.findOneAndUpdate(
            { _id: idCompteur },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        this.numero = `YMS-${year}${String(seq).padStart(4, '0')}`;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Commande', commandeSchema);
