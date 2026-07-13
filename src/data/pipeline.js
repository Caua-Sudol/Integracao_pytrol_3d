export function buildGraphData(rows, { spacing = 2, targetBuckets = 20 } = {}) {
  const normalizedRows = rows.map(normalizeRow);

  if (normalizedRows.length === 0) {
    return { instances: [], filiais: [], bucketLabels: [], spacing };
  }

  const filialIndex = buildFilialIndex(normalizedRows);
  const dateBuckets = buildDateBuckets(normalizedRows, targetBuckets);
  const grid = buildGrid(normalizedRows, filialIndex, dateBuckets);

  const maxFluxo = Math.max(...grid.map(cell => cell.fluxo), 1);
  const maxValor = Math.max(...grid.map(cell => cell.valor_total), 1);

  const instances = grid.map(cell => ({
    x: cell.filialIndex * spacing,
    z: cell.periodIndex * spacing,
    height: linearScale(cell.fluxo, 0, maxFluxo, 0.06, 6),
    color: colorScale(cell.valor_total, 0, maxValor),
    meta: cell,
  }));

  return {
    instances,
    filiais: filialIndex.unique,
    bucketLabels: dateBuckets.bucketLabels,
    spacing,
  };
}

function normalizeRow(row) {
  return {
    ...row,
    filial_destino: Number(row.filial_destino),
    peso_cte: Number(row.peso_cte || 0),
    m3_cte: Number(row.m3_cte || 0),
    peso3_cte: Number(row.peso3_cte || 0),
    volumes: Number(row.volumes || 0),
    valor_total_cte: Number(row.valor_total_cte || 0),
  };
}

function buildFilialIndex(rows) {
  const unique = [...new Set(rows.map(row => row.filial_destino))].sort((a, b) => a - b);
  const filialToIndex = new Map(unique.map((value, index) => [value, index]));
  return { unique, filialToIndex };
}

function buildDateBuckets(rows, targetBuckets) {
  const timestamps = rows.map(row => new Date(row.data_exibicao).getTime());
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);
  const rangeMs = Math.max(maxT - minT, 1);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const bucketSizeMs = Math.max(rangeMs / targetBuckets, oneDayMs);
  const bucketCount = Math.floor((maxT - minT) / bucketSizeMs) + 1;

  return {
    bucketCount,
    bucketIndexFor: dateStr => Math.floor((new Date(dateStr).getTime() - minT) / bucketSizeMs),
    bucketLabels: Array.from({ length: bucketCount }, (_, index) => formatDate(minT + index * bucketSizeMs)),
  };
}

function buildGrid(rows, filialIndex, dateBuckets) {
  const { unique: filiais, filialToIndex } = filialIndex;
  const { bucketIndexFor, bucketCount } = dateBuckets;
  const grid = [];

  for (let filialIndexValue = 0; filialIndexValue < filiais.length; filialIndexValue += 1) {
    for (let periodIndex = 0; periodIndex < bucketCount; periodIndex += 1) {
      grid.push(createCell(filialIndexValue, periodIndex, filiais[filialIndexValue]));
    }
  }

  for (const row of rows) {
    const filialPosition = filialToIndex.get(row.filial_destino);
    const periodPosition = bucketIndexFor(row.data_exibicao);
    const cell = grid[filialPosition * bucketCount + periodPosition];

    cell.fluxo += 1;
    cell.valor_total += row.valor_total_cte;
    cell.peso += row.peso_cte;
    cell.m3 += row.m3_cte;
    cell.peso3 += row.peso3_cte;
    cell.volumes += row.volumes;
    cell.rows.push(row);
  }

  return grid;
}

function createCell(filialIndex, periodIndex, filial) {
  return {
    filialIndex,
    periodIndex,
    filial,
    fluxo: 0,
    valor_total: 0,
    peso: 0,
    m3: 0,
    peso3: 0,
    volumes: 0,
    rows: [],
  };
}

function linearScale(value, domainMin, domainMax, rangeMin, rangeMax) {
  if (domainMax === domainMin) return rangeMin;
  return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

function colorScale(value, domainMin, domainMax) {
  const t = domainMax === domainMin ? 0 : (value - domainMin) / (domainMax - domainMin);
  return {
    r: lerp(60, 230, t) / 255,
    g: lerp(120, 140, t) / 255,
    b: lerp(220, 40, t) / 255,
  };
}

function lerp(start, end, t) {
  return Math.round(start + (end - start) * t);
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}
