import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard-layout";
import { AuthManager } from "@/lib/auth";
import { TrendingUp, TrendingDown, PieChart, BarChart3, Leaf, Calendar, Download } from "lucide-react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Reports() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/monthly", selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`, {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: "🍕",
      transport: "🚗",
      utilities: "🏠",
      entertainment: "🎬",
      healthcare: "🏥",
      shopping: "🛍",
      education: "📚",
      other_expense: "💸",
    };
    return icons[category] || "💰";
  };

  const months = [
    { value: 1, label: "Январь" },
    { value: 2, label: "Февраль" },
    { value: 3, label: "Март" },
    { value: 4, label: "Апрель" },
    { value: 5, label: "Май" },
    { value: 6, label: "Июнь" },
    { value: 7, label: "Июль" },
    { value: 8, label: "Август" },
    { value: 9, label: "Сентябрь" },
    { value: 10, label: "Октябрь" },
    { value: 11, label: "Ноябрь" },
    { value: 12, label: "Декабрь" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const downloadExcelReport = () => {
    if (!reportData) return;

    // Основные показатели
    const summaryData = [
      ["Финансовый отчет", "", ""],
      ["Период", `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, ""],
      ["", "", ""],
      ["Показатель", "Сумма (₽)", "Доля"],
      ["Общий доход", reportData.totalIncome || 0, "100%"],
      ["Общие расходы", reportData.totalExpenses || 0, `${Math.round((reportData.totalExpenses / reportData.totalIncome) * 100)}%`],
      ["Баланс", (reportData.totalIncome || 0) - (reportData.totalExpenses || 0), ""],
      ["", "", ""],
      ["Категории расходов", "Сумма (₽)", "Доля от расходов"],
      ...(reportData.topCategories?.map((cat: any) => [
        cat.category.replace('_', ' '),
        cat.amount,
        `${cat.percentage}%`
      ]) || [["Нет данных", "", ""]])
    ];

    // Экологические метрики
    const ecoData = [
      ["Экологический отчет", "", ""],
      ["Показатель", "Значение", ""],
      ["Общие выбросы CO₂", `${reportData.ecoMetrics?.totalCo2?.toFixed(1)} кг`, ""],
      ["Эко-рейтинг", reportData.ecoMetrics?.rating || "N/A", ""],
      ["", "", ""],
      ["Рекомендации", "", ""],
      ...(reportData.ecoMetrics?.recommendations?.map((rec: string) => [rec, "", ""]) || [])
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Финансовый отчет");

    if (reportData.ecoMetrics) {
      const wsEco = XLSX.utils.aoa_to_sheet(ecoData);
      XLSX.utils.book_append_sheet(wb, wsEco, "Эко отчет");
    }

    // Форматирование
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center" }
    };

    // Применяем стили
    wsSummary["!cols"] = [{ width: 30 }, { width: 20 }, { width: 15 }];
    if (wsSummary["A1"]) wsSummary["A1"].s = headerStyle;
    if (wsSummary["B1"]) wsSummary["B1"].s = headerStyle;
    if (wsSummary["C1"]) wsSummary["C1"].s = headerStyle;

    XLSX.writeFile(wb, `Финансовый_отчет_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const pieData = {
    labels: reportData?.topCategories?.map((cat: any) => cat.category.replace('_', ' ')),
    datasets: [
      {
        data: reportData?.topCategories?.map((cat: any) => cat.amount),
        backgroundColor: [
          '#3b82f6',
          '#6366f1',
          '#8b5cf6',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#ef4444',
          '#64748b'
        ],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto max-w-6xl fade-in">
          <div className="text-center py-8">Загрузка отчета...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Отчеты</h1>
            <p className="text-gray-600 mt-2">Анализ ваших финансов и экологического следа</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="input-premium w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-content">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="input-premium w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-content">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={downloadExcelReport} className="premium-button">
              <Download className="w-4 h-4 mr-2" />
              Скачать отчет (Excel)
            </Button>
          </div>
        </div>

        {reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Доходы</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(reportData.totalIncome || 0)}</p>
                </CardContent>
              </Card>
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span>Расходы</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(reportData.totalExpenses || 0)}</p>
                </CardContent>
              </Card>
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Баланс</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${(reportData.totalIncome || 0) - (reportData.totalExpenses || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                    }`}>
                    {formatAmount((reportData.totalIncome || 0) - (reportData.totalExpenses || 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Categories */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Топ категории расходов</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {reportData.topCategories?.map((category: any, index: number) => (
                      <div key={category.category} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getCategoryIcon(category.category)}</div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {category.category.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600">{category.percentage}% от общих расходов</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatAmount(category.amount)}</p>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-64 h-64">
                      <Pie data={pieData} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eco Metrics */}
            {reportData.ecoMetrics && (
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                    <span>Экологический отчет</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">CO₂ выбросы</span>
                        <Badge className={`${reportData.ecoMetrics.rating === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                            reportData.ecoMetrics.rating === 'A' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          Рейтинг: {reportData.ecoMetrics.rating}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.ecoMetrics.totalCo2?.toFixed(1)} кг
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Рекомендации</h4>
                      <ul className="space-y-2">
                        {reportData.ecoMetrics.recommendations?.slice(0, 3).map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="premium-card">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Нет данных за выбранный период</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}