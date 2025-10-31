const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

//  الخوارزمية الجينية
app.post('/run-genetic', (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid or missing CSV data' });
  }

  const result = {
    selectedFeatures: ['feature1', 'feature2'],
    accuracy: 0.91,
    generations: 50,
    populationSize: 100
  };

  res.json(result);
});

//   الطرق التقليدية
app.post('/run-traditional', (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid or missing CSV data' });
  }


  const result = {
    selectedFeatures: ['feature3', 'feature4'],
    accuracy: 0.89
  };

  res.json(result);
});


app.get('/results/genetic', (req, res) => {
  const { file } = req.query;


  res.json({
    file,
    selectedFeatures: ['feature1', 'feature2'],
    accuracy: 0.91,
    generations: 50,
    populationSize: 100
  });
});


app.get('/results/traditional', (req, res) => {
  const { file } = req.query;

  
  res.json({
    file,
    selectedFeatures: ['feature3', 'feature4'],
    accuracy: 0.89
  });
});


app.get('/files', (req, res) => {
  res.json(['data1.csv', 'data2.csv']);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});