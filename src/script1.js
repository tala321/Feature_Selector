fetch('http://127.0.0.1:8000/run-genetic')
  .then(response => response.json())
  .then(data => {
    // عرض الميزات المختارة
    const selectedList = document.querySelector('#selected-features');
    data.selected_features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      selectedList.appendChild(li);
    });

    // عرض الميزات غير المؤثرة
    const irrelevantList = document.querySelector('#irrelevant-features');
    data.irrelevant_features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      irrelevantList.appendChild(li);
    });

    // عرض القيم الأخرى
    document.getElementById('accuracy').textContent = data.accuracy;
    document.getElementById('generations').textContent = data.generations;
    document.getElementById('population').textContent = data.population_size;
  });