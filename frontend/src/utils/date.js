export function formatDateTime(date) {
  if (!date) return "-";

  const raw = String(date);

  const normalized =
    raw.endsWith("Z") || raw.includes("+") ? raw : `${raw}Z`;

  return new Date(normalized).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDate(date) {
  if (!date) return "-";

  const raw = String(date);

  const normalized =
    raw.endsWith("Z") || raw.includes("+") ? raw : `${raw}Z`;

  return new Date(normalized).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}