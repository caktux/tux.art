
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

import { getHouse } from '../fetchers/houses'
import { getHouseQueue } from '../fetchers/auctions'
import { emptyHouse } from '../utils/nfts'


export default function HouseQueue(props: any) {
  const { provider } = useEthereum()
  const params = useParams<any>()

  const [ offset, setOffset ] = useState(0)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ houseFetched, setHouseFetched ] = useState(false)
  const [ houseLoaded, setHouseLoaded ] = useState(false)
  const [ house, setHouse ] = useState(emptyHouse)
  const [ auctions, setAuctions ] = useState([])

  const mounted = useRef(true)

  const updateAuctions = (auctions: any, total: number) => {
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
    const fetchHouse = async () => {
      if (houseFetched)
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
    const fetchNFTs = async () => {
      if (fetched || !houseLoaded)
        return
      setFetched(true)

      const [total, auctions] = await getHouseQueue(provider, house, props.limit, offset)

      if (!mounted.current)
        return

      updateAuctions(auctions, total)

      setLoaded(true)
    }
    fetchNFTs()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      <Container fluid className='mb-2'>
        <Row xs={1}>
          <Card.Header>
            <Row xs={1}>
              <Col xs={9} className='vertical-align'>
                {house.name} - Waiting for approval
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
            No auctions in approval queue
          </Alert>
        </Container>
      }
      </Row>
    </Container>
  )
}
