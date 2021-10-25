
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { Link } from 'react-router-dom'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import AuctionItem from './AuctionItem'

import { getActiveHouseAuctions } from '../fetchers/auctions'


export default function House(props: any) {
  const { provider } = useEthereum()

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: '0'} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
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

  useEffect(() => {
    const fetchAuctions = async () => {
      if (!mounted.current)
        return
      if (fetched && !props.loaded) {
        setFetched(false)
        return
      }
      if (fetched || !props.loaded)
        return

      setFetched(true)

      const [total, auctions] = await getActiveHouseAuctions(provider, props.house, props.limit, offsets[offset])

      if (!mounted.current)
        return

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
    <>
      <Card.Header className='mb-2'>
        <Row xs={1}>
          <Col xs={9} className='vertical-align'>
            <Link to={`/house/${props.house.id}`}>
              {props.house.name}
            </Link>
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
      <Row xs={1} md={2} xl={props.limit > 2 ? 4 : 2}>
      { auctions.map((auction: any, idx: number) => {
          return (
            <AuctionItem
              auction={auction}
              tokenId={auction.tokenId}
              address={auction.tokenContract}
              house={props.house}
              loaded={loaded}
              key={`token-${props.house.name}-${idx}`} />
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
    </>
  )
}
