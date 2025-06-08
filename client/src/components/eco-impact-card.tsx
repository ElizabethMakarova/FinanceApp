import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Info,
  ChevronDown,
  ChevronUp,
  Leaf
} from "lucide-react";

interface EcoImpactCardProps {
  ecoRating: string;
  co2Reduction: number;
}

const ECO_RATING_LEVELS = [
  { rating: "A+", description: "Отлично", min: 0, max: 50 },
  { rating: "A", description: "Очень хорошо", min: 50, max: 100 },
  { rating: "B+", description: "Хорошо", min: 100, max: 200 },
  { rating: "B", description: "Средне", min: 200, max: 300 },
  { rating: "C+", description: "Ниже среднего", min: 300, max: 500 },
  { rating: "C", description: "Плохо", min: 500, max: Infinity },
];

export default function EcoImpactCard({ ecoRating, co2Reduction }: EcoImpactCardProps) {
  const [showLevels, setShowLevels] = useState(false);

  // Цвета в зависимости от рейтинга
  const getRatingColor = () => {
    if (ecoRating === "A+") return "text-emerald-500";
    if (ecoRating === "A") return "text-emerald-400";
    if (ecoRating === "B+") return "text-lime-500";
    if (ecoRating === "B") return "text-yellow-500";
    if (ecoRating === "C+") return "text-orange-500";
    return "text-rose-500";
  };

  return (
    <Card className="premium-card bg-gradient-to-br from-emerald-50/50 to-teal-100/50 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Leaf className="h-5 w-5 text-emerald-600 mr-2" />
            <span className="text-slate-800 font-semibold">Экологический рейтинг</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLevels(!showLevels)}
            className="text-slate-600 hover:bg-emerald-100"
          >
            <Info className="h-4 w-4 mr-1" />
            Уровни
            {showLevels ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className={`text-5xl font-bold ${getRatingColor()}`}>
            {ecoRating}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{co2Reduction}%</p>
            <p className="text-sm text-slate-600">Снижение CO₂</p>
          </div>
        </div>

        <div className="relative pt-1 mb-4">
          <Progress value={co2Reduction} className="h-3 bg-slate-200" />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {showLevels && (
          <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <h4 className="font-medium text-slate-800 mb-3">Уровни экологического рейтинга:</h4>
            <div className="space-y-3">
              {ECO_RATING_LEVELS.map((level) => (
                <div
                  key={level.rating}
                  className={`flex items-center justify-between p-2 rounded-md ${level.rating === ecoRating ? "bg-emerald-50 border border-emerald-200" : ""
                    }`}
                >
                  <div className="flex items-center">
                    <span className="font-medium w-8 text-slate-800">{level.rating}</span>
                    <span className="text-slate-700">{level.description}</span>
                  </div>
                  <span className="text-slate-500 text-xs">
                    {level.min} - {level.max === Infinity ? "∞" : level.max} кг CO₂
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-700">
          Ваш вклад в сохранение экологии. Продолжайте в том же духе!
        </p>
      </CardContent>
    </Card>
  );
}