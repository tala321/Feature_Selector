import React, { useState, useMemo } from "react";
/*
React single-file app for Genetic Algorithm Feature Selection
- Uses Tailwind CSS classes for styling (no imports required in this file)
- Dependencies you should install in your project:
  npm install papaparse

How to use:
1. Create a React app (e.g. with create-react-app or Vite).
2. Add Tailwind CSS or adapt classes to your CSS framework.
3. Install papaparse for CSV parsing: npm install papaparse
4. Place this file as src/App.jsx (or adjust import) and run the app.

What this app does:
- Upload CSV, preview data, choose target column (binary classification expected),
- Run Genetic Algorithm to select feature subsets evaluated by a simple logistic
  regression implemented in JS (gradient descent). The GA runs in-browser and
  returns best subset and accuracy.
- Run a traditional method (feature ranking by absolute Pearson correlation with target)
  and compare performance using top-k features.

Note: This is a self-contained demo suitable for small-to-medium datasets that
run in the browser. For very large datasets, move computation to a server.
*/

import Papa from "papaparse";

// ---------- Utility: numeric helpers ----------
function transpose(a) {
  return a[0].map((_, c) => a.map((r) => r[c]));
}

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length || 0);
}

function pearson(x, y) {
  const xm = mean(x);
  const ym = mean(y);
  const num = x.reduce((s, xi, i) => s + (xi - xm) * (y[i] - ym), 0);
  const den = Math.sqrt(
    x.reduce((s, xi) => s + (xi - xm) * (xi - xm), 0) * y.reduce((s, yi) => s + (yi - ym) * (yi - ym), 0)
  );
  return den === 0 ? 0 : num / den;
}

// ---------- Simple logistic regression (binary) ----------
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function trainLogisticRegression(X, y, opts = {}) {
  // X: array of samples, each is array of features
  // y: binary 0/1 labels
  const n = X.length;
  const m = X[0].length; // features
  const lr = opts.lr || 0.1;
  const epochs = opts.epochs || 200;
  let weights = Array(m).fill(0);
  let bias = 0;

  for (let e = 0; e < epochs; e++) {
    let gradW = Array(m).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      const xi = X[i];
      let z = bias;
      for (let j = 0; j < m; j++) z += weights[j] * xi[j];
      const p = sigmoid(z);
      const err = p - y[i];
      gradB += err;
      for (let j = 0; j < m; j++) gradW[j] += err * xi[j];
    }
    // update
    for (let j = 0; j < m; j++) weights[j] -= (lr * gradW[j]) / n;
    bias -= (lr * gradB) / n;
  }
  return { weights, bias };
}

function predictLogistic(model, X) {
  return X.map((xi) => (sigmoid(xi.reduce((s, v, j) => s + v * model.weights[j], model.bias)) >= 0.5 ? 1 : 0));
}

function accuracy(yTrue, yPred) {
  let c = 0;
  for (let i = 0; i < yTrue.length; i++) if (yTrue[i] === yPred[i]) c++;
  return c / yTrue.length;
}

// ---------- Data preprocessing: CSV -> numeric matrix ----------
function parseCSVFile(file, onComplete) {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
      onComplete(results.data, results.meta.fields || []);
    },
  });
}

function numericizeTable(rows, fields) {
  // Convert each column to numeric (if possible). For non-numeric, do simple label encoding.
  const columns = {};
  fields.forEach((f) => (columns[f] = []));
  for (const r of rows) {
    for (const f of fields) columns[f].push(r[f]);
  }
  // detect categorical
  const encoders = {};
  const numericCols = {};
  for (const f of fields) {
    const vals = columns[f];
    const allNums = vals.every((v) => typeof v === "number" && !Number.isNaN(v));
    if (allNums) {
      numericCols[f] = vals.map((v) => (v === null || v === undefined ? 0 : v));
    } else {
      // label encode
      const map = {};
      let idx = 0;
      encoders[f] = map;
      numericCols[f] = vals.map((v) => {
        if (v === null || v === undefined) return 0;
        const key = String(v);
        if (!(key in map)) map[key] = idx++;
        return map[key];
      });
    }
  }
  // return rows matrix and fields
  const n = rows.length;
  const mat = Array.from({ length: n }, (_, i) => fields.map((f) => numericCols[f][i]));
  return { mat, fields, encoders };
}

function standardizeMatrix(X) {
  const t = transpose(X);
  const means = t.map((col) => mean(col));
  const sds = t.map((col) => std(col) || 1);
  const Xs = X.map((row) => row.map((v, j) => (v - means[j]) / sds[j]));
  return { Xs, means, sds };
}

