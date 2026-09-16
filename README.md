# Epic SmartPhrase Visual Builder

Build a SmartPhrase one block at a time. Add text, SmartLinks, SmartLists, or wildcards. Put the blocks in order. Then copy the finished draft into Epic.

The app is one file: `index.html`. It has no setup, no server, and no outside packages. It works offline in a modern browser.

## Try it

1. Open `index.html`.
2. Name your SmartPhrase.
3. Add and arrange blocks.
4. Copy the name and body.
5. Test the draft in your approved Epic training or test area.

Your draft is saved in this browser. You can also save it as a JSON file and open it later.

## What works today

- Build with text, wildcards, SmartLinks, and SmartList plans.
- Search the built-in block list.
- Move, copy, or remove blocks.
- See the finished name and body as you work.
- Undo, redo, save, and open drafts.
- Add an optional local reference bank.

## Make it better

The current build is useful, but it asks users to read too much. The next version will make the main job feel like three clear steps: **name it, build it, copy it**.

See the [improvement plan](IMPROVEMENT_PLAN.md) for the full review, new words, design direction, and build order.

## Optional reference bank

You can load a local JSON file with your own SmartPhrase and SmartObject list. The file stays in your browser. The app does not upload it.

The app accepts `smartPhraseBank`, `smartObjectBank`, or both. This is an advanced feature and is not needed for normal use.

## Safety

- This tool does not connect to Epic.
- It does not publish or approve clinical content.
- SmartLinks and SmartLists can work differently at each organization.
- Do not enter patient information.
- Always test every draft in an approved Epic training or test area before clinical use.

This is an independent open-source project. It is not made, approved, or supported by Epic Systems Corporation. Epic, SmartPhrase, SmartLink, SmartList, and SmartObject are names used to describe compatibility with Epic software.

## Project history

This project was distilled from a specialty workbook prototype. Private clinical data banks and patient data are not included. The public project contains only the generic builder.

Built by [Paul Peck](https://ppeck.me).

## License

[MIT](LICENSE)
