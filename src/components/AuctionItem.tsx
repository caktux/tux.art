
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Placeholder from 'react-bootstrap/Placeholder'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Tooltip from 'react-bootstrap/Tooltip'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import Address from './Address'
import { LazyImg } from './LazyImg'

import TokenAmount from 'token-amount'

import { fetchMetadata, loadToken } from '../fetchers/metadata'
import { timeRemaining, emptyToken } from '../utils/nfts'


export default function AuctionItem(props: any) {
  const { ipfs, ipfsHost } = useIPFS()
  const { provider } = useEthereum()
  const { account } = useWallet()

  const [ tick, setTick ] = useState(true)
  const [ error, setError ] = useState(false)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ focused, setFocused ] = useState('')
  const [ token, setToken ] = useState(emptyToken as any)

  const mounted = useRef(true)

  const updateToken = (token: any) => {
    if (!mounted.current)
      return
    setToken(token)
  }

  useEffect(() => {
    if (mounted.current && tick && loaded && props.auction.firstBidTime.gt(0) && props.auction.duration.gt(0)) {
      const countdown = timeRemaining(props.auction.firstBidTime.toNumber() + props.auction.duration.toNumber())
      setToken((token: any) => { return {...token, countdown: countdown} })
      const doTick = () => {
        if (mounted.current)
          setTick(true)
      }
      setTimeout(() => {
        doTick()
      }, 5000)
      setTick(false)
    }
  }, [tick, loaded, props.auction.firstBidTime, props.auction.duration])

  useEffect(() => {
    const fetchToken = async () => {
      if (!props.loaded && mounted.current) {
        setError(false)
        setLoaded(false)
        setFetched(false)
        updateToken(emptyToken)
        return
      }
      if (!provider || !props.tokenId || fetched || loaded || !mounted.current)
        return

      setFetched(true)

      const fetchedToken = await fetchMetadata(provider, ipfs, ipfsHost, props)

      if (!mounted.current)
        return

      if (!fetchedToken) {
        console.warn(`Whoopsied on ${props.tokenId}`)
        if (props.setFailed)
          props.setFailed()
        setLoaded(true)
        setError(true)
        return
      }

      updateToken(fetchedToken)

      const loadedToken = await loadToken(fetchedToken, ipfsHost)

      updateToken(loadedToken)

      setLoaded(true)
    }
    fetchToken()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Col className='mb-3'>
      <Card className='auctionCard'
            onTouchStart={(e) => { setFocused(!focused ? 'focused' : '') }}
            onTouchEnd={(e) => { setFocused(!focused ? 'focused' : '') }}>
        <div className={`previewImage grow ${focused}`}>
        { !error && token.props.previewSrc ? (
            token.props.isImagePreview ?
            <>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <LazyImg
                  className='card-img-top'
                  src={token.props.previewSrc}
                  alt={token.props.title}
                  isOwner={account === token.props.owner} />
              </Link>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <LazyImg
                  className='full'
                  src={token.props.previewSrc}
                  alt={token.props.title}
                  isOwner={account === token.props.owner} />
              </Link>
            </> :
            token.props.isVideoPreview ?
            <video autoPlay loop controls muted>
              <source src={ token.props.previewSrc }></source>
              Your browser does not support the video element
            </video> :
            token.props.isAudioPreview ?
            <audio controls>
              <source src={ token.props.previewSrc }></source>
              Your browser does not support audio element
            </audio> :
            token.props.is3D ?
            // <model-viewer src={ token.props.previewSrc }></model-viewer> :
            <Container className='link-alert'>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <Alert variant='info'>
                  3D assets not supported yet
                </Alert>
              </Link>
            </Container> :
            token.props.isText ?
            <Container className='link-alert'>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <Alert variant='info'>
                  Text files not supported yet
                </Alert>
              </Link>
            </Container> :
            <Container className='link-alert'>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <Alert variant='info'>
                  Unrecognized file format
                </Alert>
              </Link>
            </Container>
          ) :
          error ?
          <Container className='link-alert'>
            <Alert variant='info'>
              Loading failed
            </Alert>
          </Container> :
          <Container className='text-center'>
            <Spinner animation='grow' role='status' />
          </Container>
        }
        </div>
        <Card.Body>
        { token.props.title ?
          <Card.Title>
            <Link to={ `/nft/${props.address}/${props.tokenId}` }>
              { token.props.title }
            </Link>
          </Card.Title> :
          <Placeholder as={Card.Title} animation='wave'>
            <Placeholder xs={6} />
          </Placeholder> }
          <Row xs={1}>
            <Col xs={6}>
              { loaded ?
                <>
                  { props.auction.amount > 0 ?
                    <>
                      <span className='text-muted'>Highest bid</span>
                      <p className='lead'>
                        {
                          TokenAmount.format(props.auction.amount, 18, {
                            symbol: '??',
                            digits: 5,
                            commify: true
                          })
                        }
                        { account === props.auction.bidder &&
                          <OverlayTrigger
                            placement='right'
                            delay={{ show: 250, hide: 400 }}
                            overlay={
                              <Tooltip>
                                You're the current highest bidder!
                              </Tooltip>
                            }>
                            {({ ref, ...triggerHandler }) => (
                              <div ref={ref} {...triggerHandler} className='bidderTooltip rounded-circle' />
                            )}
                          </OverlayTrigger> }
                      </p>
                    </> :
                    <>
                      <span className='text-muted'>
                        { props.auction.reservePrice.gt(0) && props.auction.duration.eq(0) &&
                          'List price'
                        }
                        { props.auction.reservePrice.gt(0) && props.auction.duration.gt(0) &&
                          'Reserve price'
                        }
                      </span>
                      <p className='lead'>
                      { props.auction.reservePrice.gt(0) ?
                        TokenAmount.format(props.auction.reservePrice, 18, {
                          symbol: '??',
                          digits: 5,
                          commify: true
                        }) : '' }
                      </p>
                    </>
                  }
                </> :
                <>
                  <Placeholder xs={5} bg='light' />
                  <p className='lead'>
                    <Placeholder xs={2} bg='light' />
                  </p>
                </>
              }
            </Col>
            <Col xs={6} className='text-end'>
              <span className='text-muted'>
                { loaded && token.countdown && token.countdown.remaining > 0 ? 'Ending in' : '' }
                { loaded && token.countdown && token.countdown.remaining === 0 ? 'Auction ended' : '' }
              </span>
              <p className='lead'>
                { loaded && token.countdown && token.countdown.remaining > 0 ?
                  `${token.countdown.days ? token.countdown.days + 'd' : ''}
                   ${token.countdown.hours}h ${token.countdown.minutes}m ${token.countdown.seconds}s` : ''
                }
              </p>
            </Col>
          </Row>
        </Card.Body>
        { (token.props.creator || token.props.owner ) ?
          <Card.Footer className='text-muted'>
            { token.props.creator &&
              <Address address={token.props.creator} prefix={'Created by'} />
            }
            { !token.props.creator && token.props.createdBy }
            { !token.props.creator && token.props.owner &&
              <Address address={token.props.owner} prefix={'Owned by'} />
            }
          </Card.Footer> :
          <Placeholder as={Card.Footer} animation='wave'>
            <Placeholder xs={2} bg='light' />{' '}
            <Placeholder xs={1} bg='light' />{' '}
            <Placeholder xs={3} bg='light' />
          </Placeholder>
        }
      </Card>
    </Col>
  )
}
