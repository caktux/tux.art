
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

import { CreateHouseModal } from '../components/modals/CreateHouseModal'

import { getRankedHouses } from '../fetchers/houses'


export default function Houses(props: any) {
  const { provider } = useEthereum()

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: '0'} as any)
  const [ houses, setHouses ] = useState([])
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ showCreateHouse, setShowCreateHouse ] = useState(false)

  const handleShowCreateHouse = () => setShowCreateHouse(true)
  const handleCloseCreateHouse = () => setShowCreateHouse(false)

  const mounted = useRef(true)

  const updateHouses = (houses: any, total: number) => {
    setHouses(houses)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset < props.limit)
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
    const fetchHouses = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      let [total, houses] = await getRankedHouses(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (!houses || houses.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = houses[houses.length - 1].id
      setOffsets(offsets)

      updateHouses(houses, total)
      setLoaded(true)
    }
    fetchHouses()
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
              <Col xs={3} className='vertical-align'>
                All houses
              </Col>
              <Col xs={9} className='text-end'>
                <ButtonGroup className='me-3'>
                  <Button size='sm' onClick={handleShowCreateHouse}>
                    Create a house
                  </Button>
                </ButtonGroup>
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
        { houses.map((house, index) => {
            return (
              <Col key={`house-${index}`}>
                <House
                  limit={4}
                  house={house}
                  loaded={loaded} />
              </Col>
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
        { loaded && houses.length === 0 &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              No houses could be found
            </Alert>
          </Container>
        }
      </Row>
      <Container fluid className='mb-3'>
        <Row xs={1}>
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
        </Row>
      </Container>

      <CreateHouseModal
        show={showCreateHouse}
        handleClose={handleCloseCreateHouse}
        setFetched={setFetched} />
    </Container>
  )
}
