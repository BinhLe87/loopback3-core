import React from 'react'
import { NavLink } from 'react-router-dom'

export default class LeftNavigation extends React.Component {
  render() {
    return (
      <nav className="left-nav">
        <ul className="links">
          <li>
            <NavLink exact to="/" activeClassName="active"></NavLink>
          </li>
          <li>
            <NavLink exact to="/workbook" activeClassName="active"></NavLink>
          </li>
          <li>
            <NavLink exact to="/automation" activeClassName="active"></NavLink>
          </li>
          <li>
            <NavLink exact to="/analytics" activeClassName="active"></NavLink>
          </li>
        </ul>
      </nav>
    )
  }
}
