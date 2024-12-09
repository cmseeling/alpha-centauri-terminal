# Alpha CenTauri Terminal

A terminal emulator built on [Tauri](https://tauri.app/) using [Rust](https://www.rust-lang.org/) and [Svelte](https://svelte.dev/).

## What this project is

This is mostly a hobby project I started when [Hyper](https://hyper.is/) didn't install cleanly on NixOs. My goal is to implement the functionality of various other terminals that I find useful or fun.

## What this project is not

- As fast as [Alaccrity](https://alacritty.org/)
- As feature rich as [Hyper](https://hyper.is/)
- A [Guake](https://guake.github.io/) style terminal (... yet)

## Building and running

1. Follow the [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)
2. Install node modules with `npm install`
3. run with `cargo tauri dev` or build with `cargo tauri build`

### Configuration File Locations

- Windows: C:/Users/{$UserName}/AppData/alpha-centauri-terminal/.alphacentauri.config.json
- Linux: ~/.config/alpha-centauri-terminal/.alphacentauri.config.json
- MacOS: ~/Library/Application Support/alpha-centauri-terminal/.alphacentauri.config.json

### Running the Svelte unit/integration tests on Windows

If the tests fail when exected on a Windows machine, try using the latest version of Powershell.
Otherwise refer to this [Stack Overflow question](https://stackoverflow.com/questions/78421435/typeerror-cannot-read-properties-of-undefined-reading-test-vitest)

### Running the Playwright e2e test

1. Start a dev instance with `cargo tauri dev`
2. In a separate shell instance, run the test with `npm run test:e2e`
3. The dev instance will close at the successful conclusion of the test

Note: only working on Windows at the moment and may never work on WebKit runtimes (Linux and MacOS)
