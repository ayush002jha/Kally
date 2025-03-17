"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Camera as LucideCamera, RotateCcw } from "lucide-react";
import Image from "next/image";

export function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [foodData, setFoodData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (stream) return; // Don't start if stream already exists

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        const constraints = {
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight },
          },
          audio: false,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.style.width = "100%";
          videoRef.current.style.height = "100%";
          videoRef.current.style.objectFit = "cover";
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback to any available camera if environment camera fails
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (fallbackErr) {
        setError(
          "Unable to access camera. Please ensure you've granted camera permissions."
        );
      }
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL("image/jpeg");
      setPhoto(photoData);
      stopCamera();
      analyzePhoto(photoData);
    }
  }, [stopCamera]);

  const analyzePhoto = async (photoData: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      // Convert base64 to blob
      const blob = await fetch(photoData).then((res) => res.blob());

      try {
        const formData = new FormData();
        formData.append("image", blob);

        // Send to your backend route that will handle Google AI integration
        const uploadResponse = await fetch("/api/upload-to-google", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to Google AI");
        }

        const uploadResult = await uploadResponse.json();
        // Assuming the output structure matches and returns a JSON string
        setFoodData(uploadResult);
      } catch (uploadError) {
        console.error("Error uploading to Google AI:", uploadError);
      }
    } catch (error) {
      console.error("Error analyzing photo:", error);
      setError("Failed to analyze the photo. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const retake = useCallback(async () => {
    setPhoto(null);
    setFoodData(null);
    setError(null);
    stopCamera(); // Stop the current stream
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to ensure cleanup
    startCamera(); // Restart the camera
  }, [stopCamera, startCamera]);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(meta);

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
    };
  }, [startCamera, stream]);

  // Utility to clean markdown code fences from JSON string
  const cleanJsonString = (str: string): string => {
    const regex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    return str.replace(regex, "$1").trim();
  };

  // Branding header component that appears in every view
  const BrandingHeader = () => (
    <div className="absolute top-0 left-0 w-full z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex items-center justify-between gap-10">
        <h1 className="text-4xl font-bold text-white">Kally</h1>
        {/* <div className="w-48 flex items-center justify-center">
          <Image src="/langflow.png" alt="langflow" height={600} width={600} className="" />
        </div> */}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <BrandingHeader />
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={retake}
            className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (photo && foodData) {
    try {
      // Clean any markdown code fences from the foodData string
      const cleanedData =
        typeof foodData === "string" ? cleanJsonString(foodData) : JSON.stringify(foodData);
      const data = JSON.parse(cleanedData);

      return (
        <div className="fixed inset-0">
          {/* Frame container */}
          <div className="fixed inset-0 border border-white/30 pointer-events-none">
            {/* Top, left and right border (thin transparent) handled by the container border */}
            {/* Bottom thick black section */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-black"></div>
          </div>
          
          {/* Fullscreen photo as background */}
          <img src={photo} alt="Captured food" className="w-full h-full object-cover" />
          {/* Add branding header */}
          <BrandingHeader />
          {/* Futuristic overlay container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Dish Name Tag */}
            <div className="mb-6 bg-white/20 backdrop-blur-lg border border-white/30 px-8 py-4 rounded-xl shadow-2xl">
              <h1 className="text-3xl font-bold text-white">{data.name}</h1>
            </div>
            {/* Nutritional Info Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 border border-white/50 text-white font-medium rounded-full px-4 py-2 shadow-xl">
                Calories: {data.calories}
              </div>
              <div className="bg-black/40 border border-white/50 text-white font-medium rounded-full px-4 py-2 shadow-xl">
                Protein: {data.protein}g
              </div>
              <div className="bg-black/40 border border-white/50 text-white font-medium rounded-full px-4 py-2 shadow-xl">
                Carbs: {data.carbs}g
              </div>
              <div className="bg-black/40 border border-white/50 text-white font-medium rounded-full px-4 py-2 shadow-xl">
                Fat: {data.fat}g
              </div>
            </div>
          </div>
          {/* Retake Button */}
          <button
            onClick={retake}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 text-black px-6 py-3 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm z-20"
          >
            <RotateCcw className="w-5 h-5" />
            Take Another Photo
          </button>
        </div>
      );
    } catch (err) {
      console.error("Error parsing food data:", err);
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white">
          <BrandingHeader />
          <p>Error parsing food data.</p>
          <button
            onClick={retake}
            className="mt-4 bg-white text-black px-6 py-3 rounded-full flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Retake
          </button>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Frame container */}
      <div className="fixed inset-0  border-[8px] border-black pointer-events-none">
        {/* Top, left and right border (thin transparent) handled by the container border */}
        {/* Bottom thick black section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-black"></div>
      </div>
      
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Add branding header */}
      <BrandingHeader />

      {analyzing ? (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p className="text-lg">Analyzing your food...</p>
          </div>
        </div>
      ) : (
        <button
          onClick={takePhoto}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 text-black px-6 py-3 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm z-20"
        >
          <LucideCamera className="w-5 h-5" />
          Take Photo
        </button>
      )}
    </div>
  );
}