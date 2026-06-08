export type AdminAnalyticsOrder = {
  orderedDate: string;
  amount: string;
  status: string;
  medication: string;
  category: string;
};

export type AdminTimeRange = "7D" | "30D" | "90D" | "YTD";

export type TreatmentRow = {
  name: string;
  category: string;
  revenue: number;
  count: number;
  sharePct: number;
  avgOrder: number;
};

export type NamedMetric = { name: string; value: number; revenue?: number };

const PIE_PALETTE = ["#10b981", "#6366f1", "#f59e0b", "#f43f5e", "#8b5cf6", "#0ea5e9", "#64748b"];

export function parseOrderAmount(amount: string | number | null | undefined): number {
  return parseFloat(String(amount ?? "").replace(/[$,]/g, "") || "0") || 0;
}

function rangeStart(timeRange: AdminTimeRange, now = new Date()): Date {
  const start = new Date(now);
  if (timeRange === "7D") start.setDate(now.getDate() - 7);
  else if (timeRange === "30D") start.setDate(now.getDate() - 30);
  else if (timeRange === "90D") start.setDate(now.getDate() - 90);
  else start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function inPeriod(orderedDate: string, start: Date, end = new Date()): boolean {
  const d = new Date(orderedDate);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

export function buildAdminBrandAnalytics(orders: AdminAnalyticsOrder[], timeRange: AdminTimeRange) {
  const now = new Date();
  const startDate = rangeStart(timeRange, now);
  const spanDays = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevStart = new Date(startDate);
  prevStart.setDate(prevStart.getDate() - spanDays);

  const filtered = orders.filter((o) => inPeriod(o.orderedDate, startDate, now));
  const prevOrders = orders.filter((o) => {
    const d = new Date(o.orderedDate);
    return d >= prevStart && d < startDate;
  });

  const totalRevenue = filtered.reduce((s, o) => s + parseOrderAmount(o.amount), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + parseOrderAmount(o.amount), 0);
  const revTrendPct = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 100;

  const clearedStatuses = new Set(["medical_review", "rx_sent", "shipped", "delivered"]);
  const totalConsults = filtered.filter((o) => clearedStatuses.has(o.status)).length;
  const conversionRate = Math.round((totalConsults / (filtered.length || 1)) * 100) || 0;
  const prevConsults = prevOrders.filter((o) => clearedStatuses.has(o.status)).length;
  const prevConversionRate = Math.round((prevConsults / (prevOrders.length || 1)) * 100) || 0;
  const conversionTrendVal = conversionRate - prevConversionRate;

  const currentYield = Math.round(totalRevenue / (filtered.length || 1));
  const prevYield = Math.round(prevRevenue / (prevOrders.length || 1));
  const yieldTrendVal = prevYield ? ((currentYield - prevYield) / prevYield) * 100 : 100;

  const treatmentMap: Record<string, { revenue: number; count: number; category: string }> = {};
  const categoryMap: Record<string, { count: number; revenue: number }> = {};
  const statusMap: Record<string, number> = {};

  for (const o of filtered) {
    const med = (o.medication || "Consultation").trim();
    const cat = (o.category || "General").trim();
    const amt = parseOrderAmount(o.amount);

    if (!treatmentMap[med]) treatmentMap[med] = { revenue: 0, count: 0, category: cat };
    treatmentMap[med].revenue += amt;
    treatmentMap[med].count += 1;
    if (!treatmentMap[med].category && cat) treatmentMap[med].category = cat;

    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].revenue += amt;

    const st = o.status || "unknown";
    statusMap[st] = (statusMap[st] || 0) + 1;
  }

  const topTreatments: TreatmentRow[] = Object.entries(treatmentMap)
    .map(([name, s]) => ({
      name,
      category: s.category,
      revenue: s.revenue,
      count: s.count,
      sharePct: totalRevenue ? Math.round((s.revenue / totalRevenue) * 100) : 0,
      avgOrder: Math.round(s.revenue / (s.count || 1)),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const categoryBreakdown: NamedMetric[] = Object.entries(categoryMap)
    .map(([name, s]) => ({ name, value: s.count, revenue: s.revenue }))
    .sort((a, b) => b.value - a.value);

  const productBreakdown: NamedMetric[] = topTreatments.slice(0, 8).map((t) => ({
    name: t.name.length > 28 ? `${t.name.slice(0, 26)}…` : t.name,
    value: t.count,
    revenue: t.revenue,
  }));

  const statusPipeline = Object.entries(statusMap)
    .map(([status, count]) => ({
      status,
      label: status.replace(/_/g, " "),
      count,
      fill: PIE_PALETTE[Object.keys(statusMap).indexOf(status) % PIE_PALETTE.length],
    }))
    .sort((a, b) => b.count - a.count);

  const chartData: { label: string; revenue: number; yield: number }[] = [];
  const interval = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90;

  if (timeRange === "7D" || timeRange === "30D") {
    for (let i = interval - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayOrders = filtered.filter(
        (o) => new Date(o.orderedDate).toDateString() === d.toDateString(),
      );
      const dayRev = dayOrders.reduce((s, o) => s + parseOrderAmount(o.amount), 0);
      chartData.push({
        label,
        revenue: dayRev,
        yield: Math.round(dayRev / (dayOrders.length || 1)),
      });
    }
  } else {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let m = startDate.getMonth();
    let y = startDate.getFullYear();
    const currentM = now.getMonth();
    const currentY = now.getFullYear();
    while (y < currentY || (y === currentY && m <= currentM)) {
      const mOrders = filtered.filter((o) => {
        const od = new Date(o.orderedDate);
        return od.getMonth() === m && od.getFullYear() === y;
      });
      const mRev = mOrders.reduce((s, o) => s + parseOrderAmount(o.amount), 0);
      chartData.push({
        label: months[m],
        revenue: mRev,
        yield: Math.round(mRev / (mOrders.length || 1)),
      });
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  }

  return {
    periodOrderCount: filtered.length,
    revenue: `$${totalRevenue.toLocaleString()}`,
    revenueTrend: `${revTrendPct > 0 ? "+" : ""}${revTrendPct.toFixed(1)}%`,
    patients: filtered.length.toString(),
    patientTrend: `+${filtered.length - prevOrders.length}`,
    consults: totalConsults.toLocaleString(),
    conversion: `${conversionRate}%`,
    yield: `$${currentYield}`,
    yieldTrend: `${yieldTrendVal > 0 ? "+" : ""}${yieldTrendVal.toFixed(1)}%`,
    conversionTrend: `${conversionTrendVal > 0 ? "+" : ""}${conversionTrendVal.toFixed(1)}%`,
    activeConsults: filtered
      .filter((o) => o.status === "medical_review" || o.status === "order_submitted")
      .length.toString(),
    shippedCount: filtered
      .filter((o) => o.status === "shipped" || o.status === "delivered")
      .length.toString(),
    regionsCount: new Set(
      filtered.map((o) => (o as { patient_country?: string }).patient_country || "United States"),
    ).size.toString(),
    chartData,
    topTreatments: topTreatments.slice(0, 10),
    categoryBreakdown,
    productBreakdown,
    statusPipeline,
    pieColors: PIE_PALETTE,
  };
}
