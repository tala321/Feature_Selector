fetch('/results/genetic/')
  .then(response => response.json())
  .then(data => {
    const tbody = document.querySelector('#genetic-table tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.feature}</td><td>${item.score}</td>`;
      tbody.appendChild(row);
    });
  });