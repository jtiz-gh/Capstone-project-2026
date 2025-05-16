beforeEach(() => {
  cy.log(
    "Before each test, we clear the local storage and session storage to ensure a clean state."
  )
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
})
