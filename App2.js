import './App.css';
import { useState } from 'react';

function App() {
  const [columns, setColumns] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setColumns(data.columns);
        setUploadStatus('✔️ File uploaded successfully');
      } else {
        setUploadStatus('❌ Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('❌ Server connection error');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2> Upload Dataset</h2>
        <input type="file" onChange={handleUpload} />
        <p>{uploadStatus}</p>

        {columns.length > 0 && (
          <div>
            <h3>Preview Columns:</h3>
            <ul>
              {columns.map((col, index) => (
                <li key={index}>{col}</li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;