# Flowtract Starter

A five-minute, registry-backed evaluation of
[`flowtract@0.1.0`](https://www.npmjs.com/package/flowtract) for authenticated,
stateful REST workflow contracts.

> Flowtract is a developer preview. This starter is evaluation material, not a
> production- or enterprise-readiness claim.

## Five-minute path

Flowtract supports Node 22 and Node 24. Clone or use this repository as a
template, then run:

```bash
npm ci
npm run demo
```

Success ends with:

```text
flowtract-starter: passed
```

For the Gate 4B first-success measurement, start the timer after `npm ci`
finishes and stop when the unchanged demo prints the success line. Report whole
minutes rounded up; a zero-minute result is invalid.

Run the complete local proof with:

```bash
npm run check
```

## What the starter proves

The demo uses only public Flowtract APIs and the exact public npm package. It
starts a generated local service on `127.0.0.1` with an ephemeral port and
proves:

- typed login, create, get, delete, and logout contracts;
- project-owned session cookie and CSRF authentication;
- secret state and `{{itemName}}` interpolation;
- two isolated scenarios and cross-scenario access denial;
- declared error narrowing;
- cleanup-client deletion followed by logout;
- redacted diagnostics and history;
- successful scenario/context disposal;
- zero remaining entities, sessions, requests, or sockets;
- normal process termination.

Every credential, cookie, session ID, CSRF token, and resource identifier is
generated at runtime. The starter contacts no external API, collects no product
telemetry or analytics, and writes no evaluation evidence automatically.

## Evaluate one real workflow

After the unchanged starter passes:

1. Replace `startDemoService()` with a permitted test or staging API base URL.
2. Replace the operations in `src/api.ts` with one authenticated workflow whose
   state spans at least two REST requests.
3. Keep credentials in `setSecret`, preserve deterministic cleanup, and inspect
   declared results instead of treating every non-2xx response as transport
   failure.
4. Record where documentation clarification, live help, or product changes were
   required.
5. If the first workflow demonstrates value, model a second distinct workflow.

Private repositories and services are eligible. Never publish credentials,
tokens, cookies, private source, endpoint identities, customer data,
proprietary payloads, or identifiable operational details.

## Submit feedback

- [Gate 4B evaluation form](https://github.com/flowtract/flowtract/issues/new?template=gate4b-evaluation.yml)
- [Usage Q&A](https://github.com/flowtract/flowtract/discussions/categories/q-a)
- [Ideas and use cases](https://github.com/flowtract/flowtract/discussions/categories/ideas)
- [Flowtract documentation](https://flowtract.github.io/flowtract/)
- [Security and limitations](https://flowtract.github.io/flowtract/security.html)
- [Private vulnerability reporting](https://github.com/flowtract/flowtract/security/advisories/new)

Issues and Discussions are intentionally centralized in
[`flowtract/flowtract`](https://github.com/flowtract/flowtract).

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
