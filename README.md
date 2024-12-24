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

Creates a new incident or informational post in your cState `content/issues` directory.

**Example:**

```bash
cstate create
```

This will guide you through an interactive prompt to create a new post.

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
*   `Experiment`
*   `Postmortem`

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