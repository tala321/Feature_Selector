import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

const UploadSuccess = () => {
  const [fileName, setFileName] = useState("Loading...");
  const [uploadTime, setUploadTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/uploaded-files/")
      .then((res) => res.json())
      .then((data) => {
        if (data.files && data.files.length > 0) {
          setFileName(data.files[0]);
          setUploadTime(new Date().toLocaleTimeString());
        } else {
          setFileName("No file uploaded");
          setUploadTime("-");
        }
      })
      .catch(() => {
        setFileName("Error loading file name");
        setUploadTime("-");
      });
  }, []);

  return (
    <div className="upload-success container mt-5 text-center">
      <h2 className="mb-3">✅ File Uploaded Successfully</h2>
      <p className="mb-4">You can now preview the data or run feature selection algorithms.</p>

      <table className="table table-bordered w-50 mx-auto mb-4">
        <thead className="table-light">
          <tr>
            <th>File Name</th>
            <th>Upload Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{fileName}</td>
            <td>{uploadTime}</td>
          </tr>
        </tbody>
      </table>

      <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Upload Another File
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/run-genetic")}>
          Run Genetic Algorithm
        </button>
        <button className="btn btn-info" onClick={() => navigate("/traditional")}>
          Try Traditional Methods
        </button>
        <button className="btn btn-success" onClick={() => navigate("/compare")}>
          Compare Methods
        </button>
      </div>

      <footer className="footer text-muted">
        <p>© 2023 Genetic Feature Selection System</p>
      </footer>
    </div>
  );
};

export default UploadSuccess;