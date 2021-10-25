
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Popover from 'react-bootstrap/Popover'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { CreateHouseModal } from './modals/CreateHouseModal'

import { getRankedHouses } from '../fetchers/houses'
import TokenAmount from 'token-amount'

import { ethers, Signer } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'


export const Houses = (props: any) => {
  const { provider } = useEthereum()
  const { ethereum } = useWallet()

  const [ error, setError ] = useState('')
  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: '0'} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ houses, setHouses ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ showCreateHouse, setShowCreateHouse ] = useState(false)

  const handleShowCreateHouse = () => setShowCreateHouse(true)
  const handleCloseCreateHouse = () => setShowCreateHouse(false)

  const mounted = useRef(true)
  const tableRef = useRef(null as any)


  const updateHouses = (houses: any, total: number) => {
    if (!mounted.current)
      return

    setHouses(houses)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset <= props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)

    setLoaded(true)
  }

  const handleUpdateRanking = (houseId: string) => {
    const updateRanking = async() => {
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      await contract.updateHouseRank(houseId).catch((e: any) => {
        console.warn(`In updateHouseRank`, e.data ? e.data.message : e.message)
        if (e.data && e.data.message)
          setError(e.data.message.slice(0, e.data.message.length - 1).slice(79, e.data.message.length))
        else
          setError(e.message)
        return
      })
      setLoaded(false)
      setFetched(false)
    }
    updateRanking()
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
  }

  const handleForward = () => {
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

      const [total, houses] = await getRankedHouses(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (!houses || houses.length === 0) {
        setLoaded(true)
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
      <Row xs={2}>
        <Col>
          <h3 className='my-5'>Houses</h3>
        </Col>
        <Col className='text-end'>
          <Button onClick={handleShowCreateHouse} className='header-button'>
            Create a house
          </Button>
        </Col>
      </Row>
      { error &&
        <Alert variant='danger' onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      }
      <Row>
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

        <Container fluid='md'>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Curator</th>
                <th className='text-center'>Creators</th>
                <th className='text-end'>Fee</th>
                <th className='text-center'>Pre-approved</th>
                <th className='text-center'>Bids</th>
                <th className='text-center'>Sales</th>
                <th className='text-end'>Fees total</th>
                <th className='text-end'>Sales total</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
            { houses && houses.length > 0 &&
              houses.map((house: any, idx: number) => {
                return (
                  <tr key={idx}>
                    <td>
                      <OverlayTrigger
                        placement='right'
                        trigger='click'
                        rootClose
                        delay={{ show: 250, hide: 400 }}
                        overlay={
                          <Popover>
                            <Popover.Body>
                              <Button size='sm' onClick={() => {
                                tableRef.current.click()
                                handleUpdateRanking(house.id)
                              }}>
                                Update ranking
                              </Button>
                            </Popover.Body>
                          </Popover>
                        }>
                        {({ ref, ...triggerHandler }) => (
                          <Button size='sm' variant='secondary' ref={ref} {...triggerHandler} className='wr-3'>
                            #{offset + idx + 1}
                          </Button>
                        )}
                      </OverlayTrigger>
                    </td>
                    <td>
                      <Link to={ `/house/${house.id}` }>
                        {house.name}
                      </Link>
                    </td>
                    <td>
                      <Link to={ `/address/${house.curator}` } className='text-muted'>
                        {house.shortCurator}
                      </Link>
                    </td>
                    <td className='text-center'>
                      <OverlayTrigger
                        placement='left'
                        trigger='click'
                        rootClose
                        delay={{ show: 250, hide: 400 }}
                        overlay={
                          <Popover>
                            <Popover.Header as='h5'>Creators</Popover.Header>
                            <Popover.Body>
                              <ListGroup variant='flush'>
                                { house.creators && house.creators.length > 0 &&
                                  house.creators.map((creator: any, idx: number) => {
                                    return (
                                      <ListGroup.Item key={`creator-${house.id}-${creator.address}`}>
                                        <Link to={ `/address/${creator.address}` } className='text-muted'>
                                          {creator.shortAddress}
                                        </Link>
                                      </ListGroup.Item>
                                    )
                                  })
                                }
                              </ListGroup>
                            </Popover.Body>
                          </Popover>
                        }>
                        {({ ref, ...triggerHandler }) => (
                          <Button size='sm' variant='secondary' ref={ref} {...triggerHandler} className='wr-3'>
                            {house.creators.length}
                          </Button>
                        )}
                      </OverlayTrigger>
                    </td>
                    <td className='text-end'>{house.fee} %</td>
                    <td className='text-center'>
                      { house.preApproved ?
                        <Form.Check checked={true} disabled /> :
                        <Form.Check checked={false} disabled />
                      }
                    </td>
                    <td className='text-center'>{house.bids}</td>
                    <td className='text-center'>{house.sales}</td>
                    <td className='text-end'>
                      {
                        TokenAmount.format(house.feesTotal, 18, {
                          symbol: 'Ξ',
                          digits: 5,
                          commify: true
                        })
                      }
                    </td>
                    <td className='text-end'>
                      {
                        TokenAmount.format(house.total, 18, {
                          symbol: 'Ξ',
                          digits: 5,
                          commify: true
                        })
                      }
                    </td>
                  </tr>
                )
              })
            }
            </tbody>
          </Table>
          { !loaded &&
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          }
          { loaded && houses.length === 0 &&
            <Alert variant='dark' className='text-center'>
              No houses could be found
            </Alert>
          }
        </Container>

        <CreateHouseModal
          show={showCreateHouse}
          handleClose={handleCloseCreateHouse}
          setFetched={setFetched} />
      </Row>
    </>
  )
}
