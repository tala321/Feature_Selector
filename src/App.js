import React, { useState, useRef } from "react";
import Papa from "papaparse";
import TextType from "./TextType";
import "./App.css";

const App = () => {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
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
        } else {
          setError("Unexpected response from server");
        }
      })
      .catch((err) => {
        console.error("URL upload failed:", err);
        setError("Failed to fetch file from URL");
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
          <p>Drag & Drop CSV Here or Click to Browse</p>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />

        {/* رفع من رابط */}
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