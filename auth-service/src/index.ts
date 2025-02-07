import { serve } from "@hono/node-server";
import bcrypt from "bcrypt";
import Consul from "consul";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const app = new Hono();
const port = process.env.PORT || 3003;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const consul = new Consul({
  host: process.env.CONSUL_HOST || "localhost",
  port: 8500,
});

async function registerService() {
  const serviceId = process.env.HOST as string;
  const serviceName = "auth-service";
  const servicePort = parseInt(process.env.PORT || "3003");

  try {
    try {
      await consul.agent.service.deregister(serviceId);
    } catch (error) {
      console.error("No service to deregister");
    }
    await consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      address: serviceId,
      port: servicePort,
      check: {
        http: `http://${serviceId}:${servicePort}/health`,
        interval: "10s",
        timeout: "5s",
        deregistercriticalserviceafter: "30s",
        name: serviceName,
      },
    });
  } catch (error) {
    console.error("Error registering service:", error);
    process.exit(1);
  }
}

app.get("/health", (c) => c.json({ status: "UP" }));

app.post("/register", async (c) => {
  const { email, password } = await c.req.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword],
    );
    return c.json(result.rows[0]);
  } catch (error) {
    return c.json({ error: "Registration failed" }, 400);
  }
});

app.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return c.json({ token });
  } catch (error) {
    return c.json({ error: "Login failed" }, 400);
  }
});

app.get("/verify", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ valid: false, error: "No token provided" }, 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    // Vérifier si l'utilisateur existe toujours dans la base de données
    const result = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      return c.json({ valid: false, error: "User no longer exists" }, 401);
    }

    const user = result.rows[0];
    return c.json({ valid: true, user });
  } catch (error) {
    return c.json({ valid: false, error: "Invalid token" }, 401);
  }
});

registerService().catch(console.error);
serve({ fetch: app.fetch, port: Number(port) });
