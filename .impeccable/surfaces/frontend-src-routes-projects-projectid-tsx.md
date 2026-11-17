---
version: 1
slug: "frontend-src-routes-projects-projectid-tsx"
primary_target: "frontend/src/routes/projects.$projectId.tsx"
related_targets: ["frontend/src/routes/index.tsx"]
---

# Surface brief: Kanban app (projetos e quadro)

Scope: `/` (lista de projetos) e `/projects/$projectId` (quadro). Mode: Operate. Audience: one developer tracking OpenSpec changes per project, desktop beside the terminal. Task: create/rename/delete projects; create/edit/delete cards; move cards across the five fixed columns by drag or keyboard "Mover para". Constraints: pt-BR copy, WCAG 2.2 AA, fixed columns Backlog/Explore/Propose/Apply/Archive with counts even when empty.

## Direction contract

THESIS: Moving a card is sorting a letter: five fixed pigeonholes, one destination per OpenSpec step. Refuses the grey-columns-white-cards default.
OWN-WORLD: Postal-yellow #f4c430 header band and enamel slot labels with navy #1c2e5a ink; deep steel #2b3440 slots holding white envelope cards with a navy top rule; red cancellation ink #c8322a only where something changed (last moved card stamp, move error). Archivo / Archivo Narrow caps on labels. Raises: dragged card inverts fully, no grey state (from Datamatics); hierarchy by apparatus, one type step for title, label and count (from Lexicon); red only on changed state (from monochrome canon); one fixed count ramp in every slot label (from Star atlas).
STORY: The visitor sees where each piece of work stands, moves it to the next slot, and trusts the board after reload.
FIRST VIEWPORT: Yellow 64px bar: "Kanban", breadcrumb Projetos / name, Renomear and "+ Novo card" right. Five equal steel slots fill the width; each opens with its yellow label (name + count); cards stack inside; empty slot shows a dashed "Nenhum card". Projects page uses the same bar over one wide steel slot listing projects as envelopes with the create form on top.
FORM: Postal sorting case, candidate 7 of 7; seed:7b5cee5a2955810e. Signature interaction: the card just moved carries a red circular postmark with the column and date until the next move.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
