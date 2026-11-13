import { apiGet } from "@/lib/api";

export type SystemStatus = {
  status: "ok";
  database: "connected";
};

export function getSystemStatus() {
  return apiGet<SystemStatus>("/status");
}
