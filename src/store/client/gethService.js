import { BigNumber } from 'bignumber.js'
import { Mist } from '../../API'
import {
  newBlock,
  updateSyncing,
  updatePeerCount,
  updateNetwork,
  updateSyncMode,
  gethStarting,
  gethStarted,
  gethConnected,
  gethDisconnected,
  gethStopping,
  gethStopped,
  gethError
} from './actions'

const { geth } = Mist

const isHex = str => typeof str === 'string' && str.startsWith('0x')
const hexToNumberString = str => new BigNumber(str).toString(10)
const toNumberString = str => (isHex(str) ? hexToNumberString(str) : str)

class GethService {
  setConfig(config) {
    geth.setConfig(config)
  }

  start(config, dispatch) {
    this.setConfig(config)
    geth.start()

    const newConfig = geth.getConfig()
    const { network, syncMode } = newConfig

    dispatch(updateNetwork({ network }))
    dispatch(updateSyncMode({ syncMode }))
    this.peerCountInterval = setInterval(
      () => this.updatePeerCount(dispatch),
      3000
    )
    this.createListeners(dispatch)
  }

  stop() {
    geth.stop()
    clearInterval(this.peerCountInterval)
    this.unsubscribeSyncingSubscription(this.syncingSubscriptionId)
    this.unsubscribeNewHeadsSubscription(this.newHeadsSubscriptionId)
    this.removeListeners()
    console.log('∆∆∆ done stop')
  }

  createListeners(dispatch) {
    geth.on('starting', () => this.onStarting(dispatch))
    geth.on('started', () => this.onStarted(dispatch))
    geth.on('connect', () => this.onConnect(dispatch))
    geth.on('stopping', () => this.onStopping(dispatch))
    geth.on('stopped', () => this.onStopped(dispatch))
    geth.on('disconnect', () => this.onDisconnect(dispatch))
    geth.on('error', e => this.onError(e, dispatch))
  }

  removeListeners() {
    geth.removeListener('starting', this.onStarting)
    geth.removeListener('started', this.onStarted)
    geth.removeListener('connect', this.onConnect)
    geth.removeListener('stopping', this.onStopping)
    geth.removeListener('stopped', this.onStopped)
    geth.removeListener('disconnect', this.onDisconnect)
    geth.removeListener('error', this.onError)
  }

  isRunning() {
    return geth.isRunning
  }

  getState() {
    return geth.state
  }

  onNewHeadsSubscriptionResult(result, dispatch) {
    const { result: subscriptionResult } = result
    if (!subscriptionResult) {
      return
    }
    const {
      number: hexBlockNumber,
      timestamp: hexTimestamp
    } = subscriptionResult
    const blockNumber = Number(toNumberString(hexBlockNumber))
    const timestamp = Number(toNumberString(hexTimestamp))
    dispatch(newBlock({ blockNumber, timestamp }))
  }

  onSyncingSubscriptionResult(result, dispatch) {
    if (result === false) {
      // Stopped syncing, begin newHeads subscription
      this.startNewHeadsSubscription(dispatch)
      // Unsubscribe from syncing subscription
      this.unsubscribeSyncingSubscription(this.syncingSubscriptionId)
      return
    }
    if (result === true) {
      // waiting for syncing data
      return
    }
    const { status } = result
    const {
      StartingBlock: startingBlock,
      CurrentBlock: currentBlock,
      HighestBlock: highestBlock,
      KnownStates: knownStates,
      PulledStates: pulledStates
    } = status

    dispatch(
      updateSyncing({
        startingBlock,
        currentBlock,
        highestBlock,
        knownStates,
        pulledStates
      })
    )
  }

  unsubscribeNewHeadsSubscription(/* subscriptionId */) {
    if (!this.newHeadsSubscriptionId) {
      return
    }
    geth.rpc('eth_unsubscribe', [this.newHeadsSubscriptionId])
    geth.removeListener(
      this.newHeadsSubscriptionId,
      this.onNewHeadsSubscriptionResult
    )
    this.newHeadsSubscriptionId = null
  }

  unsubscribeSyncingSubscription(/* subscriptionId */) {
    if (!this.syncingSubscriptionId) {
      return
    }

    geth.rpc('eth_unsubscribe', [this.syncingSubscriptionId])
    geth.removeListener(
      this.syncingSubscriptionId,
      this.onSyncingSubscriptionResult
    )
    this.syncingSubscriptionId = null
  }

  onStarting(dispatch) {
    dispatch(gethStarting())
  }

  onStarted(dispatch) {
    dispatch(gethStarted())
  }

  onConnect(dispatch) {
    dispatch(gethConnected())

    const startSubscriptions = async () => {
      const result = await geth.rpc('eth_syncing')
      if (result === false) {
        // Not syncing, start newHeads subscription
        this.startNewHeadsSubscription(dispatch)
      } else {
        // Subscribe to syncing
        this.startSyncingSubscription(dispatch)
      }
    }
    const setLastBlock = () => {
      geth.rpc('eth_getBlockByNumber', ['latest', false]).then(block => {
        const { number: hexBlockNumber, timestamp: hexTimestamp } = block
        const blockNumber = Number(toNumberString(hexBlockNumber))
        const timestamp = Number(toNumberString(hexTimestamp))
        dispatch(newBlock({ blockNumber, timestamp }))
      })
    }
    setTimeout(() => {
      setLastBlock()
      startSubscriptions()
    }, 2000)
  }

  onDisconnect(dispatch) {
    dispatch(gethDisconnected())
  }

  onStopping(dispatch) {
    dispatch(gethStopping())
  }

  onStopped(dispatch) {
    dispatch(gethStopped())
  }

  onError(error, dispatch) {
    dispatch(gethError({ error }))
  }

  async startNewHeadsSubscription(dispatch) {
    geth.rpc('eth_subscribe', ['newHeads']).then(subscriptionId => {
      this.newHeadsSubscriptionId = subscriptionId
      geth.on(subscriptionId, result =>
        this.onNewHeadsSubscriptionResult(result, dispatch)
      )
    })
  }

  async startSyncingSubscription(dispatch) {
    const subscriptionId = await geth.rpc('eth_subscribe', ['syncing'])
    this.syncingSubscriptionId = subscriptionId
    geth.on(subscriptionId, result =>
      this.onSyncingSubscriptionResult(result, dispatch)
    )
  }

  async updatePeerCount(dispatch) {
    const hexPeerCount = await geth.rpc('net_peerCount')
    const peerCount = toNumberString(hexPeerCount)
    dispatch(updatePeerCount({ peerCount }))
  }

  getNetworkStats() {
    const newConfig = geth.getConfig()
    return newConfig
  }
}

export default new GethService()
