import { useState, useEffect } from 'react';
import './App.css';

// 1. Πρόσβαση στη μεταβλητή περιβάλλοντος
// Η Vite χρησιμοποιεί import.meta.env
const API_URL = import.meta.env.VITE_SPRING_BOOT_API_URL; 

function App() {
  const [message, setMessage] = useState('Φόρτωση δεδομένων...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Κάνουμε κλήση στο Backend URL
    fetch(`${API_URL}/test`) 
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}. Πιθανότατα πρόβλημα CORS ή το BE δεν τρέχει.`);
        }
        // Αν το BE επιστρέφει απλό κείμενο, χρησιμοποιούμε .text()
        return response.text(); 
      })
      .then(data => {
        setMessage(`Μήνυμα από Spring Boot: ${data}`);
        setLoading(false);
      })
      .catch(error => {
        console.error("Σφάλμα κλήσης API:", error);
        setMessage(`Σφάλμα: Δεν είναι δυνατή η σύνδεση στο Backend. Ελέγξτε το CORS. (${error.message})`);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>React Frontend (στο Vercel)</h1>
      <p>Συνδέεται με Spring Boot Backend (στο Render)...</p>
      <hr />
      <div className={`message-box ${loading ? 'loading' : 'loaded'}`}>
        {loading ? '...Loading' : message}
      </div>
      <p className="note">Το URL του API είναι: <strong>{API_URL}</strong></p>
    </div>
  );
}

export default App;