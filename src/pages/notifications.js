import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import config from '../config';
import '../styles/notifications.css';
import { FiSearch, FiX, FiCalendar, FiSend, FiPlus, FiClipboard, FiMessageSquare, FiUsers, FiClock } from 'react-icons/fi';

const Notifications = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    body: '',
    destinataires: [],
    dateEnvoi: new Date(),
    envoyerMaintenant: true
  });
  const [loading, setLoading] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [connectedUser, setConnectedUser] = useState(null);
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [showCollaboratorDropdown, setShowCollaboratorDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setConnectedUser(decodedToken);
      } catch (err) {
        console.error('Erreur lors du décodage du token:', err);
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);


  useEffect(() => {
    if (connectedUser) {
      fetchUsers();
      fetchNotifications();
    }
  }, [connectedUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/users/collab/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();

      if (Array.isArray(data)) {
        const usersWithTokens = data.filter(user => user?.fcm_token);
        
       
        const colors = [
          '#4a6cf7', '#00b884', '#f59e0b', '#3b82f6', '#ec4899',
          '#8b5cf6', '#10b981', '#f97316', '#6366f1', '#ef4444'
        ];
        
        const usersWithColors = usersWithTokens.map((user, index) => ({
          ...user,
          distinctColor: colors[index % colors.length]
        }));

        setUsers(usersWithColors);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Erreur lors du chargement des utilisateurs');
    }
  };


  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoadingNotifs(false);
    }
  };

 
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleEnvoi = () => {
    setFormData(prev => ({
      ...prev,
      envoyerMaintenant: !prev.envoyerMaintenant
    }));
  };


  const handleCollaboratorSearch = (e) => {
    setCollaboratorSearch(e.target.value);
    setShowCollaboratorDropdown(e.target.value.length > 0);
  };

  const filteredCollaborators = users.filter(user =>
    `${user.firstname} ${user.lastname}`.toLowerCase().includes(collaboratorSearch.toLowerCase())
  );


  const handleCollaboratorSelect = (id) => {
    setFormData(prev => ({
      ...prev,
      destinataires: prev.destinataires.includes(id)
        ? prev.destinataires.filter(item => item !== id)
        : [...prev.destinataires, id]
    }));
    setCollaboratorSearch('');
    setShowCollaboratorDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
  
    if (!connectedUser) {
      setError('Vous devez être connecté pour envoyer une notification');
      setLoading(false);
      return;
    }
  
    if (formData.destinataires.length === 0) {
      setError('Veuillez sélectionner au moins un destinataire');
      setLoading(false);
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      
     
      const adjustedDate = new Date(formData.dateEnvoi);
      adjustedDate.setHours(adjustedDate.getHours() - 2); 
      
     
      const mysqlDateTime = adjustedDate.toISOString().slice(0, 19).replace('T', ' ');
      
     
      const statut = formData.envoyerMaintenant ? 'envoyee' : 'programmee';
      
     
      if (statut === 'programmee' && adjustedDate < new Date()) {
        setError('La date de programmation ne peut pas être dans le passé. Veuillez choisir une date future ou envoyer immédiatement.');
        setLoading(false);
        return;
      }
      
      const sendPromises = formData.destinataires.map(async (destinataireId) => {
        const selectedUser = users.find(user => user.id === destinataireId);
        
        if (!selectedUser || !selectedUser.fcm_token) {
          console.warn(`Utilisateur ${destinataireId} n'a pas de FCM token valide`);
          return null;
        }
        
        const requestData = {
          titre: formData.titre,
          body: formData.body,
          id_expediteur: connectedUser.id,
          id_destinataire: destinataireId,
          date_envoi: mysqlDateTime,
          statut: statut,
          fcm_token: selectedUser.fcm_token
        };

        console.log("Envoi de la requête:", requestData);

        const response = await fetch(`${config.API_BASE_URL}/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur lors de l'envoi à ${selectedUser.firstname} ${selectedUser.lastname}`);
        }

        return await response.json();
      });

     
      const results = await Promise.all(sendPromises);
      
      if (formData.envoyerMaintenant) {
        setSuccess(`Notifications envoyées avec succès à ${results.filter(Boolean).length} destinataire(s) !`);
      } else {
        setSuccess(`Notifications programmées avec succès pour ${results.filter(Boolean).length} destinataire(s) !`);
      }
      
      setFormData({
        titre: '',
        body: '',
        destinataires: [],
        dateEnvoi: new Date(),
        envoyerMaintenant: false
      });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 4);
    return date.toLocaleString('fr-FR');
  };

  
  const closeModal = () => {
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  if (!connectedUser) {
    return <div className="notifications-container">Chargement...</div>;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <button
          className="add-notification-btn"
          onClick={() => setShowForm(true)}
        >
          <span className="add-notification-btn-icon">+</span> Créer une notification
        </button>
      </div>

       {/* Formulaire modal */}
       {showForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={handleModalClick}>
            <div className="modal-header">
              <h2><FiPlus /> Nouvelle notification</h2>
              <button className="close-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="notification-form">
              <div className="form-group">
                <label><FiClipboard /> Titre</label>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleInputChange}
                  placeholder="Entrez le titre"
                  required
                />
              </div>

              <div className="form-group">
                <label><FiMessageSquare /> Message</label>
                <textarea
                  id="body"
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  placeholder="Entrez votre message"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label><FiUsers /> Destinataires</label>
                <div className="collaborator-search-container">
                  <div className="search-input-container">
                    <FiSearch className="search" />
                    <input
                      type="text"
                      placeholder="Rechercher un destinataire"
                      value={collaboratorSearch}
                      onChange={handleCollaboratorSearch}
                      onFocus={() => setShowCollaboratorDropdown(true)}
                    />
                  </div>

                  {showCollaboratorDropdown && filteredCollaborators.length > 0 && (
                    <div className="collaborators-dropdown">
                      {filteredCollaborators.map(user => (
                        <div
                          key={user.id}
                          className="collaborator-option"
                          onClick={() => handleCollaboratorSelect(user.id)}
                          style={{
                            backgroundColor: users.distinctColor
                          }}
                        >
                          {user.firstname} {user.lastname}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="selected-collaborators">
                    {formData.destinataires.map(id => {
                      const selectedUser = users.find(u => u.id === id);
                      return (
                        <div
                          key={id}
                          className="selected-collaborator"
                          style={{
                            backgroundColor: selectedUser.distinctcolor || '#004797'
                          }}
                        >
                          {selectedUser.firstname} {selectedUser.lastname}
                          <span
                            className="remove-collaborator"
                            onClick={() => handleCollaboratorSelect(id)}
                          >
                            <FiX />
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  
                </div>
              </div>

              <div className="form-group">
                <label><FiClock /> Envoi</label>
                <div className="scheduling-group" style={{ display: 'flex', gap: '20px' }}>


                  <label className="scheduling-label">
                    <input
                      type="radio"
                      checked={formData.envoyerMaintenant}
                      onChange={handleToggleEnvoi}
                    />
                    Envoyer immédiatement
                  </label>

                  <label className="scheduling-label">
                    <input
                      type="radio"
                      checked={!formData.envoyerMaintenant}
                      onChange={handleToggleEnvoi}
                    />
                    Programmer l'envoi
                  </label>

                </div>
              </div>

              {!formData.envoyerMaintenant && (
                <div className="form-group">
                  <label><FiCalendar /> Date et heure d'envoi</label>
                  <input
                    type="datetime-local"
                    id="dateEnvoi"
                    value={new Date(formData.dateEnvoi.getTime() - formData.dateEnvoi.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        dateEnvoi: selectedDate
                      }));
                    }}
                    min={new Date().toISOString().slice(0, 16)}
                    className="date-picker-input"
                  />
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={closeModal}
                >
                  <FiX /> Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={loading}
                >
                  <FiSend /> {loading ? 'Envoi en cours...' : formData.envoyerMaintenant ? 'Envoyer' : 'Programmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Liste des notifications */}
      <div className="notifications-list-container">
        <h2>Historiques des notifications</h2>

        {loadingNotifs ? (
          <div className="loading">Chargement des notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">Aucune notification disponible</div>
        ) : (
          <div className="notifications-list">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Message</th>
                  <th>Expéditeur</th>
                  <th>Destinataire</th>
                  <th>Date d'envoi</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id} className={`notification-item status-${notif.statut}`}>
                    <td>{notif.titre}</td>
                    <td>{notif.body}</td>
                    <td>{notif.expediteur_prenom} {notif.expediteur_nom}</td>
                    <td>{notif.destinataire_prenom} {notif.destinataire_nom}</td>
                    <td>{formatDate(notif.date_envoi)}</td>
                    <td>
                      <span className={`status-badge ${notif.statut}`}>
                        {notif.statut === 'programmee' ? 'Programmée' :
                         notif.statut === 'envoyee' ? 'Envoyée' :
                         notif.statut === 'echec' ? 'Échec' : notif.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;