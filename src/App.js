import React, { useState, useRef } from "react";
import Papa from "papaparse";
import TextType from "./TextType";
import Success from "./srccomponentsUploadSuccess";
import "./App.css";

const App = () => {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [geneticResult, setGeneticResult] = useState(null);
  const [url, setUrl] = useState("");
  const [showSuccessPage, setShowSuccessPage] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = (file) => {
    if (!file) {
      setError("No file selected");
      return;
    }

const handleUpload = (e) => {
  const formData = new FormData();
  formData.append("file", e.target.files[0]);

  fetch("http://localhost:8000/api/upload/", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Upload response:", data);
    })
    .catch((err) => {
      console.error("Upload error:", err);
    });
};


    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "csv") {
      setError("Please upload a valid CSV file");
      return;
    }

    setFileName(file.name);
    setError("");
    setGeneticResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError("CSV file is empty or invalid");
          return;
        }

        setCsvData(results.data);
        setShowSuccessPage(true);

        const formData = new FormData();
        formData.append("file", file);

        fetch("http://127.0.0.1:8000/api/upload/", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("File uploaded to backend:", data);
          })
          .catch((err) => {
            console.error("Upload to backend failed:", err);
          });
      },
    });
  };

  const handleUrlUpload = () => {
    setError("");
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    fetch("http://127.0.0.1:8000/api/upload-url/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.columns) {
          const fakeRows = data.columns.map((col) => ({ [col]: "" }));
          setCsvData(fakeRows);
          setFileName("From URL");
          setShowSuccessPage(true);
        } else {
          setError("Unexpected response from server");
        }
      })
      .catch((err) => {
        console.error("URL upload failed:", err);
        setError("Failed to fetch file from URL");
      });
  };

  const handleRunGenetic = () => {
    fetch("http://localhost:3001/run-genetic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: csvData }),
    })
      .then((res) => res.json())
      .then((result) => {
        setGeneticResult(result);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to run genetic algorithm");
      });
  };

  const handleDrop = (e) => {
    e.preventDefault();
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  return (
    <div className="App">
      {showSuccessPage ? (
        <Success onContinue={() => setShowSuccessPage(false)} />
      ) : (
        <>
          <header className="header">
            <TextType
              text={[
                "Welcome to CSV file Uploader",
                "Please upload your data Here",
                "Have a good time :)",
              ]}
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

            <div className="url-upload">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter CSV file URL"
                style={{ width: "300px", padding: "8px", marginTop: "20px" }}
              />
              <button
                onClick={handleUrlUpload}
                style={{ marginLeft: "10px", padding: "8px 16px" }}
              >
                Upload from URL
              </button>
            </div>

            {csvData.length > 0 && (
              <>
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

                <button className="run-button" onClick={handleRunGenetic}>
                  Run Genetic Algorithm
                </button>
              </>
            )}

            {geneticResult && (
              <div className="results">
                <h3>Genetic Algorithm Results</h3>
                <p>
                  <strong>Selected Features:</strong>{" "}
                  {geneticResult.selectedFeatures.join(", ")}
                </p>
                <p>
                  <strong>Accuracy:</strong> {geneticResult.accuracy}
                </p>
                <p>
                  <strong>Generations:</strong> {geneticResult.generations}
                </p>
                <p>
                  <strong>Population Size:</strong>{" "}
                  {geneticResult.populationSize}
                </p>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;