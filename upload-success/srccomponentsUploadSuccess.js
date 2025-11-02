import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadSuccess = () => {
  const [fileName, setFileName] = useState('Loading...');
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/list_uploaded_files')
      .then(response => response.json())
      .then(data => {
        if (data.files && data.files.length > 0) {
          setFileName(data.files[0]);
        } else {
          setFileName('No file uploaded');
        }
      })
      .catch(() => {
        setFileName('Error loading file name');
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mt-5">
      <div className="success-card">
        <div className="success-header text-center">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>File Uploaded Successfully</h2>
          <p className="mb-0">You can now preview the data or run feature selection algorithms.</p>
        </div>

        <div className="card-body p-4">
          <div className="file-info">
            <h5 className="mb-3">File Details</h5>
            <div className="file-details">
              <span>File Name:</span>
              <span>{fileName}</span>
            </div>
            <div className="file-details">
              <span>Upload Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>

            <div className="progress-container">
              <div className="d-flex justify-content-between mb-2">
                <span>Upload Progress:</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-center mt-4">
            <button
              className="btn btn-secondary-custom btn-custom"
              onClick={() => navigate('/upload')}
            >
              <i className="fas fa-arrow-right me-2"></i>
              Upload Another File
            </button>
            <button
              className="btn btn-primary-custom btn-custom"
              onClick={() => navigate('/preview')}
            >
              <i className="fas fa-chart-bar me-2"></i>
              Preview Data
            </button>
            <button
              className="btn btn-success-custom btn-custom"
              onClick={() => navigate('/run-genetic')}
            >
              <i className="fas fa-dna me-2"></i>
              Run Genetic Algorithm
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-muted">
        <p>All rights reserved &copy; 2023 | Genetic Feature Selection System</p>
      </div>
    </div>
  );
};

export default UploadSuccess;