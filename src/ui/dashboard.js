const SERIES_COLORS = ['#327e86', '#d0714f', '#7a6aa8', '#d3a22f'];
const DONUT_COLORS = ['#327e86', '#d0714f', '#7a6aa8', '#d3a22f', '#65815b', '#9d5961'];

export function renderDashboard(container, payload) {
  container.replaceChildren();

  const reportType = payload?.reportType;
  if (!reportType) {
    container.append(createEmptyState('Nenhum dado de telemetria carregado.'));
    return;
  }

  const header = element('header', 'dashboard-header');
  const heading = element('div');
  heading.append(
    textElement('span', 'dashboard-eyebrow', 'Painel 257'),
    textElement('h1', '', payload.title || 'Telemetria'),
    textElement('p', '', formatPeriod(payload.period)),
  );
  header.append(heading);

  const body = element('div', 'dashboard-content');
  body.append(createSummary(payload.summary || []));

  if (reportType === 'telemetry-operational') {
    body.append(
      createDailyChart(
        'Movimentação diária',
        payload.daily || [],
        [
          { key: 'created', label: 'Iniciados' },
          { key: 'completed', label: 'Concluídos' },
          { key: 'returned', label: 'Retornos' },
          { key: 'deleted', label: 'Exclusões' },
        ],
      ),
      createChartGrid(
        createHorizontalChart('Operações mais usadas', payload.actionBreakdown || []),
        createDonutChart('Distribuição atual por etapa', payload.stageBreakdown || []),
      ),
    );
  } else {
    body.append(
      createDailyChart(
        'Interações por dia',
        payload.daily || [],
        [
          { key: 'events', label: 'Interações' },
          { key: 'sessions', label: 'Sessões' },
        ],
      ),
      createChartGrid(
        createHorizontalChart('Pontos mais acessados', payload.eventBreakdown || []),
        createDonutChart('Resultado das interações', payload.resultBreakdown || []),
      ),
      createHorizontalChart('Validações mais frequentes', payload.codeBreakdown || []),
    );
  }

  container.append(header, body);
}

function createSummary(metrics) {
  const section = element('section', 'metric-grid');

  metrics.forEach((metric) => {
    const item = element('article', 'metric-item');
    item.append(
      textElement('span', '', metric.label || metric.key || 'Métrica'),
      textElement('strong', '', formatNumber(metric.value)),
    );
    section.append(item);
  });

  return section;
}

function createDailyChart(title, rows, series) {
  const section = createChartSection(title, 'chart-section chart-section--wide');
  const chart = element('div', 'column-chart');
  const maxValue = Math.max(
    1,
    ...rows.flatMap(row => series.map(item => numberValue(row[item.key]))),
  );

  if (!rows.length) {
    section.append(createEmptyState('Sem eventos no período.'));
    return section;
  }

  rows.forEach((row) => {
    const group = element('div', 'column-group');
    const bars = element('div', 'column-bars');

    series.forEach((item, index) => {
      const value = numberValue(row[item.key]);
      const bar = element('div', 'column-bar');
      bar.style.height = `${Math.max((value / maxValue) * 100, value ? 4 : 0)}%`;
      bar.style.backgroundColor = SERIES_COLORS[index % SERIES_COLORS.length];
      bar.title = `${item.label}: ${formatNumber(value)}`;
      bars.append(bar);
    });

    group.append(bars, textElement('span', '', formatShortDate(row.date)));
    chart.append(group);
  });

  section.append(createLegend(series), chart);
  return section;
}

function createHorizontalChart(title, rows) {
  const section = createChartSection(title);
  const chart = element('div', 'horizontal-chart');
  const visibleRows = rows.slice(0, 10);
  const maxValue = Math.max(1, ...visibleRows.map(row => numberValue(row.value)));

  if (!visibleRows.length) {
    section.append(createEmptyState('Sem dados no período.'));
    return section;
  }

  visibleRows.forEach((row, index) => {
    const item = element('div', 'horizontal-row');
    const label = element('div', 'horizontal-label');
    label.append(
      textElement('span', '', row.label || row.key || 'Item'),
      textElement('strong', '', formatNumber(row.value)),
    );
    const track = element('div', 'horizontal-track');
    const fill = element('div', 'horizontal-fill');
    fill.style.width = `${(numberValue(row.value) / maxValue) * 100}%`;
    fill.style.backgroundColor = DONUT_COLORS[index % DONUT_COLORS.length];
    track.append(fill);
    item.append(label, track);
    chart.append(item);
  });

  section.append(chart);
  return section;
}

function createDonutChart(title, rows) {
  const section = createChartSection(title);
  const content = element('div', 'donut-layout');
  const total = rows.reduce((sum, row) => sum + numberValue(row.value), 0);
  const donut = element('div', 'donut-chart');
  donut.style.background = createConicGradient(rows, total);
  donut.append(textElement('strong', '', formatNumber(total)));

  const legend = element('div', 'donut-legend');
  rows.slice(0, 8).forEach((row, index) => {
    const item = element('div');
    const swatch = element('span', 'legend-swatch');
    swatch.style.backgroundColor = DONUT_COLORS[index % DONUT_COLORS.length];
    item.append(
      swatch,
      textElement('span', '', row.label || row.key || 'Item'),
      textElement('strong', '', formatNumber(row.value)),
    );
    legend.append(item);
  });

  if (!rows.length) {
    section.append(createEmptyState('Sem dados no período.'));
    return section;
  }

  content.append(donut, legend);
  section.append(content);
  return section;
}

function createConicGradient(rows, total) {
  if (!total) return '#dfe4e7';

  let offset = 0;
  const stops = rows.slice(0, 8).map((row, index) => {
    const start = offset;
    offset += (numberValue(row.value) / total) * 100;
    return `${DONUT_COLORS[index % DONUT_COLORS.length]} ${start}% ${offset}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

function createChartGrid(...sections) {
  const grid = element('div', 'chart-grid');
  grid.append(...sections);
  return grid;
}

function createChartSection(title, className = 'chart-section') {
  const section = element('section', className);
  section.append(textElement('h2', '', title));
  return section;
}

function createLegend(series) {
  const legend = element('div', 'chart-legend');
  series.forEach((item, index) => {
    const entry = element('span');
    const swatch = element('i');
    swatch.style.backgroundColor = SERIES_COLORS[index % SERIES_COLORS.length];
    entry.append(swatch, document.createTextNode(item.label));
    legend.append(entry);
  });
  return legend;
}

function createEmptyState(message) {
  return textElement('p', 'empty-state', message);
}

function formatPeriod(period = {}) {
  if (!period.from || !period.to) return 'Período não informado';
  return `${formatDate(period.from)} a ${formatDate(period.to)}`;
}

function formatDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : String(value || '');
}

function formatShortDate(value) {
  const [, month, day] = String(value || '').slice(0, 10).split('-');
  return month && day ? `${day}/${month}` : String(value || '');
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(numberValue(value));
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function textElement(tagName, className, text) {
  const node = element(tagName, className);
  node.textContent = text;
  return node;
}

function element(tagName, className = '') {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  return node;
}
