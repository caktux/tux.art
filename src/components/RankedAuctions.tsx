
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import AuctionItem from '../components/AuctionItem'

import { getTopAuctions } from '../fetchers/auctions'
import { getTopAuctionsGraph } from '../fetchers/auctions-graph'
import { ethers } from 'ethers'


export const RankedAuctions = (props: any) => {
  const { provider } = useEthereum()

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ graphAvailable, setGraphAvailable ] = useState(true)
  const [ auctions, setAuctions ] = useState([])

  const mounted = useRef(true)

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
  }

  const updateAuctions = (auctions: any, total: number) => {
    setAuctions(auctions)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset < props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)
  }

  useEffect(() => {
    const fetchAuctions = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      let total = 0
      let auctions = []
      let timedOut = false
      if (graphAvailable)
        [total, auctions, timedOut] = await getTopAuctionsGraph(props.limit, offset)
      else
        [total, auctions] = await getTopAuctions(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (timedOut) {
        [total, auctions] = await getTopAuctions(provider, props.limit, offsets[offset])
        setGraphAvailable(false)
      }

      if (!mounted.current)
        return

      if (!auctions || auctions.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = auctions[auctions.length - 1].tokenOwner
      setOffsets(offsets)

      updateAuctions(auctions, total)
      setLoaded(true)
    }
    fetchAuctions()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Container fluid className='mb-2'>
        <Row xs={1}>
          <Card.Header>
            <Row xs={1}>
              <Col xs={6} className='vertical-align'>
                Top creators auctions
              </Col>
              <Col xs={6} className='text-end'>
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
        </Row>
      </Container>
      <Row xs={1} md={2} xl={4}>
        { auctions.map((auction: any, idx: number) => {
            return (
              <AuctionItem
                auction={auction}
                tokenId={auction.tokenId}
                address={auction.tokenContract}
                loaded={loaded}
                key={`auction-${auction.id}-${idx}`} />
            )
          })
        }
      </Row>
      <Row xs={1} className='mb-3'>
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
              No top creators auctions
            </Alert>
          </Container>
        }
      </Row>
    </>
  )
}
