# Contributing

handoffX is protocol-first. Changes should preserve these properties:

- a receiver can understand the Markdown without installing handoffX;
- transports and agent vendors remain optional adapters;
- new fields are additive and unknown fields remain safe to ignore;
- acceptance stays receiver-specific and revision-specific;
- the canonical artifact remains readable without the clarification transcript.

## Development

```bash
npm test
node src/cli.js --help
```

Protocol changes should update `SPEC.md`, the relevant JSON Schema, examples, CLI behavior, and tests in the same pull request.

Substantive incompatible protocol changes require a new protocol version. Do not silently change the meaning of a 0.1 field.
