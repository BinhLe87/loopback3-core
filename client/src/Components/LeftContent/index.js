import React from 'react'
import FontIcon from 'material-ui/FontIcon'
import Chapter from './Chapter'

export default class LeftContent extends React.Component {
  state = {
    showAddActions: false
  }

  toggleActions = () => {
    this.setState({showAddActions: !this.state.showAddActions})
  }

  render() {
    let pages1 = [
      {id: 1, title: 'Page One'},
      {id: 2, title: 'Page Two'},
      {id: 3, title: 'Page Three'}
    ]
    let pages2 = [
      {id: 4, title: 'Page One'},
      {id: 5, title: 'Page Two'},
      {id: 6, title: 'Page Three'}
    ]
    let pages3 = [
      {id: 7, title: 'Page One'},
      {id: 8, title: 'Page Two'},
      {id: 9, title: 'Page Three'}
    ]

    return (
      <section className="left-content-wrapper">
        <h2>Workbook One</h2>
        <div className="left-content-inner">
          <Chapter {...this.props.pageSettings} title="Chapter One" pages={pages1} updatePageSettings={this.props.updatePageSettings} />
          <Chapter {...this.props.pageSettings} title="Chapter Two" pages={pages2} updatePageSettings={this.props.updatePageSettings} />
          <Chapter {...this.props.pageSettings} title="Chapter Three" pages={pages3} updatePageSettings={this.props.updatePageSettings} />
        </div>
        <div className="add-action-wrapper">
          <FontIcon className="material-icons add-icon" onClick={this.toggleActions}>add_circle</FontIcon>
          {this.state.showAddActions &&
            <div className="actions">
              <p>Add Chapter</p>
              <p>Add Page</p>
            </div>
          }
        </div>
      </section>
    )
  }
}
