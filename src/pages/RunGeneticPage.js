import React, { useEffect, useState } from "react";
import "../style.css";

const RunGeneticPage = () => {
  const [features, setFeatures] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/run-genetic")
      .then((res) => res.json())
      .then((data) => {
        if (data.selectedFeatures && data.scores) {
          const combined = data.selectedFeatures.map((feature, index) => ({
            name: feature,
            score: data.scores[index] || "N/A",
          }));
          setFeatures(combined);

          setMeta({
            accuracy: data.accuracy,
            generations: data.generations,
            populationSize: data.populationSize,
            executionTime: data.executionTime,
          });
        } else {
          setError("No results found");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch genetic results:", err);
        setError("Failed to load results");
      });
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Genetic Algorithm Results</h2>
      <p className="text-center">Below are the selected features and their scores.</p>

      {error && <p className="text-danger text-center">{error}</p>}

      {features.length > 0 && (
        <>
          <table className="table table-bordered" id="genetic-table">
            <thead className="table-light">
              <tr>
                <th>Feature</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && (
            <div className="mt-4">
              <p><strong>Accuracy:</strong> {meta.accuracy}</p>
              <p><strong>Generations:</strong> {meta.generations}</p>
              <p><strong>Population Size:</strong> {meta.populationSize}</p>
              <p><strong>Execution Time:</strong> {meta.executionTime} sec</p>
            </div>
          )}
        </>
      )}

      {!error && features.length === 0 && (
        <p className="text-center">Loading results or no data available.</p>
      )}
    </div>
  );
};

export default RunGeneticPage;