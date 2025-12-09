beforeEach(() => {
  cy.log(
    "Before each test, we clear the local storage and session storage to ensure a clean state."
  )
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
})
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("Hydration failed") ||
    err.message.includes("throwOnHydrationMismatch")
  ) {
    return false
  }
  return true
})
// Set command timeout to 20 seconds
Cypress.config("defaultCommandTimeout", 20000)

// Set request timeout to 20 seconds
Cypress.config("requestTimeout", 20000)

// Set page load timeout to 20 seconds
Cypress.config("pageLoadTimeout", 20000)
