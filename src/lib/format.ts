export function formatBRL(
  value: number,
  opts: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
) {
  const safe = Number.isFinite(value) ? value : 0;
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = opts;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(safe);
}

export function formatBRLNoCents(value: number) {
  return formatBRL(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatBRLCompact(
  value: number,
  opts: {
    maximumFractionDigits?: number;
  } = {}
) {
  const safe = Number.isFinite(value) ? value : 0;
  const { maximumFractionDigits = 1 } = opts;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits,
  }).format(safe);
}

