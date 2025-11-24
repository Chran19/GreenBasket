"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
} from "lucide-react";
import { analyticsAPI } from "@/lib/api";

/**
 * AdminAnalytics with:
 *  - Date range filters
 *  - Export dashboard as PDF
 *  - Export charts / data as Excel
 *  - Animated chart transitions (ECharts options)
 *
 * Assumes echarts + echarts-for-react + html2canvas + jspdf + xlsx + file-saver installed.
 */

type SalesRow = {
  date: string;
  monthLabel: string;
  revenue: number;
  orders: number;
  users: number;
};

export function AdminAnalytics() {
  const [allSales, setAllSales] = useState<SalesRow[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topFarmers, setTopFarmers] = useState<any[]>([]);

  // Date range filters (ISO date strings)
  const [startDate, setStartDate] = useState<string | "">("");
  const [endDate, setEndDate] = useState<string | "">("");

  // Preset range selector
  const [preset, setPreset] = useState<"6m" | "3m" | "ytd" | "all">("6m");

  // Container ref for PDF capture
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mock fallback data (includes ISO dates)
  const mockSales: SalesRow[] = [
    {
      date: "2025-01-01",
      monthLabel: "Jan 2025",
      revenue: 30000,
      orders: 240,
      users: 120,
    },
    {
      date: "2025-02-01",
      monthLabel: "Feb 2025",
      revenue: 45000,
      orders: 310,
      users: 150,
    },
    {
      date: "2025-03-01",
      monthLabel: "Mar 2025",
      revenue: 52000,
      orders: 340,
      users: 165,
    },
    {
      date: "2025-04-01",
      monthLabel: "Apr 2025",
      revenue: 61000,
      orders: 380,
      users: 190,
    },
    {
      date: "2025-05-01",
      monthLabel: "May 2025",
      revenue: 66000,
      orders: 420,
      users: 205,
    },
    {
      date: "2025-06-01",
      monthLabel: "Jun 2025",
      revenue: 72000,
      orders: 460,
      users: 240,
    },
    {
      date: "2025-07-01",
      monthLabel: "Jul 2025",
      revenue: 76000,
      orders: 480,
      users: 260,
    },
    {
      date: "2025-08-01",
      monthLabel: "Aug 2025",
      revenue: 81000,
      orders: 510,
      users: 280,
    },
    {
      date: "2025-09-01",
      monthLabel: "Sep 2025",
      revenue: 78000,
      orders: 490,
      users: 270,
    },
    {
      date: "2025-10-01",
      monthLabel: "Oct 2025",
      revenue: 83000,
      orders: 520,
      users: 295,
    },
    {
      date: "2025-11-01",
      monthLabel: "Nov 2025",
      revenue: 90000,
      orders: 560,
      users: 320,
    },
  ];

  const mockCategory = [
    { name: "Vegetables", value: 42 },
    { name: "Fruits", value: 25 },
    { name: "Grains", value: 18 },
    { name: "Dairy", value: 15 },
  ];

  const mockFarmers = [
    { name: "Green Valley Farm", orders: 190, revenue: 420000 },
    { name: "Fresh Leaf Agro", orders: 165, revenue: 380000 },
    { name: "Earth Agro", orders: 150, revenue: 350000 },
    { name: "Nature Springs", orders: 140, revenue: 330000 },
  ];

  // Load analytics (fallback to mock on error)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res: any = await analyticsAPI.getPlatformAnalytics(
          "month",
          "overview"
        );
        // Parse sales period from API if present; otherwise use mock
        const rawTrend = res?.data?.salesByPeriod;
        const parsed: SalesRow[] = rawTrend
          ? Object.entries(rawTrend).map(([k, v]: any) => {
              // if API gives month label + numeric: try to create pseudo-date from label
              const monthLabel = String(k);
              // For safety, fallback to mock-like date mapping if no explicit date
              // We'll try to parse a year inside label; else set to first of month in current year
              let date = new Date();
              // If API returns object with 'date' field, prefer it
              if (v.date) {
                date = new Date(v.date);
              } else {
                // try parse like "Jan 2025" or "2025-01"
                const guess = monthLabel.match(/\d{4}/)
                  ? monthLabel
                  : `${monthLabel} 2025`;
                date = new Date(guess);
                if (isNaN(date.getTime())) {
                  // fallback to sequence; use Jan + index - but keep deterministic
                  date = new Date("2025-01-01");
                }
              }
              return {
                date: date.toISOString().slice(0, 10),
                monthLabel,
                revenue: v.revenue ?? v,
                orders: v.orders ?? 0,
                users: v.users ?? 0,
              };
            })
          : mockSales;

        const cats = res?.data?.categoryDistribution || mockCategory;
        const top = res?.data?.topFarmers || mockFarmers;

        if (!mounted) return;
        setAllSales(parsed);
        setCategoryData(cats);
        setTopFarmers(top);
      } catch (e) {
        // fallback to mock
        setAllSales(mockSales);
        setCategoryData(mockCategory);
        setTopFarmers(mockFarmers);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute filtered sales based on date range or preset
  const filteredSales = useMemo(() => {
    if (!allSales || allSales.length === 0) return [];

    // If no explicit date range chosen, apply preset
    if (!startDate && !endDate) {
      const n = allSales.length;
      switch (preset) {
        case "3m":
          return allSales.slice(Math.max(0, n - 3));
        case "6m":
          return allSales.slice(Math.max(0, n - 6));
        case "ytd":
          // attempt to pick entries from this year
          const thisYear = new Date().getFullYear();
          return allSales.filter(
            (s) => new Date(s.date).getFullYear() === thisYear
          );
        default:
          return allSales;
      }
    }

    // If user provided custom dates
    const start = startDate ? new Date(startDate) : new Date("1970-01-01");
    const end = endDate ? new Date(endDate) : new Date("9999-12-31");
    // normalize end to include the whole day
    end.setHours(23, 59, 59, 999);

    return allSales.filter((s) => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
  }, [allSales, startDate, endDate, preset]);

  // Key metrics from filteredSales
  const current = filteredSales[filteredSales.length - 1] ?? {
    revenue: 0,
    orders: 0,
    users: 0,
  };
  const prev = filteredSales[filteredSales.length - 2] ?? {
    revenue: 0,
    orders: 0,
    users: 0,
  };

  const metricPct = (now: number, old: number) => {
    if (!old) return 0;
    return ((now - old) / old) * 100;
  };

  // ---------- ECharts options with animations and dataZoom ----------
  const revenueOption = useMemo(() => {
    return {
      animation: true,
      animationDuration: 900,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>Revenue: ₹${Number(
            p.data
          ).toLocaleString()}`;
        },
      },
      toolbox: { feature: { saveAsImage: {} } },
      xAxis: { type: "category", data: filteredSales.map((s) => s.monthLabel) },
      yAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => `₹${v}` },
      },
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 0 }],
      series: [
        {
          name: "Revenue",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: "#059669" },
          areaStyle: { color: "rgba(5,150,105,0.12)" },
          emphasis: { focus: "series" },
          data: filteredSales.map((s) => s.revenue),
        },
      ],
    };
  }, [filteredSales]);

  const ordersOption = useMemo(() => {
    return {
      animation: true,
      animationDuration: 900,
      animationEasing: "cubicOut",
      tooltip: { trigger: "axis" },
      toolbox: { feature: { saveAsImage: {} } },
      xAxis: { type: "category", data: filteredSales.map((s) => s.monthLabel) },
      yAxis: { type: "value" },
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 0 }],
      series: [
        {
          name: "Orders",
          type: "bar",
          barMaxWidth: 28,
          itemStyle: { color: "#10b981" },
          data: filteredSales.map((s) => s.orders),
        },
      ],
    };
  }, [filteredSales]);

  const categoryOption = useMemo(() => {
    return {
      animation: true,
      animationDuration: 700,
      tooltip: { trigger: "item" },
      legend: { bottom: 0, orient: "horizontal" },
      series: [
        {
          name: "Categories",
          type: "pie",
          radius: "60%",
          data: categoryData,
          emphasis: { scale: true, scaleSize: 8 },
        },
      ],
    };
  }, [categoryData]);

  // ---------- Export: Dashboard PDF (html2canvas + jsPDF) ----------
  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    try {
      const el = containerRef.current;
      // Increase scale for better resolution
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      // If content taller than single page, add extra pages
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let remainingHeight = pdfHeight - pdf.internal.pageSize.getHeight();
        let position = -pdf.internal.pageSize.getHeight();
        while (remainingHeight > 0) {
          pdf.addPage();
          position += pdf.internal.pageSize.getHeight();
          pdf.addImage(imgData, "PNG", 0, -position, pdfWidth, pdfHeight);
          remainingHeight -= pdf.internal.pageSize.getHeight();
        }
      }
      pdf.save(`analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Failed to export PDF. Try again.");
    }
  };

  // ---------- Export: Excel (xlsx) ----------
  const handleExportExcel = () => {
    try {
      // 1) Revenue sheet
      const revenueSheet = [
        ["Date", "Label", "Revenue", "Orders", "Users"],
        ...filteredSales.map((r) => [
          r.date,
          r.monthLabel,
          r.revenue,
          r.orders,
          r.users,
        ]),
      ];

      // 2) Category sheet
      const categorySheet = [
        ["Category", "Value"],
        ...categoryData.map((c: any) => [c.name, c.value]),
      ];

      // 3) Top Farmers sheet
      const farmersSheet = [
        ["Name", "Orders", "Revenue"],
        ...topFarmers.map((f: any) => [f.name, f.orders, f.revenue]),
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet(revenueSheet);
      const ws2 = XLSX.utils.aoa_to_sheet(categorySheet);
      const ws3 = XLSX.utils.aoa_to_sheet(farmersSheet);

      XLSX.utils.book_append_sheet(wb, ws1, "Revenue");
      XLSX.utils.book_append_sheet(wb, ws2, "Categories");
      XLSX.utils.book_append_sheet(wb, ws3, "TopFarmers");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Failed to export Excel. Try again.");
    }
  };

  // ---------- Small helpers ----------
  const renderGrowth = (now: number, old: number) => {
    const pct = metricPct(now, old);
    const positive = pct >= 0;
    return (
      <div className="flex items-center gap-1">
        {positive ? (
          <TrendingUp className="h-3 w-3 text-green-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-600" />
        )}
        <span
          className={`text-xs ${positive ? "text-green-600" : "text-red-600"}`}
        >
          {positive ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Controls: Date range + Presets + Exports */}
      <Card className="mb-4">
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-sm block">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset("all");
                }}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm block">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset("all");
                }}
                className="input"
              />
            </div>

            <div>
              <label className="text-sm block">Preset</label>
              <select
                value={preset}
                onChange={(e) => {
                  setPreset(e.target.value as any);
                  setStartDate("");
                  setEndDate("");
                }}
                className="input"
              >
                <option value="6m">Last 6 months</option>
                <option value="3m">Last 3 months</option>
                <option value="ytd">Year to date</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-outline px-3 py-2"
            >
              Export Excel
            </button>
            <button onClick={handleExportPDF} className="btn-outline px-3 py-2">
              Export PDF
            </button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Monthly Revenue",
            value: `₹${current.revenue.toLocaleString()}`,
            comp: renderGrowth(current.revenue, prev.revenue),
            icon: <DollarSign />,
          },
          {
            label: "Monthly Orders",
            value: current.orders,
            comp: renderGrowth(current.orders, prev.orders),
            icon: <ShoppingCart />,
          },
          {
            label: "New Users",
            value: current.users,
            comp: renderGrowth(current.users, prev.users),
            icon: <Users />,
          },
          {
            label: "Active Products",
            value: 89,
            comp: renderGrowth(89, 84),
            icon: <Package />,
          },
        ].map((c, i) => (
          <Card key={i} className="hover:shadow-lg transition">
            <CardContent className="p-6 flex gap-4">
              <div className="p-2 rounded bg-muted">{c.icon}</div>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <div className="mt-1">{c.comp}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>Revenue </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={revenueOption}
              style={{ height: 340 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>Orders </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={ordersOption}
              style={{ height: 340 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Category + Top Farmers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={categoryOption} style={{ height: 340 }} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>Top Performing Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFarmers.map((f, idx) => (
                <div
                  key={f.name}
                  className="flex justify-between items-center p-3 border rounded hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#{idx + 1}</Badge>
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {f.orders} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      ₹{f.revenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
