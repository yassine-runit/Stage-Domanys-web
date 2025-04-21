import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiBriefcase, FiPlus, FiX } from "react-icons/fi"; 
import "../styles/sidebar.css";
import config from '../config';
import { LogoImg } from "../Themes/Images";
import AddPrestationModal from "./ajoutprestation";

const Sidebar = ({ onFilterChange }) => {
    const [collaborators, setCollaborators] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [loading, setLoading] = useState(true);  
    const [showAddPrestationModal, setShowAddPrestationModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const collabResponse = await fetch(`${config.API_BASE_URL}/users/collab/all`);
                const collabData = await collabResponse.json();
                setCollaborators(collabData);

                const serviceResponse = await fetch(`${config.API_BASE_URL}/prestations/types-prestations/all`);
                const serviceData = await serviceResponse.json();
                setServices(serviceData);
                
            } catch (error) {
                console.error("Erreur API:", error);
            } finally {
                setLoading(false);  
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        onFilterChange(selectedCollaborators, selectedServices);
    }, [selectedCollaborators, selectedServices, onFilterChange]);

    const handleCollaboratorChange = (id) => {
        setSelectedCollaborators(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleServiceChange = (id) => {
        setSelectedServices(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleCreatePrestationClick = () => {
        setShowAddPrestationModal(true); 
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    
                    <img src={LogoImg} alt="Logo Domanys" className="logoDomanys" />
                </div>
            </div>
            
            <div className="button-container">
                <button className="create-button" onClick={handleCreatePrestationClick}>
                    <FiPlus size={16} className="plus-icon" />
                    Créer prestation
                </button>
            </div>

            {loading ? (
                <div className="loader">
                    <div className="spinner"></div>
                    <span>Chargement...</span>
                </div>  
            ) : (
                <>
                    <div className="sidebar-section">
                        <h3>
                            <FiUsers size={20} color="#004797" className="sidebar-icon" /> 
                            Mes collaborateurs
                        </h3>
                        <div className="sidebar-items-container">
                        {Array.isArray(collaborators) && collaborators.map(collab => (
                            <label 
                                key={collab.id} 
                                className={`sidebar-item ${selectedCollaborators.includes(collab.id) ? 'checked' : ''}`}
                                style={{ color: selectedCollaborators.includes(collab.id) ? collab.distinctcolor || "#004797" : "inherit" }}
                            >
                                <div className="checkbox-container">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCollaborators.includes(collab.id)}
                                        onChange={() => handleCollaboratorChange(collab.id)} 
                                        style={{ accentColor: collab.distinctcolor || "#004797" }}
                                    />
                                </div>
                                <span className="item-label">{collab.firstname} {collab.lastname}</span>
                            </label>
                        ))}

                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3>
                            <FiBriefcase size={20} color="#004797" className="sidebar-icon" /> 
                            Mes prestations
                        </h3>
                        <div className="sidebar-items-container">
                        {Array.isArray(services) && services.map(service => (
                            <label 
                                key={service.id} 
                                className={`sidebar-item ${selectedServices.includes(service.id) ? 'checked' : ''}`}
                            >
                                <div className="checkbox-container">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedServices.includes(service.id)}
                                        onChange={() => handleServiceChange(service.id)} 
                                    />
                                </div>
                                <span className="item-label">{service.name}</span>
                            </label>
                        ))}

                        </div>
                    </div>
                </>
            )}
        

        {showAddPrestationModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button 
                        className="close-modal-btn" 
                        onClick={() => setShowAddPrestationModal(false)}
                    >
                        <FiX />
                    </button>
                    <AddPrestationModal onClose={() => setShowAddPrestationModal(false)} />
                </div>
            </div>
        )}

        </aside>


    );
};

export default Sidebar;