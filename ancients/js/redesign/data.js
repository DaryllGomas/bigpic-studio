const REFERENCE_YEAR = 2026;

const DATA_URLS = Object.freeze({
  timeline: new URL("../../data/timeline.json", import.meta.url),
  didYouKnow: new URL("../../data/did-you-know.json", import.meta.url),
  artifacts: new URL("../../data/artifacts.json", import.meta.url),
});

let dataPromise;

function yearsAgo(yearString, referenceYear = REFERENCE_YEAR) {
  if (typeof yearString !== "string") {
    throw new TypeError("yearsAgo() expects a BCE or CE year string.");
  }

  if (!Number.isFinite(referenceYear)) {
    throw new TypeError("yearsAgo() expects a finite reference year.");
  }

  const normalized = yearString
    .trim()
    .replace(/^(?:(?:~|c(?:irca)?\.?)[\s]*)+/i, "")
    .replaceAll(",", "")
    .toUpperCase();
  const match = normalized.match(/^(\d+)\s*(BCE|CE)$/);

  if (!match) {
    throw new RangeError(`Unable to parse historical year: ${yearString}`);
  }

  const year = Number.parseInt(match[1], 10);
  return match[2] === "BCE" ? referenceYear + year : referenceYear - year;
}

function selfTestYearsAgo() {
  const cases = [
    ["~10,900 BCE", 12926],
    ["c. 500 BCE", 2526],
    ["476 CE", 1550],
    ["2,026 CE", 0],
  ];

  for (const [input, expected] of cases) {
    const actual = yearsAgo(input);
    if (actual !== expected) {
      throw new Error(`yearsAgo self-test failed for ${input}: expected ${expected}, received ${actual}`);
    }
  }

  return cases.length;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url.pathname}: HTTP ${response.status}`);
  }
  return response.json();
}

function summarizeData({ timeline, didYouKnow, artifacts }) {
  const periods = timeline.periods ?? [];
  return {
    eras: periods.length,
    events: periods.reduce((count, period) => count + period.events.length, 0),
    artifacts: Object.keys(artifacts).length,
    didYouKnowCollections: Object.keys(didYouKnow).length,
    didYouKnowFacts: Object.values(didYouKnow).reduce((count, facts) => count + facts.length, 0),
  };
}

function loadAncientsData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetchJson(DATA_URLS.timeline),
      fetchJson(DATA_URLS.didYouKnow),
      fetchJson(DATA_URLS.artifacts),
    ]).then(([timeline, didYouKnow, artifacts]) => ({
      timeline,
      didYouKnow,
      artifacts,
    }));
  }

  return dataPromise;
}

const selfTestCount = selfTestYearsAgo();

if (typeof document !== "undefined") {
  console.info(`[Ancients] yearsAgo self-test passed (${selfTestCount} cases).`);
  document.documentElement.dataset.dataState = "loading";

  loadAncientsData()
    .then((data) => {
      const counts = summarizeData(data);
      document.documentElement.dataset.dataState = "ready";
      console.info(
        `[Ancients] Content loaded: ${counts.eras} eras, ${counts.events} events, ` +
          `${counts.artifacts} artifacts, ${counts.didYouKnowFacts} facts ` +
          `across ${counts.didYouKnowCollections} fact collections.`,
      );
      document.dispatchEvent(new CustomEvent("ancients:data-ready", { detail: data }));
    })
    .catch((error) => {
      document.documentElement.dataset.dataState = "error";
      console.error("[Ancients] Content failed to load.", error);
    });
}

export {
  DATA_URLS,
  REFERENCE_YEAR,
  loadAncientsData,
  selfTestYearsAgo,
  summarizeData,
  yearsAgo,
};
