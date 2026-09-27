# Security

handoff artifacts cross context and often organizational boundaries. Producers should include only the minimum information required by intended receivers.

Version 0.1 SHA-256 fields detect byte mismatch; they do not authenticate authors. Do not treat a matching digest as proof of identity or truth.

Do not include credentials, access tokens, private keys, or unrestricted sensitive data in a handoff. The `audience` field is descriptive metadata, not access control.

Please report security issues privately through GitHub's security advisory feature for this repository.
