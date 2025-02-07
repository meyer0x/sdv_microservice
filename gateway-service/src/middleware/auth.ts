import axios from "axios";
import { createMiddleware } from "hono/factory";
import { getServiceInstance } from "../utils";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Authorization header missing" }, 401);
  }

  try {
    const authService = await getServiceInstance("auth-service");
    const response = await axios.get(`${authService}/verify`, {
      headers: { Authorization: authHeader },
    });

    if (!response.data.valid) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Ajouter les informations de l'utilisateur au contexte
    c.set("user", response.data.user);
    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});

export const guestMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader) {
    return c.json({ error: "Unauthorized - Guest access only" }, 401);
  }

  await next();
});
