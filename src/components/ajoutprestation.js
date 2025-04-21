import React, { useState, useEffect } from "react";
import { FiPlus, FiX, FiCheck, FiSave, FiUser, FiCalendar, FiBriefcase, FiTag, FiClipboard, FiSearch } from "react-icons/fi";
import config from '../config';
import "../styles/ajoutprestation.css";

const AddPrestationModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        nom: '',
        id_type_prestation: '',
        created_by: '',
        duree: '',
        date_debut: '',
        date_fin: '',
        est_recurrent: '0',
        id_chef: '',
        statut: 'Planifiée',
        id_collaborateur: [],
        id_patrimoine: ''
    });

    const [typesPrestations, setTypesPrestations] = useState([]);
    const [patrimoines, setPatrimoines] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [collaboratorSearch, setCollaboratorSearch] = useState('');
    const [showCollaboratorDropdown, setShowCollaboratorDropdown] = useState(false);

    
    useEffect(() => {
        let timeoutId;
        if (showSuccessPopup) {
           
            timeoutId = setTimeout(() => {
                setShowSuccessPopup(false);
                onClose(); 
            }, 3000);
        }

        
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [showSuccessPopup, onClose]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersResponse, typesResponse, patrimoinesResponse] = await Promise.all([
                    fetch(`${config.API_BASE_URL}/users/all`),
                    fetch(`${config.API_BASE_URL}/prestations/types-prestations/all`),
                    fetch(`${config.API_BASE_URL}/patrimoines/all`)
                ]);

                const usersData = await usersResponse.json();
                const typesData = await typesResponse.json();
                const patrimoinesData = await patrimoinesResponse.json();

                setTypesPrestations(typesData);
                setPatrimoines(patrimoinesData);
                
                const collaboratorsData = usersData.filter(user => 
                    user.role === 'Collab' || user.role === 'Collaborateur'
                );
                const adminUsersData = usersData.filter(user => 
                    user.role === 'Admin' || user.role === 'GTI' || user.role === 'DAF'
                );

                setCollaborators(collaboratorsData);
                setAdminUsers(adminUsersData);
                setLoading(false);
            } catch (error) {
                console.error("Erreur de chargement des données:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCollaboratorSearch = (e) => {
        setCollaboratorSearch(e.target.value);
        setShowCollaboratorDropdown(e.target.value.length > 0);
    };

    const filteredCollaborators = collaborators.filter(collab => 
        `${collab.firstname} ${collab.lastname}`.toLowerCase().includes(collaboratorSearch.toLowerCase())
    );

    const handleCollaboratorSelect = (id) => {
        setFormData(prev => ({
            ...prev,
            id_collaborateur: prev.id_collaborateur.includes(id)
                ? prev.id_collaborateur.filter(item => item !== id)
                : [...prev.id_collaborateur, id]
        }));
        setCollaboratorSearch('');
        setShowCollaboratorDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${config.API_BASE_URL}/prestations/ajout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    id_collaborateurs: formData.id_collaborateur
                })
            });
    
            const responseData = await response.json();
    
            if (response.ok) {
                setShowSuccessPopup(true);
            } else {
                console.error("Détails de l'erreur:", responseData);
                alert(`Erreur: ${responseData.message || 'Impossible d\'ajouter la prestation'}`);
            }
        } catch (error) {
            console.error("Erreur de soumission détaillée:", error);
            alert("Une erreur s'est produite lors de la soumission");
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content loading">
                    <div className="spinner"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2><FiPlus /> Créer une nouvelle prestation</h2>
                        <button className="close-btn" onClick={onClose}><FiX /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="prestation-formulaire">
                        <div className="formulaire-grid">
                            <div className="formulaire-groupe">
                                <label><FiClipboard /> Nom de la prestation</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nom de la prestation"
                                />
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiBriefcase /> Type de prestation</label>
                                <select
                                    name="id_type_prestation"
                                    value={formData.id_type_prestation}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Sélectionner un type</option>
                                    {typesPrestations.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiUser /> Créé par</label>
                                <select
                                    name="created_by"
                                    value={formData.created_by}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Sélectionner un utilisateur</option>
                                    {adminUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstname} {user.lastname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiUser /> Chef</label>
                                <select
                                    name="id_chef"
                                    value={formData.id_chef}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Sélectionner un chef</option>
                                    {adminUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstname} {user.lastname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiCalendar /> Durée (minutes)</label>
                                <input
                                    type="number"
                                    name="duree"
                                    value={formData.duree}
                                    onChange={handleChange}
                                    required
                                    placeholder="Durée en minutes"
                                />
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiCalendar /> Date et heure de début</label>
                                <div className="datetime-input">
                                    <input
                                        type="datetime-local"
                                        name="date_debut"
                                        value={formData.date_debut}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiCalendar /> Date et heure de fin</label>
                                <div className="datetime-input">
                                    <input
                                        type="datetime-local"
                                        name="date_fin"
                                        value={formData.date_fin}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="formulaire-groupe">
                                <label><FiTag /> Patrimoine</label>
                                <select
                                    name="id_patrimoine"
                                    value={formData.id_patrimoine}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Sélectionner un patrimoine</option>
                                    {patrimoines.map(patrimoine => (
                                        <option key={patrimoine.id} value={patrimoine.id}>
                                            {patrimoine.id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="formulaire-groupe full-width">
                                <label>Collaborateurs</label>
                                <div className="collaborator-search-container">
                                    <div className="search-input-container">
                                        <FiSearch className="search" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher un collaborateur"
                                            value={collaboratorSearch}
                                            onChange={handleCollaboratorSearch}
                                            onFocus={() => setShowCollaboratorDropdown(true)}
                                        />
                                    </div>
                                    {showCollaboratorDropdown && filteredCollaborators.length > 0 && (
                                        <div className="collaborators-dropdown">
                                            {filteredCollaborators.map(collab => (
                                                <div 
                                                    key={collab.id} 
                                                    className="collaborator-option"
                                                    onClick={() => handleCollaboratorSelect(collab.id)}
                                                    style={{
                                                        backgroundColor: collab.distinctColor 
                                                    }}
                                                >
                                                    {collab.firstname} {collab.lastname}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="selected-collaborators">
                                        {formData.id_collaborateur.map(id => {
                                            const selectedCollab = collaborators.find(c => c.id === id);
                                            return (
                                                <div 
                                                    key={id} 
                                                    className="selected-collaborator"
                                                    style={{
                                                        backgroundColor: selectedCollab.distinctcolor || '#004797'
                                                    }}
                                                >
                                                    {selectedCollab.firstname} {selectedCollab.lastname}
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

                            <div className="formulaire-groupe checkbox-group">
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.est_recurrent === "1"}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            est_recurrent: e.target.checked ? "1" : "0" 
                                        }))}
                                    />
                                    <span className="checkmark"></span>
                                    Prestation récurrente
                                </label>
                            </div>
                        </div>

                        <div className="formulaire-actions">
                            <button type="button" className="bt-cancel" onClick={onClose}>
                                <FiX /> Annuler
                            </button>
                            <button type="submit" className="btn-submit">
                                <FiSave /> Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showSuccessPopup && (
                <div className="success-popUp">
                    <div className="success-popUp-inner">
                        <div className="success-popUp-icon">
                            <FiCheck />
                        </div>
                        <h3>Prestation ajoutée avec succès</h3>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddPrestationModal;