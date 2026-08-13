# expand-dotenvx-envs-action

Expand dotenvx stored values into GitHub Actions variables.

```yaml
- name: Expand dotenvx stored values into github action variable
  uses: kentrino/expand-dotenvx-envs-action@v0.0.1
  id: dotenv-secrets
  with:
    private_key: ${{ secrets.DOTENVX_PRIVATE_KEY }}
    # expand only specified names (newline-separated)
    variables: |
      CLOUDFLARE_API_KEY
    # expand all (default false)
    expand_all: false
```
