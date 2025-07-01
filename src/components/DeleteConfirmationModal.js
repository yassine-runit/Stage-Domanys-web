import React from 'react';
import '../styles/popup.css';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    loading,
    confirmButtonText = "Supprimer" 
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title || "Confirmer la suppression"}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p>{message || "Êtes-vous sûr de vouloir supprimer cet élément ?"}</p>
                    {title === "Confirmer la suppression" && <p>Cette action est irréversible.</p>}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-cancel" onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        className={`btn ${title === "Confirmer la modification" ? "btn-confirm" : "btn-delete"}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Traitement..." : confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal; 
