
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Popover from 'react-bootstrap/Popover'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Image from 'react-bootstrap/Image'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import Address from './Address'
import TokenAmount from 'token-amount'

import { ethers, Signer } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'

import { getRankedCollectors } from '../fetchers/collectors'
import { getRankedCollectorsGraph } from '../fetchers/collectors-graph'


export const Collectors = (props: any) => {
  const { provider } = useEthereum()
  const { ethereum } = useWallet()
  const { ipfsHost } = useIPFS()

  const [ error, setError ] = useState('')
  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ collectors, setCollectors ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ graphAvailable, setGraphAvailable ] = useState(true)

  const mounted = useRef(true)
  const tableRef = useRef(null as any)


  const updateCollectors = (collectors: any, total: number) => {
    setCollectors(collectors)

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

  const handleUpdateRanking = (address: string) => {
    const updateRanking = async() => {
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      await contract.updateCollectorRank(address).catch((e: any) => {
        console.warn(`In updateCollectorRank`, e.error ? e.error.message : e.message)
        if (e.error && e.error.message)
          setError(e.error.message.replace('execution reverted: ', ''))
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
    setLoaded(false)
    setCollectors([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setCollectors([])
  }

  useEffect(() => {
    const fetchCollectors = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      let total = 0
      let collectors = []
      let timedOut = false

      if (graphAvailable)
        [total, collectors, timedOut] = await getRankedCollectorsGraph(props.limit, offset)
      else
        [total, collectors] = await getRankedCollectors(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (timedOut) {
        [total, collectors] = await getRankedCollectors(provider, props.limit, offsets[offset])
        setGraphAvailable(false)
      }

      if (!mounted.current)
        return

      if (!collectors || collectors.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = collectors[collectors.length - 1].address
      setOffsets(offsets)

      updateCollectors(collectors, total)
    }
    fetchCollectors()
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
          <h3 className='my-5'>Collectors</h3>
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

        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Rank</th>
              <th></th>
              <th>Collector</th>
              <th className='text-center'>Bids</th>
              <th className='text-center'>Sales</th>
              <th className='text-center'>Bought</th>
              <th className='text-end'>Sales total</th>
              <th className='text-end'>Bought total</th>
            </tr>
          </thead>
          <tbody ref={tableRef}>
          { collectors.map((collector: any, idx: number) => {
              return (
                <tr key={idx}>
                  <td className='py-3'>
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
                              handleUpdateRanking(collector.address)
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
                    { collector.pictureHash &&
                      <Link to={ `/address/${collector.address}` }>
                        <Image className='statsPicture me-1' src={`${ipfsHost}/ipfs/${collector.pictureHash}`} roundedCircle />
                      </Link>
                    }
                  </td>
                  <td className='align-middle'>
                    <Address address={collector.address} />
                  </td>
                  <td className='text-center align-middle'>{collector.bids}</td>
                  <td className='text-center align-middle'>{collector.sales}</td>
                  <td className='text-center align-middle'>{collector.bought}</td>
                  <td className='text-end align-middle'>
                    {
                      TokenAmount.format(collector.totalSold, 18, {
                        symbol: 'Ξ',
                        digits: 5,
                        commify: true
                      })
                    }
                  </td>
                  <td className='text-end align-middle'>
                    {
                      TokenAmount.format(collector.totalSpent, 18, {
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
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          </Container>
        }
        { loaded && collectors.length === 0 &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              No collectors could be found
            </Alert>
          </Container>
        }
      </Row>
    </>
  )
}
