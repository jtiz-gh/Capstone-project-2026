describe("Energy Monitors Page", () => {
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

  it('resets zoom and shows 0 on all x-axes', () => {
    // Visit the energy monitors page
    cy.visit('http://localhost:3000/teams/1/energy-monitors') // Replace `1` with a valid team ID

    // Wait for charts to load
    cy.contains('Average Voltage').should('exist')

    cy.get('.recharts-brush-traveller')
  .should('have.length', 2)
  .then(($handles) => {
    const leftHandle = $handles[0];
    cy.wrap(leftHandle)
      .trigger('mousedown', { force: true })
      .trigger('mousemove', { clientX: 300, force: true })
      .trigger('mouseup', { force: true });
  });

    // Reset and assert
    cy.contains('Reset View').click()

    cy.get('.recharts-cartesian-axis-tick-value')
    .should('contain.text', '0s') // or regex match
  })
})