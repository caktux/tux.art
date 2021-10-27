
import { useState, useEffect, useRef } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Image from 'react-bootstrap/Image'
import Card from 'react-bootstrap/Card'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import OwnedList from '../components/OwnedList'
import CreatedList from '../components/CreatedList'
import CuratorHouses from '../components/CuratorHouses'
import CreatorHouses from '../components/CreatorHouses'
import SellerAuctions from '../components/SellerAuctions'
import BidderAuctions from '../components/BidderAuctions'


import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'

import { getRankedContracts } from '../fetchers/contracts'
import { shortAddress } from '../utils/nfts'

import { fetchWithTimeout } from '../utils/ipfs'


export default function Address(props: any) {
  const { provider } = useEthereum()
  const { ipfsHost } = useIPFS()

  const history = useHistory()
  const params = useParams<any>()

  const mounted = useRef(true)

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ contracts, setContracts ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ address, setAddress ] = useState('')
  const [ showAddress, setShowAddress ] = useState('')
  const [ resolved, setResolved] = useState(false)
  const [ accountFetched, setAccountFetched] = useState(false)
  const [ tuxAccount, setTuxAccount] = useState({} as any)
  const [ tab, setTab ] = useState(params.tab ? params.tab : 'auctions')


  const handleChangeTab = (key: string | null) => {
    if (!mounted.current || !params.address)
      return

    setTab(key)

    history.push(`/address/${params.address}/${key}`)
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setContracts([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setContracts([])
  }

  const refresh = (newAddress: string) => {
    if (!mounted.current)
      return
    setAddress(newAddress)
    setResolved(false)
    setFetched(false)
    setLoaded(false)
  }

  const updateContracts = (contracts: any, total: number) => {
    if (!mounted.current)
      return

    setContracts(contracts)

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
    if (params && params.address && params.address !== address && mounted.current)
      refresh(params.address)
  })

  useEffect(() => {
    const formatAddress = async () => {
      if (resolved || !address || !provider || !mounted.current)
        return
      setResolved(true)
      const displayAddress = await shortAddress(address, provider)
      if (!mounted.current)
        return
      setShowAddress(displayAddress)
    }
    formatAddress()
  })

  useEffect(() => {
    const fetchAccount = async () => {
      if (accountFetched || !address || !provider || !mounted.current)
        return
      setAccountFetched(true)

      const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

      const fullAccount = await contract.accounts(address).catch((e: any) => {
        console.warn(`In contract.accounts`, e.message)
      })

      let bio = ''
      try {
        if (fullAccount && fullAccount.bioHash) {
          const response = await fetchWithTimeout(`${ipfsHost}/ipfs/${fullAccount.bioHash}`)
          bio = await response.text()
        }
      } catch (e: any) {}

      if (!mounted.current)
        return

      setTuxAccount({ bio: bio, ...fullAccount})
    }
    fetchAccount()
  })

  useEffect(() => {
    const fetchContracts = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const [total, contracts] = await getRankedContracts(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (!contracts || contracts.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = contracts[contracts.length - 1].tokenContract
      setOffsets(offsets)

      updateContracts(contracts ? contracts : [], total)
    }
    fetchContracts()
  })

  useEffect(() => {
    if (!mounted.current)
      return

    const paramsTab = params.tab ? params.tab : 'auctions'

    if (paramsTab === tab)
      return

    setTab(paramsTab)
  }, [params.tab, tab])

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      <Row className='my-5'>
        { tuxAccount.pictureHash &&
          <Col xs={3} lg={2} xl={1}>
            <Image className='profilePicture' src={`${ipfsHost}/ipfs/${tuxAccount.pictureHash}`} roundedCircle />
          </Col>
        }
        <Col xs={9} lg={10} xl={11}>
          <h3>
            { showAddress }
          </h3>
          { tuxAccount.bio &&
            <h5 className='text-muted'>
                { tuxAccount.bio }
            </h5>
          }
        </Col>
      </Row>

      <Tabs activeKey={tab} onSelect={(key) => handleChangeTab(key)} mountOnEnter={true}>
        <Tab eventKey='auctions' title='Auctions'>
          <SellerAuctions address={address} limit={8} />
          <BidderAuctions address={address} limit={8} />
        </Tab>

        <Tab eventKey='houses' title='Houses'>
          <Container fluid='lg'>
            <Row>
              <Col xs={12}>
                <h4 className='mt-5'>Houses as curator</h4>
              </Col>
            </Row>
            <CuratorHouses address={address} />
          </Container>

          <Container fluid='lg'>
            <Row>
              <Col xs={12}>
                <h4 className='mt-5 mb-4'>Houses as creator</h4>
              </Col>
            </Row>
            <CreatorHouses address={address} />
          </Container>
        </Tab>

        <Tab eventKey='owned' title='Owned'>
          <Container fluid className='mt-3 mb-2'>
            <Row xs={1}>
              <Card.Header>
                <Row xs={1}>
                  <Col xs={8} className='vertical-align'>
                    All collections
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
            </Row>
          </Container>
          { contracts && contracts.length > 0 &&
            contracts.map((contract: any, index: number) => {
              return (
                <Row xs={1} key={`platform-${index}`} className='mb-3'>
                  { (address && provider) ?
                    <OwnedList
                      limit={4}
                      account={address}
                      contract={contract}
                    /> :
                    <Alert variant='dark' className='text-center'>
                      <Spinner animation="grow" role='status' />
                    </Alert>
                  }
                </Row>
              )
            })
          }
          { !loaded &&
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          }
          { loaded && contracts.length === 0 &&
            <Alert variant='dark' className='text-center'>
              No token contracts could be found
            </Alert>
          }
        </Tab>

        <Tab eventKey='created' title='Created'>
          <Container fluid className='mt-3 mb-2'>
            <Row xs={1}>
              <Card.Header>
                <Row xs={1}>
                  <Col xs={8} className='vertical-align'>
                    All collections
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
            </Row>
          </Container>
          { contracts && contracts.length > 0 &&
            contracts.map((contract: any, index: number) => {
              return (
                <Row xs={1} key={`created-${index}`} className='mb-3'>
                  <CreatedList
                    limit={4}
                    account={address}
                    contract={contract}
                  />
                </Row>
              )
            })
          }
          { !loaded &&
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          }
          { loaded && contracts.length === 0 &&
            <Alert variant='dark' className='text-center'>
              No token contracts could be found
            </Alert>
          }
        </Tab>
      </Tabs>
    </Container>
  )
}
