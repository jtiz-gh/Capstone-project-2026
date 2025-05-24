describe("Event Types Page", () => {
  it("should go back to home page when back button is clicked", () => {
    cy.visit("http://localhost:3000/event-types/")

    cy.get('[data-testid="back-button"]').click();

    cy.location('pathname').should('eq', '/');
  })

  it("should not leave the form and show validation message if input is empty", () => {
    cy.visit("http://localhost:3000/event-types/")

    cy.contains("Add Event Type").click()

    cy.get('[data-slot="input"]').should("exist")

    // Try to submit the form without filling the input
    cy.get('form').contains('Add Event Type').click()

    // URL should not change
    cy.url().should("include", "/event-types")

    // The input should be invalid
    cy.get('[data-slot="input"]').should('have.attr', 'required')
  })

  it("should add a new event type when the form is filled", () => {
    cy.visit("http://localhost:3000/event-types")

    cy.contains("Add Event Type").click()

    cy.get('[data-slot="input"]').type("New Event Type")

    // Submit the form
    cy.get('form').contains('Add Event Type').click()

    // Verify the new team is added to the list
    cy.contains("New Event Type").should("exist")
  })
})