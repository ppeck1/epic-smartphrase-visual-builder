# Improvement plan

## The goal

A new user should be able to build and copy a simple SmartPhrase in under one minute.

The whole product should feel like this:

1. Name it.
2. Build it.
3. Copy it.

Everything else is help or an advanced tool.

## What I reviewed

I read the full app, ran it in a browser, tested the main build flow, and checked the wide and phone layouts.

The core works. A phrase name becomes `.PHRASENAME`, typed text appears in the Epic body, and the checks update at once. The app is also easy to share because it is one offline HTML file.

## What is good now

- No install and no outside packages.
- The main builder works.
- Drafts save in the browser.
- Undo, redo, save, and open are included.
- Buttons have useful screen-reader names.
- The user can click to add blocks; dragging is optional.
- The app warns users to test in Epic and avoid patient data.

## What gets in the way

### 1. The first screen is mostly instructions

On a phone, the builder is not visible on the first screen. The user sees the intro, file loader, safety warning, and four status definitions first.

**Fix:** Put the phrase name and first block at the top. Move help, file tools, and status definitions behind small menus.

### 2. The app sounds like an instruction manual

Words such as “evidence states,” “catalog reference,” “preflight,” “assembly,” and “governance” slow people down.

**Fix:** Use short, common words. Explain an Epic term only when the user needs it.

### 3. A new draft starts with red errors

The first visit says “Draft incomplete” and shows four problems before the user has done anything.

**Fix:** Start with a friendly prompt: “Give your phrase a name.” Show errors only after the user tries to copy.

### 4. Too many things look equally important

Load, import, export, reset, three copy buttons, warnings, and four status types all compete with the builder.

**Fix:** Give the page one main button: **Copy for Epic**. Put file actions in a **More** menu. Put build notes in **Details**.

### 5. The text is small and dense

Many labels are smaller than 14 px. The three-column layout packs too much into one view. The wide page also creates long reading lines.

**Fix:** Use a 16 px base size, larger section titles, more space, and a narrower work area. Keep touch targets at least 44 by 44 px.

### 6. Phone use takes too much scrolling

The library, canvas, preview, notes, and help become one long page. The copy action is far from the work.

**Fix:** On phones, use two views: **Build** and **Preview**. Keep **Copy for Epic** fixed near the bottom.

### 7. Status labels are not fully clear

Some built-in SmartLinks are called “Exact token,” while nearby text still says to confirm that they work in the local Epic setup.

**Fix:** Use only two user-facing states:

- **Ready** — plain text or a safe placeholder created by the user.
- **Check in Epic** — any SmartLink, SmartList, template, or local item whose behavior can vary.

### 8. The code is hard to grow safely

The HTML, styles, data, and app logic live in one large file. That is simple to share, but hard to test and change.

**Fix:** Keep the one-file release, but develop from small source files and build them into `index.html`.

## New page shape

### Top bar

- Product name: **SmartPhrase Builder**
- One short line: **Build a phrase, one block at a time.**
- Right side: **Open**, **Save**, and **More**

### Main work area

- **Add a block** — searchable list with large rows and recent items first.
- **Your phrase** — the name and block stack. This is the largest area.
- **Preview** — the final name, body, and one copy button.

### Help

Show one slim note: **Test this in your Epic training area before using it.**

Put the full safety note, status help, reference bank, and build notes inside **Help** or **More**.

## Replace the words

| Current words | New words |
| --- | --- |
| Epic SmartObject Builder | SmartPhrase Builder |
| Assemble Epic SmartPhrases from connected blocks | Build a phrase, one block at a time. |
| Block library | Add a block |
| Connected block canvas | Your phrase |
| SmartPhrase draft | Preview |
| Draft incomplete | Finish these items |
| Exact token | Ready |
| Verify locally | Check in Epic |
| Catalog reference | Find in Epic |
| Needs creation | Build in Epic |
| Load reference bank (JSON) | Add your library |
| Export draft JSON | Save file |
| Import draft JSON | Open file |
| Build notes | Details |
| Preflight | Check |

## Function plan

### Phase 1 — make the main job easy

- Put the name field and first block above the fold.
- Replace the opening errors with a calm empty state.
- Make click or tap the main way to add a block.
- Keep drag-and-drop as a shortcut.
- Add one **Copy for Epic** button.
- Hide advanced tools until asked for.
- Group undo and redo by typing action, not by every letter.
- Show a small **Saved** message after local save.
- Change all organization-specific items to **Check in Epic**.

### Phase 2 — make the builder faster

- Show recent and favorite blocks.
- Add quick buttons for Text, Wildcard, SmartLink, and SmartList.
- Let users duplicate a whole phrase as a template.
- Add find-and-replace across text blocks.
- Show where a check comes from and how to fix it.
- Let users collapse long blocks.
- Keep the preview visible while the phrase grows.

### Phase 3 — make advanced work safer

- Check file type, file size, schema version, and item count on import.
- Show a plain preview before an imported draft replaces current work.
- Add a private-session mode that does not save to local storage.
- Add a clear “Remove saved draft” action with a warning.
- Show which reference bank is active and when it was loaded.
- Keep all work local unless a future feature clearly asks the user before sharing.

