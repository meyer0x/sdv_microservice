import { serve } from "@hono/node-server";
import axios from "axios";
import { Hono } from "hono";
import { authMiddleware, guestMiddleware } from "./middleware/auth";
import { getServiceInstance } from "./utils";

const app = new Hono();
const port = process.env.PORT || 3000;

// Définir les middlewares d'authentification en premier
app.use("/api/students", authMiddleware);
app.use("/api/schools", authMiddleware);
app.use("/api/students/*", authMiddleware);
app.use("/api/schools/*", authMiddleware);

// Route pour les écoles
app.all("/api/schools", async (c) => {
  try {
    const baseUrl = await getServiceInstance("school-service");
    const fullUrl = `${baseUrl}/schools`; // On ajoute explicitement /schools ici

    console.log(`Forwarding request to: ${fullUrl}`);
    const response = await axios({
      method: c.req.method,
      url: fullUrl,
      data: c.req.method !== "GET" ? await c.req.json() : undefined,
      headers: c.req.header(),
    });
    return c.json(response.data);
  } catch (error) {
    console.error("Error in gateway service:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        code: error.code,
        message: error.message,
        response: error.response?.data,
      });
    }
    return c.json({ error: "Service unavailable" }, 503);
  }
});

// Route pour une école spécifique
app.all("/api/schools/:id", async (c) => {
  try {
    const baseUrl = await getServiceInstance("school-service");
    const id = c.req.param("id");
    const fullUrl = `${baseUrl}/schools/${id}`;

    console.log(`Forwarding request to: ${fullUrl}`);
    const response = await axios({
      method: c.req.method,
      url: fullUrl,
      data: c.req.method !== "GET" ? await c.req.json() : undefined,
      headers: c.req.header(),
    });
    return c.json(response.data);
  } catch (error) {
    console.error("Error in gateway service:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        code: error.code,
        message: error.message,
        response: error.response?.data,
      });
    }
    return c.json({ error: "Service unavailable" }, 503);
  }
});

// Routes similaires pour students
app.all("/api/students", async (c) => {
  try {
    const baseUrl = await getServiceInstance("student-service");
    const fullUrl = `${baseUrl}/students`;

    console.log(`Forwarding request to: ${fullUrl}`);
    const response = await axios({
      method: c.req.method,
      url: fullUrl,
      data: c.req.method !== "GET" ? await c.req.json() : undefined,
      headers: c.req.header(),
    });
    return c.json(response.data);
  } catch (error) {
    console.error("Error in gateway service:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        code: error.code,
        message: error.message,
        response: error.response?.data,
      });
    }
    return c.json({ error: "Service unavailable" }, 503);
  }
});

app.all("/api/students/:id", async (c) => {
  try {
    const baseUrl = await getServiceInstance("student-service");
    const id = c.req.param("id");
    const fullUrl = `${baseUrl}/students/${id}`;

    console.log(`Forwarding request to: ${fullUrl}`);
    const response = await axios({
      method: c.req.method,
      url: fullUrl,
      data: c.req.method !== "GET" ? await c.req.json() : undefined,
      headers: c.req.header(),
    });
    return c.json(response.data);
  } catch (error) {
    console.error("Error in gateway service:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        code: error.code,
        message: error.message,
        response: error.response?.data,
      });
    }
    return c.json({ error: "Service unavailable" }, 503);
  }
});

app.use("/api/auth/*", guestMiddleware);
app.post("/api/auth/register", async (c) => {
  try {
    const baseUrl = await getServiceInstance("auth-service");
    const fullUrl = `${baseUrl}/register`;

    console.log(`Forwarding request to: ${fullUrl}`);

    const response = await axios({
      method: "POST",
      url: fullUrl,
      data: JSON.stringify(await c.req.json()),
      headers: {
        "Content-Type": "application/json",
      },
    });

    return c.json(response.data);
  } catch (error) {
    console.error("Error in gateway service:", error);
    return c.json({ error: "Service unavailable" }, 503);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const baseUrl = await getServiceInstance("auth-service");
    const fullUrl = `${baseUrl}/login`;

    console.log(`Forwarding request to: ${fullUrl}`);

    const response = await axios({
      method: "POST",
      url: fullUrl,
      data: JSON.stringify(await c.req.json()),
      headers: {
        "Content-Type": "application/json",
      },
    });

    return c.json(response.data);
  } catch (error) {
    console.error("Error in gateway service:", error);
    return c.json({ error: "Service unavailable" }, 503);
  }
});
serve({ fetch: app.fetch, port: Number(port) });