// ---------- Genetic Algorithm ----------
function randomChromosome(numFeatures, pctOn = 0.2) {
  return Array.from({ length: numFeatures }, () => Math.random() < pctOn ? 1 : 0);
}

function crossover(a, b) {
  const n = a.length;
  const point = Math.floor(Math.random() * n);
  const child = a.slice(0, point).concat(b.slice(point));
  return child;
}

function mutate(chrom, mutProb) {
  return chrom.map((g) => (Math.random() < mutProb ? 1 - g : g));
}

async function evaluateChromosome(chrom, X, y, opts) {
  // chrom: array of 0/1 selecting features
  const selectedIdx = chrom.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  if (selectedIdx.length === 0) return { fitness: 0, acc: 0, nFeatures: 0 };
  // build Xsub
  const Xsub = X.map((row) => selectedIdx.map((i) => row[i]));
  // split train/test simple split
  const n = Xsub.length;
  const split = Math.floor(n * 0.7);
  const Xtrain = Xsub.slice(0, split);
  const ytrain = y.slice(0, split);
  const Xtest = Xsub.slice(split);
  const ytest = y.slice(split);
  // standardize per feature
  const { Xs: XtrainS, means, sds } = standardizeMatrix(Xtrain);
  const XtestS = Xtest.map((row) => row.map((v, j) => (v - means[j]) / (sds[j] || 1)));
  // train logistic
  const model = trainLogisticRegression(XtrainS, ytrain, opts.lr ? { lr: opts.lr, epochs: opts.epochs } : {});
  const ypred = predictLogistic(model, XtestS);
  const acc = accuracy(ytest, ypred);
  // fitness trades off accuracy and number of features (fewer features better)
  const alpha = opts.alpha || 0.01; // penalty per feature
  const fitness = acc - alpha * selectedIdx.length;
  return { fitness, acc, nFeatures: selectedIdx.length };
}

async function runGeneticAlgorithm(X, y, options = {}, onProgress = () => {}) {
  const numFeatures = X[0].length;
  const popSize = options.popSize || 30;
  const generations = options.generations || 40;
  const elite = Math.max(1, Math.floor(popSize * 0.1));
  const mutProb = options.mutProb || 0.02;
  const pctOn = options.initPctOn || 0.15;

  // init
  let population = Array.from({ length: popSize }, () => randomChromosome(numFeatures, pctOn));

  let best = null;

  for (let gen = 0; gen < generations; gen++) {
    // evaluate
    const evaluated = await Promise.all(population.map((chrom) => evaluateChromosome(chrom, X, y, options)));
    // attach fitness
    const popWithFitness = population.map((chrom, i) => ({ chrom, ...evaluated[i] }));
    popWithFitness.sort((a, b) => b.fitness - a.fitness);
    if (!best || popWithFitness[0].fitness > best.fitness) best = JSON.parse(JSON.stringify(popWithFitness[0]));

    onProgress({ gen, best });

    // selection (roulette wheel on fitness shifted)
    const minFit = Math.min(...popWithFitness.map((p) => p.fitness));
    const adj = popWithFitness.map((p) => p.fitness - minFit + 1e-6);
    const sumAdj = adj.reduce((s, v) => s + v, 0);
    const probs = adj.map((v) => v / sumAdj);

    // build next generation with elitism
    const next = popWithFitness.slice(0, elite).map((p) => p.chrom);
    while (next.length < popSize) {
      // select parents
      const selectOne = () => {
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < probs.length; i++) {
          acc += probs[i];
          if (r <= acc) return popWithFitness[i].chrom;
        }
        return popWithFitness[probs.length - 1].chrom;
      };
      const p1 = selectOne();
      const p2 = selectOne();
      let child = crossover(p1, p2);
      child = mutate(child, mutProb);
      next.push(child);
    }
    population = next;
  }

  return best;
}