## Visual direction

The design should feel quiet, warm, and exact.

- Use one near-black text color, one soft gray background, and one accent color.
- Use color for meaning, not decoration.
- Remove the navy, teal, purple, yellow, and red competition.
- Use a simple 8 px spacing system.
- Use 16 px body text and a clear type scale.
- Use thin borders and very soft shadows.
- Round corners with one consistent size.
- Keep one main action per screen.
- Let empty space separate ideas.
- Use motion only to show where a block moved. Keep it under 200 ms.
- Honor `prefers-reduced-motion`.
- Do not use glass effects or decoration that makes reading harder.

## Ethical color and behavior plan

Color can guide attention before a person reads the words. We will use that power to prevent mistakes and make choices clear. We will not use false urgency, hidden choices, or colors that push users into unsafe actions.

| Job | Color | Why it works | Where to use it |
| --- | --- | --- | --- |
| Main action | Deep blue `#0B5BD3` | Blue is familiar, calm, and strongly linked with trust and competence. | The one main button, selected controls, and active focus. |
| Main action hover | Dark blue `#0847A6` | A darker value gives clear feedback without changing meaning. | Hover and pressed states only. |
| Finished successfully | Deep green `#0B6B55` | Green signals completion and lowers doubt after a real success. | Saved, copied, and ready states only after they happen. |
| Check before use | Dark amber `#8A5C00` | Amber slows people down without the alarm of red. | SmartLinks, SmartLists, wildcards, and anything that must be checked in Epic. |
| Blocked or destructive | Deep red `#B42318` | Red gets fast attention and is widely understood as stop or danger. | Invalid work, failed actions, remove, and start-over warnings only. |
| Page background | Cool gray `#F4F7FB` | A quiet background lowers visual strain and makes the work surface easy to find. | The page behind cards. |
| Work surface | White `#FFFFFF` | White gives the builder a clean, focused work area. | The library, phrase, and preview cards. |
| Main text | Soft near-black `#172033` | High contrast feels clear and dependable without the harshness of pure black. | Titles, labels, and important text. |
| Supporting text | Slate `#596579` | Slate stays readable while clearly stepping behind the main text. | Help, notes, and descriptions. |
| Borders | Blue-gray `#D9E0EA` | Low-contrast edges group content without adding noise. | Cards, fields, and dividers. |

### Color rules

- Only one filled blue button should appear in a view.
- Green appears only after success. It never promises that Epic has approved the content.
- Amber means “pause and check,” not “something failed.”
- Red never appears on a new, untouched draft.
- Every color message also uses words or an icon.
- Disabled controls use lower contrast but stay readable.
- Focus uses a blue ring that is easy to see on every surface.
- Status colors use pale backgrounds and dark text so they remain readable.
- All normal text and controls must meet WCAG 2.2 AA contrast.

The implemented core pairs pass the 4.5:1 AA target: blue on white is 6.08:1, green on white is 6.46:1, amber on its pale background is 5.43:1, red on its pale background is 5.98:1, supporting slate on white is 5.90:1, and main text on white is 16.27:1.

## Build progress

Phase 1 is in progress. The first build pass includes:

- A compact header and a shorter safety note.
- The name field and phrase builder first on phones.
- One deep-blue **Copy for Epic** action.
- Neutral secondary controls.
- Green only for saved, copied, and ready states.
- Amber for items that must be checked in Epic.
- Red only for blocked work and start-over warnings.
- Plain labels such as **Add a block**, **Your phrase**, and **Preview**.
- Advanced file and library tools moved behind one menu.
- Build notes moved into **Details**.
- Friendlier first-use guidance instead of immediate errors.
- Larger type and touch targets.

## Access for everyone

- Meet WCAG 2.2 AA.
- Support the full flow with a keyboard.
- Keep a visible focus ring.
- Give every icon a text name.
- Keep controls at least 44 by 44 px.
- Never use color as the only status signal.
- Announce copy, save, import, and error results to screen readers.
- Keep the page usable at 200% zoom and 320 px wide.

## Tests to add

- Unit tests for name cleanup, block output, checks, save files, and imports.
- Browser tests for create, edit, move, duplicate, undo, redo, save, open, and copy.
- Keyboard-only tests.
- Automated accessibility checks.
- Phone, tablet, laptop, and large-screen layout checks.
- A test that proves the app makes no network request.
- A test that bad or very large JSON files fail safely.

## Done means

- The first useful field is visible on a 390 by 844 phone screen.
- A first-time user can build and copy a basic phrase in under one minute without help.
- Main instructions use short sentences and common words.
- There is only one bright primary button in each view.
- Instructions and labels are at least 14 px; normal reading text is at least 16 px. Small status tags may use 12–13 px when contrast stays strong.
- Every control works by keyboard and touch.
- There is no sideways scroll at 320 px wide.
- The main flow has no console errors.
- The app still works offline.
- No private source data or patient data is included.

## Recommended build order

1. Rewrite the page and move advanced tools.
2. Rebuild the layout for phone first.
3. Simplify status to **Ready** and **Check in Epic**.
4. Create one clear copy flow.
5. Split source code and add tests.
6. Add speed features only after new-user testing passes.
