describe("Competitions Page", () => {
  it("should go back to home page when back button is clicked", () => {
    cy.visit("http://localhost:3000/competitions/")

    cy.get('[data-testid="back-button"]').click();

    cy.location('pathname').should('eq', '/');
  })
})