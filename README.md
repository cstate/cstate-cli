# Command Line Tool for cState Status Page

A CLI tool to help you create and manage content for your [cState](https://cstate.dev/) status page.

## Installation

You can install `cstate-cli` globally using npm:

```bash
npm install -g cstate-cli
```

Or, you can use it directly with `npx`:

```bash
npx cstate-cli <command>
```

## Usage

### `cstate`

The main help command for `cstate-cli`.

### `cstate create`

Creates a new incident, informational post, or v7 operational record.

**Example:**

```bash
cstate create
```

This will guide you through an interactive prompt. Incidents still write to `content/issues`. v7 records write to their matching sections, such as `content/experiments`, `content/release-notes`, `content/evals`, or `content/agent-runs`.

Experiment records use `recordType: experiment` and `recordKind: experiment`. The CLI also asks whether an experiment should use `severity: notice` for component-level notice placement, whether it should set `pin: true` for the homepage announcement band, and an optional `summary`. It never writes a frontmatter key named `kind`.

### `cstate draft`

Creates a new post from a pre-defined template.

**Example:**

```bash
cstate draft
```

This will ask you to choose a template and then guide you through an interactive prompt.

**Available Templates:**

*   `Incident Post`
*   `Maintenance`
*   `Postmortem`
*   `Experiment`
*   `Release Note`
*   `Changelog Entry`
*   `Roadmap Update`
*   `Eval Report`
*   `Agent Run`
*   `Decision Record`
*   `Research Note`

Experiment drafts now use `content/experiments` with `recordType: experiment`, `recordKind: experiment`, `state`, `severity`, `pin`, `affected`, and optional `summary` frontmatter instead of incident-shaped informational posts.

### `cstate dev`

Runs the Hugo development server with the cState theme.

**Example:**

```bash
cstate dev
```

This is useful for previewing the cState root repository `exampleSite` locally during development.

### `cstate serve`

An alias for `hugo serve`. You can pass any Hugo server options to this command.

**Example:**

```bash
cstate serve --contentDir=exampleSite/content
```

### `cstate build`

An alias for `hugo build`.

**Example:**

```bash
cstate build
```

## Contributing

If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/cstate/cstate-cli).

If you want to contribute code, please fork the repository and submit a pull request.

## License

MIT

(C) Mantas Vilčinskas
