import React, { useEffect, useState } from "react";
import "../style.css";

const ComparisonPage = () => {
  const [baselineResults, setBaselineResults] = useState([]);
  const [geneticResult, setGeneticResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/comparison/")
      .then((res) => res.json())
      .then((data) => {
        if (data.baseline_results && data.genetic_result) {
          setBaselineResults(data.baseline_results);
          setGeneticResult(data.genetic_result);
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
      <h2 className="text-center mb-4">Feature Selection Comparison</h2>

      {error && <p className="text-danger text-center">{error}</p>}

      {!error && (
        <>
          {baselineResults.length > 0 && (
            <>
              <h4 className="mt-4">Traditional Methods</h4>
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Method</th>
                    <th>Selected Features</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {baselineResults.map((method, index) => (
                    <tr key={index}>
                      <td>{method.method}</td>
                      <td>{method.selectedFeatures.join(", ")}</td>
                      <td>{method.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {geneticResult && (
            <>
              <h4 className="mt-5">Genetic Algorithm</h4>
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Selected Features</th>
                    <th>Accuracy</th>
                    <th>Generations</th>
                    <th>Population Size</th>
                    <th>Execution Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{geneticResult.selected_features.join(", ")}</td>
                    <td>{geneticResult.accuracy}%</td>
                    <td>{geneticResult.generations}</td>
                    <td>{geneticResult.population_size}</td>
                    <td>{geneticResult.execution_time} sec</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {baselineResults.length === 0 && !geneticResult && (
            <p className="text-center">Loading comparison data...</p>
          )}
        </>
      )}
    </div>
  );
};

export default ComparisonPage;