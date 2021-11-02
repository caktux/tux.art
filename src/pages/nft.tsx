
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'
import { useWallet } from 'use-wallet'

import { useParams, Link } from 'react-router-dom'

import { FullScreen, useFullScreenHandle } from 'react-full-screen'

import Placeholder from 'react-bootstrap/Placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { LazyImg } from '../components/LazyImg'
// import { useGLTF } from "@react-three/drei"

import { UpdateReservePriceModal } from '../components/modals/UpdateReservePriceModal'
import { CreateAuctionModal } from '../components/modals/CreateAuctionModal'
import { CancelAuctionModal } from '../components/modals/CancelAuctionModal'
import { CancelFeatureModal } from '../components/modals/CancelFeatureModal'
import { AcceptOfferModal } from '../components/modals/AcceptOfferModal'
import { CancelOfferModal } from '../components/modals/CancelOfferModal'
import { MakeOfferModal } from '../components/modals/MakeOfferModal'
import { PlaceBidModal } from '../components/modals/PlaceBidModal'
import { FinalizeModal } from '../components/modals/FinalizeModal'
import { TransferModal } from '../components/modals/TransferModal'
import { ApproveModal } from '../components/modals/ApproveModal'
import { FeatureModal } from '../components/modals/FeatureModal'
import { BurnModal } from '../components/modals/BurnModal'

import { ethers, BigNumber } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'
import TokenAmount from 'token-amount'

import { timeRemaining, emptyToken, emptyAuction } from '../utils/nfts'
import { fetchMetadata, loadToken } from '../fetchers/metadata'
import { getHouse } from '../fetchers/houses'
import { getAuctionBids } from '../fetchers/bids'
import { getTokenOffers } from '../fetchers/offers'
import { getTokenContract } from '../fetchers/contracts'
import { getFeaturedContains } from '../fetchers/featured'
import { getTokenAuction, getPreviousAuctions } from '../fetchers/auctions'

// const Model = (props) => {
//   const { scene, animations } = useGLTF(props.src)
//   const { actions } = useAnimations(animations, scene)
//   return (
//     <primitive object={scene}/ >
//   )
// }

