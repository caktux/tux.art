
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useParams } from 'react-router-dom'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import AuctionItem from '../components/AuctionItem'

import { emptyHouse } from '../utils/nfts'
import { getHouse } from '../fetchers/houses'
import { getActiveHouseAuctions } from '../fetchers/auctions'
import { getActiveHouseAuctionsGraph } from '../fetchers/auctions-graph'


export default function House(props: any) {
  const { provider } = useEthereum()
  const params = useParams<any>()

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: '0'} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ graphAvailable, setGraphAvailable ] = useState(true)
  const [ houseFetched, setHouseFetched ] = useState(false)
  const [ houseLoaded, setHouseLoaded ] = useState(false)
  const [ house, setHouse ] = useState(emptyHouse)
  const [ auctions, setAuctions ] = useState([])

  const mounted = useRef(true)

  const updateAuctions = (auctions: any, total: number) => {
    if (!mounted.current)
      return

    setAuctions(auctions)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset <= props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)
  }

  const handleBack = () => {
    setLoaded(false)
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
  }

  const handleForward = () => {
    setLoaded(false)
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
  }

  useEffect(() => {
    const fetchHouse = async () => {
      if (houseFetched || !mounted.current)
        return
      setHouseFetched(true)

      const newHouse = await getHouse(provider, params.houseId)

      if (!mounted.current)
        return

      setHouse(newHouse)
      setHouseLoaded(true)
    }
    fetchHouse()
  })

  useEffect(() => {
    const fetchAuctions = async () => {
      if (fetched || (!graphAvailable && !houseLoaded) || !mounted.current)
        return
      setFetched(true)

      let total = 0
      let auctions = [] as any
      let timedOut = false

      if (graphAvailable)
        [total, auctions, timedOut] = await getActiveHouseAuctionsGraph(params.houseId, props.limit, offset)
      else
        [total, auctions] = await getActiveHouseAuctions(provider, house, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (timedOut) {
        setGraphAvailable(false)
        setFetched(false)
        return
      }

      if (!auctions || auctions.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = auctions[auctions.length - 1].id
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
    <Container fluid>
      <Container fluid className='mb-3'>
        <Row xs={1}>
          <Card.Header>
            <Row xs={1}>
              <Col xs={9} className='vertical-align'>
                {house.name}
              </Col>
              <Col xs={3} className='text-end'>
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
              house={house}
              loaded={loaded}
              key={`token-${house.name}-${idx}`} />
          )
        })
      }
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
            No active auctions
          </Alert>
        </Container>
      }
      </Row>
    </Container>
  )
}
