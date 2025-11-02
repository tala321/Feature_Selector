import React, { useState, useRef } from "react";
import Papa from "papaparse";
import "./App.css";

const App = () => {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [geneticResult, setGeneticResult] = useState(null); // نتيجة الخوارزمية
  const fileInputRef = useRef(null);

  const handleFileUpload = (file) => {
    setError("");
    setGeneticResult(null); 

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
      complete: function (results) {
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
    const csvFile = files.find(file => file.name.split(".").pop().toLowerCase() === "csv");
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError("Please drop a valid CSV file");
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click();
  };

  const handleRunGenetic = () => {
    fetch("http://localhost:3001/run-genetic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: csvData })
    })
      .then(res => res.json())
      .then(result => {
        setGeneticResult(result);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to run genetic algorithm");
      });
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
          onClick={handleDropZoneClick}
        >
          <p>Drag and drop your CSV file here, or click to browse</p>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />

        {fileName && <p className="file-name">Selected file: {fileName}</p>}
        {error && <p className="error">{error}</p>}

        {csvData.length > 0 && (
          <>
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

            <button className="run-button" onClick={handleRunGenetic}>
              Run Genetic Algorithm
            </button>
          </>
        )}

        {geneticResult && (
          <div className="results">
            <h3>Genetic Algorithm Results</h3>
            <p><strong>Selected Features:</strong> {geneticResult.selectedFeatures.join(", ")}</p>
            <p><strong>Accuracy:</strong> {geneticResult.accuracy}</p>
            <p><strong>Generations:</strong> {geneticResult.generations}</p>
            <p><strong>Population Size:</strong> {geneticResult.populationSize}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
