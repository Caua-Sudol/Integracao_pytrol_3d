const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
});

export function createTooltip() {
  const element = document.createElement('div');
  element.style.cssText = `
    position: fixed;
    z-index: 5;
    display: none;
    min-width: 220px;
    padding: 10px 12px;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 8px;
    background: rgba(13, 18, 23, 0.94);
    color: #f4f7fb;
    font: 12px Arial, sans-serif;
    line-height: 1.45;
    pointer-events: none;
    box-shadow: 0 10px 24px rgba(0,0,0,0.28);
  `;
  document.body.appendChild(element);

  return {
    show(x, y, meta) {
      element.innerHTML = buildContent(meta);
      element.style.display = 'block';
      element.style.left = `${x + 14}px`;
      element.style.top = `${y + 14}px`;
    },
    hide() {
      element.style.display = 'none';
    },
    dispose() {
      element.remove();
    },
  };
}

function buildContent(meta) {
  const ctes = meta.rows.map(row => row.cte_numero).slice(0, 4).join(', ') || '-';

  return `
    <strong>Filial ${meta.filial}</strong><br>
    Fluxo: ${meta.fluxo} CT-e<br>
    Valor: ${currencyFormatter.format(meta.valor_total)}<br>
    Peso: ${numberFormatter.format(meta.peso)} kg<br>
    M3: ${numberFormatter.format(meta.m3)}<br>
    Peso cubado: ${numberFormatter.format(meta.peso3)}<br>
    Volumes: ${numberFormatter.format(meta.volumes)}<br>
    CT-e: ${ctes}
  `;
}
