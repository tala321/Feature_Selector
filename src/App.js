import React, { useState, useRef } from "react";
import Papa from "papaparse";
import "./App.css";

const App = () => {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false); // State for drag-over styling
  const [fileName, setFileName] = useState(""); // New state for file name
  const fileInputRef = useRef(null); // Ref for hidden file input

  const handleFileUpload = (file) => {
    setError("");
    if (!file) {
      setError("No file selected");
      return;
    }

    setFileName(file.name); // Set the file name

    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "csv") {
      setError("Please upload a valid CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (!results.data || results.data.length === 0) {
          setError("CSV file is empty or invalid");
          return;
        }
        setCsvData(results.data);
      },
    });
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault(); // Crucial to allow drop
    e.stopPropagation(); // Prevent bubbling
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.split(".").pop().toLowerCase() === "csv");
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError("Please drop a valid CSV file");
    }
  };

  // Handle drop zone click to open file dialog
  const handleDropZoneClick = () => {
    fileInputRef.current.click(); // Trigger hidden file input
  };

  return (
    <div className="App">
      <header className="header">
        <h2>Upload and Preview The CSV File</h2>
      </header>

      <main className="content">
        <div
          className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropZoneClick} // Click to browse
        >
          <p>Drag and drop your CSV file here, or click to browse</p>
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          ref={fileInputRef}
          style={{ display: "none" }} // Hidden
        />
        
        {/* Display selected file name */}
        {fileName && <p className="file-name">Selected file: {fileName}</p>}
        
        {error && <p className="error">{error}</p>}

        {csvData.length > 0 && (
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
        )}
      </main>
    </div>
  );
};

export default App;

