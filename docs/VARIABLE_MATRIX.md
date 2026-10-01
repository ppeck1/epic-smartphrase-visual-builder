# Current variable matrix

This file is the compact source of truth for the current public build. Update it when a design token, breakpoint, status, schema field, or safety limit changes.

## Color variables

| Variable | Value | Job | Human signal |
| --- | --- | --- | --- |
| `--bg` | `#F4F2ED` | Page background | Quiet, warm workspace |
| `--paper` | `#FFFFFF` | Editor and preview | The active work surface |
| `--paper-2` | `#FBFAF7` | Soft secondary surface | Related but less important |
| `--ink` | `#1C1B19` | Main text | Highest reading priority |
| `--ink-2` | `#47443E` | Secondary controls | Available, not dominant |
| `--muted` | `#69655D` | Help text | Supporting information |
| `--line` | `#E5E1D9` | Dividers | Separates without competing |
| `--accent` | `#2446C4` | Main action and focus | Clear next step |
| `--accent-strong` | `#1A3596` | Hover/pressed action | Action feedback |
| `--amber` | `#8A5A00` | Check in Epic | Pause and verify |
| `--red` | `#B42318` | Unfinished or failed | Stop and fix |
| `--green` | `#0B6B4F` | Saved or copied | The requested action finished |

Core contrast ratios against their intended backgrounds are 4.85:1 or higher. Color is always paired with text or an icon.

## Type variables

| Variable | Stack | Use |
| --- | --- | --- |
| `--serif` | Iowan Old Style, Charter, Sitka Text, Cambria, Georgia | Authored phrase text and brand tone |
| `--sans` | System UI, Segoe UI, Helvetica Neue, Noto Sans | Navigation, labels, help, controls |
| `--mono` | SF Mono, Cascadia Mono, Roboto Mono, Menlo, Consolas | Phrase names and Epic tokens |

Base reading size is 16 px. Helper text stays at or above 13.5 px. Coarse-pointer controls expand to at least 44 px.

## Layout variables

| Rule | Current value | Result |
| --- | --- | --- |
| Preview width | `clamp(340px, 34vw, 460px)` | Stable reading pane on desktop |
| Main sheet width | `720px` maximum | Short, readable lines |
| Standard radius | `--r: 8px` | Consistent controls |
| Motion | `--t: 140ms` | Fast spatial feedback |
| Compact layout | `960px` | Smaller editor padding and two-column quick add |
| Phone layout | `820px` | Build/Preview tabs and fixed copy bar |
| Narrow phone | `380px` | Shorter labels and compact controls |
| Minimum supported review width | `320px` | No intended sideways scrolling |

## Status matrix

| Status | Color | Meaning | Does it block copying? |
| --- | --- | --- | --- |
| `Ready to copy` | Near-black + blue action | Builder fields are complete | No |
| `Check in Epic` | Amber | Confirm local Epic behavior | No |
| `Set up in Epic` | Amber | Create or insert something in Epic | No |
| `Draft · unfinished` | Red after reveal | A builder field still needs work | No; copy is clearly labeled as a draft |
| `Copied` | Green | Clipboard write succeeded | No |
| `Not saved` | Amber | Browser storage failed | No; Save file remains available |

Green confirms a completed interface action. It never claims that Epic approved or clinically validated the phrase.

## Draft schema matrix

| Variable | Value or limit | Notes |
| --- | --- | --- |
| Schema | `epic-smartobject-builder` | Identifies exported drafts |
| Version | `1` | Reject unknown versions |
| Storage key | `epic-smartobject-builder.v1` | Local browser storage only |
| Phrase name | 64 characters | Copies as uppercase letters, numbers, and underscores |
| Blocks | 500 maximum | Order determines copied line order |
| Draft file | 2 MB maximum | Checked before JSON parsing |
| Text per block | 300,000 characters | Hard safety bound |
| Choices per SmartList plan | 100,000 characters | One choice per line |
| Internal block ID | Regenerated on import | Prevents markup and selector injection |

### Block fields

| Field | Purpose |
| --- | --- |
| `moduleId` | Links a block to starter or loaded-library metadata |
| `kind` | Text, wildcard, SmartLink, SmartList, template, or plan |
| `evidence` | Internal source classification used to create plain status words |
| `text` | Authored text or template body |
| `token` | Epic token copied by a non-text block |
| `listName` | Planned SmartList name |
| `choices` | Planned SmartList choices |
| `defaultChoice` | Optional choice to preselect when building in Epic |
| `multiple` | Single, multiple, or decide in Epic |
| `collapsed` | View preference; never changes copied text |

## Reference-library limits

| Variable | Limit |
| --- | --- |
| File size | 5 MB |
| Total entries | 10,000 |
| Body/search field | 300,000 characters |
| Source pages per entry | 500 |
| Results rendered at once | 150 in the library browser; 200 in the picker |

Reference data is normalized before it reaches application state. User-provided text is escaped before it is placed into generated interface markup.

## Build matrix

| Entity | Source of truth | Verification |
| --- | --- | --- |
| Page structure | `src/index.template.html` | Browser and accessibility checks |
| Visual tokens | `src/styles/00-foundation.css` | Contrast matrix and screenshots |
| Phrase output | `src/js/core.js` | Node unit tests |
| Browser behavior | `src/js/app/*.js` | Integration and live-browser checks |
| Public release | `index.html` | `npm run build:check` |
| Examples | `examples/*.json` | Core schema validation tests |
