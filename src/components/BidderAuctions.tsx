
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

import { getBidderAuctions } from '../fetchers/auctions'


export default function BidderAuctions(props: any) {
  const { provider } = useEthereum()

  const mounted = useRef(true)

  const [ offset, setOffset ] = useState(0)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ auctions, setAuctions ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)

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

  const updateAuctions = (auctions: any, total: number) => {
    if (!mounted.current)
      return

    setAuctions(auctions)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset < props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)

    setLoaded(true)
  }

  useEffect(() => {
    const fetchAuctions = async () => {
      if (fetched || !props.address || !mounted.current)
        return
      setFetched(true)

      const [total, auctions] = await getBidderAuctions(provider, props.address, props.limit, offset)

      if (!mounted.current)
        return

      if (!auctions || auctions.length === 0) {
        setLoaded(true)
        return
      }

      updateAuctions(auctions, total)
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
          <Col xs={8} className='vertical-align'>
            Bidding
          </Col>
          <Col xs={4} className='text-end'>
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
      <Row xs={1} md={2} xl={4}>
        { auctions && auctions.length > 0 &&
          auctions.map((auction: any, idx: number) => {
            return (
              <AuctionItem
                auction={auction}
                tokenId={auction.tokenId}
                address={auction.tokenContract}
                loaded={fetched}
                key={`auction-${auction.id}-${idx}`} />
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
