
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

import House from '../components/House'

import { getRankedHouses } from '../fetchers/houses'


export const RankedHouses = (props: any) => {
  const { provider } = useEthereum()

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: '0'} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ houses, setHouses ] = useState([])

  const mounted = useRef(true)

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setHouses([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setHouses([])
  }

  const updateHouses = (houses: any, total: number) => {
    setHouses(houses)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset < props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total && houses.length === props.limit)
      setForwardDisabled(false)
    else if (!forwardDisabled && (offset + props.limit >= total || houses.length < props.limit))
      setForwardDisabled(true)

    setLoaded(true)
  }

  useEffect(() => {
    const fetchHouses = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const [total, houses] = await getRankedHouses(provider, props.limit, offsets[offset], 2)

      if (!mounted.current)
        return

      if (!houses || houses.length === 0) {
        updateHouses([], total)
        return
      }

      offsets[offset + props.limit] = houses[houses.length - 1].id
      setOffsets(offsets)

      updateHouses(houses, total)
    }
    fetchHouses()
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
                Top house auctions
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
      <Row xs={1}>
        { !loaded &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          </Container>
        }
        { loaded && houses.length === 0 &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              No top ranking houses
            </Alert>
          </Container>
        }
      </Row>
      <Row xs={1} xl={2} className='mb-3'>
        { houses.map((house, index) => {
            return (
              <Col key={`house-${index}`}>
                <House
                  limit={2}
                  house={house}
                  loaded={loaded} />
              </Col>
            )
          })
        }
      </Row>
    </>
  )
}
