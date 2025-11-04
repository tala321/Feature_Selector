import React, { useEffect, useState } from "react";
import "../style.css"; // تأكدي من وجود ملف التنسيق

const ComparisonPage = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/comparison/")
      .then((res) => res.json())
      .then((data) => {
        if (data.methods) {
          setResults(data.methods);
        } else {
          setError("No comparison data found");
        }
      })
      .catch(() => {
        setError("Failed to fetch comparison results");
      });
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">📊 Feature Selection Comparison</h2>

      {error && <p className="text-danger text-center">{error}</p>}

      {results.length > 0 ? (
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Method</th>
              <th>Selected Features</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {results.map((method, index) => (
              <tr key={index}>
                <td>{method.name}</td>
                <td>{method.features.join(", ")}</td>
                <td>{method.accuracy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && <p className="text-center">Loading comparison data...</p>
      )}
    </div>
  );
};

export default ComparisonPage;