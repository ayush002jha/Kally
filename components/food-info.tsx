"use client";

import { motion } from "framer-motion";

interface FoodInfoProps {
  data: {
    calories: number;
    foodName: string;
    confidence: number;
    nutrients: {
      protein: string;
      carbs: string;
      fat: string;
    };
  };
}

export function FoodInfo({ data }: FoodInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-x-4 top-6 bg-white/90 rounded-2xl p-6 backdrop-blur-sm shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-2">{data.foodName}</h2>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-3xl font-bold">{data.calories}</div>
        <div className="text-gray-600">calories</div>
        <div className="ml-auto text-sm text-gray-500">
          {Math.round(data.confidence * 100)}% confidence
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <NutrientCard
          label="Protein"
          value={data.nutrients.protein}
          color="bg-blue-100"
        />
        <NutrientCard
          label="Carbs"
          value={data.nutrients.carbs}
          color="bg-green-100"
        />
        <NutrientCard
          label="Fat"
          value={data.nutrients.fat}
          color="bg-yellow-100"
        />
      </div>
    </motion.div>
  );
}

function NutrientCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-3 text-center`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}