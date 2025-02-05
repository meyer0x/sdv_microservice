import { serve } from "@hono/node-server";
import Consul from "consul";
import { Hono } from "hono";
import { Pool } from "pg";

const app = new Hono();
const port = process.env.PORT || 3001;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const consul = new Consul({
  host: process.env.CONSUL_HOST || "localhost",
  port: 8500,
});

async function registerService() {
  const serviceId = process.env.HOST as string;
  const serviceName = process.env.SERVICE_NAME || "school-service";
  const servicePort = parseInt(process.env.PORT || "3001");

  try {
    // D'abord, désenregistrer si le service existe déjà
    try {
      await consul.agent.service.deregister({ id: serviceId });
    } catch (error) {
      console.log("No existing service to deregister");
    }

    // Enregistrer le service avec l'adresse correcte
    await consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      address: serviceId, // Utiliser le hostname comme adresse
      port: servicePort,
      check: {
        http: `http://${serviceId}:${servicePort}/health`,
        interval: "10s",
        timeout: "5s",
        deregistercriticalserviceafter: "30s",
        name: serviceName,
      },
      tags: ["microservice", "school"],
    });
    console.log(
      `Service registered with Consul: ${serviceId} at port ${servicePort}`,
    );

    // Gérer la désinscription propre
    process.on("SIGTERM", async () => {
      try {
        await consul.agent.service.deregister(serviceId);
        console.log("Service deregistered from Consul");
        process.exit(0);
      } catch (error) {
        console.error("Error deregistering service:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Error registering service:", error);
    process.exit(1);
  }
}

app.get("/health", (c) => {
  return c.json({ status: "UP" });
});

app.get("/schools", async (c) => {
  const { rows } = await pool.query("SELECT * FROM schools");
  return c.json(rows);
});

app.get("/schools/:id", async (c) => {
  const id = c.req.param("id");
  const { rows } = await pool.query("SELECT * FROM schools WHERE id = $1", [
    id,
  ]);
  return c.json(rows[0]);
});

app.post("/schools", async (c) => {
  const body = await c.req.json();
  const { name, address, directorName } = body;
  const { rows } = await pool.query(
    "INSERT INTO schools (name, address, director_name) VALUES ($1, $2, $3) RETURNING *",
    [name, address, directorName],
  );
  return c.json(rows[0]);
});

// Appelez registerService au démarrage
registerService().catch(console.error);

serve({ fetch: app.fetch, port: Number(port) });
