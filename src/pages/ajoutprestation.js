import React, { useState } from "react";
import "../styles/ajoutprestation.css"; // Assurez-vous d'importer le CSS

const AjoutPrestation = ({ showModal, onClose, onSubmit, users, collaborators, patrimoines, typesPrestations }) => {
    const [formData, setFormData] = useState({
        nom: '',
        id_type_prestation: '',
        created_by: '',
        duree: '',
        date_debut: '',
        date_fin: '',
        est_recurrent: false,
        id_chef: '',
        statut: '',
        id_collaborateur: [],
        id_patrimoine: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCollaboratorChange = (id) => {
        setFormData(prev => ({
            ...prev,
            id_collaborateur: prev.id_collaborateur.includes(id)
                ? prev.id_collaborateur.filter(item => item !== id)
                : [...prev.id_collaborateur, id]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    if (!showModal) return null;

    return (
        <div className="modal-overlayy">
            <div className="modal-content">
                <h2>Créer une nouvelle prestation</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nom de la prestation</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Type de prestation</label>
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
                    <div className="form-group">
                        <label>Créé par</label>
                        <select
                            name="created_by"
                            value={formData.created_by}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionner un utilisateur</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.firstname} {user.lastname}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Collaborateurs</label>
                        {collaborators.map(collab => (
                            <label key={collab.id}>
                                <input
                                    type="checkbox"
                                    checked={formData.id_collaborateur.includes(collab.id)}
                                    onChange={() => handleCollaboratorChange(collab.id)}
                                />
                                {collab.firstname} {collab.lastname}
                            </label>
                        ))}
                    </div>
                    <div className="form-group">
                        <label>Patrimoine</label>
                        <select
                            name="id_patrimoine"
                            value={formData.id_patrimoine}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionner un patrimoine</option>
                            {patrimoines.map(patrimoine => (
                                <option key={patrimoine.id} value={patrimoine.id}>{patrimoine.id}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Durée (en heures)</label>
                        <input
                            type="number"
                            name="duree"
                            value={formData.duree}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Date de début</label>
                        <input
                            type="date"
                            name="date_debut"
                            value={formData.date_debut}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Date de fin</label>
                        <input
                            type="date"
                            name="date_fin"
                            value={formData.date_fin}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                name="est_recurrent"
                                checked={formData.est_recurrent}
                                onChange={(e) => setFormData(prev => ({ ...prev, est_recurrent: e.target.checked }))}
                            />
                            Est récurrent
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Statut</label>
                        <input
                            type="text"
                            name="statut"
                            value={formData.statut}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onClose}>Annuler</button>
                        <button type="submit">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AjoutPrestation;