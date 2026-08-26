# Security policy

## Supported version

Security fixes are applied to the latest release on the `main` branch.

## Reporting a vulnerability

Do not open a public issue for credential exposure, local-server bypasses, unsafe URL handling, injection, or another exploitable weakness. Use GitHub's private vulnerability reporting for this repository. Include affected versions, reproduction steps, impact, and a suggested mitigation when available.

Please allow maintainers reasonable time to validate and address a report before public disclosure.

## Security model

- The local server binds to `127.0.0.1` and is not designed for public hosting.
- Credentials belong only in ignored `terminal/.tang-*.env` local files.
- Browser endpoints must never return credential values.
- TANG does not store brokerage credentials or execute orders.
- External news, market, filing, model, and AIS responses are untrusted input and must be normalized or escaped.

If a credential enters a commit, issue, log, screenshot, or release archive, revoke it immediately. Removing the text later is not sufficient.
