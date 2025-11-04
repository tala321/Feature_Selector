import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";

const TraditionalMethodsPage = () => {
  const [methods, setMethods] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/traditionalmethods/")
      .then((res) => res.json())
      .then((data) => {
        if (data.methods) {
          setMethods(data.methods);
        } else {
          setError("No methods found");
        }
      })
      .catch(() => {
        setError("Failed to load traditional methods");
      });
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Traditional Feature Selection Methods</h2>
      <p className="text-center">Below are the results of traditional methods applied to your dataset.</p>

      {error && <p className="text-danger text-center">{error}</p>}

      {methods.length > 0 ? (
        <table className="table table-bordered" id="traditional-table">
          <thead className="table-light">
            <tr>
              <th>Method</th>
              <th>Accuracy</th>
              <th>Selected Features</th>
              <th>Execution Time</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method, index) => (
              <tr key={index}>
                <td>{method.name}</td>
                <td>{method.accuracy}</td>
                <td>{method.features.join(", ")}</td>
                <td>{method.execution_time} sec</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && <p className="text-center">Loading methods...</p>
      )}

      <div className="text-center mt-4">
        <button className="btn btn-primary" onClick={() => navigate("/compare")}>
          Compare with Genetic
        </button>
      </div>
    </div>
  );
};

export default TraditionalMethodsPage;