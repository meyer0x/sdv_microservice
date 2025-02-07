import Consul from "consul";

const consul = new Consul({
  host: process.env.CONSUL_HOST || "localhost",
  port: 8500,
});

export async function getServiceInstance(serviceName: string) {
  const services = await consul.catalog.service.nodes(serviceName);
  if (services.length === 0) {
    throw new Error(`No instances found for service: ${serviceName}`);
  }
  // Simple round-robin
  const instance = services[Math.floor(Math.random() * services.length)];
  return `http://${instance.ServiceAddress}:${instance.ServicePort}`;
}
