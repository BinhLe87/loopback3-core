import React from 'react'
import LeftContent from '../LeftContent'

export default class WorkBook extends React.Component {
  render() {
    return (
      <div>
        <LeftContent {...this.props} />
      </div>
    )
  }
}
