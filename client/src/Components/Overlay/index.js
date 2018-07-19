import React from 'react'

export default class Overlay extends React.Component {
  handleClickOverlay = () => {
    this.props.updatePageSettings({showOverlay: false})
  } 

  render() {
    let { showOverlay } = this.props.pageSettings
      
    return (
      <div className="overlay" onClick={this.handleClickOverlay}>
      </div>
    )
  }
}
