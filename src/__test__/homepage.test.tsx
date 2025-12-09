import { expect, describe, it } from "vitest"
import { render, screen } from "@testing-library/react"
import Home from "../src/app/page"

describe("Home", () => {
  it("renders the logo image", () => {
    render(<Home />)
    const logo = screen.getByTestId("evolocity-logo")
    expect(logo).toBeDefined()
  })

  it("renders Teams button with icon", () => {
    render(<Home />)
    const teamsButton = screen.getAllByRole("button", { name: /Teams/i })[0]
    expect(teamsButton).toBeDefined()
    const teamsIcon = screen.getAllByAltText("Teams icon")[0]
    expect(teamsIcon).toBeDefined()
  })

  it("renders Competitions button with icon", () => {
    render(<Home />)
    const competitionsButton = screen.getAllByRole("button", { name: /Competitions/i })[0]
    expect(competitionsButton).toBeDefined()
    const competitionsIcon = screen.getAllByAltText("Teams icon")[1]
    expect(competitionsIcon).toBeDefined()
  })

  it("renders Event Types button", () => {
    render(<Home />)
    const buttons = screen.getAllByRole("button", { name: /Event Types/i })[0]
    expect(buttons).toBeDefined()
  })

  it("renders three navigation links", () => {
    render(<Home />)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(15) // 3 main links + 12 from the buttons
  })
})

// We recommend installing an extension to run vitest tests.
