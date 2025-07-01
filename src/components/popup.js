import React, { useEffect, useState } from 'react';
import { PatrimoineIcon, LocationIcon, heure_arrivee, heure_depart } from "../Themes/Images";
import "../styles/popup.css";
import config from "../config";
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { usePrestations } from "../context/PrestationsContext";
import { envoyerNotification } from "../utils/notificationUtils";

const EventPopup = ({ event, onClose, onValidate, onDelete }) => {
  const { deletePrestation, validatePrestation } = usePrestations();
  const [pointage, setPointage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchPointage = async () => {
      try {
        setLoading(true);
        console.log("Fetching pointage for prestation ID:", event.id);
        const response = await fetch(`${config.API_BASE_URL}/pointages/prestation/${event.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.log("Aucun pointage trouvé pour cette prestation");
            setPointage(null);
            return;
          }
          throw new Error('Erreur lors de la récupération des pointages');
        }
        const pointage = await response.json();
        console.log("Pointage brut reçu:", pointage);
        console.log("Heure arrivée brute:", pointage?.heure_arrivee);
        console.log("Heure départ brute:", pointage?.heure_depart);
        setPointage(pointage);
      } catch (error) {
        console.error("Erreur lors de la récupération des pointages:", error);
        setPointage(null);
      } finally {
        setLoading(false);
      }
    };

    if (event && event.id) {
      fetchPointage();
    }
  }, [event]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}`;
  };

  const extractTime = (dateString) => {
    if (!dateString) return "00:00";
    if (dateString.includes('T')) {
      const timePart = dateString.split('T')[1];
      return timePart.substring(0, 5);
    }
   
    if (dateString.includes(' ')) {
      const timePart = dateString.split(' ')[1];
      return timePart.substring(0, 5);
    }
    return "00:00";
  };

  const addTwoHours = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const adjustedHours = (parseInt(hours) + 2) % 24;
      return `${adjustedHours.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.error("Erreur d'ajustement de l'heure:", error);
      return timeString;
    }
  };

  const addThreeHours = (timeString) => {
    try {
      if (!timeString || timeString === "Non pointé") return timeString;
      console.log("Heure avant ajustement:", timeString);

      if (timeString.includes('T')) {
        const timePart = timeString.split('T')[1];
        const [hours, minutes] = timePart.split(':');
        const adjustedHours = (parseInt(hours) + 3) % 24;
        const result = `${adjustedHours.toString().padStart(2, '0')}:${minutes}`;
        console.log("Heure après ajustement (ISO):", result);
        return result;
      }
      if (timeString.includes(' ')) {
        const timePart = timeString.split(' ')[1];
        const [hours, minutes] = timePart.split(':');
        const adjustedHours = (parseInt(hours) + 3) % 24;
        const result = `${adjustedHours.toString().padStart(2, '0')}:${minutes}`;
        console.log("Heure après ajustement (date complète):", result);
        return result;
      }
      const [hours, minutes] = timeString.split(':');
      const adjustedHours = (parseInt(hours) + 3) % 24;
      const result = `${adjustedHours.toString().padStart(2, '0')}:${minutes}`;
      console.log("Heure après ajustement (heure simple):", result);
      return result;
    } catch (error) {
      console.error("Erreur d'ajustement de l'heure:", error);
      return timeString;
    }
  };

  const formatTimeFromDB = (timeString) => {
    try {
      if (!timeString) return "Non pointé";
      if (timeString.includes(' ')) {
        const timePart = timeString.split(' ')[1];
        const [hours, minutes] = timePart.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.error("Erreur de formatage de l'heure:", error);
      return "00:00";
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setError(null);

      const result = await deletePrestation(event.id);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      console.log('Prestation supprimée:', result.data);

      if (event.id_collaborateur) {
        try {
          const dateObj = new Date(event.date_debut);
          const formattedDate = dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });

          await envoyerNotification(
            event.id_collaborateur,
            "Prestation supprimée",
            `La prestation du ${formattedDate} a été supprimée.`
          );

          console.log("Notification de suppression envoyée au collaborateur:", event.id_collaborateur);
        } catch (notifError) {
          console.error("Erreur lors de l'envoi de la notification:", notifError);
        }
      }

      setShowConfirmDelete(false);
      onClose();
      onDelete();

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      console.log("Envoi de la validation pour l'événement:", event);

      const formatDateForAPI = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };

      const formattedDateDebut = formatDateForAPI(event.date_debut);
      const formattedDateFin = formatDateForAPI(event.date_fin);

      console.log("Dates formatées:", {
        date_debut: formattedDateDebut,
        date_fin: formattedDateFin
      });

      const result = await validatePrestation(event.id, formattedDateDebut, formattedDateFin);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }

      console.log("Réponse de validation:", result.data);

      if (event.id_collaborateur) {
        try {
          const dateObj = new Date(event.date_debut);
          const formattedDate = dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });

          await envoyerNotification(
            event.id_collaborateur,
            "Prestation validée",
            `La prestation du ${formattedDate} a été validée.`
          );

          console.log("Notification de validation envoyée au collaborateur:", event.id_collaborateur);
        } catch (notifError) {
          console.error("Erreur lors de l'envoi de la notification:", notifError);
        }
      }

      onValidate({ ...event, statut: 'Validée' });
   
      setShowSuccessMessage(true);
  
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    }
  };

  return (
    <>
      <div className="popup-overlay">
        <div className="popup-content">
          <button className="popup-close" onClick={onClose}>×</button>
          <h2>{event.type_prestation_name}</h2>
          <div className="popup-date">
            {formatDate(event.date_debut)} • {addTwoHours(extractTime(event.date_debut))} - {addTwoHours(extractTime(event.date_fin))}
          </div>
          <div className="popup-section">
            <div className="popup-icon"><img src={PatrimoineIcon} alt="Icône patrimoine" /></div>
            <div className="popup-details">
              <h3>Référence patrimoine</h3>
              <p>{event.id_patrimoine}</p>
            </div>
          </div>
          <div className="popup-section">
            <div className="popup-icon"><img src={LocationIcon} alt="Icône localisation" /></div>
            <div className="popup-details">
              <h3>Adresse</h3>
              <p>{event.streetnumber} {event.streetname}</p>
            </div>
          </div>
          <div className="popup-section">
            <div className="popup-icon"><img src={heure_arrivee} alt="Icône heure d'arrivée" /></div>
            <div className="popup-details">
              <h3>Heure d'arrivée</h3>
              <p>
                {loading ? (
                  "Chargement..."
                ) : pointage ? (
                  addThreeHours(pointage.heure_arrivee)
                ) : (
                  "Non pointé"
                )}
              </p>
            </div>
          </div>
          <div className="popup-section">
            <div className="popup-icon"><img src={heure_depart} alt="Icône heure de départ" /></div>
            <div className="popup-details">
              <h3>Heure de départ</h3>
              <p>
                {loading ? (
                  "Chargement..."
                ) : pointage ? (
                  addThreeHours(pointage.heure_depart)
                ) : (
                  "Non pointé"
                )}
              </p>
            </div>
          </div>
          {error && <div className="popup-error">{error}</div>}
          <div className="popup-actions">
            <button className="popup-delete" onClick={() => setShowConfirmDelete(true)} disabled={deleteLoading}>
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </button>
            <button className="popup-validate" onClick={handleValidate}>Valider</button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette prestation ?"
        loading={deleteLoading}
      />
    </>
  );
};

export default EventPopup;