// ---------- React UI ----------
export default function App() {
  const [page, setPage] = useState("upload");
  const [rows, setRows] = useState(null);
  const [fields, setFields] = useState([]);
  const [parsed, setParsed] = useState(null);
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState("");
  const [gaResult, setGaResult] = useState(null);
  const [tradResult, setTradResult] = useState(null);
  const [progress, setProgress] = useState(null);

  const handleFile = (file) => {
    setStatus("Parsing CSV...");
    parseCSVFile(file, (data, flds) => {
      setRows(data);
      setFields(flds);
      setParsed(null);
      setStatus("Parsed. Choose target column and preview.");
      setPage("preview");
    });
  };

  const buildNumeric = () => {
    const { mat, fields: flds, encoders } = numericizeTable(rows, fields);
    setParsed({ mat, fields: flds, encoders });
    return { mat, fields: flds };
  };

  const runGA = async (opts = {}) => {
    setStatus("Preparing data...");
    if (!parsed) buildNumeric();
    const { mat, fields: flds } = parsed || buildNumeric();
    if (target == null) {
      setStatus("Choose a target column first.");
      return;
    }
    const targetIdx = flds.indexOf(target);
    // prepare X and y
    const X = mat.map((r) => r.filter((_, i) => i !== targetIdx));
    const fieldNamesX = flds.filter((_, i) => i !== targetIdx);
    const y = mat.map((r) => r[targetIdx]);
    // if target non-binary, binarize by median
    const uniqueY = [...new Set(y)];
    let yBin = y;
    if (uniqueY.length !== 2) {
      const med = median(y);
      yBin = y.map((v) => (v >= med ? 1 : 0));
    }
    setStatus("Running Genetic Algorithm...");
    setPage("genetic_results");
    setGaResult(null);
    setProgress(null);
    const best = await runGeneticAlgorithm(
      X,
      yBin,
      {
        popSize: opts.popSize || 40,
        generations: opts.generations || 30,
        mutProb: opts.mutProb || 0.03,
        alpha: opts.alpha || 0.02,
        lr: opts.lr || 0.3,
        epochs: opts.epochs || 120,
        initPctOn: opts.initPctOn || 0.12,
      },
      ({ gen, best }) => {
        setProgress({ gen, best });
      }
    );
    // decode best
    const selected = best.chrom.map((v, i) => (v ? fieldNamesX[i] : null)).filter(Boolean);
    setGaResult({ best, selected, fieldNamesX });
    setStatus("GA finished.");
  };

  const runTraditional = () => {
    if (!parsed) buildNumeric();
    const { mat, fields: flds } = parsed || buildNumeric();
    if (target == null) {
      setStatus("Choose a target column first.");
      return;
    }
    const targetIdx = flds.indexOf(target);
    const X = mat.map((r) => r.filter((_, i) => i !== targetIdx));
    const fieldNamesX = flds.filter((_, i) => i !== targetIdx);
    const y = mat.map((r) => r[targetIdx]);
    // binarize if necessary
    const uniqueY = [...new Set(y)];
    let yBin = y;
    if (uniqueY.length !== 2) {
      const med = median(y);
      yBin = y.map((v) => (v >= med ? 1 : 0));
    }
    // compute pearson per feature
    const t = transpose(X);
    const scores = t.map((col) => Math.abs(pearson(col, yBin)));
    // rank
    const ranked = fieldNamesX.map((f, i) => ({ feature: f, score: scores[i] }));
    ranked.sort((a, b) => b.score - a.score);
    // evaluate top-k for several k
    const evals = [];
    for (const k of [1, 3, 5, 10, Math.min(15, fieldNamesX.length)]) {
      const selIdx = ranked.slice(0, k).map((r) => fieldNamesX.indexOf(r.feature));
      const Xsub = mat.map((row) => selIdx.map((i) => row.filter((_, j) => j !== targetIdx)[i]));
      const split = Math.floor(Xsub.length * 0.7);
      const { Xs: XtrainS, means, sds } = standardizeMatrix(Xsub.slice(0, split));
      const XtestS = Xsub.slice(split).map((row) => row.map((v, j) => (v - means[j]) / (sds[j] || 1)));
      const ytrain = yBin.slice(0, split);
      const ytest = yBin.slice(split);
      const model = trainLogisticRegression(XtrainS, ytrain, { lr: 0.3, epochs: 120 });
      const ypred = predictLogistic(model, XtestS);
      const acc = accuracy(ytest, ypred);
      evals.push({ k, acc });
    }
    setTradResult({ ranked, evals });
    setPage("traditional_results");
    setStatus("Traditional method finished.");
  };

  const handleConfirmUpload = () => {
    setPage("success");
    setStatus("File uploaded successfully.");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">مشروع: اختيار الميزات بالخوارزمية الجينية (واجهة React)</h1>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setPage("upload")} className={`px-3 py-1 rounded ${page==="upload"?"bg-blue-600 text-white":"bg-gray-100"}`}>Upload</button>
          <button onClick={() => setPage("preview")} className={`px-3 py-1 rounded ${page==="preview"?"bg-blue-600 text-white":"bg-gray-100"}`}>Preview</button>
          <button onClick={() => setPage("genetic_results")} className={`px-3 py-1 rounded ${page==="genetic_results"?"bg-blue-600 text-white":"bg-gray-100"}`}>Genetic Results</button>
          <button onClick={() => setPage("traditional_results")} className={`px-3 py-1 rounded ${page==="traditional_results"?"bg-blue-600 text-white":"bg-gray-100"}`}>Traditional Results</button>
          <button onClick={() => setPage("success")} className={`px-3 py-1 rounded ${page==="success"?"bg-blue-600 text-white":"bg-gray-100"}`}>Success</button>
        </div>

        {page === "upload" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">صفحة ال upload</h2>
            <p className="mb-2">ارفع ملف CSV يحتوي على سمات (ميزات) وعمود الهدف (target).</p>
            <input type="file" accept="text/csv" onChange={(e) => handleFile(e.target.files[0])} />
            <div className="mt-4">
              <button onClick={handleConfirmUpload} className="px-4 py-2 bg-green-600 text-white rounded">تأكيد رفع الملف (صفحة success)</button>
            </div>
          </div>
        )}

        {page === "preview" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">صفحة preview</h2>
            {!rows && <p>لا يوجد ملف بعد — ارفع ملفًا في صفحة ال upload.</p>}
            {rows && (
              <div>
                <p className="mb-2">اختر عمود الهدف (target):</p>
                <select value={target || ""} onChange={(e) => setTarget(e.target.value)} className="border p-1">
                  <option value="">-- اختر --</option>
                  {fields.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <div className="mt-4 overflow-auto max-h-64 border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        {fields.map((f) => (
                          <th key={f} className="px-2 py-1 border">{f}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          {fields.map((f) => (
                            <td key={f} className="px-2 py-1 border">{String(r[f])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { buildNumeric(); setStatus('Prepared numeric data.'); }} className="px-3 py-1 bg-indigo-600 text-white rounded">تحضير البيانات</button>
                  <button onClick={() => runGA()} className="px-3 py-1 bg-blue-600 text-white rounded">تشغيل الخوارزمية الجينية</button>
                  <button onClick={() => runTraditional()} className="px-3 py-1 bg-yellow-600 text-white rounded">تشغيل الطريقة التقليدية</button>
                </div>
              </div>
            )}
          </div>
        )}

        {page === "genetic_results" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">صفحة genetic_results</h2>
            <p>Status: {status}</p>
            {progress && (
              <div className="my-2 p-2 border rounded">
                <p>تقدم الجيل: {progress.gen}</p>
                <p>أفضل دقّة حتى الآن: {(progress.best.acc * 100).toFixed(2)}%</p>
                <p>عدد الميزات المختارة: {progress.best.nFeatures}</p>
              </div>
            )}
            {gaResult && (
              <div className="mt-3 p-3 border rounded">
                <h3 className="font-semibold">النتيجة النهائية (GA)</h3>
                <p>دقّة النموذج: {(gaResult.best.acc * 100).toFixed(2)}%</p>
                <p>عدد الميزات: {gaResult.best.nFeatures}</p>
                <p>الميزات المختارة:</p>
                <ul className="list-disc ml-6">{gaResult.selected.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {page === "traditional_results" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">صفحة traditional_results</h2>
            {tradResult ? (
              <div>
                <h3 className="font-semibold">ترتيب الميزات بال Pearson (قيمة مطلقة)</h3>
                <ol className="list-decimal ml-6">
                  {tradResult.ranked.slice(0, 20).map((r) => <li key={r.feature}>{r.feature} — score: {r.score.toFixed(3)}</li>)}
                </ol>
                <h3 className="mt-3 font-semibold">تقييم top-k</h3>
                <ul className="list-disc ml-6">
                  {tradResult.evals.map((e) => <li key={e.k}>k={e.k} &nbsp; accuracy={(e.acc*100).toFixed(2)}%</li>)}
                </ul>
              </div>
            ) : (
              <p>لم تقم بتشغيل الطريقة التقليدية بعد.</p>
            )}
          </div>
        )}

        {page === "success" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">صفحة success</h2>
            <p>{status || 'تم رفع الملف بنجاح.'}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">ملاحظة: هذه واجهة تعليمية لتجربة الخوارزمية الجينية داخل المتصفح. للمشاريع الكبيرة أو قواعد البيانات الضخمة، يُنصح بنقل التدريب إلى خادم (بايثون/خدمات سحابية) ثم عرض النتائج في الواجهة.</div>
      </div>
    </div>
  );
}

// small extra helpers
function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 === 0 ? (a[mid - 1] + a[mid]) / 2 : a[mid];
}
