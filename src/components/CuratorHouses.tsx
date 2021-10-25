
import { useState, useEffect, useRef } from 'react'
import { useHistory, Link } from 'react-router-dom'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

import DropdownButton from 'react-bootstrap/DropdownButton'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import ListGroup from 'react-bootstrap/ListGroup'
import Dropdown from 'react-bootstrap/Dropdown'
import Popover from 'react-bootstrap/Popover'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'

import TokenAmount from 'token-amount'

import { AddCreatorModal } from './modals/AddCreatorModal'
import { RemoveCreatorModal } from './modals/RemoveCreatorModal'
import { UpdateFeeModal } from './modals/UpdateFeeModal'
import { UpdateMetadataModal } from './modals/UpdateMetadataModal'

import { getCuratorHouses } from '../fetchers/houses'


export default function CuratorHouses(props: any) {
  const { provider } = useEthereum()
  const { account } = useWallet()
  const history = useHistory()

  const mounted = useRef(true)

  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ forHouseID, setForHouseID ] = useState(0)
  const [ curatorHouses, setCuratorHouses ] = useState([])
  const [ showAddCreator, setShowAddCreator] = useState(false)
  const [ showRemoveCreator, setShowRemoveCreator] = useState(false)
  const [ showUpdateFee, setShowUpdateFee] = useState(false)
  const [ showUpdateMetadata, setShowUpdateMetadata] = useState(false)

  const handleShowAddCreator = (houseId: any) => {
    setForHouseID(houseId)
    setShowAddCreator(true)
  }
  const handleCloseAddCreator = () => {
    setForHouseID(0)
    setShowAddCreator(false)
  }

  const handleShowRemoveCreator = (houseId: any) => {
    setForHouseID(houseId)
    setShowRemoveCreator(true)
  }
  const handleCloseRemoveCreator = () => {
    setForHouseID(0)
    setShowRemoveCreator(false)
  }

  const handleShowUpdateFee = (houseId: any) => {
    setForHouseID(houseId)
    setShowUpdateFee(true)
  }
  const handleCloseUpdateFee = () => {
    setForHouseID(0)
    setShowUpdateFee(false)
  }

  const handleShowUpdateMetadata = (houseId: any) => {
    setForHouseID(houseId)
    setShowUpdateMetadata(true)
  }
  const handleCloseUpdateMetadata = () => {
    setForHouseID(0)
    setShowUpdateMetadata(false)
  }

  useEffect(() => {
    const fetchCuratorHouses = async () => {
      if (fetched || !props.address || !mounted.current)
        return
      setFetched(true)
      const houses = await getCuratorHouses(provider, props.address)
      if (!mounted.current)
        return
      setCuratorHouses(houses ? houses : [])
      setLoaded(true)
    }
    fetchCuratorHouses()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Curator</th>
            <th className='text-end'>Fee</th>
            <th className='text-center'>Pre-approved</th>
            <th className='text-center'>Bids</th>
            <th className='text-center'>Sales</th>
            <th className='text-end'>Total fees</th>
            <th className='text-center'>Creators</th>
            { account && account === props.address &&
              <th></th>
            }
          </tr>
        </thead>
        <tbody>
        { curatorHouses && curatorHouses.length > 0 &&
          curatorHouses.map((house: any, idx: number) => {
            return (
              <tr key={idx}>
                <td className='align-middle'>
                  <Link to={ `/house/${house.id}` }>
                    {house.name}
                  </Link>
                </td>
                <td className='align-middle'>
                  <Link to={ `/address/${house.curator}` } className='text-muted'>
                    {house.shortCurator}
                  </Link>
                </td>
                <td className='align-middle text-end'>
                  {house.fee} %
                </td>
                <td className='align-middle text-center'>
                  { house.preApproved ?
                    <Form.Check checked disabled /> :
                    <Form.Check disabled />
                  }
                </td>
                <td className='align-middle text-center'>{house.bids}</td>
                <td className='align-middle text-center'>{house.sales}</td>
                <td className='align-middle text-end'>
                  {
                    TokenAmount.format(house.feesTotal, 18, {
                      symbol: 'Ξ',
                      digits: 5,
                      commify: true
                    })
                  }
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
                { account && account === props.address &&
                  <td className='text-end'>
                    { // ≡
                    }
                    { house.queue.length > 0 &&
                      <>
                      <Button size='sm' variant='danger' onClick={() => { history.push(`/queue/${house.id}`) }}>
                        Approval queue
                      </Button>{' '}
                      </>
                    }
                    <DropdownButton size='sm' drop='start' align='end' title='Actions ' style={{display: 'inline-block'}}>
                      <Dropdown.Item onClick={() => handleShowAddCreator(house.id)}>
                        Add creator
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleShowRemoveCreator(house.id)}>
                        Remove creator
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleShowUpdateFee(house.id)}>
                        Update fee
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleShowUpdateMetadata(house.id)}>
                        Update metadata
                      </Dropdown.Item>
                    </DropdownButton>
                  </td>
                }
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
      { loaded && curatorHouses.length === 0 &&
        <Alert variant='dark' className='text-center'>
          No houses as curator
        </Alert>
      }

      <AddCreatorModal
        show={showAddCreator}
        houseId={forHouseID}
        handleClose={handleCloseAddCreator}
        setFetched={setFetched} />

      <RemoveCreatorModal
        show={showRemoveCreator}
        houseId={forHouseID}
        handleClose={handleCloseRemoveCreator}
        setFetched={setFetched} />

      <UpdateFeeModal
        show={showUpdateFee}
        houseId={forHouseID}
        handleClose={handleCloseUpdateFee}
        setFetched={setFetched} />

      <UpdateMetadataModal
        show={showUpdateMetadata}
        houseId={forHouseID}
        handleClose={handleCloseUpdateMetadata}
        setFetched={setFetched} />
    </>
  )
}
