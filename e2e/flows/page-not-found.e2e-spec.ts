import { expect, test } from '@playwright/test'

test('user opens an unknown address and goes back to the project list', async ({ page }) => {
  await page.goto('/endereco-que-nao-existe')
  await page.waitForLoadState('networkidle')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()

  await page.getByRole('link', { name: 'Voltar para a lista de projetos' }).click()
  await expect(page).toHaveURL('/')
})
