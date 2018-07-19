import React from 'react'
import FontIcon from 'material-ui/FontIcon'
import { classnames } from '../../utils'

export default class Chapter extends React.Component {
  state =  {
    showChapter: false,
    showPageActions: false
  }

  handleClickChapter = () => {
    this.setState({showChapter: !this.state.showChapter})
    this.props.updatePageSettings({activePageId: 0})
  }

  handleClickPage(pageId) {
    this.props.updatePageSettings({activePageId: pageId})
  }

  openPageActionsPopup = () => {
    this.setState({showPageActions: true})
  }

  handleClickPageAction = () => {
    this.setState({showPageActions: false})
  }

  render() {
    let { title, pages, activePageId } = this.props

    return (
      <div className={classnames("chapter-wrapper", {hide: !this.state.showChapter})}>
        <div className="chapter-title" onClick={this.handleClickChapter}>
          <FontIcon className="material-icons chapter-icon">menu</FontIcon>
          <h3>{title}</h3>
          <FontIcon className="material-icons arrow">keyboard_arrow_down</FontIcon>
        </div>
        <ul className="page-list">
          {pages.map((page, index) => 
            <li 
              key={index}
              className={classnames({active: page.id === activePageId})}
              onClick={this.handleClickPage.bind(this, page.id)}
            >
              <span>{page.title}</span>
              <FontIcon className="material-icons more" onClick={this.openPageActionsPopup}>more_horiz</FontIcon>
              {page.id === activePageId && this.state.showPageActions &&
                <div className="page-actions">
                  <p onClick={this.handleClickPageAction}>Edit</p>
                  <p onClick={this.handleClickPageAction}>Move</p>
                  <p onClick={this.handleClickPageAction}>Duplicate</p>
                  <p onClick={this.handleClickPageAction}>Delete</p>
                </div>
              }
            </li>
          )}
        </ul>
      </div>
    )
  }
}
