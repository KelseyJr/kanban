# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One developer (the owner of this repository), for personal use. They run several repositories that use the OpenSpec workflow and need to see, per project, where each piece of work stands in that workflow and what is left to do.

## Product Purpose

A Kanban board per project whose columns mirror the OpenSpec workflow: a backlog followed by one column per OpenSpec step. Each activity is a card the user moves as steps finish. Success means opening a project and knowing at a glance what is waiting, what is being explored, proposed, applied and archived.

## Positioning

The columns are not generic "to do / doing / done": they are fixed to the OpenSpec commands (Backlog, Explore, Propose, Apply, Archive), so the board reads as the state of the OpenSpec changes of a repository.

## Operating Context

- Used on a desktop, in a wide window open next to the editor and the terminal where the OpenSpec commands run. Phones only need to work, not to be the primary experience.
- One board per project; the user switches between a few projects.
- The user moves cards after finishing a step in the terminal, by dragging or by the keyboard "Mover para" action.

## Capabilities and Constraints

- Projects: create, list (alphabetical), rename, delete (with confirmation; deletes their cards). Names are unique ignoring case, 1 to 80 characters.
- Cards: title (1 to 120 characters) and optional description (up to 5,000); created at the end of Backlog; edit; delete with confirmation.
- Moving: to any column, at any position, forward, backward or skipping steps; reorder within a column; drag and drop or the "Mover para" action. A failed move puts the card back and shows "Não foi possível mover o card. Tente de novo."
- The five columns are fixed and always shown with their card count, even when empty.
- All interface text is in Portuguese (pt-BR); column names keep the OpenSpec command names.
- Out of scope for now: login, deploy, custom columns, labels, assignees, due dates, real-time sync between tabs, automatic sync with the OpenSpec CLI.

## Evidence on Hand

None: there is no real content, data or brand asset yet. Do not fabricate sample projects, testimonials or metrics.

## Product Principles

1. The board shows the workflow state at a glance: columns, counts and card titles read before anything else.
2. Every move is possible without a mouse.
3. The server is the source of truth: what the board shows after a reload is what was saved.
4. Nothing beyond the OpenSpec workflow until a later change asks for it.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, visible focus, target sizes and full keyboard operation, including moving cards.
