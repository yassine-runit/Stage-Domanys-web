import React, { useState, useEffect } from 'react';
import "../styles/utilisateurs.css";  
import config from '../config';
import { useNavigate } from 'react-router-dom';
import { ShowIcon, HideIcon } from "../Themes/Images";

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [showSuccessEditPopup, setShowSuccessEditPopup] = useState(false);
  const [showSuccessDeletePopup, setShowSuccessDeletePopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [agences, setAgences] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [newUtilisateurData, setNewUtilisateurData] = useState({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    role: '',
    civility: '',
    agencyid: '',
    active: true,
    distinctcolor: '#ffffff'
  });

  const navigate = useNavigate();
  
 
  const civilityOptions = ['Mr.', 'Mme.'];
  const roleOptions = ['GTI', 'DAF', 'Collab'];

  useEffect(() => {
    
    const storedUserRole = localStorage.getItem("userRole");
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }
    
    fetchAgences();
    
    fetchUtilisateurs(storedUserRole);
    
    console.log("Rôle de l'utilisateur connecté:", storedUserRole);
  }, []);

  const fetchAgences = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/agences/all`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      setAgences(data);
    } catch (error) {
      setError('Erreur lors du chargement des agences');
    }
  };

  const fetchUtilisateurs = async (role) => {
    setIsLoading(true);
    setError(null);
    try {
      // Si l'utilisateur est admin, récupérer tous les utilisateurs
      const endpoint = role === 'Admin' || role === 'admin' || role === 'ADMIN' 
        ? `${config.API_BASE_URL}/users/all` 
        : `${config.API_BASE_URL}/users/collab/all`;
      
      console.log("Endpoint utilisé:", endpoint);
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      
      // Normalize data to handle API field differences
      const normalizedData = data.map(user => ({
        ...user,
        civility: user.civility || user.civility,
        active: user.active !== undefined ? user.active : true,
        distinctcolor: user.distinctcolor || '#ffffff'
      }));
      
      setUtilisateurs(normalizedData);
    } catch (error) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error("Erreur détaillée:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredUsers = utilisateurs.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    setConfirmation({
      message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      onConfirm: async () => {
        if (!id) return;
        setIsLoading(true);
        try {
          await fetch(`${config.API_BASE_URL}/users/delete/${id}`, { method: 'DELETE' });
          await fetchUtilisateurs(userRole);
          setConfirmation(null);
          setShowSuccessDeletePopup(true);
          setTimeout(() => setShowSuccessDeletePopup(false), 2000);
        } catch (error) {
          setError('Erreur lors de la suppression de l\'utilisateur');
        } finally {
          setIsLoading(false);
        }
      },
      onCancel: () => setConfirmation(null)
    });
  };

  const handleEdit = (index, user) => {
    setEditingIndex(index);
    setFormData(user);
    setOriginalData(user);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleActiveChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: checked }));
  };

  const handleNewUtilisateurInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setNewUtilisateurData(prevData => ({ ...prevData, [name]: checked }));
    } else {
      setNewUtilisateurData(prevData => ({ ...prevData, [name]: value }));
    }
  };

  const handleSubmit = async (e, userId) => {
    e.preventDefault();
    if (!userId) return;

    setConfirmation({
      message: 'Êtes-vous sûr de vouloir modifier cet utilisateur ?',
      onConfirm: async () => {
        setIsLoading(true);
        setError(null);

        try {
          const dataToSend = {};
          Object.keys(formData).forEach(key => {
           
            if (key === 'password' && !formData[key]) return;
            
           
            if (typeof formData[key] === 'boolean') {
              dataToSend[key] = formData[key];
              return;
            }
            
            if (formData[key] !== originalData[key] && formData[key] !== "") {
              dataToSend[key] = formData[key];
            }
          });

          if (Object.keys(dataToSend).length === 0) {
            alert("Aucune modification détectée.");
            setIsLoading(false);
            return;
          }

          await fetch(`${config.API_BASE_URL}/users/modif/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          setShowSuccessEditPopup(true);
          setTimeout(() => setShowSuccessEditPopup(false), 2000);
          setEditingIndex(-1);
          await fetchUtilisateurs(userRole);
        } catch (error) {
          setError(`Erreur lors de la modification: ${error.message}`);
        } finally {
          setIsLoading(false);
          setConfirmation(null);
        }
      },
      onCancel: () => setConfirmation(null)
    });
  };

  const handleAddUtilisateur = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const dataToSend = { ...newUtilisateurData };
      
      const response = await fetch(`${config.API_BASE_URL}/users/ajout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      await fetchUtilisateurs(userRole);
      setShowAddPopup(false);
      setNewUtilisateurData({
        username: '',
        password: '',
        firstname: '',
        lastname: '',
        role: '',
        civility: '',
        agencyid: '',
        active: true,
        distinctcolor: '#ffffff'
      });
      
      setShowSuccessEditPopup(true);
      setTimeout(() => setShowSuccessEditPopup(false), 2000);
    } catch (error) {
      setError(`Erreur lors de l'ajout de l'utilisateur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closeEditForm = () => {
    setEditingIndex(-1);
  };

  
  const getFilteredRoleOptions = () => {
    console.log("Current user role:", userRole);
    
    
    if (userRole === 'Admin' || userRole === 'admin' || userRole === 'ADMIN') {
      return roleOptions; // Return all roles for Admin
    } else if (userRole === 'GTI' || userRole === 'DAF') {
      return ['Collab'];
    }
    return ['Collab']; 
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <div className="utilisateurs-container">
      <div className="utilisateurs-header">
        
        

        
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchTerm} 
            onChange={handleSearch} 
          />
          {searchTerm && (
            <button className="btn-clear-search" onClick={clearSearch}>
              ×
            </button>
          )}
        </div>
        
        <div className="header-right">
          <h1>Utilisateurs</h1>
          <button className="btn-add" onClick={() => setShowAddPopup(true)}>
            <span className="btn-add-icon">+</span> Ajouter un utilisateur
          </button>
        </div>
          
          
        
      </div>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Chargement en cours...</div>}

      <div className="utilisateurs-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <div key={index} className="user-item">
              <div className="user-info">
                <span className="user-color" style={{ backgroundColor: user.distinctcolor }}></span>
                <span className="firstname">{user.firstname}</span>
                <span className="lastname">{user.lastname}</span>
                <span className="role">{user.role}</span>
                
              </div>
              <div className="user-actions">
                <button className="btn-edit" onClick={() => handleEdit(index, user)} disabled={isLoading}>Modifier</button>
                <button className="btn-delete" onClick={() => handleDelete(user._id || user.id)} disabled={isLoading}>Supprimer</button>
              </div>

              {editingIndex === index && (
                <div className="edit-form-container">
                  <form onSubmit={(e) => handleSubmit(e, user._id || user.id)} className="edit-form">
                    <div className="form-group">
                      <label>Civilité:</label>
                      <select name="civility" value={formData.civility || ""} onChange={handleInputChange} required>
                        <option value="">Sélectionnez une civilité</option>
                        {civilityOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nom d'utilisateur:</label>
                      <input type="text" name="username" value={formData.username} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group password-field">
                      <label>Mot de passe (laisser vide pour ne pas modifier):</label>
                      <div className="password-input-container">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password" 
                          value={formData.password || ''} 
                          onChange={handleInputChange} 
                        />
                        <span className="password-toggle" onClick={togglePasswordVisibility}>
                          {showPassword ? <img src={HideIcon} alt="Hide" className="hide-icon" /> : <img src={ShowIcon} alt="Show" className="show-icon" />}
                        </span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Prénom:</label>
                      <input type="text" name="firstname" value={formData.firstname} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Nom:</label>
                      <input type="text" name="lastname" value={formData.lastname} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Agence:</label>
                      <select 
                        name="agencyid" 
                        value={formData.agencyid} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="">Sélectionnez une agence</option>
                        {agences.map((agency) => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name || agency.nom || agency.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Rôle:</label>
                      <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="">Sélectionnez un rôle</option>
                        {getFilteredRoleOptions().map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Couleur distinctive:</label>
                      <input 
                        type="color" 
                        name="distinctcolor" 
                        value={formData.distinctcolor || '#ffffff'} 
                        onChange={handleColorChange} 
                      />
                    </div>
                    <div className="form-group toggle-switch-container">
                      <label>Compte actif:</label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          name="active" 
                          checked={formData.active !== undefined ? formData.active : true} 
                          onChange={handleActiveChange} 
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    {formData.lastconnexiontime && (
                      <div className="form-group">
                        <label>Dernière connexion:</label>
                        <input type="text" name="lastconnexiontime" value={formData.lastconnexiontime} disabled />
                      </div>
                    )}
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
                      <button type="button" className="btn-cancel" onClick={closeEditForm} disabled={isLoading}>Annuler</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : <div className="no-results">Aucun utilisateur trouvé</div>}
      </div>

      {confirmation && (
        <div className="confirmation-popup">
          <p>{confirmation.message}</p>
          <button className="confirm-btn" onClick={confirmation.onConfirm}>Oui</button>
          <button className="cancel-btn" onClick={confirmation.onCancel}>Non</button>
        </div>
      )}

      {showSuccessEditPopup && (
        <div className="success-popup">
          <p>Opération réussie !</p>
        </div>
      )}

      {showSuccessDeletePopup && (
        <div className="success-popup">
          <p>Suppression réussie !</p>
        </div>
      )}

      {showAddPopup && (
        <div className="add-popup-overlay">
          <div className="add-popup">
            <h2>Ajouter un utilisateur</h2>
            <form onSubmit={handleAddUtilisateur} className="add-form">
              <div className="add-form-content">
                <div className="form-group">
                  <label>Civilité:</label>
                  <select name="civility" value={newUtilisateurData.civility} onChange={handleNewUtilisateurInputChange} required>
                    <option value="">Sélectionnez une civilité</option>
                    {civilityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nom d'utilisateur:</label>
                  <input type="text" name="username" value={newUtilisateurData.username} onChange={handleNewUtilisateurInputChange} required />
                </div>
                <div className="form-group password-field">
                  <label>Mot de passe:</label>
                  <div className="password-input-container">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      name="password" 
                      value={newUtilisateurData.password} 
                      onChange={handleNewUtilisateurInputChange} 
                      required 
                    />
                    <span className="password-toggle" onClick={toggleNewPasswordVisibility}>
                      {showNewPassword ? <img src={HideIcon} alt="Hide" className="hide-icon" /> : <img src={ShowIcon} alt="Show" className="show-icon" />}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Prénom:</label>
                  <input type="text" name="firstname" value={newUtilisateurData.firstname} onChange={handleNewUtilisateurInputChange} required />
                </div>
                <div className="form-group">
                  <label>Nom:</label>
                  <input type="text" name="lastname" value={newUtilisateurData.lastname} onChange={handleNewUtilisateurInputChange} required />
                </div>
                <div className="form-group">
                  <label>Agence:</label>
                  <select 
                    name="agencyid" 
                    value={newUtilisateurData.agencyid} 
                    onChange={handleNewUtilisateurInputChange} 
                    required
                  >
                    <option value="">Sélectionnez une agence</option>
                    {agences.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name || agency.nom || agency.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Rôle:</label>
                  <select 
                    name="role" 
                    value={newUtilisateurData.role} 
                    onChange={handleNewUtilisateurInputChange} 
                    required
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {getFilteredRoleOptions().map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Couleur distinctive:</label>
                  <input 
                    type="color" 
                    name="distinctcolor" 
                    value={newUtilisateurData.distinctcolor} 
                    onChange={handleNewUtilisateurInputChange} 
                  />
                </div>
                <div className="form-group toggle-switch-container">
                  <label>Compte actif:</label>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="active" 
                      checked={newUtilisateurData.active} 
                      onChange={handleNewUtilisateurInputChange} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div className="add-form-actions">
                <button type="submit" className="btn-save" disabled={isLoading}>
                  {isLoading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowAddPopup(false)} disabled={isLoading}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilisateurs;