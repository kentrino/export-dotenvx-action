# export-dotenvx-action

Decrypt dotenvx-stored values into step outputs and the job environment.

Named keys only. Omitted `keys` is an error; use `*` to export every secret.

```yaml
- uses: kentrino/export-dotenvx-action@v0.0.1
  id: dotenv
  with:
    private_key: ${{ secrets.DOTENV_PRIVATE_KEY_CI }}
    file: .env.ci
    keys: |
      CLOUDFLARE_API_KEY

# other actions can read step outputs
- uses: example/action
  with:
    api_key: ${{ steps.dotenv.outputs.CLOUDFLARE_API_KEY }}

# later run steps also see values via $GITHUB_ENV
- run: echo "token length ${#CLOUDFLARE_API_KEY}"
```

Export every key except `DOTENV_PUBLIC_KEY*`:

```yaml
- uses: kentrino/export-dotenvx-action@v0.0.1
  with:
    private_key: ${{ secrets.DOTENV_PRIVATE_KEY_CI }}
    file: .env.ci
    keys: "*"
```

## License

MIT. Portions are adapted from [motdotla/dotenv](https://github.com/motdotla/dotenv) (BSD-2-Clause) and [dotenvx/dotenvx](https://github.com/dotenvx/dotenvx) (BSD-3-Clause); see `THIRD_PARTY_NOTICES.md`.
