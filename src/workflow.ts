import {
  createFlowtract,
  sessionAuth,
  type FlowtractScenario,
} from "flowtract";
import {
  CreateItem,
  DeleteItem,
  GetItem,
  Login,
  Logout,
  operations,
} from "./api.ts";
import { startDemoService } from "./demo-server.ts";

const service = await startDemoService();
const runtime = createFlowtract({
  baseURL: service.baseURL,
  operations,
  auth: {
    session: sessionAuth({
      login: Login,
      input: (state) => ({
        body: {
          username: String(state.require("username")),
          password: String(state.require("password")),
        },
      }),
      afterLogin(result, state) {
        if (result.status !== 200)
          throw new Error("Generated starter login failed.");
        state.setSecret("csrf", result.body.csrf);
      },
      csrf: { state: "csrf", header: "x-csrf-token" },
    }),
  },
});

const scenarios: FlowtractScenario[] = [];
let primaryFailure: unknown;
let closeFailures = 0;
try {
  scenarios.push(
    await runtime.createScenario(),
    await runtime.createScenario(),
  );
  for (const [index, scenario] of scenarios.entries()) {
    scenario.setSecret("username", service.username);
    scenario.setSecret("password", service.password);
    scenario.set("itemName", `starter-item-${index + 1}`);
  }

  const created = await Promise.all(
    scenarios.map((scenario) =>
      scenario.execute(CreateItem, { body: { name: "{{itemName}}" } }),
    ),
  );
  for (const [index, result] of created.entries()) {
    if (result.status !== 201)
      throw new Error(`Create ${index + 1} was denied.`);
    const scenario = scenarios[index];
    if (scenario === undefined) throw new Error("Scenario ownership was lost.");
    scenario.registerCleanup(`logout-${index + 1}`, async (client) => {
      const logout = await client.execute(Logout);
      if (logout.status !== 204) throw new Error("Cleanup logout failed.");
    });
    scenario.registerCleanup(`delete-${index + 1}`, async (client) => {
      const deleted = await client.execute(DeleteItem, {
        pathParams: { id: result.body.id },
      });
      if (deleted.status !== 204) throw new Error("Cleanup delete failed.");
    });
  }

  const first = scenarios[0];
  const secondItem = created[1];
  if (
    first === undefined ||
    secondItem === undefined ||
    secondItem.status !== 201
  ) {
    throw new Error("Cross-scenario proof setup failed.");
  }
  const denied = await first.execute(GetItem, {
    pathParams: { id: secondItem.body.id },
  });
  if (denied.status !== 404 || denied.body.message !== "missing") {
    throw new Error(
      "Cross-scenario access was not denied through its declared contract.",
    );
  }

  const evidence = JSON.stringify(
    scenarios.flatMap((scenario) => [
      ...scenario.history(),
      ...scenario.diagnostics(),
    ]),
  );
  for (const secret of service.generatedSecrets) {
    if (evidence.includes(secret))
      throw new Error("A generated secret escaped into public evidence.");
  }
} catch (error) {
  primaryFailure = error;
} finally {
  const closed = await Promise.allSettled(
    scenarios.map((scenario) => scenario.close()),
  );
  closeFailures = closed.filter(
    (result) => result.status === "rejected",
  ).length;
  await service.close();
}

if (primaryFailure !== undefined) throw primaryFailure;
const final = service.snapshot();
if (
  closeFailures !== 0 ||
  final.items !== 0 ||
  final.sessions !== 0 ||
  final.activeRequests !== 0 ||
  final.activeSockets !== 0
) {
  throw new Error(
    `Starter leaked resources: closeFailures=${closeFailures}, items=${final.items}, sessions=${final.sessions}, requests=${final.activeRequests}, sockets=${final.activeSockets}.`,
  );
}
console.log("flowtract-starter: passed");
