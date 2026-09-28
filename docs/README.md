# Documentation

Product-discovery documentation for **Digitizing the PDM Final Project Lifecycle** (M.Tech Product Design and Management, IIIT Hyderabad).

## For faculty review — Word documents

| Document | What it covers |
|---|---|
| [PDM-Workflow-Report.docx](./PDM-Workflow-Report.docx) | The programme and the people, the twelve dated deliverables, how the process runs today for each stakeholder, the eighteen problems we found, what we propose to change, the scope, the twelve measures, and the questions we need answered. 14 pages, 9 diagrams. |
| [PDM-Feature-Plan.docx](./PDM-Feature-Plan.docx) | How features were chosen, the forty must-haves in full with the problem and measure behind each one, the should-haves and later work in summary, what we are not building, the weekly build order, and every measure mapped to the features behind it. 12 pages, 2 diagrams. |

## Working notes

| File | What it is |
|---|---|
| [01-workflow-map.md](./01-workflow-map.md) | The long-form workflow map, including the landscape scan of comparable tools and the IIITH ecosystem scan with sources. |
| [02-feature-catalogue-moscow.md](./02-feature-catalogue-moscow.md) | The complete catalogue of 162 features across 17 modules, each traced to a friction point and tagged with its evidence state. |
| [figures/](./figures) | The eleven diagrams as PNG, with the Mermaid source for each so they can be edited and re-rendered. |
| [build/](./build) | The scripts that generate the two Word documents. |

## Rebuilding the Word documents

Diagrams are rendered with Mermaid, using the system copy of Chrome rather than a downloaded one:

```bash
cd docs/figures
PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npx @mermaid-js/mermaid-cli@11 -i 01-stakeholders.mmd -o 01-stakeholders.png -b white -s 3 -c mconf.json
```

The documents themselves need `python-docx` and `Pillow`, and LibreOffice plus `pdftotext` for the contents page, which is built by rendering the document once to work out which page each heading lands on:

```bash
python3 docs/build/build_workflow.py docs/PDM-Workflow-Report.docx
python3 docs/build/build_features.py docs/PDM-Feature-Plan.docx
```

## Where the content comes from

The programme milestone sheet for 2026, the batch project registration form, the project proposal and research plan, the published PDM programme pages, and a review of around forty comparable tools. Claims are tagged in the working notes as recorded, partly recorded, or assumed, and the assumed ones are assigned to a specific interview in Weeks 3 to 6.
