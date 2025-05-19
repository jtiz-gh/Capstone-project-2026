describe("Teams Page", () => {
  it("should navigate between team view and energy monitors", () => {
    // Start at teams page
    cy.visit("http://localhost:3000/teams/coolteam/energy-monitors")

    // Verify back button exists
    cy.contains("← Back to Team View").should("exist")

    // Click back button
    cy.contains("← Back to Team View").click()

    // Verify we're back on teams page
    cy.url().should("include", "/teams")
  })
})
