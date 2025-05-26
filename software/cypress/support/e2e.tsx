beforeEach(() => {
  cy.log(
    "Before each test, we clear the local storage and session storage to ensure a clean state."
  )
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
})
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('Hydration failed') ||
    err.message.includes('throwOnHydrationMismatch')) {
    return false
  }
  return true
});
