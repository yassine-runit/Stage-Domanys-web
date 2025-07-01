import React, { useState, useEffect } from 'react';
import config from '../config';
import '../styles/réclamations.css';

const Réclamations = () => {
    const [reclamations, setReclamations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    
    useEffect(() => {
        const fetchReclamations = async () => {
            try {
                const response = await fetch(`${config.API_BASE_URL}/messages-aide`);

                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des réclamations');
                }

                const data = await response.json();
                setReclamations(data);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReclamations();
    }, []);

    
    const filteredReclamations = reclamations.filter(reclamation =>
        reclamation.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reclamations-container">
            <div className="reclamations-header">
                <h1>Réclamations</h1>

            </div>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading">Chargement des réclamations...</div>
            ) : filteredReclamations.length === 0 ? (
                <div className="no-reclamations">
                    Aucune réclamation trouvée
                </div>
            ) : (
                <div className="reclamations-list">
                    {filteredReclamations.map((reclamation) => (
                        <div key={reclamation.id} className="reclamation-item">
                            <div className="reclamation-info">
                                <div className="reclamation-sender">
                                    <strong>De: </strong>
                                    {reclamation.firstname} {reclamation.lastname}
                                </div>
                                <div className="reclamation-message">
                                    <strong>Message: </strong>
                                    {reclamation.message}
                                </div>
                                <div className="reclamation-date">
                                    <strong>Date: </strong>
                                    {new Date(reclamation.date_envoi).toLocaleDateString()} {new Date(reclamation.date_envoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Réclamations;