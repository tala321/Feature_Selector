import React, { useState, useRef } from "react";
import Papa from "papaparse";
import TextType from "./TextType";
import "./App.css";

const App = () => {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = (file) => {
    setError("");
    if (!file) {
      setError("No file selected");
      return;
    }

    setFileName(file.name);
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "csv") {
      setError("Please upload a valid CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError("CSV file is empty or invalid");
          return;
        }
        setCsvData(results.data);
      },
    });
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(
      (file) => file.name.split(".").pop().toLowerCase() === "csv"
    );
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError("Please drop a valid CSV file");
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="App">
      <header className="header">
        <TextType
          text={["Welcome to CSV file Uploader", "Please upload your data Here", "Have a good time :)"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
        />
      </header>

      <main className="content">
        <div
          className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
        >
          <p>Drag & Drop CSV Here or Click to Browse</p>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />

        {fileName && <p className="file-name">Selected: {fileName}</p>}

        {error && <p className="error">{error}</p>}

        {csvData.length > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {Object.keys(csvData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;