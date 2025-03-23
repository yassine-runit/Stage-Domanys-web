import React from "react";

const Popup = ({ isOpen, onClose, children, onValidate }) => {
    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="popup-close" onClick={onClose}>
                    &times;
                </button>
                {children}
                <div className="popup-actions">
                    <button className="popup-button cancel" onClick={onClose}>
                        Annuler
                    </button>
                    <button className="popup-button validate" onClick={onValidate}>
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Popup;