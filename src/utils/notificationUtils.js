import { jwtDecode } from "jwt-decode";
import config from '../config';

/**
 * Envoie une notification à un utilisateur spécifique
 * @param {string} destinataireId - ID de l'utilisateur destinataire
 * @param {string} titre - Titre de la notification
 * @param {string} message - Corps du message de la notification
 * @param {string} statut - Statut de la notification ('envoyee' ou 'programmee')
 * @returns {Promise<Object|null>} - Résultat de l'envoi ou null en cas d'erreur
 */
export const envoyerNotification = async (destinataireId, titre, message, statut = 'envoyee') => {
    try {
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Aucun token d'authentification trouvé");
            return null;
        }

        
        const decodedToken = jwtDecode(token);
        const expediteurId = decodedToken.id;

        
        const userResponse = await fetch(`${config.API_BASE_URL}/users/${destinataireId}`);
        if (!userResponse.ok) {
            console.error(`Erreur lors de la récupération des informations de l'utilisateur ${destinataireId}`);
            return null;
        }
        
        const userData = await userResponse.json();

        if (!userData || !userData.fcm_token) {
            console.log(`L'utilisateur ${destinataireId} n'a pas de token FCM`);
            return null;
        }

        
        const now = new Date();
        const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');

        
        const notificationData = {
            titre: titre,
            body: message,
            id_expediteur: expediteurId,
            id_destinataire: destinataireId,
            date_envoi: mysqlDateTime,
            statut: statut,
            fcm_token: userData.fcm_token
        };

        console.log("Envoi de notification:", notificationData);

        
        const response = await fetch(`${config.API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(notificationData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de l\'envoi de la notification');
        }

        return await response.json();

    } catch (error) {
        console.error("Erreur d'envoi de notification:", error);
        return null;
    }
};

/**
 * Envoie une notification à plusieurs utilisateurs
 * @param {Array<string>} destinataireIds - Liste des IDs des utilisateurs destinataires
 * @param {string} titre - Titre de la notification
 * @param {string} message - Corps du message de la notification
 * @param {string} statut - Statut de la notification ('envoyee' ou 'programmee')
 * @returns {Promise<Array>} - Résultats des envois
 */
export const envoyerNotificationMultiple = async (destinataireIds, titre, message, statut = 'envoyee') => {
    if (!Array.isArray(destinataireIds) || destinataireIds.length === 0) {
        console.error("Aucun destinataire spécifié");
        return [];
    }

    const resultats = [];
    for (const destinataireId of destinataireIds) {
        const resultat = await envoyerNotification(destinataireId, titre, message, statut);
        resultats.push(resultat);
    }

    return resultats.filter(Boolean); 
};
