        // State management
        let watchList = [];
        let externalData = [];
        let useLocalStorage = true;

        // DOM elements
        const addForm = document.getElementById('addForm');
        const watchListElement = document.getElementById('watchList');
        const typeSelect = document.getElementById('type');
        const tvFields = document.getElementById('tvFields');
        const exportBtn = document.getElementById('exportBtn');
        const importForm = document.getElementById('importForm');
        const nameInput = document.getElementById('name');
        const nameSuggestions = document.getElementById('nameSuggestions');
        const storageToggle = document.getElementById('storageToggle');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const dataFrame = document.getElementById('dataFrame');
        const dynamicFrame = document.getElementById('dynamicFrame');
        

        let chart;

        // Load data based on storage preference
        async function loadData() {
            if (useLocalStorage) {
                const storedData = localStorage.getItem('watchList');
                watchList = storedData ? JSON.parse(storedData) : [];
            } else {
                try {
                    const response = await fetch('https://samkarya.github.io/Side-fun/watchlist.json');
                    watchList = await response.json();
                } catch (error) {
                    console.error('Error loading external data:', error);
                    watchList = [];
                }
            }
        }

        // Load external data for suggestions
        async function loadExternalData() {
            try {
                const response = await fetch('https://samkarya.github.io/Side-fun/watchlist.json');
                externalData = await response.json();
            } catch (error) {
                console.error('Error loading external data:', error);
            }
        }

        // Initialize
        async function init() {
            await loadExternalData();
            await loadData();
            updateTVFields();
            renderWatchList();
            setupEventListeners();
            updateIframe();
        }

        // Event Listeners
        function setupEventListeners() {
            typeSelect.addEventListener('change', updateTVFields);
            addForm.addEventListener('submit', handleFormSubmit);
            exportBtn.addEventListener('click', handleExport);
            importForm.addEventListener('submit', handleImport);
            nameInput.addEventListener('input', handleNameInput);
            document.addEventListener('click', handleOutsideClick);
            storageToggle.addEventListener('change', handleStorageToggle);
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }

        // UI update functions
        function updateTVFields() {
            tvFields.style.display = typeSelect.value === 'tv' ? 'block' : 'none';
        }

        function renderWatchList() {
            watchListElement.innerHTML = '';
            watchList.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.name} (${item.type === 'tv' ? `TV: S${item.season}E${item.episode}` : 'Movie'})</span>
                    <select class="status-select" data-index="${index}">
                        <option value="Watching" ${item.status === 'Watching' ? 'selected' : ''}>Watching</option>
                        <option value="Watched" ${item.status === 'Watched' ? 'selected' : ''}>Watched</option>
                        <option value="On Hold" ${item.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                        <option value="Planned" ${item.status === 'Planned' ? 'selected' : ''}>Planned</option>
                    </select>
                `;
                watchListElement.appendChild(li);
            });
            updateChart();
            updateIframe();
        }

        // Chart functions
        function updateChart() {
            const statusCounts = {
                'Watching': 0,
                'Watched': 0,
                'On Hold': 0,
                'Planned': 0
            };
            
            watchList.forEach(item => {
                statusCounts[item.status]++;
            });
            
            const data = {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#bb86fc', '#03dac6', '#ffb74d', '#cf6679']
                }]
            };
            
            if (chart) {
                chart.data = data;
                chart.update();
            } else {
                const ctx = document.getElementById('statusChart').getContext('2d');
                chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: '#ffffff'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Watch Status Distribution',
                                color: '#ffffff',
                                font: {
                                    size: 16
                                }
                            }
                        }
                    }
                });
            }
        }

        // Event handlers
        function handleFormSubmit(e) {
            e.preventDefault();
            const type = typeSelect.value;
            const name = nameInput.value;
            const id = document.getElementById('id').value;
            const season = document.getElementById('season').value;
            const episode = document.getElementById('episode').value;
            
            const newItem = {
                type,
                name,
                id,
                season: type === 'tv' ? parseInt(season) || 1 : null,
                episode: type === 'tv' ? parseInt(episode) || 1 : null,
                status: 'Watching',
                date: new Date().toISOString()
            };
             // Generate URL based on type
    let url;
    if (type === 'tv') {
        url = `https://vidsrc.cc/v2/embed/tv/${id}/${season || '1'}/${episode || '1'}`;
    } else {
        url = `https://vidsrc.cc/v2/embed/movie/${id}`;
    }

    // Update the iframe's URL
    dynamicFrame.src = url;

            watchList.push(newItem);
            if (useLocalStorage) {
                localStorage.setItem('watchList', JSON.stringify(watchList));
            } else {
                navigator.clipboard.writeText(JSON.stringify(newItem, null, 2))
                    .then(() => showNotification('New item copied to clipboard!'))
                    .catch(err => console.error('Failed to copy: ', err));
            }
            renderWatchList();

            addForm.reset();
            showNotification('Item added successfully!');
        }

        function handleNameInput() {
            const searchTerm = nameInput.value.toLowerCase();
            const suggestions = externalData
                .filter(item => item.name.toLowerCase().includes(searchTerm))
                .slice(0, 5);

            nameSuggestions.innerHTML = '';
            suggestions.forEach(item => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = item.name;
                div.onclick = () => {
                    nameInput.value = item.name;
                    document.getElementById('id').value = item.id;
                    if (item.type === 'tv') {
                        document.getElementById('season').value = item.season || '';
                        document.getElementById('episode').value = item.episode || '';
                    }
                    typeSelect.value = item.type;
                    updateTVFields();
                    nameSuggestions.innerHTML = '';
                };
                nameSuggestions.appendChild(div);
            });
        }

        function handleOutsideClick(e) {
            if (!nameInput.contains(e.target)) {
                nameSuggestions.innerHTML = '';
            }
        }

        function handleExport() {
            const dataStr = JSON.stringify(watchList, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = 'watchlist.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showNotification('Watch list exported successfully!');
        }

        async function handleImport(e) {
            e.preventDefault();
            const githubUrl = document.getElementById('githubUrl').value;
            const fileInput = document.getElementById('fileInput').files[0];
            
            try {
                let importedData;
                if (githubUrl) {
                    const response = await fetch(githubUrl);
                    importedData = await response.json();
                } else if (fileInput) {
                    const text = await fileInput.text();
                    importedData = JSON.parse(text);
                }
                
                if (importedData) {
                    watchList = [...watchList, ...importedData];
                    if (useLocalStorage) {
                        localStorage.setItem('watchList', JSON.stringify(watchList));
                    }
                    renderWatchList();
                    showNotification('Watch list imported successfully!');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                showNotification('Error importing data. Please check the format.', 'error');
            }
        }

        function handleStorageToggle(e) {
            useLocalStorage = e.target.checked;
            loadData().then(() => {
                renderWatchList();
                showNotification(`Switched to ${useLocalStorage ? 'local storage' : 'external data'}`);
            });
        }

        // Utility functions
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '4px';
            notification.style.backgroundColor = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';
            notification.style.color = 'var(--bg-primary)';
            notification.style.zIndex = '1000';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Status update handler
        watchListElement.addEventListener('change', function(e) {
            if (e.target.classList.contains('status-select')) {
                const index = parseInt(e.target.dataset.index);
                watchList[index].status = e.target.value;
                if (useLocalStorage) {
                    localStorage.setItem('watchList', JSON.stringify(watchList));
                }
                updateChart();
                updateIframe();
            }
        });

        // iframe functions
        function updateIframe() {
            const iframeContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Watch List Data</title>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f0f0f0; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #4CAF50; color: white; }
                    </style>
                </head>
                <body>
                    <h1>Watch List Data</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${watchList.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.type}</td>
                                    <td>${item.status}</td>
                                    <td>${new Date(item.date).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            dataFrame.srcdoc = iframeContent;
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                dynamicFrame.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }        

        // Initialize the application
        init();
