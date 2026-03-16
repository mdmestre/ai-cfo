export function classifyTransaction(description: string, amount: number): string {
  const desc = String(description || "").toLowerCase();
  const amt = Number(amount || 0);

  if (amt > 0) return "Receita";

  const rules: Array<{ category: string; match: RegExp }> = [
    { category: "Folha", match: /\b(payroll|folha|sal(a|á)rio|pro-?labore)\b/i },
    { category: "Infraestrutura", match: /\b(aws|amazon web services|gcp|google cloud|azure|cloudflare)\b/i },
    { category: "Marketing", match: /\b(google ads|meta|facebook ads|instagram|tiktok|ads)\b/i },
    { category: "Aluguel", match: /\b(aluguel|rent|wework)\b/i },
    { category: "Software", match: /\b(hubspot|slack|figma|notion|jira|atlassian|github|gitlab)\b/i },
    { category: "Transporte", match: /\b(uber|99|taxi)\b/i },
    { category: "Refeicao", match: /\b(ifood|ubereats|restaurante|restaurant)\b/i },
    { category: "Impostos", match: /\b(darf|das|iss|inss|simples)\b/i },
    { category: "Tarifas Bancarias", match: /\b(tarifa|taxa|fee)\b/i },
  ];

  for (const r of rules) {
    if (r.match.test(desc)) return r.category;
  }

  if (!desc) return "Uncategorized";
  return "Outros";
}

