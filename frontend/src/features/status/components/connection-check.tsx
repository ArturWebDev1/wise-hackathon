"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSystemStatus } from "../api";
import styles from "./connection-check.module.css";

export function ConnectionCheck() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function checkConnection() {
    setState("loading");
    try {
      const result = await getSystemStatus();
      setState(result.status === "ok" && result.database === "connected" ? "success" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section className={styles.card} aria-labelledby="connection-heading">
      <div>
        <h2 id="connection-heading">Development connection</h2>
        <p>Browser → Next.js → Spring Boot → PostgreSQL</p>
      </div>
      <Button onClick={checkConnection} disabled={state === "loading"}>
        {state === "loading" ? "Checking…" : "Check connection"}
      </Button>
      <p className={styles.result} role="status" aria-live="polite">
        {state === "idle" && "Ready when you are."}
        {state === "loading" && "Connecting to the backend…"}
        {state === "success" && "Connected. Backend and PostgreSQL are ready."}
        {state === "error" && "Connection failed. Start PostgreSQL and the backend, then try again."}
      </p>
    </section>
  );
}