export default function FullNFT(props: any) {
  const { account } = useWallet()
  const { provider } = useEthereum()
  const { ipfs, ipfsHost } = useIPFS()

  const params = useParams<any>()

  const [ error, setError ] = useState('')
  const [ tick, setTick ] = useState(true)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ house, setHouse ] = useState({} as any)
  const [ duration, setDuration ] = useState('')
  const [ auction, setAuction ] = useState(emptyAuction as any)
  const [ token, setToken ] = useState(emptyToken as any)
  const [ bids, setBids ] = useState([] as any)
  const [ offers, setOffers ] = useState([] as any)
  const [ previousAuctions, setPreviousAuctions ] = useState([] as any)
  const [ watchingBids, setWatchingBids ] = useState(false)
  const [ isAuction, setIsAuction ] = useState(true)
  const [ featured, setFeatured ] = useState(false)
  const [ fetchedFeatured, setFetchedFeatured ] = useState(false)
  const [ contract, setContract ] = useState({name: '', tokenContract: ''})
  const [ fetchedContract, setFetchedContract ] = useState(false)

  const [ showUpdateReservePrice, setShowUpdateReservePrice ] = useState(false)
  const [ showCreateAuction, setShowCreateAuction ] = useState(false)
  const [ showCancelAuction, setShowCancelAuction ] = useState(false)
  const [ showAcceptOffer, setShowAcceptOffer ] = useState(false as any)
  const [ showCancelOffer, setShowCancelOffer ] = useState(false as any)
  const [ showMakeOffer, setShowMakeOffer ] = useState(false)
  const [ showCreateBid, setShowCreateBid ] = useState(false)
  const [ showFinalize, setShowFinalize ] = useState(false)
  const [ showTransfer, setShowTransfer ] = useState(false)
  const [ showApprove, setShowApprove ] = useState(false)
  const [ showFeature, setShowFeature ] = useState(false)
  const [ showCancelFeature, setShowCancelFeature ] = useState(false)
  const [ showBurn, setShowBurn ] = useState(false)

  const handleFullscreen = useFullScreenHandle()

  const handleShowUpdateReservePrice = () => setShowUpdateReservePrice(true)
  const handleCloseUpdateReservePrice = () => setShowUpdateReservePrice(false)

  const handleShowCreateAuction = () => setShowCreateAuction(true)
  const handleCloseCreateAuction = () => setShowCreateAuction(false)

  const handleShowCancelAuction = () => setShowCancelAuction(true)
  const handleCloseCancelAuction = () => setShowCancelAuction(false)

  const handleShowAcceptOffer = (offer: any) => setShowAcceptOffer(offer)
  const handleCloseAcceptOffer = () => setShowAcceptOffer(false)

  const handleShowCancelOffer = (offer: any) => setShowCancelOffer(offer)
  const handleCloseCancelOffer = () => setShowCancelOffer(false)

  const handleShowMakeOffer = () => setShowMakeOffer(true)
  const handleCloseMakeOffer = () => setShowMakeOffer(false)

  const handleShowCreateBid = () => setShowCreateBid(true)
  const handleCloseCreateBid = () => setShowCreateBid(false)

  const handleShowFinalize = () => setShowFinalize(true)
  const handleCloseFinalize = () => setShowFinalize(false)

  const handleShowTransfer = () => setShowTransfer(true)
  const handleCloseTransfer = () => setShowTransfer(false)

  const handleShowApprove = () => setShowApprove(true)
  const handleCloseApprove = () => setShowApprove(false)

  const handleShowFeature = () => setShowFeature(true)
  const handleCloseFeature = () => setShowFeature(false)

  const handleShowCancelFeature = (auction: any) => setShowCancelFeature(auction)
  const handleCloseCancelFeature = () => setShowCancelFeature(false)

  const handleShowBurn = () => setShowBurn(true)
  const handleCloseBurn = () => setShowBurn(false)

  const mounted = useRef(true)


  const updateToken = (token: any) => {
    if (!mounted.current)
      return

    setToken(token)
  }

  const updateAuction = (auction: any) => {
    if (!mounted.current || !auction)
      return

    setAuction(auction)

    const isAuction = !auction.tokenId || (auction.duration && auction.duration.gt(0))
    setIsAuction(isAuction)

    const days = Math.floor(auction.duration.toNumber() / 86400)
    const hours = Math.floor(auction.duration.toNumber() / 3600)
    const duration = days > 1 ? `${days} day${hours % 24 > 0 ? ` ${hours % 24} hour` : ''}` : `${hours} hour`
    setDuration(isAuction && duration)

    if (auction.houseId.isZero())
      return

    const fetchHouse = async () => {
      const house = await getHouse(provider, auction.houseId.toString())
      if (house.name && mounted.current)
        setHouse(house)
    }
    fetchHouse()
  }

  const updateBids = (bids: any) => {
    if (!mounted.current)
      return
    setBids(bids)
  }

  const updatePreviousAuctions = (bids: any) => {
    if (!mounted.current)
      return
    setPreviousAuctions(bids)
  }

  const updateOffers = (offers: any) => {
    if (!mounted.current)
      return
    setOffers(offers)
  }

  useEffect(() => {
    if (mounted.current && tick && loaded && auction.firstBidTime.gt(0) && auction.duration.gt(0)) {
      const countdown = timeRemaining(auction.firstBidTime.toNumber() + auction.duration.toNumber())
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
  }, [tick, loaded, auction.firstBidTime, auction.duration])

  useEffect(() => {
    if (watchingBids || !auction || !auction.id || !mounted.current)
      return
    setWatchingBids(true)

    const contract = new ethers.Contract(AUCTIONS, Auctions, provider)
    contract.on(contract.filters.AuctionBid(
      BigNumber.from(auction.id),
      null,
      null,
      null,
      null
    ), () => {
      if (!mounted.current)
        return
      setFetched(false)
      setLoaded(false)
    })
  }, [watchingBids, props, auction, params, provider])

  useEffect(() => {
    const fetchToken = async () => {
      if (!provider || !params.tokenId || fetched || loaded || !mounted.current)
        return

      setFetched(true)

      const fetchedToken = await fetchMetadata(provider, ipfs, ipfsHost, props, params)

      if (!mounted.current)
        return

      if (!fetchedToken) {
        console.warn(`Whoopsied on ${params.tokenId}`)
        setError('Looks like this NFT was burned, or something else went wrong...')
        return
      }

      updateToken(fetchedToken)

      const auction = await getTokenAuction(provider, params)
      updateAuction(auction)

      const loadedToken = await loadToken(fetchedToken, ipfsHost)
      updateToken(loadedToken)

      let bids = []
      if (auction)
        bids = await getAuctionBids(provider, auction.id)
      if (bids)
        updateBids(bids)

      const previousAuctions = await getPreviousAuctions(provider, params)
      if (previousAuctions)
        updatePreviousAuctions(previousAuctions)

      const tokenOffers = await getTokenOffers(provider, params)
      if (tokenOffers)
        updateOffers(tokenOffers)

      if (!mounted.current)
        return

      setLoaded(true)
    }
    fetchToken()
  })

  useEffect(() => {
    const fetchContract = async () => {
      if (fetchedContract || !params.contract)
        return
      setFetchedContract(true)

      const contract = await getTokenContract(provider, params.contract)

      if (!mounted.current)
        return

      setContract(contract)
    }
    fetchContract()
  })

  useEffect(() => {
    const fetchFeatured = async () => {
      if (fetchedFeatured || !loaded || !auction || !auction.id || !mounted.current)
        return
      setFetchedFeatured(true)

      const contains = await getFeaturedContains(provider, auction.id)

      if (!mounted.current)
        return

      setFeatured(contains)
    }
    fetchFeatured()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid className='fullCard'>
      { error &&
        <Alert variant='danger' className='text-center' onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      }
      <Row xs={1} lg={2}>
        <Col xl={8}>
          <Card>
            <div className='fullImage'>
            { token.props.src ? (
                token.props.isVideo ?
                  <video autoPlay loop muted controls>
                    <source src={ token.props.src } type='video/mp4'></source>
                  </video> :
                token.props.is3D ?
                  // <model-viewer src={ token.props.src }></model-viewer> :
                  // <Model src={ token.props.src } />
                  <Container>
                    <Alert variant='info'>
                      3D assets not supported yet
                    </Alert>
                  </Container> :
                token.props.isAudio ?
                  <audio controls>
                    <source src={ token.props.src }></source>
                    Your browser does not support audio element
                  </audio> :
                token.props.isImage ?
                  <FullScreen handle={handleFullscreen}>
                    <LazyImg
                      className='card-img-top'
                      src={ token.props.src }
                      alt={ token.props.title }
                      fullscreen={handleFullscreen} />
                  </FullScreen> :
                token.props.isText ?
                  <Container className='link-alert'>
                    <Alert variant='info'>
                      Text files not supported yet
                    </Alert>
                  </Container> :
                <Container className='link-alert'>
                  <Alert variant='info'>
                    Unrecognized file format
                  </Alert>
                </Container>
              ) :
              <Container className='text-center'>
                <Spinner animation='grow' role='status' />
              </Container>
            }
            </div>
            <Card.Body>
              { token.props.title ?
                <Card.Title className='mt-2 mb-4'>{ token.props.title }</Card.Title> :
                <Placeholder as={Card.Title} animation='wave' className='mt-3 mb-5'>
                  <Placeholder xs={8} />
                </Placeholder> }
              { token.props.title ?
                <Card.Text className='lead text-muted mb-3'>{ token.props.description }</Card.Text> :
                <Placeholder as={Card.Text} animation='wave' className='mb-3'>
                  <Placeholder xs={5} bg='dark' />{' '}
                  <Placeholder xs={4} bg='dark' />{' '}
                  <Placeholder xs={8} bg='dark' />
                </Placeholder>
              }
            </Card.Body>
            { token.props.createdBy ?
              <Card.Footer className='text-muted'>
                <Row xs={2}>
                  <Col>
                  { token.props.creator ?
                    <Link to={ `/address/${token.props.creator}` }>
                      { token.props.createdBy }
                    </Link> :
                    token.props.createdBy
                  }
                  </Col>
                  <Col className='text-end'>
                  { token.props.owner !== AUCTIONS ?
                    <Link to={ `/address/${token.props.owner}` }>
                      Owned by { token.props.ownedBy }
                    </Link> : ( auction.tokenOwner ?
                    <Link to={ `/address/${auction.tokenOwner}` }>
                      Owned by { auction.ownedBy }
                    </Link> : '')
                  }
                  </Col>
                </Row>
              </Card.Footer> :
              <Placeholder as={Card.Footer} animation='wave'>
                <Placeholder xs={3} bg='light' />{' '}
                <Placeholder xs={1} bg='light' />{' '}
                <Placeholder xs={4} bg='light' />
              </Placeholder>
            }
          </Card>
        </Col>

        <Col xl={4}>
          <Card>
            <Card.Header>
              <Row>
                <Col>
                  { isAuction ?
                    'Auction' :
                    'Listing' }
                  { house.name ?
                    <>
                      {' '}-{' '}
                      <Link to={`/house/${auction.houseId}`}>
                        {house.name}
                      </Link>
                    </> : '' }
                </Col>
                { contract.name && contract.name !== 'Tux' &&
                  <Col className='text-end'>
                    <Link to={`/contract/${contract.tokenContract}`}>
                      {contract.name}
                    </Link>
                  </Col> }
              </Row>
            </Card.Header>

            <Card.Body>
              { token.props.src && !token.onIPFS &&
                <Alert variant='warning' className='text-center'>
                  This NFT does not seem to be hosted on IPFS.
                </Alert>
              }
              <Card.Title>
                <Row xs={2}>
                  <Col>
                    { auction.amount.gt(0) ?
                      <>
                        <span className='text-muted'>
                          { isAuction ?
                            'Highest bid' :
                            'Bought for' }
                        </span>
                        <p className='lead'>
                          {
                            TokenAmount.format(auction.amount, 18, {
                              symbol: 'Ξ',
                              digits: 5,
                              commify: true
                            })
                          }
                        </p>
                      </> :
                      <>
                        <span className='text-muted'>
                          { auction.approved && auction.reservePrice.eq(0) &&
                            'Not listed yet'
                          }
                          { auction.reservePrice.gt(0) && auction.duration.eq(0) &&
                            'List price'
                          }
                          { auction.reservePrice.gt(0) && auction.duration.gt(0) &&
                            'Reserve price'
                          }
                        </span>
                        <p className='lead'>
                        {
                          auction.reservePrice > 0 ?
                          TokenAmount.format(auction.reservePrice, 18, {
                            symbol: 'Ξ',
                            digits: 5,
                            commify: true
                          }) : ''
                        }
                        </p>
                      </>
                    }
                  </Col>
                  <Col className='text-end'>
                    <span className='text-muted'>
                      { (loaded && isAuction && auction.approved && token.countdown && token.countdown.remaining > 0) ?
                        'Ending in' : '' }
                      { (loaded && isAuction && auction.approved && token.countdown && token.countdown.remaining <= 0) ?
                        'Auction ended' : '' }
                      { (loaded && isAuction && auction.approved && auction.reservePrice.gt(0) && !token.countdown) ?
                        `A ${duration} auction will start once the first bid is made` : '' }
                      { (loaded && auction && !auction.approved && auction.reservePrice && auction.reservePrice.gt(0)) ?
                        'Waiting for approval' : ''}
                    </span>
                    <p className='lead'>
                      { loaded && isAuction && auction.approved && token.countdown && token.countdown.remaining > 0 &&
                        `${token.countdown.days ? token.countdown.days + 'd' : ''}
                         ${token.countdown.hours}h ${token.countdown.minutes}m ${token.countdown.seconds}s`
                      }
                    </p>
                  </Col>
                </Row>
              </Card.Title>
              <div className='d-grid gap-2'>
                { loaded && account &&
                  account !== auction.tokenOwner &&
                  account !== auction.bidder &&
                  ((token.countdown && token.countdown.remaining > 10) || auction.bidder === ethers.constants.AddressZero) &&
                  auction.reservePrice && auction.reservePrice.gt(0) &&
                  auction.approved ?
                  <Button
                    size='lg'
                    variant={token.countdown && token.countdown.remaining < 300000 ? 'danger' : 'primary'}
                    onClick={handleShowCreateBid}>
                  { auction.reservePrice.gt(0) && auction.duration.eq(0) ?
                    'Buy now' : 'Place bid'
                  }
                  </Button> : '' }
                { loaded && account && auction.reservePrice &&  auction.reservePrice.eq(0) && account !== token.props.owner ?
                  <Button size='lg' onClick={handleShowMakeOffer}>
                    Make an offer
                  </Button> : '' }
                { loaded && account && account === auction.bidder && auction.duration.gt(0) &&
                  token.countdown && token.countdown.remaining > 0 &&
                  <Alert variant='success'>
                    You're the current highest bidder!
                  </Alert> }
                { loaded && account &&
                  ((token.countdown && token.countdown.remaining > 900000) || auction.bidder === ethers.constants.AddressZero) &&
                  account === auction.tokenOwner && fetchedFeatured && !featured &&
                  <Button size='lg' variant='success' onClick={handleShowFeature}>
                    Feature auction
                  </Button> }
                { loaded && account &&
                  ((token.countdown && token.countdown.remaining > 900000) || auction.bidder === ethers.constants.AddressZero) &&
                  account === auction.tokenOwner && fetchedFeatured && featured &&
                  <Button size='lg' variant='danger' onClick={() => { handleShowCancelFeature(auction) } }>
                    Cancel feature
                  </Button> }
                { loaded && account && token.countdown && token.countdown.remaining === 0 &&
                  auction.bidder !== ethers.constants.AddressZero &&
                  (account === auction.bidder || account === auction.tokenOwner || account === house.curator) &&
                  <Button size='lg' variant='success' onClick={handleShowFinalize}>
                    Finalize auction
                  </Button> }
                { loaded && account === auction.tokenOwner && auction.bidder === ethers.constants.AddressZero &&
                  auction.reservePrice && auction.reservePrice.gt(0) &&
                  <div className='d-grid gap-2'>
                    <Row xs={1} xl={2}>
                      <Col>
                        <div className='d-grid'>
                          <Button onClick={handleShowUpdateReservePrice}>
                            Update price
                          </Button>
                        </div>
                      </Col>
                      <Col>
                        <div className='d-grid'>
                          <Button variant='danger' onClick={handleShowCancelAuction}>
                            Cancel auction
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                }
              </div>
            </Card.Body>

            { loaded && auction.created.toNumber() > 0 &&
              <Card.Footer className='text-muted text-end'>
                Listed on { new Date(auction.created.toNumber() * 1000).toLocaleString() }{' '}
                for {
                  TokenAmount.format(auction.reservePrice, 18, {
                    symbol: 'Ξ',
                    digits: 5,
                    commify: true
                  })
                }
                { auction.tokenOwner ?
                <Link to={ `/address/${auction.tokenOwner}` }>
                  {' '} by { auction.ownedBy }
                </Link> : '' }
              </Card.Footer>
            }

            { loaded && account === token.props.owner && auction.reservePrice && auction.reservePrice.eq(0) &&
              <Card.Footer>
                <div className='d-grid gap-2'>
                  <Button size='lg' onClick={handleShowCreateAuction}>Start auction</Button>
                  <Row xs={1} xl={2}>
                    <Col>
                      <div className='d-grid'>
                        <Button onClick={handleShowTransfer}>Transfer</Button>
                      </div>
                    </Col>
                    <Col>
                      <div className='d-grid'>
                        <Button variant='danger' onClick={handleShowBurn}>Burn</Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Footer>
            }

            { loaded && account === house.curator && account !== auction.tokenOwner && !token.countdown &&
              auction.tokenOwner !== ethers.constants.AddressZero &&
              auction.reservePrice && auction.reservePrice.gt(0) &&
              <Card.Footer>
                <div className='d-grid gap-2'>
                  <Button size='lg' variant={ !auction.approved ? 'success' : 'danger' } onClick={handleShowApprove}>
                    { !auction.approved ? 'Approve auction' : 'Revoke approval' }
                  </Button>
                </div>
              </Card.Footer>
            }

            <Card.Footer>
              <p className='lead'>
                { loaded && isAuction && auction.approved && bids.length > 0 && 'Last bids' }
                { loaded && isAuction && auction.approved && bids.length === 0 && 'No bids yet' }
                { loaded && !isAuction && bids.length > 0 && 'Bought by' }
              </p>
              <ListGroup>
              {
                bids.map((bid:any, index: number) => {
                  return (
                    <ListGroup.Item key={`bid-${index}`}>
                      <Row>
                        <Col xs={3} className='text-muted'>
                          <Link to={`/address/${bid.bidder}`}>
                            { bid.shortAddress }
                          </Link>
                        </Col>
                        <Col xs={6} className='text-muted'>
                          { new Date(bid.timestamp.toNumber() * 1000).toLocaleString() }
                        </Col>
                        <Col xs={3} className='text-end'>
                          { TokenAmount.format(bid.value, 18, {
                              symbol: 'Ξ',
                              digits: 5,
                              commify: true
                            })
                          }
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )
                })
              }
              </ListGroup>
            </Card.Footer>

            { previousAuctions.length > 0 &&
              <Card.Footer>
                <p className='lead'>Previous auctions</p>
                <ListGroup>
                {
                  previousAuctions.map((auction:any, index: number) => {
                    return (
                      <ListGroup.Item key={`auction-${index}`}>
                        <Row>
                          <Col xs={3} className='text-muted'>
                            { auction.approved && auction.amount.gt(0) ?
                              <Link to={`/address/${auction.bidder}`}>
                                { auction.wonBy }
                              </Link> :
                              <Link to={`/address/${auction.tokenOwner}`}>
                                { auction.ownedBy }
                              </Link>
                            }
                          </Col>
                          <Col xs={5} className='text-muted'>
                            { new Date(auction.created.toNumber() * 1000).toLocaleString() }
                          </Col>
                          <Col xs={4} className='text-end text-muted'>
                            { !auction.approved || auction.amount.eq(0) ?
                              <>
                                Cancelled @{' '}
                                { TokenAmount.format(auction.reservePrice, 18, {
                                    symbol: 'Ξ',
                                    digits: 5,
                                    commify: true
                                  })
                                }
                              </> :
                              TokenAmount.format(auction.amount, 18, {
                                symbol: 'Ξ',
                                digits: 5,
                                commify: true
                              })
                            }
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )
                  })
                }
                </ListGroup>
              </Card.Footer>
            }

            { offers.length > 0 &&
              <Card.Footer>
                <p className='lead'>Offers</p>
                <ListGroup>
                {
                  offers.map((offer:any, index: number) => {
                    return (
                      <ListGroup.Item key={`auction-${index}`}>
                        <Row className='vertical-align' xs={1} md={2} lg={4}>
                          <Col xs={3} className='text-muted'>
                            { offer.amount.gt(0) &&
                              <Link to={`/address/${offer.from}`}>
                                { offer.shortFrom }
                              </Link>
                            }
                          </Col>
                          <Col xs={5} className='text-muted'>
                            { new Date(offer.timestamp.toNumber() * 1000).toLocaleString() }
                          </Col>
                          <Col xs={2} className='text-center text-muted'>
                            { TokenAmount.format(offer.amount, 18, {
                                symbol: 'Ξ',
                                digits: 5,
                                commify: true
                              })
                            }
                          </Col>
                          <Col xs={2} className='text-end text-muted'>
                            { offer.from === account &&
                              <Button
                                size='sm'
                                variant='danger'
                                onClick={() => { handleShowCancelOffer(offer) }}>
                                Cancel
                              </Button>
                            }
                            { offer.from !== account && account === token.props.owner &&
                              <Button
                                size='sm'
                                variant='success'
                                onClick={() => { handleShowAcceptOffer(offer) }}>
                                Accept
                              </Button>
                            }
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )
                  })
                }
                </ListGroup>
              </Card.Footer>
            }
          </Card>
        </Col>
      </Row>

      <UpdateReservePriceModal
        show={showUpdateReservePrice}
        handleClose={handleCloseUpdateReservePrice}
        auction={auction}
        setFetched={setFetched}
        setLoaded={setLoaded} />

      <CreateAuctionModal
        show={showCreateAuction}
        handleClose={handleCloseCreateAuction}
        auction={auction}
        setFetched={setFetched}
        setLoaded={setLoaded}
        tokenContract={params.contract}
        tokenId={params.tokenId}
        tokenOwner={token.props.owner} />

      <CancelAuctionModal
        show={showCancelAuction}
        handleClose={handleCloseCancelAuction}
        auction={auction}
        setFetched={setFetched}
        setLoaded={setLoaded} />

      <AcceptOfferModal
        show={showAcceptOffer ? true : false}
        handleClose={handleCloseAcceptOffer}
        offer={showAcceptOffer}
        token={token}
        setFetched={setFetched}
        setLoaded={setLoaded}
        tokenContract={params.contract}
        tokenId={params.tokenId} />

      <CancelOfferModal
        show={showCancelOffer ? true : false}
        handleClose={handleCloseCancelOffer}
        offer={showCancelOffer}
        setFetched={setFetched}
        setLoaded={setLoaded} />

      <MakeOfferModal
        show={showMakeOffer}
        handleClose={handleCloseMakeOffer}
        setFetched={setFetched}
        setLoaded={setLoaded}
        tokenContract={params.contract}
        tokenId={params.tokenId}
        tokenOwner={token.props.owner} />

      <PlaceBidModal
        show={showCreateBid}
        handleClose={handleCloseCreateBid}
        auction={auction}
        isAuction={isAuction}
        setFetched={setFetched}
        setLoaded={setLoaded}
        tokenContract={params.contract}
        tokenId={params.tokenId}
        tokenOwner={token.props.owner} />

      <FinalizeModal
        show={showFinalize}
        handleClose={handleCloseFinalize}
        auction={auction}
        isAuction={isAuction}
        token={token}
        setFetched={setFetched}
        setLoaded={setLoaded} />

      <TransferModal
        show={showTransfer}
        handleClose={handleCloseTransfer}
        token={token}
        setFetched={setFetched}
        setLoaded={setLoaded} />

      <ApproveModal
        show={showApprove}
        handleClose={handleCloseApprove}
        auction={auction}
        token={token}
        setFetched={setFetched}
        setLoaded={setLoaded} />

      <FeatureModal
        show={showFeature}
        handleClose={handleCloseFeature}
        auction={auction}
        isAuction={isAuction}
        setFetched={setFetched}
        setLoaded={setFetchedFeatured}
        tokenContract={params.contract}
        tokenId={params.tokenId}
        tokenOwner={token.props.owner} />

      <CancelFeatureModal
        show={showCancelFeature ? true : false}
        handleClose={handleCloseCancelFeature}
        auction={showCancelFeature}
        setFetched={setFetched}
        setLoaded={setFetchedFeatured} />

      <BurnModal
        show={showBurn}
        handleClose={handleCloseBurn}
        token={token}
        setFetched={setFetched}
        setLoaded={setLoaded} />
    </Container>
  )
}
