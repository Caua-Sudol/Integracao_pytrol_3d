# Pimp Three

Protótipo em Three.js para validar relatórios 3D interativos acionados pelo Pytrol.

## Objetivo

Renderizar um relatório visual de fluxo de CT-e por filial e período:

- altura da barra: quantidade de CT-es na célula;
- cor da barra: valor total agregado;
- tooltip: peso, m3, peso cubado, volumes, valor e CT-es agrupados.

## Como Rodar Localmente

Instale as dependências uma vez:

```bash
npm install
```

Para testar:

```bash
npx vite
```

O `vite.config.js` lê `VITE_PUBLIC_APP_URL` e usa a porta dessa URL. Se a URL tiver um IP de rede, o servidor sobe com `host 0.0.0.0` para outras máquinas acessarem.

Para testar temporariamente sem `.env`, ainda é possível sobrescrever via linha de comando:

```bash
npx vite --host 0.0.0.0 --port 5173
```

Depois acesse pelo IP da máquina que está rodando o Vite:

```text
http://SEU_IP_LOCAL:5173/
```

## Configuração Local

Crie a partir do exemplo:

```bash
cp .env.example .env
```

## Integração Com Pytrol

O Pytrol abre este app em uma janela separada e envia os dados por `postMessage`.

Mensagem esperada:

```js
{
  type: 'PYTROL_THREE_DATA',
  payload: {
    panelId: '251',
    agencyCode: 10,
    date: '2026-07-10',
    rows: []
  }
}
```

Se o app for aberto direto no navegador, ele usa `sampleRows` como fallback para facilitar testes isolados.

## Estrutura

```text
main.js
src/data/
src/scene/
src/interaction/
src/ui/
```

- `src/data`: normalização, bucketing e criação da grade.
- `src/scene`: cena, câmera, luzes, labels e barras.
- `src/interaction`: raycast e hover.
- `src/ui`: tooltip.

## Observações

Este projeto ainda é um protótipo.
