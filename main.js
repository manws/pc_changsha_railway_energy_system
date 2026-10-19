// Main Entry - Page Router & Global Logic
import { mockData } from './mockData.js';
import { renderOverview } from './pages/overview.js';
import { renderPVMonitor } from './pages/pvMonitor.js';
import { renderPVForecast } from './pages/pvForecast.js';
import { renderLoadMonitor } from './pages/loadMonitor.js';
import { renderESSMonitor } from './pages/essMonitor.js';
import { renderSchedule } from './pages/schedule.js';

// Page Registry
const pages = {
    ov: { title: '能源协同总览', render: renderOverview },
    pv: { title: '光伏监控', render: renderPVMonitor },
    pvfc: { title: '光伏预测', render: renderPVForecast },
    ld: { title: '负荷监控', render: renderLoadMonitor },
    es: { title: '储能看板', render: renderESSMonitor },
    sch: { title: '智能调度', render: renderSchedule },
};

let currentPage = 'ov';

// Update clock
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent =
        now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateTime, 1000);
updateTime();

// Page switch
function switchPage(pageKey) {
    if (currentPage === pageKey) return;
    currentPage = pageKey;
    const page = pages[pageKey];

    // Update nav
    document.querySelectorAll('.top-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageKey);
    });

    // Update breadcrumb
    document.getElementById('breadcrumb').textContent = page.title;

    // Render page
    const main = document.getElementById('mainContent');
    main.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'page active';
    container.id = 'page-' + pageKey;
    main.appendChild(container);
    page.render(container, mockData);
}

// Nav click handler
document.getElementById('topNav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.top-nav-item');
    if (navItem) {
        e.preventDefault();
        switchPage(navItem.dataset.page);
    }
});

// Initial load
switchPage('ov');
