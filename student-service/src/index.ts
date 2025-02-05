import { serve } from "@hono/node-server";
import axios from "axios";
import Consul from "consul";
import { Hono } from "hono";
import { MongoClient, ObjectId } from "mongodb";

const app = new Hono();
const port = process.env.PORT || 3002;

const mongoClient = new MongoClient(
  process.env.MONGODB_URI || "mongodb://localhost:27017",
);
const db = mongoClient.db("students");
const students = db.collection("students");

const consul = new Consul({
  host: process.env.CONSUL_HOST || "localhost",
  port: 8500,
});

async function registerService() {
  const serviceId = process.env.HOST as string;
  const serviceName = process.env.SERVICE_NAME || "student-service";
  const servicePort = parseInt(process.env.PORT || "3002");

  try {
    // D'abord, désenregistrer si le service existe déjà
    try {
      await consul.agent.service.deregister(serviceId);
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
      tags: ["microservice", "student"],
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

app.get("/health", (c) => c.text("OK"));

app.get("/students/:id", async (c) => {
  const id = c.req.param("id");
  const student = await students.findOne({ _id: new ObjectId(id) });

  if (!student) {
    return c.json({ error: "Student not found" }, 404);
  }

  // Get school info from school-service
  const schoolService = await consul.catalog.service.nodes("school-service");
  const schoolUrl = `http://${schoolService[0].ServiceAddress}:${schoolService[0].ServicePort}/schools/${student.schoolId}`;

  try {
    const schoolResponse = await axios.get(schoolUrl);
    return c.json({
      ...student,
      school: schoolResponse.data,
    });
  } catch (error) {
    return c.json({
      ...student,
      school: null,
    });
  }
});

app.post("/students", async (c) => {
  const body = await c.req.json();
  const result = await students.insertOne(body);
  return c.json({ id: result.insertedId });
});

app.get("/students", async (c) => {
  const studentsDocuments = await students.find({}).toArray();
  return c.json(
    studentsDocuments.map((student) => ({
      id: student._id,
      name: student.name,
      genre: student.genre,
      schoolId: student.schoolId,
    })),
  );
});

registerService().catch(console.error);
serve({ fetch: app.fetch, port: Number(port) });
