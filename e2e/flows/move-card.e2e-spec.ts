import { expect, type Locator, type Page, test } from '@playwright/test'
import { E2E_API_URL as API_URL } from '../support/urls'

type ColumnParams = {
  page: Page
  name: string
}

function column({ page, name }: ColumnParams): Locator {
  return page.getByRole('region', { name })
}

type DragParams = {
  page: Page
  handle: Locator
  target: Locator
}

async function drag({ page, handle, target }: DragParams): Promise<void> {
  const from = await handle.boundingBox()
  const to = await target.boundingBox()
  if (!from || !to) throw new Error('Drag source or target is not visible')

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 20 })
  await page.mouse.up()
}

test('user moves a card by keyboard and by dragging, and the board keeps it after reload', async ({ page, request }) => {
  const response = await request.post(`${API_URL}/projects`, { data: { name: `e2e-quadro-${Date.now()}` } })
  const { project } = await response.json()
  const title = 'Configurar CI'

  await page.goto(`/projects/${project.id}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Novo card' }).click()
  await page.getByRole('textbox', { name: 'Título' }).fill(title)
  await page.getByRole('button', { name: 'Criar card' }).click()
  await expect(column({ page, name: 'Backlog' }).getByRole('heading', { name: title })).toBeVisible()

  await page.getByRole('button', { name: `Mover para: ${title}` }).focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Explore', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(column({ page, name: 'Explore' }).getByRole('heading', { name: title })).toBeVisible()

  await drag({ page, handle: page.getByRole('button', { name: `Arrastar ${title}` }), target: column({ page, name: 'Apply' }) })
  await expect(column({ page, name: 'Apply' }).getByRole('heading', { name: title })).toBeVisible()

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(column({ page, name: 'Apply' }).getByRole('heading', { name: title })).toBeVisible()
  await expect(column({ page, name: 'Explore' }).getByRole('heading', { name: title })).toHaveCount(0)
})
