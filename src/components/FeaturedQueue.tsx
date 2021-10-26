
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import AuctionItemName from './AuctionItemName'
import { CancelFeatureModal } from '../components/modals/CancelFeatureModal'

import TokenAmount from 'token-amount'

import { ethers } from 'ethers'
import {
  getFeatured,
  getFeaturedQueue,
  getNextFeaturedTime
} from '../fetchers/featured'


export const FeaturedQueue = (props: any) => {
  const { provider } = useEthereum()
  const { account } = useWallet()

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ fetchedTime, setFetchedTime ] = useState(false)
  const [ fetchedFeatured, setFetchedFeatured ] = useState(false)
  const [ featured, setFeatured ] = useState({ tokenId: '', tokenContract: '' })
  const [ nextFeaturedTime, setNextFeaturedTime ] = useState(1)
  const [ auctions, setAuctions ] = useState([])
  const [ showCancel, setShowCancel ] = useState(false as any)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)

  const mounted = useRef(true)


  const handleShowCancel = (auction: any) => setShowCancel(auction)
  const handleCloseCancel = () => setShowCancel(false)

  const updateAuctions = (auctions: any, total: number) => {
    if (!mounted.current)
      return

    setAuctions(auctions)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset <= props.limit)
      setBackDisabled(true)
    if (forwardDisabled && auctions.length < total)
      setForwardDisabled(true)
    else if (!forwardDisabled && auctions.length >= total)
      setForwardDisabled(false)

    setLoaded(true)
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setAuctions([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setAuctions([])
  }

  const handleRefresh = (loaded: boolean) => {
    setFetchedTime(loaded)
    setFetchedFeatured(loaded)
  }

  useEffect(() => {
    const fetchAuctions = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const [total, auctions] = await getFeaturedQueue(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (!auctions || auctions.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = auctions[auctions.length - 1].id
      setOffsets(offsets)

      updateAuctions(auctions, total)
    }
    fetchAuctions()
  })

  useEffect(() => {
    const fetchNextFeaturedTime = async () => {
      if (fetchedTime || !mounted.current)
        return
      setFetchedTime(true)

      const nextFeaturedTime = await getNextFeaturedTime(provider)

      if (!mounted.current)
        return

      setNextFeaturedTime(nextFeaturedTime)
    }
    fetchNextFeaturedTime()
  })

  useEffect(() => {
    const fetchFeatured = async () => {
      if (fetchedFeatured || !mounted.current)
        return
      setFetchedFeatured(true)

      const auction = await getFeatured(provider)

      if (!mounted.current)
        return

      setFeatured(auction)
    }
    fetchFeatured()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Row>
        <Col>
          <h3 className='my-5'>Featured queue</h3>
        </Col>
      </Row>
      <Row>
        <Container fluid>
          <Alert variant='dark' className='text-center text-muted'>
            { !nextFeaturedTime &&
              <>
                No next featured auction
              </>
            }
            { nextFeaturedTime === 1 &&
              <Spinner animation='grow' role='status' />
            }
            { nextFeaturedTime > 1 &&
              <>
                Next featured auction after { new Date(nextFeaturedTime * 1000).toLocaleString() } -
                Currently ★ {' '}
                  <AuctionItemName
                    tokenId={featured.tokenId}
                    address={featured.tokenContract}
                    loaded={loaded} />
              </>
            }
          </Alert>
        </Container>

        <Container fluid className='mb-3'>
          <Card.Header>
            <Row xs={1}>
              <Col className='text-end'>
                <ButtonGroup>
                  <Button
                    size='sm'
                    onClick={handleBack}
                    disabled={backDisabled}>{'←'}</Button>
                  <Button
                    size='sm'
                    onClick={handleForward}
                    disabled={forwardDisabled}>{'→'}</Button>
                </ButtonGroup>
              </Col>
            </Row>
          </Card.Header>
        </Container>

        <Table responsive striped hover>
          <thead>
            <tr>
              <th></th>
              <th>Auction</th>
              <th className='text-end'>Reserve price</th>
              <th className='text-end'>Featured price</th>
            </tr>
          </thead>
          <tbody>
          { auctions && auctions.length > 0 &&
            auctions.map((auction: any, idx: number) => {
              return (
                <tr key={idx}>
                  <td>
                    { `#${offset + idx + 1}` }
                  </td>
                  <td>
                    <AuctionItemName
                      tokenId={auction.tokenId}
                      address={auction.tokenContract}
                      loaded={loaded}
                      key={`auction-${auction.id}-${idx}`} />
                    { account === auction.tokenOwner &&
                      <Button size='sm' className='ms-3'
                              onClick={() => handleShowCancel(auction)}>
                        Cancel
                      </Button> }
                  </td>
                  <td className='text-end'>
                    { auction.reservePrice.gt(0) ?
                      TokenAmount.format(auction.reservePrice, 18, {
                        symbol: 'Ξ',
                        digits: 5,
                        commify: true
                      }) : '' }
                  </td>
                  <td className='text-end'>
                    { auction.featuredPrice.gt(0) ?
                      TokenAmount.format(auction.featuredPrice, 18, {
                        symbol: 'TUX',
                        digits: 5,
                        commify: true
                      }) : '' }
                  </td>
                </tr>
              )
            })
          }
          </tbody>
        </Table>
        { !loaded &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          </Container>
        }
        { loaded && auctions.length === 0 &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              No featured auctions currently queued
            </Alert>
          </Container>
        }
      </Row>

      <CancelFeatureModal
        show={showCancel ? true : false}
        handleClose={handleCloseCancel}
        auction={showCancel}
        setFetched={setFetched}
        setLoaded={handleRefresh} />
    </>
  )
}
