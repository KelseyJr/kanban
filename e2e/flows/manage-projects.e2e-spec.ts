import { expect, test } from '@playwright/test'

const CARD_STAGES = ['Backlog', 'Explore', 'Propose', 'Apply', 'Archive']

test('user creates, renames, opens and deletes a project', async ({ page }) => {
  const name = `e2e-projeto-${Date.now()}`
  const renamed = `${name}-renomeado`

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('textbox', { name: 'Nome do projeto' }).fill(`  ${name}  `)
  await page.getByRole('button', { name: 'Criar projeto' }).click()
  await expect(page.getByRole('link', { name, exact: true })).toBeVisible()

  await page.getByRole('button', { name: `Renomear ${name}` }).click()
  await page.getByRole('textbox', { name: 'Novo nome' }).fill(renamed)
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('link', { name: renamed, exact: true })).toBeVisible()

  await page.getByRole('link', { name: renamed, exact: true }).click()
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(CARD_STAGES)

  await page.getByRole('link', { name: 'Projetos' }).click()
  await page.getByRole('button', { name: `Excluir ${renamed}` }).click()
  await page.getByRole('dialog', { name: 'Excluir projeto' }).getByRole('button', { name: 'Excluir projeto' }).click()
  await expect(page.getByRole('link', { name: renamed, exact: true })).toHaveCount(0)
})
