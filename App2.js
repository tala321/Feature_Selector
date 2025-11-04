import './App.css';
import { useState } from 'react';

function App() {
  const [columns, setColumns] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [url, setUrl] = useState('');

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

  const handleUrlUpload = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/upload-url/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        setColumns(data.columns);
        setUploadStatus('✔️ File from URL uploaded successfully');
      } else {
        setUploadStatus('❌ URL upload failed');
      }
    } catch (error) {
      console.error('URL upload error:', error);
      setUploadStatus('❌ Server connection error');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Upload Dataset</h2>

        {/* رفع من الجهاز */}
        <input type="file" onChange={handleUpload} />

        {/* رفع من رابط */}
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter CSV file URL"
            style={{ width: '300px', padding: '8px' }}
          />
          <button onClick={handleUrlUpload} style={{ marginLeft: '10px', padding: '8px 16px' }}>
            Upload from URL
          </button>
        </div>

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