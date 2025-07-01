import React, { useState, useEffect } from 'react';
import "../styles/agences.css";
import config from '../config';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Agences = () => {
  const [agences, setAgences] = useState([]);
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
  const [newAgenceData, setNewAgenceData] = useState({
    agencynumber: '',
    code: '',
    postalcode: '',
    city: '',
    street: '',
    name: '',
    phone: '',
    fax: '',
    email: ''
  });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAgences();
  }, []);

  const fetchAgences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_BASE_URL}/agences/all`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setAgences(data);
    } catch (error) {
      setError('Erreur lors du chargement des agences');
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

  const filteredAgences = agences.filter(agence =>
    agence.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (agence) => {
    setSelectedAgence(agence);
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAgence) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/agences/delete/${selectedAgence.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setAgences(agences.filter(a => a.id !== selectedAgence.id));
      setShowConfirmDelete(false);
      setSelectedAgence(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression de l\'agence');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (index, agence) => {
    setEditingIndex(index);


    const completeFormData = {
      agencynumber: agence.agencynumber || '',
      code: agence.code || '',
      postalcode: agence.postalcode || '',
      city: agence.city || '',
      street: agence.street || '',
      name: agence.name || '',
      phone: agence.phone || '',
      fax: agence.fax || '',
      email: agence.email || ''
    };

    setFormData(completeFormData);
    setOriginalData({ ...completeFormData });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleNewAgenceInputChange = (e) => {
    const { name, value } = e.target;
    setNewAgenceData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e, agenceId) => {
    e.preventDefault();
    if (!agenceId) return;

    setConfirmation({
      message: 'Êtes-vous sûr de vouloir modifier cette agence ?',
      onConfirm: async () => {
        setIsLoading(true);
        setError(null);

        try {
          const dataToSend = {};
          Object.keys(formData).forEach(key => {
            if (formData[key] !== originalData[key] && formData[key] !== "") {
              dataToSend[key] = formData[key];
            }
          });

          if (Object.keys(dataToSend).length === 0) {
            alert("Aucune modification détectée.");
            setIsLoading(false);
            return;
          }

          await fetch(`${config.API_BASE_URL}/agences/modif/${agenceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          setShowSuccessEditPopup(true);
          setTimeout(() => setShowSuccessEditPopup(false), 2000);
          setEditingIndex(-1);
          await fetchAgences();
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

  const handleAddAgence = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.API_BASE_URL}/agences/ajout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgenceData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      await fetchAgences();
      setShowAddPopup(false);
      setNewAgenceData({
        agencynumber: '',
        code: '',
        postalcode: '',
        city: '',
        street: '',
        name: '',
        phone: '',
        fax: '',
        email: ''
      });

      setShowSuccessEditPopup(true);
      setTimeout(() => setShowSuccessEditPopup(false), 2000);
    } catch (error) {
      setError(`Erreur lors de l'ajout de l'agence: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closeEditForm = () => {
    setEditingIndex(-1);
  };

  return (
    <div className="agences-container">
      <div className="agences-header">



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
          <h1>Agences</h1>
          <button className="btn-add" onClick={() => setShowAddPopup(true)}>
            <span className="btn-add-icon">+</span> Ajouter une agence
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Chargement en cours...</div>}

      <div className="agences-list">
        {filteredAgences.length > 0 ? (
          filteredAgences.map((agence, index) => (
            <div key={index} className="agence-item">
              <div className="agence-info">
                <span className="name">{agence.name}</span>
                <span className="city">{agence.city}</span>
              </div>
              <div className="agence-actions">
                <button className="btn-edit" onClick={() => handleEdit(index, agence)} disabled={isLoading}>Modifier</button>
                <button className="btn-delete" onClick={() => handleDeleteClick(agence)} disabled={isLoading}>Supprimer</button>
              </div>

              {editingIndex === index && (
                <div className="edit-form-container">
                  <form onSubmit={(e) => handleSubmit(e, agence._id || agence.id)} className="edit-form">
                    <div className="form-group">
                      <label>Numéro d'agence:</label>
                      <input type="text" name="agencynumber" value={formData.agencynumber} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Code:</label>
                      <input type="text" name="code" value={formData.code} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Code postal:</label>
                      <input type="text" name="postalcode" value={formData.postalcode} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Ville:</label>
                      <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Rue:</label>
                      <input type="text" name="street" value={formData.street} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Nom:</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Téléphone:</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Fax:</label>
                      <input type="text" name="fax" value={formData.fax} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
                      <button type="button" className="btn-cancel" onClick={closeEditForm} disabled={isLoading}>Annuler</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : <div className="no-results">Aucune agence trouvée</div>}
      </div>

      {confirmation && (
        <DeleteConfirmationModal
          isOpen={!!confirmation}
          onClose={confirmation.onCancel}
          onConfirm={confirmation.onConfirm}
          title="Confirmer la modification"
          message={confirmation.message}
          loading={isLoading}
          confirmButtonText={isLoading ? "Enregistrement..." : "Confirmer"}
        />
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
            <h2>Ajouter une agence</h2>
            <form onSubmit={handleAddAgence} className="add-form">
              <div className="add-form-content">
                <div className="form-group">
                  <label>Numéro d'agence:</label>
                  <input type="text" name="agencynumber" value={newAgenceData.agencynumber} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Code:</label>
                  <input type="text" name="code" value={newAgenceData.code} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Code postal:</label>
                  <input type="text" name="postalcode" value={newAgenceData.postalcode} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Ville:</label>
                  <input type="text" name="city" value={newAgenceData.city} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Rue:</label>
                  <input type="text" name="street" value={newAgenceData.street} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Nom:</label>
                  <input type="text" name="name" value={newAgenceData.name} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input type="text" name="phone" value={newAgenceData.phone} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Fax:</label>
                  <input type="text" name="fax" value={newAgenceData.fax} onChange={handleNewAgenceInputChange} />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input type="email" name="email" value={newAgenceData.email} onChange={handleNewAgenceInputChange} />
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

      <DeleteConfirmationModal
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setSelectedAgence(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'agence ${selectedAgence?.name || ''} ?`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Agences;
