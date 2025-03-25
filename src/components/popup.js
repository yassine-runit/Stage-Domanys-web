import React from 'react';
import {  PatrimoineIcon, LocationIcon, heure_arrivee, heure_depart} from "../Themes/Images";

const EventPopup = ({ event, onClose, onValidate }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}`;
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={onClose}>×</button>
        <h2>{event.type_prestation_name}</h2>
        <div className="popup-date">
          {formatDate(event.date_debut)} • {new Date(event.date_debut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.date_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="popup-section">
          <div className="popup-icon"><img src={PatrimoineIcon} /></div>
          <div className="popup-details">
            <h3>Référence patrimoine</h3>
            <p>{event.id_patrimoine}</p>
          </div>
        </div>
        <div className="popup-section">
          <div className="popup-icon"><img src={LocationIcon} /></div>
          <div className="popup-details">
            <h3>Adresse</h3>
            <p>{event.streetnumber} {event.streetname}</p>
          </div>
        </div>
        <div className="popup-section">
          <div className="popup-icon"><img src={heure_arrivee} /></div>
          <div className="popup-details">
            <h3>Heure d'arrivée</h3>
            <p>{event.heure_arrivee}</p>
          </div>
        </div>
        <div className="popup-section">
          <div className="popup-icon"><img src={heure_depart} /></div>
          <div className="popup-details">
            <h3>Heure de départ</h3>
            <p>{event.heure_depart}</p>
          </div>
        </div>
        <div className="popup-actions">
          <button className="popup-cancel" onClick={onClose}>Annuler</button>
          <button className="popup-validate" onClick={onValidate}>Valider</button>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;