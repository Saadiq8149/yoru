"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Connecting to AniList...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Authentication failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received");
        return;
      }

      try {
        // Exchange code for token
        const response = await fetch(
          `/api/anilist/exchange-code?code=${code}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const tokenData = await response.json();

        // Store the access token
        localStorage.setItem("anilist_token", tokenData.access_token);

        setStatus("success");
        setMessage("Authentication successful! Redirecting...");

        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage("Failed to complete authentication");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {status === "loading" && (
          <Loader className="w-8 h-8 animate-spin text-primary" />
        )}
        {status === "error" && <AlertCircle className="w-8 h-8 text-red-500" />}
        {status === "success" && (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
            ✓
          </div>
        )}

        <h1 className="text-xl font-semibold text-foreground">
          {status === "error"
            ? "Authentication Error"
            : status === "success"
            ? "Authentication Successful!"
            : "Connecting to AniList..."}
        </h1>
        <p className="text-muted-foreground text-center max-w-md">{message}</p>

        {status === "error" && (
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}
