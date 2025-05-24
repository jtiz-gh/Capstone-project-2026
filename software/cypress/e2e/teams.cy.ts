describe("Teams Page", () => {
  it("should not leave the form and show validation message if input is empty", () => {
    cy.visit("http://localhost:3000/teams/")

    cy.contains("Add Team").click()

    cy.get('[data-slot="input"]').should("exist")

    // Try to submit the form without filling the input
    cy.get('form').contains('Add Team').click()

    // URL should not change
    cy.url().should("include", "/teams")

    // The input should be invalid
    cy.get('[data-slot="input"]').should('have.attr', 'required')
  })

  it("should add a new team when the form is filled", () => {
    cy.visit("http://localhost:3000/teams/")

    cy.contains("Add Team").click()

    cy.get('[data-slot="input"]').type("New Team")

    // Submit the form
    cy.get('form').contains('Add Team').click()
  })

  it("should go back to home page when back button is clicked", () => {
    cy.visit("http://localhost:3000/teams/")

    cy.get('[data-testid="back-button"]').click();

    cy.location('pathname').should('eq', '/');
  })
})
