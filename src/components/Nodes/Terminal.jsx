import React, { Component } from 'react'
import { Mist } from '../../API'

const { geth } = Mist

export default class Terminal extends Component {
  state = {
    logs: []
  }

  constructor(props) {
    super(props)
    this.terminalScrollViewRef = React.createRef()
  }

  componentDidMount = async () => {
    this.subscribeLogs()
  }

  componentDidUpdate = () => {
    this.terminalScrollToBottom()
  }

  componentWillUnmount() {
    this.unsubscribeLogs()
  }

  addNewLog = async newLog => {
    const { logs } = this.state
    this.setState({
      logs: [...logs, newLog]
    })
  }

  subscribeLogs = () => {
    geth.on('log', this.addNewLog)
  }

  unsubscribeLogs = () => {
    geth.removeListener('log', this.addNewLog)
  }

  terminalScrollToBottom = () => {
    const scrollView = this.terminalScrollViewRef.current
    if (!scrollView) {
      return
    }
    const { scrollHeight } = scrollView
    scrollView.scrollTo({
      top: scrollHeight,
      behavior: 'smooth'
    })
  }

  render() {
    const { logs } = this.state

    return (
      <div key="terminalContainer">
        <div
          key="terminalWrapper"
          ref={this.terminalScrollViewRef}
          style={{
            fontFamily:
              'Lucida Console, Lucida Sans Typewriter, monaco, Bitstream Vera Sans Mono, monospace',
            fontSize: '11px',
            background: '#111',
            color: '#eee',
            maxHeight: 350,
            maxWidth: 680,
            overflowY: 'scroll',
            whiteSpace: 'nowrap',
            padding: 10
          }}
        >
          {logs.map((l, index) => (
            <div key={index}> &gt; {l}</div>
          ))}
        </div>
      </div>
    )
  }
}
