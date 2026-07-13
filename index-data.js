function buildFilialIndex(rows) {
  const unique = [...new Set(rows.map(r => r.filial_destino))].sort((a, b) => a - b);
  const filialToIndex = new Map(unique.map((v, i) => [v, i]));
  return { unique, filialToIndex };
}

function buildDateBuckets(rows, targetBuckets = 20) {
  const timestamps = rows.map(r => new Date(r.data_exibicao).getTime());
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);
  const rangeMs = Math.max(maxT - minT, 1);

  const oneDayMs = 24 * 60 * 60 * 1000;
  const bucketSizeMs = Math.max(rangeMs / targetBuckets, oneDayMs);

  const bucketIndexFor = (dateStr) => {
    const t = new Date(dateStr).getTime();
    return Math.floor((t - minT) / bucketSizeMs);
  };

  const bucketCount = Math.floor((maxT - minT) / bucketSizeMs) + 1;

  const bucketLabels = Array.from({ length: bucketCount }, (_, i) => {
    const d = new Date(minT + i * bucketSizeMs);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  return { bucketIndexFor, bucketCount, bucketLabels };
}

function buildGrid(rows, filialIndex, dateBuckets) {
  const { unique: filiais, filialToIndex } = filialIndex;
  const { bucketIndexFor, bucketCount } = dateBuckets;

  const grid = [];
  for (let f = 0; f < filiais.length; f++) {
    for (let p = 0; p < bucketCount; p++) {
      grid.push({
        filialIndex: f,
        periodIndex: p,
        filial: filiais[f],
        fluxo: 0,
        valor_total: 0,
        peso: 0,
        m3: 0,
        peso3: 0,
        volumes: 0,
        rows: [],
      });
    }
  }

  const cellAt = (f, p) => grid[f * bucketCount + p];

  for (const row of rows) {
    const f = filialToIndex.get(row.filial_destino);
    const p = bucketIndexFor(row.data_exibicao);
    const cell = cellAt(f, p);

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

function linearScale(value, domainMin, domainMax, rangeMin, rangeMax) {
  if (domainMax === domainMin) return rangeMin;
  const t = (value - domainMin) / (domainMax - domainMin);
  return rangeMin + t * (rangeMax - rangeMin);
}

function colorScale(value, domainMin, domainMax, colorLow, colorHigh) {
  const t = domainMax === domainMin ? 0 : (value - domainMin) / (domainMax - domainMin);
  const lerp = (a, b) => Math.round(a + (b - a) * t);
  return {
    r: lerp(colorLow.r, colorHigh.r),
    g: lerp(colorLow.g, colorHigh.g),
    b: lerp(colorLow.b, colorHigh.b),
  };
}

function buildGraphData(rows, { spacing = 2, targetBuckets = 20 } = {}) {
  const filialIndex = buildFilialIndex(rows);
  const dateBuckets = buildDateBuckets(rows, targetBuckets);
  const grid = buildGrid(rows, filialIndex, dateBuckets);

  const maxFluxo = Math.max(...grid.map(c => c.fluxo), 1);
  const maxValor = Math.max(...grid.map(c => c.valor_total), 1);

  const colorLow = { r: 60, g: 120, b: 220 };
  const colorHigh = { r: 230, g: 140, b: 40 };

  const instances = grid.map(cell => ({
    x: cell.filialIndex * spacing,
    z: cell.periodIndex * spacing,
    height: linearScale(cell.fluxo, 0, maxFluxo, 0.05, 5),
    color: colorScale(cell.valor_total, 0, maxValor, colorLow, colorHigh),
    meta: cell,
  }));

  return { instances, filiais: filialIndex.unique, bucketLabels: dateBuckets.bucketLabels };
}

// teste

const sample = [
    {
      cte_serial: 99999999,
      cte_numero: '99/9999999',
      data_exibicao: '2026-06-01 23:20:57',
      filial_destino: 7,
      peso_cte: 3.736,
      m3_cte: 0.0,
      peso3_cte: 3.736,
      volumes: 1,
      valor_total_cte: 87.0,
    },
  ];

console.log(JSON.stringify(buildGraphData(sample), null, 2));