"use client";

import { Camera } from "@/components/camera";
import { useState } from "react";

export default function Home() {
  const [showCamera, setShowCamera] = useState(true);
  
  return (
    <main className="min-h-screen bg-black">
      <Camera />
    </main>
  );
}
