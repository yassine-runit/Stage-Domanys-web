import React, { useState, useEffect } from 'react';
import "../styles/patrimoines.css";
import config from '../config';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Patrimoines = () => {
  const [patrimoines, setPatrimoines] = useState([]);
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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedPatrimoine, setSelectedPatrimoine] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newPatrimoineData, setNewPatrimoineData] = useState({
    refpat: '',
    nature: '',
    latitude: '',
    longitude: '',
    streetnumber: '',
    streetname: '',
    insee: '',
    constructtype: '',
    class: '',
    surface: '',
    heartype: '',
    uptakeindice: '',
    uptakevalue: '',
    gazclass: '',
    gazvalue: '',
    agencyid: '',
    active: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPatrimoines();
    fetchAgences();
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

  const fetchPatrimoines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_BASE_URL}/patrimoines/all`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setPatrimoines(data);
    } catch (error) {
      setError('Erreur lors du chargement des patrimoines');
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

  const filteredPatrimoines = patrimoines.filter(patrimoine =>
    patrimoine.refpat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patrimoine.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (patrimoine) => {
    setSelectedPatrimoine(patrimoine);
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatrimoine) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/patrimoines/delete/${selectedPatrimoine.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setPatrimoines(patrimoines.filter(p => p.id !== selectedPatrimoine.id));
      setShowConfirmDelete(false);
      setSelectedPatrimoine(null);
      setShowSuccessDeletePopup(true);
      setTimeout(() => setShowSuccessDeletePopup(false), 2000);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression du patrimoine');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (index, patrimoine) => {
    setEditingIndex(index);
    setFormData(patrimoine);
    setOriginalData(patrimoine);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleNewPatrimoineInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatrimoineData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e, patrimoineId) => {
    e.preventDefault();
    if (!patrimoineId) return;

    setConfirmation({
      message: 'Êtes-vous sûr de vouloir modifier ce patrimoine ?',
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

          await fetch(`${config.API_BASE_URL}/patrimoines/modif/${patrimoineId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          setShowSuccessEditPopup(true);
          setTimeout(() => setShowSuccessEditPopup(false), 2000);
          setEditingIndex(-1);
          await fetchPatrimoines();
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

  const handleAddPatrimoine = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.API_BASE_URL}/patrimoines/ajout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatrimoineData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      await fetchPatrimoines();
      setShowAddPopup(false);
      setNewPatrimoineData({
        refpat: '',
        nature: '',
        latitude: '',
        longitude: '',
        streetnumber: '',
        streetname: '',
        insee: '',
        constructtype: '',
        class: '',
        surface: '',
        heartype: '',
        uptakeindice: '',
        uptakevalue: '',
        gazclass: '',
        gazvalue: '',
        agencyid: '',
        active: true
      });

      setShowSuccessEditPopup(true);
      setTimeout(() => setShowSuccessEditPopup(false), 2000);
    } catch (error) {
      setError(`Erreur lors de l'ajout du patrimoine: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closeEditForm = () => {
    setEditingIndex(-1);
  };

  return (
    <div className="patrimoines-container">
      <div className="patrimoines-header">
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
          <h1>Patrimoines</h1>
          <button className="btn-add" onClick={() => setShowAddPopup(true)}>
            <span className="btn-add-icon">+</span> Ajouter un patrimoine
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Chargement en cours...</div>}

      <div className="patrimoines-list">
        {filteredPatrimoines.length > 0 ? (
          filteredPatrimoines.map((patrimoine, index) => (
            <div key={index} className="patrimoine-item">
              <div className="patrimoine-info">
                <span className="refpat">{patrimoine.refpat}</span>
                <span className="nature">{patrimoine.nature}</span>
                <span className="address">{patrimoine.streetnumber} {patrimoine.streetname}</span>
                <span className="city">{patrimoine.postalcode} {patrimoine.city}</span>
              </div>
              <div className="patrimoine-actions">
                <button className="btn-edit" onClick={() => handleEdit(index, patrimoine)} disabled={isLoading}>Modifier</button>
                <button className="btn-delete" onClick={() => handleDeleteClick(patrimoine)} disabled={isLoading}>Supprimer</button>
              </div>

              {editingIndex === index && (
                <div className="edit-form-container">
                  <form onSubmit={(e) => handleSubmit(e, patrimoine._id || patrimoine.id)} className="edit-form">
                    <div className="form-group">
                      <label>Référence patrimoine:</label>
                      <input type="text" name="refpat" value={formData.refpat} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Nature:</label>
                      <input type="text" name="nature" value={formData.nature} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Latitude:</label>
                      <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Longitude:</label>
                      <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Numéro de rue:</label>
                      <input type="text" name="streetnumber" value={formData.streetnumber} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Nom de rue:</label>
                      <input type="text" name="streetname" value={formData.streetname} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Code INSEE:</label>
                      <input type="text" name="insee" value={formData.insee} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Type de construction:</label>
                      <input type="text" name="constructtype" value={formData.constructtype} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Classe:</label>
                      <input type="text" name="classType" value={formData.class} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Surface:</label>
                      <input type="text" name="surface" value={formData.surface} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Type de cœur:</label>
                      <input type="text" name="heartype" value={formData.heartype} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Indice de reprise:</label>
                      <input type="text" name="uptakeindice" value={formData.uptakeindice} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Valeur de reprise:</label>
                      <input type="text" name="uptakevalue" value={formData.uptakevalue} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Classe de gaz:</label>
                      <input type="text" name="gazclass" value={formData.gazclass} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Valeur de gaz:</label>
                      <input type="text" name="gazvalue" value={formData.gazvalue} onChange={handleInputChange} required />
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
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
                      <button type="button" className="btn-cancel" onClick={closeEditForm} disabled={isLoading}>Annuler</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : <div className="no-results">Aucun patrimoine trouvé</div>}
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
            <h2>Ajouter un patrimoine</h2>
            <form onSubmit={handleAddPatrimoine} className="add-form">
              <div className="add-form-content">
                <div className="form-group">
                  <label>Référence patrimoine:</label>
                  <input type="text" name="refpat" value={newPatrimoineData.refpat} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Nature:</label>
                  <input type="text" name="nature" value={newPatrimoineData.nature} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Latitude:</label>
                  <input type="text" name="latitude" value={newPatrimoineData.latitude} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Longitude:</label>
                  <input type="text" name="longitude" value={newPatrimoineData.longitude} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Numéro de rue:</label>
                  <input type="text" name="streetnumber" value={newPatrimoineData.streetnumber} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Nom de rue:</label>
                  <input type="text" name="streetname" value={newPatrimoineData.streetname} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Code INSEE:</label>
                  <input type="text" name="insee" value={newPatrimoineData.insee} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Type de construction:</label>
                  <input type="text" name="constructtype" value={newPatrimoineData.constructtype} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Classe:</label>
                  <input type="text" name="class" value={newPatrimoineData.class} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Surface:</label>
                  <input type="text" name="surface" value={newPatrimoineData.surface} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Type de cœur:</label>
                  <input type="text" name="heartype" value={newPatrimoineData.heartype} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Indice de reprise:</label>
                  <input type="text" name="uptakeindice" value={newPatrimoineData.uptakeindice} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Valeur de reprise:</label>
                  <input type="text" name="uptakevalue" value={newPatrimoineData.uptakevalue} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Classe de gaz:</label>
                  <input type="text" name="gazclass" value={newPatrimoineData.gazclass} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Valeur de gaz:</label>
                  <input type="text" name="gazvalue" value={newPatrimoineData.gazvalue} onChange={handleNewPatrimoineInputChange} required />
                </div>
                <div className="form-group">
                  <label>Agence:</label>
                  <select
                    name="agencyid"
                    value={newPatrimoineData.agencyid}
                    onChange={handleNewPatrimoineInputChange}
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
          setSelectedPatrimoine(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le patrimoine ${selectedPatrimoine?.refpat || ''} ?`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Patrimoines;
