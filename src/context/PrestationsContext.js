import React, { createContext, useState, useContext, useCallback } from 'react';
import config from '../config';


const PrestationsContext = createContext();


export const usePrestations = () => {
  const context = useContext(PrestationsContext);
  if (!context) {
    throw new Error('usePrestations doit être utilisé à l\'intérieur d\'un PrestationsProvider');
  }
  return context;
};

export const PrestationsProvider = ({ children }) => {
  const [prestations, setPrestations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now()); 

  
  const fetchPrestations = useCallback(async (startOfWeek, endOfWeek, filterType) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startOfWeek: startOfWeek.toISOString().split("T")[0],
        endOfWeek: endOfWeek.toISOString().split("T")[0],
        ...(filterType === 1 && { est_recurrent: '1' })
      });

      const apiUrl = `${config.API_BASE_URL}/prestations/semaine/test?${params}`;
      console.log("Fetching events with URL:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Données brutes reçues de l'API:", data);

      setPrestations(data);
      return data;
    } catch (error) {
      console.error("Erreur fetch:", error);
      setError(error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPrestation = useCallback(async (prestationData) => {
    try {
      setIsLoading(true);
      setError(null);

     

      const response = await fetch(`${config.API_BASE_URL}/prestations/ajout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prestationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'ajout de la prestation');
      }

      const data = await response.json();
     
      setLastUpdate(Date.now());

      return { success: true, data };
    } catch (error) {
      console.error("Erreur d'ajout:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePrestation = useCallback(async (prestationId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}/prestations/delete/${prestationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      const data = await response.json();

      setLastUpdate(Date.now());

      return { success: true, data };
    } catch (error) {
      console.error("Erreur de suppression:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validatePrestation = useCallback(async (prestationId, dateDebut, dateFin) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}/prestations/${prestationId}/valider`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          date_debut: dateDebut,
          date_fin: dateFin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la validation');
      }

      const data = await response.json();

      setLastUpdate(Date.now());

      return { success: true, data };
    } catch (error) {
      console.error("Erreur de validation:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    prestations,
    isLoading,
    error,
    lastUpdate,
    fetchPrestations,
    addPrestation,
    deletePrestation,
    validatePrestation,
    refreshData: () => setLastUpdate(Date.now())
  };

  return (
    <PrestationsContext.Provider value={value}>
      {children}
    </PrestationsContext.Provider>
  );
};
