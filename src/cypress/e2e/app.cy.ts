describe("Homepage navigation", () => {
  it("should navigate to the teams page", () => {
    // Start from the home page
    cy.visit("http://localhost:3000/")

    // Find a link with an href attribute containing "teams" and click it
    cy.get('[data-testid="homepage-teams"]').click()

    // The new url should include "/teams"
    cy.url().should("include", "/teams")

    // The new page should contain an h1 with "Teams"
    cy.get("h1").contains("Teams")
  })

  it("should navigate to the competitions page", () => {
    // Start from the home page
    cy.visit("http://localhost:3000/")

    // Find a link with an href attribute containing "competitions" and click it
    cy.get('[data-testid="homepage-competitions"]').click()

    // The new url should include "/competitions"
    cy.url().should("include", "/competitions")

    // The new page should contain an h1 with "Competitions"
    cy.get("h1").contains("Competitions")
  })

  it("should navigate to the event types page", () => {
    // Start from the home page
    cy.visit("http://localhost:3000/")

    // Use the data-testid selector as in your navbar tests
    cy.get('[data-testid="homepage-event-types"]').click()

    // The new url should include "/event-types"
    cy.url().should("include", "/event-types")

    // The new page should contain an h1 with "Event Types"
    cy.get("h1").contains("Event Types")
  })
})

describe("Navbar navigation", () => {
  beforeEach(() => {
    // Start from the event types page so we can see the navbar
    cy.visit("http://localhost:3000/event-types")
  })

  it("should display all navbar links", () => {
    cy.get('[data-testid="nav-home-link"]').should("be.visible").and("contain", "Home")
    cy.get('[data-testid="nav-teams-link"]').should("be.visible").and("contain", "Teams")
    cy.get('[data-testid="nav-competitions-link"]')
      .should("be.visible")
      .and("contain", "Competitions")
    cy.get('[data-testid="nav-event-types-link"]')
      .should("be.visible")
      .and("contain", "Event Types")
  })

  it("should navigate to Teams page when clicked", () => {
    cy.get('[data-testid="nav-teams-link"]').click()
    cy.location("pathname").should("eq", "/teams")
  })

  it("should navigate to Competitions page", () => {
    cy.get('[data-testid="nav-competitions-link"]').click()
    cy.location("pathname").should("eq", "/competitions")
  })

  it("should navigate to Home page", () => {
    cy.get('[data-testid="nav-home-link"]').click()
    cy.location("pathname").should("eq", "/")
  })

  it("should navigate to Event Types page", () => {
    cy.get('[data-testid="nav-teams-link"]').click()
    cy.get('[data-testid="nav-event-types-link"]').click()
    cy.location("pathname").should("eq", "/event-types")
  })
})
